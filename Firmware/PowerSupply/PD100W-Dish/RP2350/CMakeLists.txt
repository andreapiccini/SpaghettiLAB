cmake_minimum_required(VERSION 3.13)

set(PICO_BOARD pico2 CACHE STRING "Board type")
set(PICO_NO_PICOTOOL 1)

include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(pd100w_dish)

pico_sdk_init()

add_executable(pd100w_dish
    src/main.cpp
)

target_link_libraries(pd100w_dish
    pico_stdlib
)

pico_enable_stdio_usb(pd100w_dish 1)
pico_enable_stdio_uart(pd100w_dish 0)

pico_add_extra_outputs(pd100w_dish)