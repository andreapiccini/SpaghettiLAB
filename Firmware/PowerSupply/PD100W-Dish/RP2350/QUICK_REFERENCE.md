# Quick Reference

## Essential Commands

### Build and Flash (macOS)
```bash
cd /path/to/RP2350
./flash.sh
```

### Manual Build
```bash
cd /path/to/RP2350
mkdir -p build && cd build
cmake .. && make -j4
```

### View Serial Output
```bash
screen /dev/tty.usbmodem14101 115200
# Exit: Ctrl+A, Ctrl+\
```

### Set SDK Path (one time)
```bash
export PICO_SDK_PATH=$HOME/pico-sdk
# Add to ~/.zshrc or ~/.bashrc to persist
```

## File Locations

| Component | File |
|-----------|------|
| Application | `src/main.cpp` |
| PIO Program | `src/ws2812.pio` |
| Build Config | `CMakeLists.txt` |
| Flash Script | `flash.sh` |
| Documentation | `README.md` |

## Pin Configuration

| Purpose | GPIO | Notes |
|---------|------|-------|
| LED Data | GPIO 3 | Through inverting Schmitt Trigger |

## LED Configuration

| Setting | Value | Notes |
|---------|-------|-------|
| LED Count | 4 | Modify `LED_COUNT` in main.cpp |
| Color Order | GRB | SK6812MINI-E format |
| Protocol | WS2812 @ 800 kHz | Standard; inverted at driver level |
| Max Brightness | 20/255 | ~7.8%; modify `MAX_BRIGHTNESS` |

## Animations

The firmware cycles through these 5 animations continuously:

1. **Red** - 2 sec
2. **Green** - 2 sec
3. **Blue** - 2 sec
4. **White Chase** - LED moves across strip
5. **Rainbow** - Color cycling

## Modifying Code

### Change Brightness
**File**: `src/main.cpp` line 15
```c
#define MAX_BRIGHTNESS 20  // Change to 0-255
```
Then rebuild and flash.

### Change LED Pin
**File**: `src/main.cpp` line 12
```c
#define LED_PIN 3  // Change to your GPIO
```

### Add Animation
**File**: `src/main.cpp`
1. Add new function (e.g., `animation_custom()`)
2. Call it in the `while(1)` loop in `main()`
3. Rebuild and flash

### Change LED Count
**File**: `src/main.cpp` line 13
```c
#define LED_COUNT 4  // Change to your count
```

## Build Output

- **UF2 File**: `build/pd100w_dish.uf2`
- **ELF Binary**: `build/pd100w_dish.elf`
- **Map File**: `build/pd100w_dish.map`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails - "pioasm not found" | Set `PICO_SDK_PATH` correctly |
| Build fails - "command not found: cmake" | Install: `brew install cmake` |
| Build fails - "arm-none-eabi-gcc not found" | Install: `brew install arm-none-eabi-gcc` |
| Build fails - "cannot find -lhardware_pio" | Run `git submodule update --init` in SDK |
| LEDs don't light | Check GPIO 3 → Schmitt Trigger → LED data path |
| LEDs flicker | Add 100µF capacitor across LED power/ground |
| Serial port shows nothing | Reconnect USB; check: `ls /dev/tty.usbmodem*` |

## Serial Port Baud Rate

Always **115200 baud** for Pico USB serial.

## Flash Drive Mount Points

- **RP2350**: `/Volumes/RP2350`
- **Older Picos**: `/Volumes/RPI-RP2`

## Hardware Checklist

- [ ] RP2350 Pico 2 board
- [ ] 4× SK6812MINI-E LEDs
- [ ] Inverting Schmitt Trigger (e.g., 74HC14)
- [ ] 100µF capacitor (LED power filtering)
- [ ] 470Ω resistor (data line protection)
- [ ] USB cable (power and programming)
- [ ] 5V power supply (for LEDs if needed)

## Quick Customization Template

To create a custom animation:

```c
void animation_custom(PIO pio, uint sm) {
    // Create a color
    uint32_t red = rgb_to_grb(255, 0, 0);
    uint32_t green = rgb_to_grb(0, 255, 0);
    
    // Set all to red
    set_all_leds(pio, sm, red);
    sleep_ms(500);
    
    // Set all to green
    set_all_leds(pio, sm, green);
    sleep_ms(500);
}
```

Then in `main()` while loop:
```c
animation_custom(pio, sm);
```

## Color Examples (GRB order)

```c
rgb_to_grb(255, 0, 0)    // Red
rgb_to_grb(0, 255, 0)    // Green
rgb_to_grb(0, 0, 255)    // Blue
rgb_to_grb(255, 255, 0)  // Yellow
rgb_to_grb(0, 255, 255)  // Cyan
rgb_to_grb(255, 0, 255)  // Magenta
rgb_to_grb(255, 255, 255)// White
rgb_to_grb(0, 0, 0)      // Off
```

Note: These are full brightness (255). Actual displayed brightness is limited by `MAX_BRIGHTNESS`.

## Performance

- **Compilation**: ~10-30 seconds on modern Mac
- **Flash time**: ~2-5 seconds
- **Boot time**: <100ms
- **Animation frame rate**: ~3-5 fps (300ms per frame)

## Power Considerations

- **RP2350**: ~100-150mA
- **SK6812MINI-E per LED**: ~60mA at full white
- **Total with 4 LEDs**: ~300mA maximum
- **Recommended supply**: USB 5V 1A minimum

At 20/255 brightness: ~40mA typical with mixed colors.
