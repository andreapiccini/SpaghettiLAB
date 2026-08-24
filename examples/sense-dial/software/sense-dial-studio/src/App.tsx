import { useEffect, useMemo, useRef, useState } from 'react'
import { Activity, Cable, ChevronDown, Gauge, RotateCcw, Save, Settings2, Sparkles, Zap } from 'lucide-react'
import { api } from './api'
import DialPreview from './components/DialPreview'
import Control from './components/Control'
import type { DialConfig, DialTelemetry, SerialPort } from './types'

const stableMotorTuning: DialConfig['motor_control'] = {
  pole_pairs: 7,
  sensor_type: 'MAGNETIC_ENCODER',
  sensor_direction: 'AUTO',
  motion_type: 'TORQUE',
  voltage_limit: 5,
  velocity_limit: 8,
  current_limit: 1.2,
  velocity_pid: { p: 0.2, i: 2, d: 0, output_ramp: 1000 },
  velocity_lpf: { time_constant: 0.01 },
  current_pid: { p: 3, i: 300, d: 0, output_ramp: 0 },
  current_lpf: { time_constant: 0.006 },
  haptic_tuning: {
    detent_gain: 0.42,
    endstop_gain: 0.65,
    deadband_fraction: 0.035,
    torque_filter_time_constant: 0.012,
    torque_slew_rate: 55,
    detent_settle_fraction: 0.035,
    endstop_settle_fraction: 0.035,
    idle_release_ms: 180,
    idle_centering_delay_ms: 500,
  },
}

const initialConfig: DialConfig = {
  position: 0,
  sub_position_unit: 0,
  min_position: 0,
  max_position: 23,
  position_width_radians: Math.PI * 2 / 24,
  detent_strength_unit: 1.2,
  endstop_strength_unit: 2.2,
  snap_point: 0.55,
  snap_point_bias: 0,
  detent_positions: [],
  override_detents: [],
  motor_control: stableMotorTuning,
}

function normalizeSensorDirection(value: unknown): DialConfig['motor_control']['sensor_direction'] {
  const text = String(value ?? 'AUTO').toUpperCase()
  if (text.endsWith('_CCW') || text === 'CCW') return 'CCW'
  if (text.endsWith('_CW') || text === 'CW') return 'CW'
  return 'AUTO'
}

