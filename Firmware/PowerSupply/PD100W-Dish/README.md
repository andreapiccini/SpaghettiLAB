# PD100W-Dish Firmware (RP2350)

Firmware for the SpaghettiLAB PD100W-Dish power module.

## Requirements

### Windows

Install:

* CMake >= 3.20
* Ninja
* Python 3
* Git
* ARM GNU Toolchain (arm-none-eabi)

Clone the Raspberry Pi Pico SDK:

```bash
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
```

Set environment variable:

```powershell
$env:PICO_SDK_PATH="C:\Users\<USER>\pico-sdk"
```

### Linux

Install dependencies:

```bash
sudo apt install cmake ninja-build gcc-arm-none-eabi git python3
```

Clone Pico SDK:

```bash
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
```

Set environment variable:

```bash
export PICO_SDK_PATH=~/pico-sdk
```

### macOS

Install dependencies:

```bash
brew install cmake ninja python
brew install --cask gcc-arm-embedded
```

Clone Pico SDK:

```bash
git clone https://github.com/raspberrypi/pico-sdk.git
cd pico-sdk
git submodule update --init
```

Set environment variable:

```bash
export PICO_SDK_PATH=~/pico-sdk
```

## Build

```bash
mkdir build
cd build

cmake -G Ninja ..
ninja
```

Generated files:

```text
pd100w_dish.uf2
pd100w_dish.elf
pd100w_dish.bin
```

## Flash

Hold BOOTSEL while connecting the RP2350 to USB.

Copy the generated `.uf2` file to the mounted drive.

## Repository Structure

```text
RP2350/
├── src/
├── include/
├── build/
├── CMakeLists.txt
└── README.md
```
