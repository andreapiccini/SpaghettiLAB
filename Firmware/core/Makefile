COMPOSE := docker compose
LINUX_COMPOSE := $(COMPOSE) -f compose.yaml -f compose.linux.yaml
VALIDATOR_QUIET_VALUES := 1 true yes on
VALIDATOR_IS_QUIET := $(filter $(VALIDATOR_QUIET_VALUES),$(VALIDATOR_QUIET))
VALIDATOR_FLAGS := $(if $(VALIDATOR_IS_QUIET),--quiet,)
VALIDATOR_ENV := $(if $(VALIDATOR_IS_QUIET),SPAGHETTI_VALIDATOR_QUIET=1 ,)

.PHONY: image shell validate build pristine flash monitor clean

image:
	$(COMPOSE) build

shell:
	$(COMPOSE) run --rm dev

validate:
	$(COMPOSE) run --rm --entrypoint python3 dev validator $(VALIDATOR_FLAGS)

build:
	$(COMPOSE) run --rm dev sh -lc \
		'python3 validator $(VALIDATOR_FLAGS) \
		&& SPAGHETTI_VALIDATOR_ALREADY_RUN=1 $(VALIDATOR_ENV)west build -p auto -b "$$BOARD" -d build .'

pristine:
	$(COMPOSE) run --rm dev sh -lc \
		'python3 validator $(VALIDATOR_FLAGS) \
		&& SPAGHETTI_VALIDATOR_ALREADY_RUN=1 $(VALIDATOR_ENV)west build -p always -b "$$BOARD" -d build .'

# USB passthrough in compose.linux.yaml is supported on a native Linux host.
flash:
	$(LINUX_COMPOSE) run --rm dev west flash -d build --reset-type watchdog-reset

monitor:
	$(LINUX_COMPOSE) run --rm dev west espressif monitor

clean:
	$(COMPOSE) run --rm dev west build -d build -t pristine
