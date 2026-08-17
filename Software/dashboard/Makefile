.PHONY: ci dev-web shell broker

ci:
	docker compose run --rm dashboard-ci

dev-web:
	docker compose up --build --force-recreate dashboard-dev-web

broker:
	docker compose up -d mosquitto

shell:
	docker compose run --rm dashboard-ci bash
