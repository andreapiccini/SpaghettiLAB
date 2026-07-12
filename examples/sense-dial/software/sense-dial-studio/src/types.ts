export type DialConfig = {
  position: number
  sub_position_unit: number
  min_position: number
  max_position: number
  position_width_radians: number
  detent_strength_unit: number
  endstop_strength_unit: number
  snap_point: number
  snap_point_bias: number
  detent_positions: number[]
  override_detents: { position: number; strength: number }[]
  motor_control: {
    pole_pairs: number
    sensor_type: 'MAGNETIC_ENCODER' | 'HALL' | 'NONE'
    sensor_direction: 'AUTO' | 'CW' | 'CCW'
    motion_type: 'POSITION' | 'VELOCITY' | 'TORQUE'
    voltage_limit: number
    velocity_limit: number
    current_limit: number
    velocity_pid: { p: number; i: number; d: number; output_ramp: number }
    velocity_lpf: { time_constant: number }
    current_pid: { p: number; i: number; d: number; output_ramp: number }
    current_lpf: { time_constant: number }
    haptic_tuning: {
      detent_gain: number
      endstop_gain: number
      deadband_fraction: number
      torque_filter_time_constant: number
      torque_slew_rate: number
      detent_settle_fraction: number
      endstop_settle_fraction: number
      idle_release_ms: number
    }
  }
}

export type SerialPort = { device: string; description?: string }

export type DialTelemetry = {
  current_position: number
  sub_position_unit: number
}

export type DialStateResult = {
  dial_state?: DialTelemetry & {
    config?: Partial<DialConfig>
  }
}

export type ApplyConfigResult = {
  ok: boolean
  verified: boolean
  position_nonce: number
  state?: {
    host_state?: {
      lowside?: {
        ready?: boolean
        calibrated?: boolean
        fault_active?: boolean
        applied_config_nonce?: number
      }
    }
  } | null
}
