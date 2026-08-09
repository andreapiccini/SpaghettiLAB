cmake_minimum_required(VERSION 3.20.0)

find_package(Zephyr REQUIRED HINTS $ENV{ZEPHYR_BASE})
project(esp32c3_app)

find_package(Python3 REQUIRED COMPONENTS Interpreter)

add_custom_target(spaghetti_validator
  COMMAND ${Python3_EXECUTABLE} ${CMAKE_CURRENT_SOURCE_DIR}/validator
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
  subsys/core/core.c
  subsys/port/port.c
)

target_include_directories(app PRIVATE ${CMAKE_CURRENT_SOURCE_DIR}/include/)
