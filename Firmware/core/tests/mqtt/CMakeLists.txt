cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(spaghetti_mqtt_test)

target_sources(app PRIVATE
  src/main.c
  ../../subsys/data/data.c
  ../../subsys/services/mqtt/mqtt.c
  ../../subsys/services/service_thread.c
)

target_include_directories(app PRIVATE
  ../../include
  ../../subsys/services/mqtt
  ../../subsys/services
)
