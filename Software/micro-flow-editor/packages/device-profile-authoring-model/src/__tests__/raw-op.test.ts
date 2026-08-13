import { describe, expect, it } from "vitest";
import { DeviceProfileOpcode } from "../opcodes.js";
import { toRawOp } from "../raw-op.js";

describe("toRawOp — fixed per-opcode compile, S061 point 3", () => {
  it("compiles I2C_READ using imm0 for length, per device_profile.h's opcode comment", () => {
    expect(toRawOp({ op: "I2C_READ", dst: 1, length: 2 })).toEqual({
      opcode: DeviceProfileOpcode.I2C_READ,
      dst: 1,
      srcA: 0,
      srcB: 0,
      imm0: 2,
      imm1: 0,
      imm2: 0,
      imm3: 0,
    });
  });

  it("compiles WAIT_FIELD_MASK with attempts/intervalMs/mask/expected in imm0-imm3", () => {
    expect(toRawOp({ op: "WAIT_FIELD_MASK", src: 3, mask: 0xff, expected: 0x01, attempts: 5, intervalMs: 10 })).toEqual({
      opcode: DeviceProfileOpcode.WAIT_FIELD_MASK,
      dst: 0,
      srcA: 3,
      srcB: 0,
      imm0: 5,
      imm1: 10,
      imm2: 0xff,
      imm3: 0x01,
    });
  });

  it("compiles LOAD_CONST using imm2/imm3, per 'Load imm2/imm3 bytes'", () => {
    expect(toRawOp({ op: "LOAD_CONST", dst: 0, low: 100, high: 0 })).toMatchObject({
      opcode: DeviceProfileOpcode.LOAD_CONST,
      dst: 0,
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
