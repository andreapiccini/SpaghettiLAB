cmake_minimum_required(VERSION 3.13)

set(PICO_BOARD pico2 CACHE STRING "Board type")
set(PICO_NO_PICOTOOL 1)

include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(pd100w_dish)

pico_sdk_init()

add_executable(pd100w_dish
    src/main.cpp
)

# Generate PIO header from ws2812.pio
pico_generate_pio_header(pd100w_dish ${CMAKE_CURRENT_LIST_DIR}/src/ws2812.pio)

target_include_directories(pd100w_dish PRIVATE
    ${CMAKE_CURRENT_BINARY_DIR}
)

target_link_libraries(pd100w_dish
    pico_stdlib
    hardware_pio
)

pico_enable_stdio_usb(pd100w_dish 1)
pico_enable_stdio_uart(pd100w_dish 0)

pico_add_extra_outputs(pd100w_dish)