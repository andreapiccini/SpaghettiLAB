cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(spaghetti_runtime_test)

target_sources(app PRIVATE
  src/main.c
  ../../subsys/services/timer/timer.c
  ../../subsys/runtime/runtime.c
)

target_include_directories(app PRIVATE
  ../../include
)
