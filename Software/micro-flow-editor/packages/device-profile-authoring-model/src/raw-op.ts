import { DeviceProfileOpcode } from "./opcodes.js";
import type { Instruction } from "./instruction.js";

/**
 * Mirrors `struct spaghetti_device_profile_op` field-for-field
 * (`device_profile.h`): "operand meaning depends on opcode. Immediate
 * fields carry lengths, timeouts, masks, and small constants." This is the
 * wire/storage layout — `toRawOp()` is the one place a typed `Instruction`
 * is mapped onto it, mechanically, never by an arbitrary formula.
 */
export type RawDeviceProfileOp = {
  readonly opcode: number;
  readonly dst: number;
  readonly srcA: number;
  readonly srcB: number;
  readonly imm0: number;
  readonly imm1: number;
  readonly imm2: number;
  readonly imm3: number;
};

const LEFT = 0;
const RIGHT = 1;

/** Fixed per-opcode compile — see each `Instruction` variant's doc comment in `instruction.ts` for the operand meaning this mirrors (grounded in `device_profile_exec.c`, not just the opcode enum's one-line comments). */
export function toRawOp(instruction: Instruction): RawDeviceProfileOp {
  const base = { dst: 0, srcA: 0, srcB: 0, imm0: 0, imm1: 0, imm2: 0, imm3: 0 };
  switch (instruction.op) {
    case "I2C_WRITE":
      return { ...base, opcode: DeviceProfileOpcode.I2C_WRITE, srcA: instruction.src, imm0: instruction.length, imm1: instruction.timeoutMs };
    case "I2C_READ":
      return { ...base, opcode: DeviceProfileOpcode.I2C_READ, dst: instruction.dst, imm0: instruction.length, imm1: instruction.timeoutMs };
    case "I2C_WRITE_READ":
      return {
        ...base,
        opcode: DeviceProfileOpcode.I2C_WRITE_READ,
        srcA: instruction.src,
        dst: instruction.dst,
        imm0: instruction.readLength,
        imm1: instruction.writeLength,
        imm2: instruction.timeoutMs,
      };
    case "SPI_TRANSCEIVE":
      return {
        ...base,
        opcode: DeviceProfileOpcode.SPI_TRANSCEIVE,
        srcA: instruction.src,
        dst: instruction.dst,
        imm0: instruction.length,
        imm1: instruction.timeoutMs,
        imm2: instruction.frequencyHz,
      };
    case "UART_WRITE":
      return { ...base, opcode: DeviceProfileOpcode.UART_WRITE, srcA: instruction.src, imm0: instruction.length, imm1: instruction.timeoutMs };
    case "UART_READ_UNTIL":
      return {
        ...base,
        opcode: DeviceProfileOpcode.UART_READ_UNTIL,
        dst: instruction.dst,
        imm0: instruction.maxLength,
        imm1: instruction.timeoutMs,
        imm2: instruction.stopByte,
      };
    case "GPIO_GET":
      return { ...base, opcode: DeviceProfileOpcode.GPIO_GET, dst: instruction.dst };
    case "GPIO_SET":
      return { ...base, opcode: DeviceProfileOpcode.GPIO_SET, imm0: instruction.value ? 1 : 0 };
    case "ADC_READ":
      return { ...base, opcode: DeviceProfileOpcode.ADC_READ, dst: instruction.dst, imm0: instruction.timeoutMs };
    case "DELAY_BOUNDED":
      return { ...base, opcode: DeviceProfileOpcode.DELAY_BOUNDED, imm0: instruction.milliseconds };
    case "WAIT_FIELD_MASK":
      return {
        ...base,
        opcode: DeviceProfileOpcode.WAIT_FIELD_MASK,
        dst: instruction.dst,
        srcA: instruction.src,
        imm0: instruction.attempts,
        imm1: instruction.intervalMs,
        imm2: instruction.mask,
        imm3: instruction.expected,
      };
    case "LOAD_CONST":
      return { ...base, opcode: DeviceProfileOpcode.LOAD_CONST, dst: instruction.dst, imm0: instruction.length, imm2: instruction.low, imm3: instruction.high };
    case "COPY_BYTES":
      return { ...base, opcode: DeviceProfileOpcode.COPY_BYTES, srcA: instruction.src, dst: instruction.dst, imm0: instruction.length };
    case "CONCAT":
      return { ...base, opcode: DeviceProfileOpcode.CONCAT, srcA: instruction.srcA, srcB: instruction.srcB, dst: instruction.dst };
    case "BYTE_SWAP":
      return { ...base, opcode: DeviceProfileOpcode.BYTE_SWAP, srcA: instruction.src, dst: instruction.dst, imm0: instruction.width };
    case "MASK":
      return { ...base, opcode: DeviceProfileOpcode.MASK, srcA: instruction.src, dst: instruction.dst, imm2: instruction.mask };
    case "SHIFT":
      return {
        ...base,
        opcode: DeviceProfileOpcode.SHIFT,
        srcA: instruction.src,
        dst: instruction.dst,
        imm0: instruction.amount,
        imm1: instruction.direction === "left" ? LEFT : RIGHT,
      };
    case "SIGN_EXTEND":
      return { ...base, opcode: DeviceProfileOpcode.SIGN_EXTEND, srcA: instruction.src, dst: instruction.dst, imm0: instruction.bits };
    case "CRC8":
      return { ...base, opcode: DeviceProfileOpcode.CRC8, srcA: instruction.src, dst: instruction.dst };
    case "CRC16":
      return { ...base, opcode: DeviceProfileOpcode.CRC16, srcA: instruction.src, dst: instruction.dst };
    case "EMIT_FIELD":
      return { ...base, opcode: DeviceProfileOpcode.EMIT_FIELD, srcA: instruction.src, dst: instruction.fieldId };
    case "EMIT_RECORD":
      return { ...base, opcode: DeviceProfileOpcode.EMIT_RECORD };
  }
}
