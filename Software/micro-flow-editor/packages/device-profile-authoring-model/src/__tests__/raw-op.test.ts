import { describe, expect, it } from "vitest";
import { DeviceProfileOpcode } from "../opcodes.js";
import { toRawOp } from "../raw-op.js";

describe("toRawOp — fixed per-opcode compile, S061 point 3", () => {
  it("compiles I2C_READ using imm0 for length and imm1 for timeoutMs, per device_profile_exec.c's exec_i2c_read", () => {
    expect(toRawOp({ op: "I2C_READ", dst: 1, length: 2, timeoutMs: 50 })).toEqual({
      opcode: DeviceProfileOpcode.I2C_READ,
      dst: 1,
      srcA: 0,
      srcB: 0,
      imm0: 2,
      imm1: 50,
      imm2: 0,
      imm3: 0,
    });
  });

  it("compiles I2C_WRITE_READ with imm0=readLength, imm1=writeLength, imm2=timeoutMs — easy to get backwards, verified against exec_i2c_write_read's call site", () => {
    expect(toRawOp({ op: "I2C_WRITE_READ", src: 0, dst: 1, readLength: 4, writeLength: 1, timeoutMs: 20 })).toEqual({
      opcode: DeviceProfileOpcode.I2C_WRITE_READ,
      dst: 1,
      srcA: 0,
      srcB: 0,
      imm0: 4,
      imm1: 1,
      imm2: 20,
      imm3: 0,
    });
  });

  it("compiles UART_READ_UNTIL with imm0=maxLength, imm1=timeoutMs, imm2=stopByte", () => {
    expect(toRawOp({ op: "UART_READ_UNTIL", dst: 2, maxLength: 16, timeoutMs: 100, stopByte: 0x0a })).toEqual({
      opcode: DeviceProfileOpcode.UART_READ_UNTIL,
      dst: 2,
      srcA: 0,
      srcB: 0,
      imm0: 16,
      imm1: 100,
      imm2: 0x0a,
      imm3: 0,
    });
  });

  it("compiles GPIO_SET as an immediate boolean in imm0, never a temp slot", () => {
    expect(toRawOp({ op: "GPIO_SET", value: true })).toEqual({
      opcode: DeviceProfileOpcode.GPIO_SET,
      dst: 0,
      srcA: 0,
      srcB: 0,
      imm0: 1,
      imm1: 0,
      imm2: 0,
      imm3: 0,
    });
  });

  it("compiles WAIT_FIELD_MASK with dst as the result slot, src as the optional write-command slot, and attempts/intervalMs/mask/expected in imm0-imm3", () => {
    expect(toRawOp({ op: "WAIT_FIELD_MASK", dst: 1, src: 3, mask: 0xff, expected: 0x01, attempts: 5, intervalMs: 10 })).toEqual({
      opcode: DeviceProfileOpcode.WAIT_FIELD_MASK,
      dst: 1,
      srcA: 3,
      srcB: 0,
      imm0: 5,
      imm1: 10,
      imm2: 0xff,
      imm3: 0x01,
    });
  });

  it("compiles LOAD_CONST using imm0 for length and imm2/imm3 for the value, per 'Load imm2/imm3 bytes'", () => {
    expect(toRawOp({ op: "LOAD_CONST", dst: 0, length: 4, low: 100, high: 0 })).toEqual({
      opcode: DeviceProfileOpcode.LOAD_CONST,
      dst: 0,
      srcA: 0,
      srcB: 0,
      imm0: 4,
      imm1: 0,
      imm2: 100,
      imm3: 0,
    });
  });

  it("compiles EMIT_FIELD with the field id in dst, per the struct's own 'destination temp slot or emitted field id'", () => {
    expect(toRawOp({ op: "EMIT_FIELD", src: 2, fieldId: 7 })).toMatchObject({
      opcode: DeviceProfileOpcode.EMIT_FIELD,
      srcA: 2,
      dst: 7,
    });
  });

  it("compiles EMIT_RECORD with no operands", () => {
    expect(toRawOp({ op: "EMIT_RECORD" })).toEqual({
      opcode: DeviceProfileOpcode.EMIT_RECORD,
      dst: 0,
      srcA: 0,
      srcB: 0,
      imm0: 0,
      imm1: 0,
      imm2: 0,
      imm3: 0,
    });
  });
});