export default function App() {
  const [config, setConfig] = useState(initialConfig)
  const [ports, setPorts] = useState<SerialPort[]>([])
  const [port, setPort] = useState('')
  const [connected, setConnected] = useState(false)
  const [motorReady, setMotorReady] = useState(false)
  const [applying, setApplying] = useState(false)
  const [liveApply, setLiveApply] = useState(true)
  const [staticBaseline, setStaticBaseline] = useState({ pole_pairs: 7, sensor_direction: 'AUTO' as DialConfig['motor_control']['sensor_direction'] })
  const [telemetry, setTelemetry] = useState<DialTelemetry>()
  const [message, setMessage] = useState('Preview changes instantly. Connect hardware when ready.')
  const [tab, setTab] = useState<'feel' | 'motion' | 'advanced'>('feel')
  const detentCount = config.max_position - config.min_position + 1
  const restartRequired = config.motor_control.pole_pairs !== staticBaseline.pole_pairs ||
    config.motor_control.sensor_direction !== staticBaseline.sensor_direction
  const configRef = useRef(config)
  const applyingRef = useRef(false)
  const pendingApplyRef = useRef(false)
  const lastAppliedRef = useRef('')

  useEffect(() => { configRef.current = config }, [config])

  useEffect(() => {
    api.ports().then(({ ports: found }) => {
      setPorts(found)
      if (found[0]) setPort(found[0].device)
    }).catch(() => setMessage('Backend starting… preview remains available.'))
  }, [])

  useEffect(() => {
    if (!connected) return undefined

    let cancelled = false
    let polling = false
    let heartbeatCounter = 0
    const poll = async () => {
      if (polling) return
      polling = true
      try {
        try {
          const dial = await api.dialState()
          if (cancelled) return
          if (dial.dial_state) setTelemetry(dial.dial_state)
        } catch {
          // Telemetry is best-effort. Only the slower status heartbeat is
          // allowed to declare the serial connection lost.
        }
        heartbeatCounter += 1
        if (heartbeatCounter >= 10) {
          heartbeatCounter = 0
          const status = await api.status() as { connected?: boolean; state?: { host_state?: { lowside?: { ready?: boolean; calibrated?: boolean; fault_active?: boolean } } } }
          if (status.connected === false) throw new Error('Device disconnected')
          const lowside = status.state?.host_state?.lowside
          setMotorReady(Boolean(lowside?.ready && lowside?.calibrated && !lowside?.fault_active))
        }
      } catch {
        if (cancelled) return
        setConnected(false)
        setMotorReady(false)
        setTelemetry(undefined)
        setMessage('SenseDial disconnected. The serial port was released; you can reconnect without resetting it.')
        api.ports().then(({ ports: found }) => {
          if (cancelled) return
          setPorts(found)
          if (found[0]) setPort(found[0].device)
        }).catch(() => {})
      } finally { polling = false }
    }

    const timer = window.setInterval(() => { void poll() }, 100)
    void poll()
    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [connected])

  useEffect(() => {
    if (!connected || !motorReady || !liveApply || restartRequired) return undefined
    pendingApplyRef.current = true
    const timer = window.setTimeout(() => { void flushConfig(false) }, 220)
    return () => window.clearTimeout(timer)
  }, [config, connected, motorReady, liveApply, restartRequired])

  const update = <K extends keyof DialConfig>(key: K, value: DialConfig[K]) => setConfig((old) => ({ ...old, [key]: value }))
  const updateMotor = <K extends keyof DialConfig['motor_control']>(key: K, value: DialConfig['motor_control'][K]) => setConfig((old) => ({ ...old, motor_control: { ...old.motor_control, [key]: value } }))
  const configuredDetents = useMemo(() => config.detent_positions.length || detentCount, [config.detent_positions, detentCount])

  async function connect() {
    try {
      setMessage('Opening secure serial session…')
      await api.connect(port)
      // A firmware reset or a new serial session loses the motor's volatile
      // haptic configuration. Never reuse the previous session's apply cache:
      // the current editor profile must be sent again as soon as FOC is ready.
      lastAppliedRef.current = ''
      pendingApplyRef.current = true
      const initialStatus = await api.status().catch(() => undefined) as { state?: { host_state?: { lowside?: { ready?: boolean; calibrated?: boolean; fault_active?: boolean } } } } | undefined
      const initialLowSide = initialStatus?.state?.host_state?.lowside
      const initialMotorReady = Boolean(initialLowSide?.ready && initialLowSide?.calibrated && !initialLowSide?.fault_active)
      setMotorReady(initialMotorReady)
      const dial = await api.dialState().catch(() => undefined)
      const storedMotor = dial?.dial_state?.config?.motor_control
      if (storedMotor) {
        const persisted = {
          pole_pairs: Number(storedMotor.pole_pairs ?? config.motor_control.pole_pairs),
          sensor_direction: normalizeSensorDirection(storedMotor.sensor_direction),
        }
        setStaticBaseline(persisted)
        setConfig((old) => ({ ...old, motor_control: { ...old.motor_control, ...persisted } }))
      }
      setConnected(true)
      setMessage(initialMotorReady
        ? 'SenseDial connected. Visual and physical controls are linked.'
        : 'SenseDial connected. Motor calibration is still in progress; live apply will start automatically when ready.')
    } catch (error) {
      lastAppliedRef.current = ''
      setConnected(false)
      setMotorReady(false)
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  async function disconnect() {
    try {
      setMessage('Releasing serial session…')
      await api.disconnect()
      lastAppliedRef.current = ''
      pendingApplyRef.current = false
      setConnected(false)
      setTelemetry(undefined)
      setMessage('SenseDial disconnected. The serial port is available.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : String(error))
    }
  }

  async function flushConfig(announce = true) {
    if (!connected) { setMessage('Connect a SenseDial first. Your design is preserved in preview.'); return }
    if (!motorReady) { setMessage('Motor calibration is not complete. Wait for the motor to become ready or restore factory defaults.'); return }
    if (applyingRef.current) {
      pendingApplyRef.current = true
      return
    }
    applyingRef.current = true
    try {
      setApplying(true)
      do {
        pendingApplyRef.current = false
        const snapshot = configRef.current
        const serialized = JSON.stringify(snapshot)
        if (serialized === lastAppliedRef.current) break
        const result = await api.applyConfig(snapshot)
        const lowside = result.state?.host_state?.lowside
        if (result.verified) lastAppliedRef.current = serialized
        if (announce || !result.verified) {
          setMessage(lowside?.fault_active
            ? 'Motor initialization fault. Check 9 V motor power, then use Restore factory defaults and reconnect after calibration.'
            : result.verified
              ? `Live configuration applied · revision ${result.position_nonce}`
              : `Command acknowledged, motor core did not confirm revision ${result.position_nonce}`)
        }
      } while (pendingApplyRef.current)
    } catch (error) { setMessage(error instanceof Error ? error.message : String(error)) }
    finally {
      applyingRef.current = false
      setApplying(false)
      if (pendingApplyRef.current && connected && liveApply) void flushConfig(false)
    }
  }

  async function apply() {
    if (restartRequired) {
      const accepted = window.confirm(
        'DANGER: changing motor pole pairs or sensor direction can cause violent vibration, overheating, or loss of control if the values do not match the hardware. Save these values to EEPROM, reboot SenseDial, and run a fresh FOC calibration?'
      )
      if (!accepted) return
    }
    await flushConfig(true)
    if (restartRequired && lastAppliedRef.current === JSON.stringify(configRef.current)) {
      setMessage('Saving hardware configuration and rebooting SenseDial…')
      await api.persistAndReboot()
      setStaticBaseline({
        pole_pairs: config.motor_control.pole_pairs,
        sensor_direction: config.motor_control.sensor_direction,
      })
      setConnected(false)
      setMotorReady(false)
      setTelemetry(undefined)
      setMessage('Hardware configuration saved. SenseDial is rebooting; reconnect after calibration.')
    }
  }

  async function restoreFactoryDefaults() {
    if (!connected) {
      setConfig(initialConfig)
      setMessage('Factory values restored in the editor. Connect SenseDial to restore its EEPROM defaults.')
      return
    }
    const accepted = window.confirm(
      'DANGER: restoring factory motor settings will erase the saved hardware configuration, reboot the device, and force a new FOC calibration. Continue?'
    )
    if (!accepted) return
    setMessage('Restoring factory EEPROM settings and rebooting SenseDial…')
    await api.restoreDefaults()
    setConfig(initialConfig)
    setStaticBaseline({ pole_pairs: 7, sensor_direction: 'AUTO' })
    setConnected(false)
    setMotorReady(false)
    setTelemetry(undefined)
    setMessage('Factory defaults restored. Reconnect after the automatic calibration finishes.')
  }

  function setDetentCount(value: number) {
    const count = Math.max(1, Math.round(value))
    setConfig((old) => ({
      ...old,
      max_position: old.min_position + count - 1,
      position: Math.min(old.position, old.min_position + count - 1),
      position_width_radians: Math.PI * 2 / count,
      detent_positions: [],
    }))
  }

  function toggleEveryFourth() {
    if (config.detent_positions.length) update('detent_positions', [])
    else update('detent_positions', Array.from({ length: detentCount }, (_, i) => config.min_position + i).filter((_, i) => i % 4 === 0))
  }

  function resetCurrentTab() {
    setConfig((old) => {
      if (tab === 'feel') return {
        ...old,
        min_position: initialConfig.min_position,
        max_position: initialConfig.max_position,
        position_width_radians: initialConfig.position_width_radians,
        detent_strength_unit: initialConfig.detent_strength_unit,
        endstop_strength_unit: initialConfig.endstop_strength_unit,
        snap_point: initialConfig.snap_point,
        snap_point_bias: initialConfig.snap_point_bias,
        detent_positions: [],
        override_detents: [],
      }
      if (tab === 'motion') return {
        ...old,
        position: initialConfig.position,
        sub_position_unit: initialConfig.sub_position_unit,
        motor_control: {
          ...old.motor_control,
          voltage_limit: stableMotorTuning.voltage_limit,
          velocity_limit: stableMotorTuning.velocity_limit,
          current_limit: stableMotorTuning.current_limit,
        },
      }
      return {
        ...old,
        motor_control: {
          ...stableMotorTuning,
          velocity_pid: { ...stableMotorTuning.velocity_pid },
          velocity_lpf: { ...stableMotorTuning.velocity_lpf },
          current_pid: { ...stableMotorTuning.current_pid },
          current_lpf: { ...stableMotorTuning.current_lpf },
          haptic_tuning: { ...stableMotorTuning.haptic_tuning },
        },
      }
    })
    setMessage(tab === 'advanced'
      ? 'Advanced defaults restored. Runtime tuning applies live; Apply will request a reboot only if hardware settings changed.'
      : `${tab === 'feel' ? 'Feel' : 'Motion'} defaults restored and queued for live apply.`)
  }

  return <main className="app-shell">
    <header className="topbar">
      <div className="brand"><div className="brand-mark"><Sparkles size={19} /></div><div><strong>SenseDial</strong><span>STUDIO</span></div><div className="topbar-credit"><img src="/spaghetti-lab-logo.png" alt="Spaghetti Lab" /><span>By Spaghetti Lab</span></div></div>
      <nav><button className="active">Designer</button><button>Telemetry</button><button>Presets</button></nav>
      <div className="connection-cluster">
        <div className="port-select"><Cable size={15} /><select value={port} onChange={(e) => setPort(e.target.value)}><option value="">Select device</option>{ports.map((item) => <option key={item.device} value={item.device}>{item.device}</option>)}</select><ChevronDown size={14} /></div>
        <button className={connected ? 'connect connected' : 'connect'} onClick={connected ? disconnect : connect}><span />{connected ? 'Disconnect' : 'Connect'}</button>
      </div>
    </header>

    <section className="workspace">
      <aside className="left-panel glass-panel">
        <div className="panel-title"><div><span>HAPTIC PROFILE</span><h2>Precision detents</h2></div><div className="reset-action"><small>{tab === 'advanced' ? 'LIVE / HW' : 'LIVE'}</small><button title={`Reset ${tab} tab`} onClick={resetCurrentTab}><RotateCcw size={17} /></button></div></div>
        <div className="tabs"><button className={tab === 'feel' ? 'active' : ''} onClick={() => setTab('feel')}>Feel</button><button className={tab === 'motion' ? 'active' : ''} onClick={() => setTab('motion')}>Motion</button><button className={tab === 'advanced' ? 'active' : ''} onClick={() => setTab('advanced')}>Advanced</button></div>
        <div className="controls-scroll">
          {tab === 'feel' && <>
            <Control label="Number of detents" value={detentCount} min={1} max={64} onChange={setDetentCount} hint={`${configuredDetents} active positions around 360°`} />
            <Control label="Detent strength" value={config.detent_strength_unit} min={0} max={5} step={0.05} unit="×" onChange={(v) => update('detent_strength_unit', v)} />
            <Control label="Endstop strength" value={config.endstop_strength_unit} min={0} max={5} step={0.05} unit="×" onChange={(v) => update('endstop_strength_unit', v)} />
            <Control label="Snap field" value={config.snap_point} min={0.05} max={1} step={0.01} onChange={(v) => update('snap_point', v)} hint="Blue arc visualizes the magnetic capture zone" />
            <Control label="Snap bias" value={config.snap_point_bias} min={-1} max={1} step={0.01} onChange={(v) => update('snap_point_bias', v)} />
            <div className="pattern-card"><div><strong>Detent pattern</strong><span>{config.detent_positions.length ? 'Every fourth position' : 'All positions'}</span></div><button onClick={toggleEveryFourth}>{config.detent_positions.length ? 'Use all' : 'Accent ¼'}</button></div>
          </>}
          {tab === 'motion' && <>
            <Control label="Target position" value={config.position} min={config.min_position} max={config.max_position} onChange={(v) => update('position', Math.round(v))} />
            <Control label="Sub-position" value={config.sub_position_unit} min={0} max={0.99} step={0.01} onChange={(v) => update('sub_position_unit', v)} />
            <Control label="Voltage limit" value={config.motor_control.voltage_limit} min={0.5} max={9} step={0.1} unit=" V" onChange={(v) => updateMotor('voltage_limit', v)} hint="Default 5 V. Stay near 0.58 × supply; raise only when you need more torque." />
            <Control label="Velocity limit" value={config.motor_control.velocity_limit} min={0.2} max={30} step={0.1} unit=" rad/s" onChange={(v) => updateMotor('velocity_limit', v)} />
            <Control label="Current limit" value={config.motor_control.current_limit} min={0} max={2.5} step={0.05} unit=" A" onChange={(v) => updateMotor('current_limit', v)} hint="Default 1.2 A. Lower if you prefer less holding force." />
          </>}
          {tab === 'advanced' && <>
            <Control label="Motor pole pairs" value={config.motor_control.pole_pairs} min={1} max={32} step={1} onChange={(v) => updateMotor('pole_pairs', Math.round(v))} />
            <label className="select-control"><div><span>Sensor direction</span><span className="info-dot" tabIndex={0}>i<small>Encoder direction. AUTO detects it during calibration; CW or CCW forces it. A wrong value can cause unstable motion and requires EEPROM save, reboot, and calibration.</small></span></div><select value={config.motor_control.sensor_direction} onChange={(event) => updateMotor('sensor_direction', event.target.value as DialConfig['motor_control']['sensor_direction'])}><option value="AUTO">Auto</option><option value="CW">Clockwise</option><option value="CCW">Counter-clockwise</option></select></label>
            {restartRequired && <div className="restart-notice">Restart required · live apply paused</div>}
            <button className="factory-reset" onClick={() => void restoreFactoryDefaults()}><RotateCcw size={13} />Restore factory EEPROM defaults · reboot</button>
            <Control label="Velocity P" value={config.motor_control.velocity_pid.p} min={0} max={2} step={0.01} onChange={(v) => updateMotor('velocity_pid', { ...config.motor_control.velocity_pid, p: v })} />
            <Control label="Velocity I" value={config.motor_control.velocity_pid.i} min={0} max={20} step={0.1} onChange={(v) => updateMotor('velocity_pid', { ...config.motor_control.velocity_pid, i: v })} />
            <Control label="Velocity D" value={config.motor_control.velocity_pid.d} min={0} max={1} step={0.001} onChange={(v) => updateMotor('velocity_pid', { ...config.motor_control.velocity_pid, d: v })} />
            <Control label="Output ramp" value={config.motor_control.velocity_pid.output_ramp} min={10} max={3000} step={10} onChange={(v) => updateMotor('velocity_pid', { ...config.motor_control.velocity_pid, output_ramp: v })} />
            <Control label="Velocity filter" value={config.motor_control.velocity_lpf.time_constant} min={0.001} max={0.1} step={0.001} unit=" s" onChange={(v) => updateMotor('velocity_lpf', { time_constant: v })} />
            <Control label="Current P" value={config.motor_control.current_pid.p} min={0} max={10} step={0.05} onChange={(v) => updateMotor('current_pid', { ...config.motor_control.current_pid, p: v })} />
            <Control label="Current I" value={config.motor_control.current_pid.i} min={0} max={1000} step={5} onChange={(v) => updateMotor('current_pid', { ...config.motor_control.current_pid, i: v })} />
            <Control label="Current D" value={config.motor_control.current_pid.d} min={0} max={1} step={0.001} onChange={(v) => updateMotor('current_pid', { ...config.motor_control.current_pid, d: v })} />
            <Control label="Current ramp" value={config.motor_control.current_pid.output_ramp} min={0} max={5000} step={10} onChange={(v) => updateMotor('current_pid', { ...config.motor_control.current_pid, output_ramp: v })} />
            <Control label="Current filter" value={config.motor_control.current_lpf.time_constant} min={0.001} max={0.1} step={0.001} unit=" s" onChange={(v) => updateMotor('current_lpf', { time_constant: v })} />
            <Control label="Detent gain" value={config.motor_control.haptic_tuning.detent_gain} min={0.01} max={1.5} step={0.01} unit=" V/×" onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, detent_gain: v })} />
            <Control label="Endstop gain" value={config.motor_control.haptic_tuning.endstop_gain} min={0.01} max={2} step={0.01} unit=" V/×" onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, endstop_gain: v })} />
            <Control label="Center deadband" value={config.motor_control.haptic_tuning.deadband_fraction} min={0} max={0.25} step={0.001} onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, deadband_fraction: v })} />
            <Control label="Torque smoothing" value={config.motor_control.haptic_tuning.torque_filter_time_constant} min={0.001} max={0.1} step={0.001} unit=" s" onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, torque_filter_time_constant: v })} />
            <Control label="Torque slew rate" value={config.motor_control.haptic_tuning.torque_slew_rate} min={1} max={300} step={1} unit=" V/s" onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, torque_slew_rate: v })} />
            <Control label="Detent settle zone" value={config.motor_control.haptic_tuning.detent_settle_fraction} min={0} max={0.25} step={0.001} onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, detent_settle_fraction: v })} />
            <Control label="Endstop settle zone" value={config.motor_control.haptic_tuning.endstop_settle_fraction} min={0} max={0.25} step={0.001} onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, endstop_settle_fraction: v })} />
            <Control label="Idle release" value={config.motor_control.haptic_tuning.idle_release_ms} min={10} max={2000} step={10} unit=" ms" onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, idle_release_ms: v })} />
            <Control label="Idle centering delay" value={config.motor_control.haptic_tuning.idle_centering_delay_ms} min={50} max={5000} step={50} unit=" ms" onChange={(v) => updateMotor('haptic_tuning', { ...config.motor_control.haptic_tuning, idle_centering_delay_ms: v })} />
          </>}
        </div>
      </aside>

      <section className="hero-panel">
        <div className="ambient-grid" />
        <div className="hero-copy"><span>REAL-TIME HAPTIC MODEL</span><h1>Feel the interface<br/><em>before you touch it.</em></h1><div className="brand-credit">By Spaghetti Lab</div></div>
        <DialPreview config={config} telemetry={telemetry} connected={connected} applying={applying} />
      </section>

      <aside className="right-panel glass-panel">
        <div className="panel-title"><div><span>LIVE INSPECTOR</span><h2>Physical response</h2></div><Activity size={18} /></div>
        <div className="metric-grid">
          <div><Gauge /><span>Step angle</span><strong>{(config.position_width_radians * 180 / Math.PI).toFixed(1)}°</strong></div>
          <div><Zap /><span>Torque ceiling</span><strong>{config.motor_control.voltage_limit.toFixed(1)} V</strong></div>
          <div><Settings2 /><span>Active detents</span><strong>{configuredDetents}</strong></div>
        </div>
        <div className="feel-map">
          <div className="section-label">FEEL MAP</div>
          <div className="feel-row"><span>Soft</span><div><i style={{ width: `${config.detent_strength_unit / 5 * 100}%` }} /></div><span>Crisp</span></div>
          <div className="feel-row"><span>Loose</span><div className="blue"><i style={{ width: `${config.snap_point * 100}%` }} /></div><span>Magnetic</span></div>
        </div>
        <div className="profile-summary">
          <span className="section-label">PROFILE DNA</span>
          <div className="dna"><i style={{ height: `${25 + config.detent_strength_unit * 11}%` }} /><i style={{ height: `${20 + config.snap_point * 55}%` }} /><i style={{ height: `${25 + config.endstop_strength_unit * 10}%` }} /><i style={{ height: `${30 + Math.min(55, config.motor_control.velocity_limit * 2)}%` }} /><i style={{ height: `${20 + config.motor_control.voltage_limit * 10}%` }} /></div>
          <p>A {detentCount}-position tactile profile with {config.snap_point > .6 ? 'strong' : 'progressive'} magnetic capture and reinforced boundaries.</p>
        </div>
        <label className="live-apply"><input type="checkbox" checked={liveApply} onChange={(event) => setLiveApply(event.target.checked)} /><span>Apply changes in real time</span></label>
        <button className="apply-button" onClick={apply} disabled={applying}><Save size={18} />{applying ? 'Synchronizing…' : 'Apply to SenseDial'}<span>⌘ ↵</span></button>
        <div className="message-line"><span className={connected ? 'online' : ''} />{message}</div>
      </aside>
    </section>
  </main>
}
