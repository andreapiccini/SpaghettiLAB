/**
 * Typed, ergonomic instructions for authoring an acquisition plan — one
 * variant per opcode in `opcodes.ts`, with named fields instead of raw
 * `imm0`-`imm3` operand slots. `raw-op.ts` compiles each variant down to the
 * exact `spaghetti_device_profile_op` struct layout mechanically (a fixed
 * per-opcode mapping, never an arbitrary formula — S061 point 3), using the
 * operand meaning documented on every opcode in
 * `Firmware/core/include/spaghetti/device_profile.h`'s enum comments (e.g.
 * `I2C_READ = 2, /` Read imm0 bytes into temp. `/`).
 *
 * A `TempSlot` is an index into the firmware's 8 temporary byte slots
 * (`SPAGHETTI_DEVICE_PROFILE_TEMP_SLOTS`); `MAX_TEMP_SLOTS` here mirrors that
 * constant, not an invented editor limit.
 */
export const MAX_TEMP_SLOTS = 8;

export type TempSlot = number;

type Op<Kind extends string> = { readonly op: Kind };

export type I2cWriteInstruction = Op<"I2C_WRITE"> & { readonly src: TempSlot };
export type I2cReadInstruction = Op<"I2C_READ"> & { readonly dst: TempSlot; readonly length: number };
export type I2cWriteReadInstruction = Op<"I2C_WRITE_READ"> & { readonly src: TempSlot; readonly dst: TempSlot; readonly readLength: number };
export type SpiTransceiveInstruction = Op<"SPI_TRANSCEIVE"> & { readonly src: TempSlot; readonly dst: TempSlot; readonly length: number };
export type UartWriteInstruction = Op<"UART_WRITE"> & { readonly src: TempSlot };
export type UartReadUntilInstruction = Op<"UART_READ_UNTIL"> & { readonly dst: TempSlot; readonly stopByte: number; readonly maxLength: number };
export type GpioGetInstruction = Op<"GPIO_GET"> & { readonly dst: TempSlot };
export type GpioSetInstruction = Op<"GPIO_SET"> & { readonly src: TempSlot };
export type AdcReadInstruction = Op<"ADC_READ"> & { readonly dst: TempSlot };
export type DelayBoundedInstruction = Op<"DELAY_BOUNDED"> & { readonly milliseconds: number };
/** "Bounded ready poll" — `attempts` must be > 0 (the firmware itself rejects zero attempts as an unbounded wait, `-EINVAL`); this is the only looping construct the instruction set has. */
export type WaitFieldMaskInstruction = Op<"WAIT_FIELD_MASK"> & {
  readonly src: TempSlot;
  readonly mask: number;
  readonly expected: number;
  readonly attempts: number;
  readonly intervalMs: number;
};
export type LoadConstInstruction = Op<"LOAD_CONST"> & { readonly dst: TempSlot; readonly low: number; readonly high: number };
export type CopyBytesInstruction = Op<"COPY_BYTES"> & { readonly src: TempSlot; readonly dst: TempSlot };
export type ConcatInstruction = Op<"CONCAT"> & { readonly srcA: TempSlot; readonly srcB: TempSlot; readonly dst: TempSlot };
export type ByteSwapInstruction = Op<"BYTE_SWAP"> & { readonly src: TempSlot; readonly dst: TempSlot; readonly width: 2 | 4 };
export type MaskInstruction = Op<"MASK"> & { readonly src: TempSlot; readonly dst: TempSlot; readonly mask: number };
export type ShiftInstruction = Op<"SHIFT"> & { readonly src: TempSlot; readonly dst: TempSlot; readonly amount: number; readonly direction: "left" | "right" };
export type SignExtendInstruction = Op<"SIGN_EXTEND"> & { readonly src: TempSlot; readonly dst: TempSlot; readonly bits: number };
export type Crc8Instruction = Op<"CRC8"> & { readonly src: TempSlot; readonly dst: TempSlot };
export type Crc16Instruction = Op<"CRC16"> & { readonly src: TempSlot; readonly dst: TempSlot };
/** `fieldId` must match a `SampleField.fieldId` declared on the owning `DeviceProfileDraft` — checked by `validate-profile.ts`, never assumed. */
export type EmitFieldInstruction = Op<"EMIT_FIELD"> & { readonly src: TempSlot; readonly fieldId: number };
export type EmitRecordInstruction = Op<"EMIT_RECORD">;

export type Instruction =
  | I2cWriteInstruction
  | I2cReadInstruction
  | I2cWriteReadInstruction
  | SpiTransceiveInstruction
  | UartWriteInstruction
  | UartReadUntilInstruction
  | GpioGetInstruction
  | GpioSetInstruction
  | AdcReadInstruction
  | DelayBoundedInstruction
  | WaitFieldMaskInstruction
  | LoadConstInstruction
  | CopyBytesInstruction
  | ConcatInstruction
  | ByteSwapInstruction
  | MaskInstruction
  | ShiftInstruction
  | SignExtendInstruction
  | Crc8Instruction
  | Crc16Instruction
  | EmitFieldInstruction
  | EmitRecordInstruction;
