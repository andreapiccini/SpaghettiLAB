# Architecture & Implementation Details

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    RP2350 (Pico 2)                           │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ARM Cortex-M33 Dual Core @ 150 MHz                   │ │
│  └────────────────────────────────────────────────────────┘ │
│                           ↑                                  │
│           ┌───────────────┴───────────────┐                 │
│           │                               │                 │
│  ┌────────▼──────────┐        ┌──────────▼───────┐         │
│  │  PIO State        │        │  Programmable IO │         │
│  │  Machine #0       │        │  (PIO)           │         │
│  │                   │        │                  │         │
│  │  - ws2812_inverted│        │  - Pin control   │         │
│  │    program        │        │  - Timing        │         │
│  │  - Side-set GPIO3 │        │  - Data shift    │         │
│  │  - 800 kHz clock  │        │  - DMA support   │         │
│  └────────┬──────────┘        │                  │         │
│           │                   └──────────────────┘         │
└───────────┼──────────────────────────────────────────────────┘
            │
         GPIO 3 (Output)
            │
            │ [Inverted signal: HIGH=LOW, LOW=HIGH]
            │
     ┌──────▼──────────┐
     │ 74HC14 or equiv │ (Inverting Schmitt Trigger)
     │ Inverter        │
     └──────┬──────────┘
            │
         Output: Standard WS2812 signal
            │
     ┌──────▼──────────────────────┐
     │  SK6812MINI-E LED #1         │
     │  (GRB: Green, Red, Blue)     │
     │  ┌───────────────────────┐   │
     │  │ [Data In] [Data Out]  │   │
     │  └───────────────────────┘   │
     └──────┬──────────────────────┘
            │
     ┌──────▼──────────────────────┐
     │  SK6812MINI-E LED #2         │
     │  ┌───────────────────────┐   │
     │  │ [Data In] [Data Out]  │   │
     │  └───────────────────────┘   │
     └──────┬──────────────────────┘
            │
     ┌──────▼──────────────────────┐
     │  SK6812MINI-E LED #3         │
     │  ┌───────────────────────┐   │
     │  │ [Data In] [Data Out]  │   │
     │  └───────────────────────┘   │
     └──────┬──────────────────────┘
            │
     ┌──────▼──────────────────────┐
     │  SK6812MINI-E LED #4         │
     │  ┌───────────────────────┐   │
     │  │ [Data In] [Data Out]  │   │
     │  └───────────────────────┘   │
     └──────────────────────────────┘
```

## WS2812 Timing (After Schmitt Trigger Inversion)

```
Bit "1":  800ns HIGH    |    450ns LOW
          ────────────      ────
         │        │        │  │
    ─────┘        └────────┘  └─
          24 cycles  18 cycles
    (125 MHz clock = 8ns/cycle)

Bit "0":  400ns HIGH    |    850ns LOW
          ────────      ──────────
         │      │        │    │
    ─────┘      └────────┘    └─
          13 cycles    34 cycles

Total bit time: 1250ns = 800 kHz
```

## PIO Program Execution Flow

### Original WS2812 (Standard Output)

```
Loop Start:
  out x, 32              side 1      ← GPIO HIGH (data buffered)
  out y, 1               side 0      ← GPIO LOW (sample bit)
  IF bit==1:
    side 1 [T2-1]                   ← GPIO HIGH (long period)
    jmp bitloop            side 0    ← GPIO LOW
  IF bit==0:
    nop                   side 0     ← GPIO LOW (extended)
    jmp bitloop           side 1     ← GPIO HIGH
```

### Modified for Inversion (Inverted Output)

```
Loop Start:
  out x, 32              side 0      ← GPIO LOW (→HIGH via inverter)
  out y, 1               side 1      ← GPIO HIGH (→LOW via inverter)
  IF bit==1:
    side 0 [T2-1]                   ← GPIO LOW (→HIGH via inverter)
    jmp bitloop            side 1    ← GPIO HIGH (→LOW via inverter)
  IF bit==0:
    nop                   side 1     ← GPIO HIGH (→LOW via inverter)
    jmp bitloop           side 0     ← GPIO LOW (→HIGH via inverter)
