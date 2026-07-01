#!/bin/bash

# Flash script for RP2350 Pico board
# This script builds the project and flashes it to a mounted BOOTSEL drive

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo -e "${GREEN}=== PD100W Dish LED Project Build & Flash ===${NC}"
echo "Project root: $PROJECT_ROOT"

# Check if PICO_SDK_PATH is set
if [ -z "$PICO_SDK_PATH" ]; then
    echo -e "${RED}Error: PICO_SDK_PATH environment variable is not set${NC}"
    echo "Please set it to your Pico SDK path:"
    echo "  export PICO_SDK_PATH=/path/to/pico-sdk"
    exit 1
fi

echo -e "${YELLOW}PICO_SDK_PATH: $PICO_SDK_PATH${NC}"

# Create build directory
BUILD_DIR="$PROJECT_ROOT/build"
if [ ! -d "$BUILD_DIR" ]; then
    echo -e "${YELLOW}Creating build directory...${NC}"
    mkdir -p "$BUILD_DIR"
fi

# Run CMake
echo -e "${YELLOW}Running CMake...${NC}"
cd "$BUILD_DIR"
cmake ..

# Build the project
echo -e "${YELLOW}Building project...${NC}"
make -j4

# Look for UF2 file
UF2_FILE=$(find "$BUILD_DIR" -name "*.uf2" -type f | head -1)

if [ -z "$UF2_FILE" ]; then
    echo -e "${RED}Error: No UF2 file found in build directory${NC}"
    exit 1
fi

echo -e "${GREEN}UF2 file found: $UF2_FILE${NC}"

# Find mounted Pico drive
PICO_MOUNT=""
if [ -d "/Volumes/RP2350" ]; then
    PICO_MOUNT="/Volumes/RP2350"
elif [ -d "/Volumes/RPI-RP2" ]; then
    PICO_MOUNT="/Volumes/RPI-RP2"
fi

if [ -z "$PICO_MOUNT" ]; then
    echo -e "${YELLOW}Warning: No mounted Pico drive found${NC}"
    echo "Available /Volumes:"
    ls /Volumes/ 2>/dev/null || true
    echo ""
    echo "Please:"
    echo "1. Put your RP2350 Pico into BOOTSEL mode (hold BOOTSEL button while plugging in USB)"
    echo "2. Wait for the drive to mount (/Volumes/RP2350 or /Volumes/RPI-RP2)"
    echo "3. Run this script again"
    exit 1
fi

echo -e "${GREEN}Mounted Pico drive found: $PICO_MOUNT${NC}"

# Copy UF2 file to Pico
echo -e "${YELLOW}Flashing to Pico...${NC}"
cp "$UF2_FILE" "$PICO_MOUNT/"

# Wait a moment for the copy to complete
sleep 1

# Check if the file was copied
if [ -f "$PICO_MOUNT/$(basename "$UF2_FILE")" ]; then
    echo -e "${GREEN}✓ Successfully flashed $UF2_FILE${NC}"
    echo -e "${GREEN}✓ Pico should restart automatically${NC}"
else
    echo -e "${RED}Error: Failed to copy UF2 file${NC}"
    exit 1
fi

# Try to eject the drive safely (optional)
if diskutil info "$PICO_MOUNT" >/dev/null 2>&1; then
    sleep 2
    echo -e "${YELLOW}Ejecting Pico drive...${NC}"
    diskutil eject "$PICO_MOUNT" 2>/dev/null || true
fi

echo -e "${GREEN}=== Flash Complete ===${NC}"
echo "The Pico should now be running the LED animation program."
echo "Connect to the USB serial port at 115200 baud to see debug output."
