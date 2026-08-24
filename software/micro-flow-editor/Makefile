# React Flow + host USB bridge (Safari cannot use Web Serial).
# Docker on macOS does not see /dev/cu.usbmodem*; `make up-d` starts the
# bridge on this machine, then Compose.

.PHONY: up up-d down usb-bridge usb-bridge-stop

up-d:
	@sh scripts/usb-bridge.sh start
	docker compose up -d $(ARGS)

up:
	@sh scripts/usb-bridge.sh start
	docker compose up $(ARGS)

down:
	docker compose down
	@sh scripts/usb-bridge.sh stop || true

usb-bridge:
	@sh scripts/usb-bridge.sh start

usb-bridge-stop:
	@sh scripts/usb-bridge.sh stop