```

After inverting Schmitt Trigger: **Produces identical timing to standard WS2812!**

## Software Architecture

```
┌──────────────────────────────────────────┐
│  Application Logic (main.cpp)            │
│  ┌──────────────────────────────────────┐│
│  │  main()                              ││
│  │  ┌──────────────────────────────────┐││
│  │  │ • Initialize PIO                 │││
│  │  │ • Configure state machine        │││
│  │  │ • Enter animation loop           │││
│  │  └──────────────────────────────────┘││
│  └──────────────────────────────────────┘│
│                    ↑                      │
└────────────────────┼──────────────────────┘
                     │
┌────────────────────▼──────────────────────┐
│  Animation Functions                     │
│  ┌──────────────────────────────────────┐│
│  │ • animation_red()                    ││
│  │ • animation_green()                  ││
│  │ • animation_blue()                   ││
│  │ • animation_chase()                  ││
│  │ • animation_rainbow()                ││
│  └──────────────────────────────────────┘│
│                    ↑                      │
└────────────────────┼──────────────────────┘
                     │
┌────────────────────▼──────────────────────┐
│  Color & LED Control Utilities           │
│  ┌──────────────────────────────────────┐│
│  │ • rgb_to_grb()    - Color conversion ││
│  │ • urgb_u32()      - GRB encoding     ││
│  │ • set_all_leds()  - Bulk color set   ││
│  │ • pio_sm_put_blocking() - Send pixel ││
│  └──────────────────────────────────────┘│
│                    ↑                      │
└────────────────────┼──────────────────────┘
                     │
┌────────────────────▼──────────────────────┐
│  Pico SDK Libraries                      │
│  ┌──────────────────────────────────────┐│
│  │ • hardware/pio.h   - PIO control     ││
│  │ • pico/stdlib.h    - Standard lib    ││
│  │ • hardware/gpio.h  - GPIO access     ││
│  └──────────────────────────────────────┘│
│                    ↑                      │
└────────────────────┼──────────────────────┘
                     │
              RP2350 Hardware
```

## Color Encoding (GRB Order)

```
Standard RGB Input:     (R=255, G=0, B=127)
                              ↓
Brightness Scale:       (20/255 = 0.078)
                              ↓
Scaled Values:          (R=20, G=0, B=10)
                              ↓
GRB Reorder:            G=0, R=20, B=10
                              ↓
32-bit Value:           0x00140A00
                         ││││││││
                         ││││││└─ Byte 0: Blue (10)
                         ││││└─── Byte 1: Red (20)
                         ││└───── Byte 2: Green (0)
                         └─────── Byte 3: Reserved (0)
                              ↓
PIO Shift:              0x140A00 (left shifted 8 bits)
```

## Build & Compilation Flow

```
Source Files:
├─ src/main.cpp
├─ src/ws2812.pio
└─ CMakeLists.txt
        ↓
    [CMake]
        ↓
Pioasm Compiler
        ↓
    ws2812.pio
        ↓
    [Generate ws2812.pio.h]
        ↓
        ├─ ws2812_inverted_program (bytecode)
        ├─ ws2812_inverted_program_init() (init function)
        └─ RP2350 PIO instruction definitions
        ↓
    [Compile C++]
        ↓
    main.cpp + ws2812.pio.h
        ↓
    [Link]
        ↓
    pd100w_dish.elf
        ↓
    [Convert to UF2]
        ↓
    pd100w_dish.uf2
        ↓
    [Flash to Pico]
        ↓
    Running Firmware
```

## Memory Layout (RP2350)

```
┌─────────────────────────────────────────┐
│ Address Space (RP2350)                  │
├─────────────────────────────────────────┤
│ 0x50200000  ROM (16KB)                  │
│ 0x20000000  RAM (520KB)                 │
│             ├─ Data/BSS                 │
│             ├─ Heap                     │
│             └─ Stack                    │
│ 0x20000000  XIP Flash (memory-mapped)   │
└─────────────────────────────────────────┘

Typical Program Layout:
├─ Bootloader & Metadata (256 bytes)
├─ ws2812_inverted Program (80 bytes)
├─ Animation Data (~1KB)
├─ Global Variables (~256 bytes)
├─ Stack (grows downward)
└─ Heap (grows upward)

