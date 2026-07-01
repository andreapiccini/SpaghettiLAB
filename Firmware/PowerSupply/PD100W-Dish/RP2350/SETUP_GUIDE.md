# RP2350 WS2812 LED Controller - Setup & Build Guide

## Project Overview

✅ **Complete buildable Pico SDK project** for RP2350 (Pico 2) controlling 4 SK6812MINI-E LEDs with an inverted signal path.

### Project Contents

```
├── CMakeLists.txt         - Build configuration with PIO support
├── flash.sh              - One-command build & flash script (macOS)
├── README.md             - Full project documentation
├── SETUP_GUIDE.md        - This file
└── src/
    ├── main.cpp          - Application with 5 LED animations
    └── ws2812.pio        - Modified WS2812 program with inverted outputs
```

## Hardware Setup

### Wiring

- **RP2350 GPIO 3** → **Inverting Schmitt Trigger Input** → **WS2812 Data Pin**
- **GND** → **GND** (all connections)
- **5V** → **WS2812 5V** (through appropriate power supply)

### LED Configuration

- 4× SK6812MINI-E LEDs (GRB color order)
- GPIO 3 for data signal
- Signal passes through inverting Schmitt Trigger
- 800 kHz WS2812 protocol
- Maximum brightness: 20/255 (~7.8%)

## Software Setup

### 1. Install Prerequisites (macOS)

```bash
# Install ARM toolchain
brew install arm-none-eabi-gcc cmake

# Install pico-sdk if not already installed
git clone https://github.com/raspberrypi/pico-sdk.git ~/pico-sdk
cd ~/pico-sdk && git submodule update --init
```

### 2. Set Environment Variables

Add to your shell configuration file (`.zshrc`, `.bashrc`, etc.):

```bash
export PICO_SDK_PATH=$HOME/pico-sdk
```

Then reload:

```bash
source ~/.zshrc  # or ~/.bashrc
```

Verify:

```bash
echo $PICO_SDK_PATH
```

### 3. Build & Flash

#### Option A: Automatic (Recommended)

```bash
cd /path/to/RP2350
./flash.sh
```

The script will:
1. Create `build/` directory
2. Run CMake and compile
3. Prompt you to put the Pico in BOOTSEL mode
4. Automatically flash the UF2 file

#### Option B: Manual Build

```bash
cd /path/to/RP2350
mkdir -p build
cd build
cmake ..
make -j4
```

The UF2 file will be at: `build/pd100w_dish.uf2`

**To flash manually:**
1. Hold BOOTSEL on the Pico and plug USB (or press RESET while holding BOOTSEL)
2. Wait for `/Volumes/RP2350` or `/Volumes/RPI-RP2` to mount
3. Copy the `.uf2` file to the mounted drive
4. Pico will reboot automatically

## Verification

### Check Build Success

After running `make -j4`:

```
[100%] Linking CXX executable pd100w_dish.elf
[100%] Built target pd100w_dish
```

### Test LEDs

After flashing, the LEDs should cycle through:

1. **All RED** (2 seconds)
2. **All GREEN** (2 seconds)
3. **All BLUE** (2 seconds)
4. **White Chase** (LED moves across strip, 4 cycles)
5. **Rainbow** (colors cycle, 8 cycles)

Then repeat indefinitely.

### Monitor Serial Output

Connect to the USB serial port to see debug messages:

```bash
# Find the serial port
ls /dev/tty.usbmodem*

# Connect (example - use your actual port)
screen /dev/tty.usbmodem14101 115200
```

Expected output:

```
PD100W Dish LED Animation Test
Initializing PIO and WS2812 LEDs...
PIO initialized. Starting animations...
Red animation...
Green animation...
Blue animation...
Chase animation...
Rainbow animation...
```

To exit `screen`: Press `Ctrl+A` then `Ctrl+\`

## Project Architecture

### PIO Program (`ws2812.pio`)

The inverted WS2812 program modifies the official Raspberry Pi example:

- **Original**: Outputs standard WS2812 signal
- **Modified**: Inverts all pin outputs (HIGH ↔ LOW)
- **Result**: After inverting Schmitt Trigger, produces standard WS2812 signal

**Key change**: Every `side 0` and `side 1` is swapped.

### Main Application (`main.cpp`)

- **LED Control**: GPIO 3 via PIO state machine
- **Color Format**: GRB (not RGB) for SK6812MINI-E
- **Brightness**: Scaled to 20/255 maximum
- **Animations**: 5 separate functions cycling continuously

### Build System (`CMakeLists.txt`)

- Generates `.pio.h` header from `ws2812.pio`
- Links `hardware_pio` and `pico_stdlib`
- Produces UF2 binary for flashing
- Configures USB serial and bootloader

## Troubleshooting

### "PICO_SDK_PATH not set" Error

```bash
# Set it in your current shell
export PICO_SDK_PATH=$HOME/pico-sdk

