cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(spaghetti_mqtt_test)

target_sources(app PRIVATE
  src/main.c
  ../../subsys/data/data.c
  ../../subsys/data/record_delivery.c
  ../../subsys/services/mqtt/mqtt.c
  ../../subsys/services/service_thread.c
  ../../subsys/resources/resources_note_weak.c
)

target_include_directories(app PRIVATE
  ../../include
  ../../subsys/services/mqtt
  ../../subsys/services
)

zephyr_linker_sources(SECTIONS ../../subsys/data/record_delivery_sections.ld)
