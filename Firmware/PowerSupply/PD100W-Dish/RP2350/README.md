# PD100W Dish - RP2350 WS2812 LED Controller

Complete Pico SDK project for controlling 4 SK6812MINI-E LEDs on the RP2350 (Pico 2) via an inverted signal path (Schmitt Trigger inverter).

## Hardware Configuration

- **MCU**: RP2350 (Pico 2)
- **LEDs**: 4× SK6812MINI-E (GRB color order)
- **Data Pin**: GPIO 3
- **Signal Path**: GPIO 3 → Inverting Schmitt Trigger → LED Data Input
- **Protocol**: WS2812 @ 800 kHz
- **Brightness**: Maximum 20/255 (~7.8%)

## Project Structure

```
├── CMakeLists.txt          # CMake build configuration
├── flash.sh               # Build and flash script (macOS)
├── README.md              # This file
└── src/
    ├── main.cpp           # Application code with animations
    └── ws2812.pio         # Inverted WS2812 PIO program
```

## Key Implementation Details

### Inverted WS2812 PIO Program (`ws2812.pio`)

The official Raspberry Pi WS2812 PIO program has been **modified to invert all output states**:
- Every `side 1` (HIGH output) becomes `side 1` with inverted logic
- Every `side 0` (LOW output) becomes `side 0` with inverted logic
- The inverting Schmitt Trigger converts these back to normal WS2812 signals

**Important**: The timing remains **completely identical** to the standard WS2812 protocol. Only the output polarity is inverted.

### GRB Color Order

SK6812MINI-E LEDs use GRB color ordering. The `rgb_to_grb()` helper function handles the conversion automatically:

```c
urgb_u32(r, g, b) → outputs GRB format
```

### Brightness Control

All colors are multiplied by `MAX_BRIGHTNESS / 255` (20/255 ≈ 7.8%) to limit power consumption.

## Building

### Prerequisites

1. **Pico SDK** installed and `PICO_SDK_PATH` environment variable set:
   ```bash
   export PICO_SDK_PATH=/path/to/pico-sdk
   ```

2. **ARM GCC toolchain** and **CMake** installed:
   ```bash
   brew install arm-none-eabi-gcc cmake
   ```

### Using flash.sh (Recommended for macOS)

```bash
cd /path/to/RP2350
./flash.sh
```

The script will:
1. Create a build directory
2. Run CMake
3. Compile the project
4. Wait for a Pico in BOOTSEL mode
5. Flash the UF2 file to the Pico
6. Eject the drive safely

**To enter BOOTSEL mode:**
- Hold the BOOTSEL button on the Pico
- While holding, connect USB or press the reset button
- Release BOOTSEL when the RP2350 drive appears

### Manual Build

```bash
cd /path/to/RP2350
mkdir -p build && cd build
cmake ..
make -j4
```

The generated UF2 file will be at:
```
build/pd100w_dish.uf2
```

## Animations

The firmware cycles through these animations:

1. **All RED** - All LEDs solid red (2 seconds)
2. **All GREEN** - All LEDs solid green (2 seconds)
3. **All BLUE** - All LEDs solid blue (2 seconds)
4. **Chase** - White LED chasing across the strip (4 cycles, 300ms per position)
5. **Rainbow** - Rainbow colors cycling through the strip (8 cycles)

The sequence repeats indefinitely.

## Serial Output

Debug output is available on the USB serial port:
- **Baud Rate**: 115200
- **Data Bits**: 8
- **Stop Bits**: 1
- **Parity**: None

Connect with:
```bash
# macOS
screen /dev/tty.usbmodem14101 115200

# Linux
screen /dev/ttyACM0 115200
```

Output will show animation progress:
```
PD100W Dish LED Animation Test
Initializing PIO and WS2812 LEDs...
PIO initialized. Starting animations...
Red animation...
Green animation...
...
```

## Troubleshooting

### Build fails: "PICO_SDK_PATH not set"
```bash
export PICO_SDK_PATH=/path/to/pico-sdk
```

### Build fails: "pioasm not found"
The Pico SDK's CMake integration will compile the `.pio` file automatically. Ensure:
- `PICO_SDK_PATH` points to a valid Pico SDK directory
- The Pico SDK has been properly extracted with all tools

### LEDs not lighting up
- **Check GPIO 3**: Verify the data line is connected to GPIO 3
- **Check Schmitt Trigger**: Verify the inverting circuit is correctly connected
- **Check power**: Ensure the LEDs have proper GND and power connections
- **Check brightness**: At 20/255, LEDs may appear dim

### LEDs flickering or not responding
- **Verify USB power**: WS2812 LEDs draw significant current; ensure adequate USB power
- **Check timing**: The 800 kHz protocol timing is critical
- **Add capacitors**: Place a 100µF capacitor across LED power and ground near the LEDs

## Modifying Animations

Edit the `src/main.cpp` file to add or modify animations. Key functions:

- `rgb_to_grb(r, g, b)` - Convert RGB color to GRB with brightness scaling
- `set_all_leds(pio, sm, color)` - Set all LEDs to one color
- `pio_sm_put_blocking(pio, sm, color << 8u)` - Send one LED color to the PIO
- `sleep_ms(duration)` - Delay in milliseconds

## References

- [Raspberry Pi Pico SDK Documentation](https://datasheets.raspberrypi.org/pico/raspberry-pi-pico-c-sdk.pdf)
- [WS2812 LED Protocol](https://cdn-shop.adafruit.com/datasheets/WS2812.pdf)
- [SK6812MINI-E Datasheet](https://cdn-shop.adafruit.com/product-files/2528/SK6812MINI-E.pdf)
- [RP2350 Datasheet](https://datasheets.raspberrypi.org/rp2350/rp2350-datasheet.pdf)

## License

Based on the official Raspberry Pi Pico SDK examples (BSD-3-Clause).
Modified for inverted output and custom animations.
