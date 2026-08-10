-include .env

COMPOSE := docker compose
VALIDATOR_QUIET_VALUES := 1 true yes on
VALIDATOR_IS_QUIET := $(filter $(VALIDATOR_QUIET_VALUES),$(VALIDATOR_QUIET))
VALIDATOR_ENV := $(if $(VALIDATOR_IS_QUIET),SPAGHETTI_VALIDATOR_QUIET=1 ,)
HOST_PYTHON := python3
ifeq ($(OS),Windows_NT)
HOST_PYTHON := py -3
endif
PORT_ARG := $(if $(strip $(PORT)),--port "$(PORT)",)
BAUD ?= 115200
FLASH_BAUD ?= 460800

.PHONY: image shell validate build pristine flash screen monitor ports clean

image:
	@$(COMPOSE) build

shell:
	@$(COMPOSE) run --rm --entrypoint /bin/bash dev

validate:
	@$(COMPOSE) run --rm --entrypoint sh dev -lc \
		'SPAGHETTI_VALIDATOR_QUIET=$(if $(VALIDATOR_IS_QUIET),1,0) west build \
			-p auto -b "$$BOARD" -d build -t spaghetti_validator .'

build:
	@$(COMPOSE) run --rm --entrypoint sh dev -lc \
		'set -e; \
		if [ -d build ] && [ ! -f build/build.ninja ]; then \
			echo "Incomplete build directory detected; regenerating."; \
			cmake -E remove_directory build; \
		fi; \
		$(VALIDATOR_ENV)west build \
			-p auto -b "$$BOARD" -d build .'

pristine:
	@$(COMPOSE) run --rm --entrypoint sh dev -lc \
		'set -e; \
		cmake -E remove_directory build; \
		$(VALIDATOR_ENV)west build \
			-p auto -b "$$BOARD" -d build .'

flash:
	@$(HOST_PYTHON) tools/device.py flash $(PORT_ARG) --baud "$(FLASH_BAUD)"

screen:
	@$(HOST_PYTHON) tools/device.py screen $(PORT_ARG) --baud "$(BAUD)"

monitor: screen

ports:
	@$(HOST_PYTHON) tools/device.py ports

clean:
	@$(COMPOSE) run --rm --entrypoint west dev build -d build -t pristine