# Make sure it exists
ls $PICO_SDK_PATH/external/pico_sdk_import.cmake
```

### "ws2812.pio.h: No such file"

```bash
# Clean and rebuild
cd build && rm -rf * && cmake .. && make -j4
```

### CMake fails to find ARM toolchain

```bash
# Verify installation
arm-none-eabi-gcc --version

# If not found, reinstall
brew reinstall arm-none-eabi-gcc
```

### LEDs don't light up

**Check in this order:**

1. **Power**: Verify 5V and GND are connected to LEDs
2. **Data line**: Verify GPIO 3 is connected to Schmitt Trigger input
3. **Schmitt Trigger**: Verify inverter is connected correctly
4. **Polarity**: Try reversing the data line connection (if not using Schmitt Trigger circuit)
5. **USB Power**: WS2812s can draw 60mA per LED; ensure adequate USB power

### LEDs flicker or respond slowly

- Add 100µF capacitor across LED power and ground
- Add 470Ω resistor in series with data line (near Pico)
- Check cable length (should be < 1 meter for 800 kHz)

### Serial terminal shows no output

```bash
# Check if USB device appears
ls /dev/tty.usbmodem*

# Try different baud rate if needed
screen /dev/tty.usbmodem14101 115200

# If still no output, check:
# 1. USB driver installed
# 2. Cable is connected properly
# 3. Firmware actually flashed (LEDs should cycle)
```

## Customization

### Changing Brightness

Edit [src/main.cpp](src/main.cpp#L15):

```c
#define MAX_BRIGHTNESS 20  // Change to 0-255
```

Recompile and flash.

### Adding Animations

Add a new function to [src/main.cpp](src/main.cpp):

```c
void animation_custom(PIO pio, uint sm) {
    uint32_t color = rgb_to_grb(255, 0, 0);  // Red
    set_all_leds(pio, sm, color);
    sleep_ms(1000);
}
```

Then add to main loop:

```c
while (1) {
    animation_custom(pio, sm);
    // ... other animations
}
```

### Changing LED Pin

Edit [src/main.cpp](src/main.cpp#L12):

```c
#define LED_PIN 3  // Change to desired GPIO
```

### Changing LED Count

Edit [src/main.cpp](src/main.cpp#L13):

```c
#define LED_COUNT 4  // Change to your LED count
```

## References

- [Pico 2 Datasheet](https://datasheets.raspberrypi.org/rp2350/rp2350-datasheet.pdf)
- [Pico SDK Documentation](https://datasheets.raspberrypi.org/pico/raspberry-pi-pico-c-sdk.pdf)
- [WS2812 LED Datasheet](https://cdn-shop.adafruit.com/datasheets/WS2812.pdf)
- [SK6812MINI-E Datasheet](https://cdn-shop.adafruit.com/product-files/2528/SK6812MINI-E.pdf)
- [Raspberry Pi Pico Getting Started](https://projects.raspberrypi.org/en/projects/getting-started-with-the-pico)

## Support

For build issues, verify:

- ✅ `$PICO_SDK_PATH` environment variable is set
- ✅ ARM GCC toolchain installed (`arm-none-eabi-gcc --version`)
- ✅ CMake version 3.13+ installed
- ✅ All source files present (main.cpp, ws2812.pio)
- ✅ CMakeLists.txt has correct paths

For hardware issues, verify:

- ✅ Connections soldered/connected properly
- ✅ GPIO 3 routed to Schmitt Trigger
- ✅ Schmitt Trigger output to LED data pin
- ✅ 5V power stable (add capacitor if needed)
- ✅ Ground properly connected

## Next Steps

1. Build and flash the project using `./flash.sh`
2. Watch LEDs cycle through animations
3. Monitor serial output for debug info
4. Modify animations as needed
5. Integrate into your board design

Good luck! 🎉