Total: ~50KB program, <5KB RAM used
```

## Timing Analysis

```
Operation               Time            Notes
─────────────────────────────────────────────────────
Startup                 <100ms          PIO init + first LED update
Per LED Update          1.25µs/bit × 24 bits = 30µs
4 LEDs @ 800kHz         120µs           Total data transmission
Animation Frame Rate    300ms           Configurable via sleep_ms()
Full Animation Cycle    ~31 seconds     5 animations × ~6.2s each
Boot to Ready           <200ms          Includes USB init

Power Draw:
  Idle (no LEDs)        ~100mA          RP2350 + USB
  Black LEDs            ~150mA          Overhead only
  Full White x4         ~300mA          At 20/255 brightness
  Typical Animation     ~180mA          Mixed colors
```

## Debugging & Monitoring

```
Serial Output (USB):
┌─────────────────────────────────────────┐
│ PD100W Dish LED Animation Test          │
│ Initializing PIO and WS2812 LEDs...     │
│ PIO initialized. Starting animations... │
│ Red animation...                        │
│ Green animation...                      │
│ Blue animation...                       │
│ Chase animation...                      │
│ Rainbow animation...                    │
│ (cycle repeats)                         │
└─────────────────────────────────────────┘

Connection:
  • Port: /dev/tty.usbmodem*
  • Baud: 115200
  • Data: 8 bits
  • Stop: 1 bit
  • Parity: None
  • Flow: None
```

## File Structure Details

```
project/
│
├─ CMakeLists.txt (30 lines)
│  └─ Defines build configuration
│     • Pico SDK path
│     • PIO compilation
│     • Target executables
│     • Library linkage
│
├─ src/
│  │
│  ├─ main.cpp (136 lines)
│  │  ├─ Includes & defines (15 lines)
│  │  ├─ Color utilities (30 lines)
│  │  │  • rgb_to_grb()
│  │  │  • urgb_u32()
│  │  ├─ Animation functions (85 lines)
│  │  │  • animation_red/green/blue
│  │  │  • animation_chase
│  │  │  • animation_rainbow
│  │  └─ main() entry (6 lines)
│  │
│  └─ ws2812.pio (43 lines)
│     ├─ Header/metadata (7 lines)
│     ├─ ws2812_inverted program (18 lines)
│     └─ ws2812_inverted_fast variant (18 lines)
│
└─ Documentation
   ├─ README.md
   ├─ SETUP_GUIDE.md
   ├─ QUICK_REFERENCE.md
   ├─ PROJECT_SUMMARY.md
   └─ ARCHITECTURE.md (this file)
```

## Optimization Notes

### Current Implementation
- ✓ Inverted PIO program (minimal overhead)
- ✓ Blocking sends (simple, adequate for animation)
- ✓ Software brightness scaling (CPU efficient)
- ✓ GRB color ordering (hardware correct)
- ✓ Single PIO state machine (GPIO 3 only)

### Possible Enhancements
- [ ] Multi-strip support (additional PIO state machines)
- [ ] Interrupt-driven updates (for timing-critical apps)
- [ ] DMA-based streaming (higher throughput)
- [ ] WiFi/network control (requires additional SDK)
- [ ] Sensor integration (GPIO inputs, ADC)
- [ ] EEPROM animation storage

## Compatibility

```
Hardware Compatibility:
├─ RP2350 (Pico 2)      ✓ Fully supported
├─ RP2040 (Pico 1)      ✓ Compatible (adjust board in CMakeLists)
├─ Custom RP2350 board  ✓ Adjust GPIO pin as needed
└─ Other MCUs           ✗ Requires porting

LED Compatibility:
├─ WS2812B             ✓ Standard timing
├─ SK6812MINI-E        ✓ GRB order support
├─ WS2811              ✓ Similar protocol
└─ APA102 (SPI)        ✗ Different protocol

OS Compatibility:
├─ macOS               ✓ Full support (flash.sh optimized)
├─ Linux               ✓ Manual build & flash
├─ Windows             ~ Manual steps required
```

---

**Architecture Document v1.0**
Complete technical reference for the PD100W Dish LED controller implementation.
