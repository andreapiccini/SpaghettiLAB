import { useMemo } from 'react'
import type { DialConfig, DialTelemetry } from '../types'

type Props = { config: DialConfig; telemetry?: DialTelemetry; connected: boolean; applying: boolean }

const polar = (angle: number, radius: number) => ({
  x: 260 + Math.cos(angle - Math.PI / 2) * radius,
  y: 260 + Math.sin(angle - Math.PI / 2) * radius,
})

const arcPath = (startAngle: number, endAngle: number, radius: number) => {
  const start = polar(startAngle, radius)
  const end = polar(endAngle, radius)
  const largeArc = Math.abs(endAngle - startAngle) > Math.PI ? 1 : 0
  const sweep = endAngle >= startAngle ? 1 : 0
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${end.x} ${end.y}`
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value))

const endstopForceArc = (side: 'min' | 'max', anchorAngle: number, overshoot: number, count: number, radius: number) => {
  const fullTurnProgress = clamp(overshoot / Math.max(1, count), 0, 1)
  const span = fullTurnProgress * Math.PI * 2 * 0.995
  const direction = side === 'min' ? 1 : -1
  return {
    force: fullTurnProgress,
    path: arcPath(anchorAngle, anchorAngle + span * direction, radius),
  }
}

export default function DialPreview({ config, telemetry, connected, applying }: Props) {
  const endstopRadius = 212
  const count = Math.max(1, config.max_position - config.min_position + 1)
  const detents = useMemo(() => Array.from({ length: count }, (_, index) => {
    const position = config.min_position + index
    const angle = count === 1 ? 0 : -(index / count) * Math.PI * 2
    const override = config.override_detents.find((item) => item.position === position)
    const enabled = config.detent_positions.length === 0 || config.detent_positions.includes(position)
    return { position, angle, strength: override?.strength ?? config.detent_strength_unit, enabled }
  }), [config, count])
  const livePosition = telemetry?.current_position ?? config.position
  const liveSubPosition = telemetry?.sub_position_unit ?? config.sub_position_unit
  const normalized = ((livePosition - config.min_position + liveSubPosition) / count) * 360
  const visualRotation = -normalized
  const snapArc = Math.max(4, Math.min(70, config.snap_point * 120))
  const physicalPosition = livePosition + liveSubPosition
  const lowerOvershoot = connected && telemetry
    ? Math.max(0, config.min_position - physicalPosition)
    : 0
  const upperOvershoot = connected && telemetry
    ? Math.max(0, physicalPosition - config.max_position)
    : 0
  const endstopSide = lowerOvershoot > 0 ? 'min' : upperOvershoot > 0 ? 'max' : undefined
  const minEndstopAngle = 0
  const maxEndstopAngle = count === 1 ? 0 : -((count - 1) / count) * Math.PI * 2
  const activeEndstopAngle = endstopSide === 'min' ? minEndstopAngle : maxEndstopAngle
  const activeForceArc = endstopSide
    ? endstopForceArc(endstopSide, activeEndstopAngle, Math.max(lowerOvershoot, upperOvershoot), count, endstopRadius)
    : undefined
  const minLabel = polar(minEndstopAngle, 244)
  const maxLabel = polar(maxEndstopAngle, 244)

  return (
    <div className="dial-stage">
      <div className={`energy-halo ${applying ? 'is-applying' : ''}`} />
      <svg className="dial-svg" viewBox="0 0 520 520" role="img" aria-label="Live haptic dial preview">
        <defs>
          <radialGradient id="dialFace" cx="40%" cy="30%">
            <stop offset="0" stopColor="#203f63" />
            <stop offset="0.55" stopColor="#0d2038" />
            <stop offset="1" stopColor="#050c18" />
          </radialGradient>
          <linearGradient id="accent" x1="0" x2="1">
            <stop stopColor="#8bd8ff" />
            <stop offset="1" stopColor="#2b83ff" />
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="5" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          <filter id="shadow"><feDropShadow dx="0" dy="18" stdDeviation="18" floodColor="#000" floodOpacity=".65" /></filter>
        </defs>
        <circle cx="260" cy="260" r="225" fill="none" stroke="#7bbdff18" strokeWidth="1" />
        <circle cx="260" cy="260" r="205" fill="none" stroke="#7bbdff28" strokeWidth="1" strokeDasharray="2 8" />
        <path className="endstop-marker" d={arcPath(minEndstopAngle - .055, minEndstopAngle + .055, endstopRadius)} />
        {count > 1 && <path className="endstop-marker" d={arcPath(maxEndstopAngle - .055, maxEndstopAngle + .055, endstopRadius)} />}
        <text className="endstop-label" x={minLabel.x} y={minLabel.y}>MIN ↻</text>
        {count > 1 && <text className="endstop-label" x={maxLabel.x} y={maxLabel.y}>MAX ↺</text>}
        {detents.map(({ position, angle, strength, enabled }) => {
          const start = polar(angle, 188)
          const end = polar(angle, enabled ? 211 + strength * 4 : 199)
          const selected = position === livePosition
          return <g key={position} className={selected ? 'detent selected' : 'detent'}>
            <line x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke={endstopSide ? '#69747b' : enabled ? (selected ? '#a8ddff' : '#65d8ff') : '#61716c'} strokeWidth={selected && !endstopSide ? 4 : enabled ? 2.2 : 1} strokeLinecap="round" opacity={endstopSide ? .28 : enabled ? .9 : .35} />
            {selected && !endstopSide && <circle cx={end.x} cy={end.y} r="5" fill="#a8ddff" filter="url(#glow)" />}
          </g>
        })}
        <path d={`M 260 48 A 212 212 0 0 1 ${polar((snapArc / 180) * Math.PI, 212).x} ${polar((snapArc / 180) * Math.PI, 212).y}`} fill="none" stroke={endstopSide ? '#69747b' : '#2b83ff'} strokeWidth="7" strokeLinecap="round" opacity={endstopSide ? .2 : .72} filter="url(#glow)" transform={`rotate(${visualRotation - snapArc / 2} 260 260)`} />
        {activeForceArc && <path className="endstop-force" d={activeForceArc.path} strokeWidth={5 + activeForceArc.force * 19} />}
        <g filter="url(#shadow)" transform={`rotate(${visualRotation} 260 260)`}>
          <circle cx="260" cy="260" r="166" fill="url(#dialFace)" stroke="#45627f" strokeWidth="2" />
          <circle cx="260" cy="260" r="151" fill="none" stroke="#ffffff0c" strokeWidth="2" />
          <path d="M260 104 L251 132 L269 132 Z" fill="url(#accent)" filter="url(#glow)" />
          <path d="M165 175 A135 135 0 0 1 345 155" fill="none" stroke="#ffffff10" strokeWidth="13" strokeLinecap="round" />
        </g>
        <g className="dial-readout">
          <text x="260" y="236" textAnchor="middle" className="eyebrow">POSITION</text>
          <text x="260" y="294" textAnchor="middle" className="position-value">{livePosition}</text>
          <text x="260" y="326" textAnchor="middle" className="position-meta">{count} DETENTS · {(config.position_width_radians * 180 / Math.PI).toFixed(1)}° STEP</text>
        </g>
      </svg>
      <div className="dial-legend">
        <span><i className="dot detent-dot" />Detent</span>
        <span><i className="dot snap-dot" />Snap field</span>
        <span><i className="dot endstop-dot" />Endstop</span>
      </div>
      <div className={`hardware-pill ${connected ? 'online' : ''}`}>
        <span className="status-light" />{connected ? 'Hardware linked' : 'Preview mode'}
      </div>
    </div>
  )
}
