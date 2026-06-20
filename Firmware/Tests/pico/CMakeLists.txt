cmake_minimum_required(VERSION 3.13)

set(PICO_BOARD pico2)

include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(spaghetti_led)

pico_sdk_init()

add_executable(spaghetti_led
    main.cpp
)

target_link_libraries(spaghetti_led
    pico_stdlib
)

pico_add_extra_outputs(spaghetti_led)