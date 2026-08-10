cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(esp32c3_app)

find_package(Python3 REQUIRED COMPONENTS Interpreter)

add_custom_target(spaghetti_validator
  COMMAND
    ${Python3_EXECUTABLE}
    ${CMAKE_CURRENT_SOURCE_DIR}/validator
    --cmake-sources
    "$<TARGET_GENEX_EVAL:app,$<JOIN:$<TARGET_PROPERTY:app,SOURCES>,|>>"
    --cmake-includes
    "$<TARGET_GENEX_EVAL:app,$<JOIN:$<TARGET_PROPERTY:app,INCLUDE_DIRECTORIES>,|>>"
  WORKING_DIRECTORY ${CMAKE_CURRENT_SOURCE_DIR}
  DEPENDS
    ${CMAKE_CURRENT_SOURCE_DIR}/validator
    ${CMAKE_CURRENT_SOURCE_DIR}/FIRMWARE_IMPLEMENTATION_GUIDE.md
  COMMENT "Validating Spaghetti LAB firmware conventions"
  VERBATIM
  USES_TERMINAL
)

add_dependencies(app spaghetti_validator)

target_sources(app PRIVATE
  src/main.c
  spaghetti_modules/ina219/ina219.c
  spaghetti_modules/relay/relay.c
  subsys/core/core.c
  subsys/port/port.c
  subsys/driver_registry/driver_registry.c
  subsys/module_manager/module_manager.c
  subsys/config/config.c
  subsys/config/config_cbor.c
  subsys/services/storage/storage.c
  subsys/data/data.c
  subsys/services/timer/timer.c
  subsys/runtime/runtime.c
  subsys/communication/communication.c
  subsys/communication/communication_shell.c
)

get_target_property(APP_SRCS app SOURCES)

message(STATUS "========== APP SOURCES ==========")

foreach(src ${APP_SRCS})
    message(STATUS "  ${src}")
endforeach()


target_include_directories(app PRIVATE
  ${CMAKE_CURRENT_SOURCE_DIR}/include
  ${CMAKE_CURRENT_SOURCE_DIR}/spaghetti_modules/ina219
  ${CMAKE_CURRENT_SOURCE_DIR}/spaghetti_modules/relay
)

get_target_property(APP_INCLUDES app INCLUDE_DIRECTORIES)

message(STATUS "========== APP INCLUDE DIRS ==========")

foreach(dir ${APP_INCLUDES})
    message(STATUS "  ${dir}")
endforeach()

message(STATUS "======================================")
