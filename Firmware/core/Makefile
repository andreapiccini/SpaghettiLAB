COMPOSE := docker compose
LINUX_COMPOSE := $(COMPOSE) -f compose.yaml -f compose.linux.yaml

.PHONY: image shell build pristine flash monitor clean

image:
	$(COMPOSE) build

shell:
	$(COMPOSE) run --rm dev

build:
	$(COMPOSE) run --rm dev sh -lc 'west build -p auto -b "$$BOARD" -d build .'

pristine:
	$(COMPOSE) run --rm dev sh -lc 'west build -p always -b "$$BOARD" -d build .'

# USB passthrough in compose.linux.yaml is supported on a native Linux host.
flash:
	$(LINUX_COMPOSE) run --rm dev west flash -d build --reset-type watchdog-reset

monitor:
	$(LINUX_COMPOSE) run --rm dev west espressif monitor

clean:
	$(COMPOSE) run --rm dev west build -d build -t pristine
