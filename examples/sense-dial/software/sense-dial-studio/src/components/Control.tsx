import type { ReactNode } from 'react'

type Props = {
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  hint?: ReactNode
  info?: ReactNode
  onChange: (value: number) => void
}

const CONTROL_INFO: Record<string, string> = {
  'Number of detents': 'Number of tactile steps per revolution. Increasing it places steps closer together; decreasing it makes each step wider and easier to distinguish.',
  'Detent strength': 'Strength of each tactile click. Increasing it creates a firmer click but requires more hand force; decreasing it makes rotation softer.',
  'Endstop strength': 'Strength of the virtual mechanical limit. Increasing it makes the boundary harder to push through; decreasing it makes the stop more elastic.',
  'Snap field': 'Point where the dial moves to the next detent. Increasing it requires more rotation before switching; decreasing it captures the next detent sooner.',
  'Snap bias': 'Offsets the switching point by direction. Positive values favor one direction; negative values favor the opposite direction.',
  'Target position': 'Requested logical position. Increasing it moves toward higher indices; decreasing it moves toward lower indices.',
  'Sub-position': 'Fractional offset between two positions. Increasing it shifts the reference toward the next detent without changing the integer index.',
  'Voltage limit': 'Maximum motor voltage. Increasing it adds force but also heat and noise; decreasing it is gentler and quieter but reduces available force.',
  'Velocity limit': 'Maximum control speed. Increasing it improves speed but can reduce precision; decreasing it improves control and precision but limits speed.',
  'Current limit': 'SimpleFOC current ceiling. Increasing it permits more torque in current-control modes; decreasing it protects the motor but reduces force.',
  'Motor pole pairs': 'Physical pole-pair count of the motor. A wrong value can cause violent vibration or loss of control. Changing it requires EEPROM save, reboot, and calibration.',
  'Velocity P': 'Proportional response to velocity error. Increasing it sharpens response but can cause oscillation; decreasing it is smoother but slower.',
  'Velocity I': 'Accumulated velocity-error correction. Increasing it removes steady error faster but can create oscillation; decreasing it improves stability.',
  'Velocity D': 'Damping for fast velocity changes. Increasing it can reduce oscillation but amplify sensor noise; decreasing it provides less damping.',
  'Output ramp': 'Maximum command change rate. Increasing it makes response more aggressive; decreasing it makes response smoother but slower.',
  'Velocity filter': 'Filtering of measured velocity. Increasing it reduces noise and whine but adds delay; decreasing it follows motion faster but passes more noise.',
  'Current P': 'Proportional current-loop response. Increasing it makes current react faster but may oscillate; decreasing it makes the loop slower.',
  'Current I': 'Integral current-loop correction. Increasing it recovers error faster but may excite resonance; decreasing it improves stability.',
  'Current D': 'Current-loop damping. Increasing it opposes fast changes but may amplify noise; it is normally kept near zero.',
  'Current ramp': 'Maximum current-command change rate. Increasing it improves response; decreasing it makes current delivery more gradual.',
  'Current filter': 'Filtering of measured phase current. Increasing it reduces noise but slows the loop; decreasing it improves response but can increase whine.',
  'Detent gain': 'Voltage gain used for detents. Increasing it makes clicks stronger; decreasing it makes them lighter.',
  'Endstop gain': 'Voltage gain used for endstops. Increasing it creates a harder virtual wall; decreasing it makes the wall softer.',
  'Center deadband': 'Quiet zone around a detent center. Increasing it reduces vibration but lowers centering precision; decreasing it improves precision but may add buzz.',
  'Torque smoothing': 'Filtering of the torque command. Increasing it makes motion smoother but delayed; decreasing it makes response faster but potentially noisier.',
  'Torque slew rate': 'Maximum torque change rate. Increasing it creates sharper clicks; decreasing it reduces impacts and noise but softens the feel.',
  'Detent settle zone': 'Zone considered settled at a detent. Increasing it releases the motor sooner but reduces precision; decreasing it centers more accurately.',
  'Endstop settle zone': 'Zone considered settled at an endstop. Increasing it calms the motor sooner; decreasing it holds the boundary more precisely.',
  'Idle release': 'Delay before disabling a quiet motor. Increasing it holds force longer; decreasing it reduces noise and power but releases sooner.',
  'Idle centering delay': 'Time the knob must remain still before its detent center slowly follows the resting angle. Increasing it preserves exact centering longer but may leave residual buzz; decreasing it quiets the motor sooner but allows more resting-position drift.',
}

export default function Control({ label, value, min, max, step = 1, unit, hint, info, onChange }: Props) {
  const progress = ((value - min) / (max - min)) * 100
  const help = info ?? CONTROL_INFO[label]
  return <label className="control">
    <div className="control-label"><span className="control-name">{label}{help && <span className="info-dot" tabIndex={0}>i<small>{help}</small></span>}</span><strong>{Number(value.toFixed(3))}{unit}</strong></div>
    <input type="range" min={min} max={max} step={step} value={value} style={{ '--progress': `${progress}%` } as React.CSSProperties} onChange={(event) => onChange(Number(event.target.value))} />
    {hint && <small>{hint}</small>}
  </label>
}
