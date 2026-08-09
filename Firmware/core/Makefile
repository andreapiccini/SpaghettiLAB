COMPOSE := docker compose
LINUX_COMPOSE := $(COMPOSE) -f compose.yaml -f compose.linux.yaml
VALIDATOR_QUIET_VALUES := 1 true yes on
VALIDATOR_IS_QUIET := $(filter $(VALIDATOR_QUIET_VALUES),$(VALIDATOR_QUIET))
VALIDATOR_FLAGS := $(if $(VALIDATOR_IS_QUIET),--quiet,)
VALIDATOR_ENV := $(if $(VALIDATOR_IS_QUIET),SPAGHETTI_VALIDATOR_QUIET=1 ,)

.PHONY: image shell validate build pristine flash monitor clean

image:
	@$(COMPOSE) build

shell:
	@$(COMPOSE) run --rm --entrypoint /bin/bash dev

validate:
	@$(COMPOSE) run --rm --entrypoint python3 dev validator $(VALIDATOR_FLAGS)

build:
	@$(COMPOSE) run --rm --entrypoint sh dev -lc \
		'set -e; \
		python3 validator $(VALIDATOR_FLAGS); \
		if [ -d build ] && [ ! -f build/build.ninja ]; then \
			echo "Incomplete build directory detected; regenerating."; \
			cmake -E remove_directory build; \
		fi; \
		SPAGHETTI_VALIDATOR_ALREADY_RUN=1 $(VALIDATOR_ENV)west build \
			-p auto -b "$$BOARD" -d build .'

pristine:
	@$(COMPOSE) run --rm --entrypoint sh dev -lc \
		'set -e; \
		python3 validator $(VALIDATOR_FLAGS); \
		cmake -E remove_directory build; \
		SPAGHETTI_VALIDATOR_ALREADY_RUN=1 $(VALIDATOR_ENV)west build \
			-p auto -b "$$BOARD" -d build .'

# USB passthrough in compose.linux.yaml is supported on a native Linux host.
flash:
	@$(LINUX_COMPOSE) run --rm --entrypoint west dev \
		flash -d build --reset-type watchdog-reset

monitor:
	@$(LINUX_COMPOSE) run --rm --entrypoint west dev espressif monitor

clean:
	@$(COMPOSE) run --rm --entrypoint west dev build -d build -t pristine
