# Dashboard SpaghettiLAB

[Indice master Software](../SOFTWARE_MASTER_INDEX.md)

Il **volto grafico** del prodotto: presenta bene ciò che sotto già funziona
(firmware, React Flow, Node-RED). Temi, animazioni e **viste estendibili**
(cards, schema, pianta, first person, pack custom) da marketplace o da chi
programma.

## Fa / non fa

| Fa | Non fa |
|---|---|
| Motore di presentazione Flutter | Automazioni / Telegram / regole |
| Appearance, brand, animazioni | Processing / deploy Config |
| ViewMode pluggable (fase 1: cards) | API dashboard nel firmware |
| Visual Pack marketplace + developer SDK (fase 2) | Eval di codice remoto non firmato |
| Comandi manuali su punti esposti | |

## Documentazione

| Doc | Contenuto |
|---|---|
| [DASHBOARD_ARCHITECTURE.md](DASHBOARD_ARCHITECTURE.md) | Confini e prodotto |
| [design/VIEW_MODES.md](design/VIEW_MODES.md) | Viste, Scene, Visual Pack |
| [design/THEMING.md](design/THEMING.md) | Appearance e pack |
| [HOST_API.md](HOST_API.md) | Contratto host |
| [roadmap/dashboard-v1/](roadmap/dashboard-v1/README.md) | Task |

## Ambiente riproducibile

Dopo clone, **non** dipendere dalla Flutter installata sul PC:

```sh
cd Software/dashboard
make ci          # analyze + test + build web in Docker
make dev-web     # hot reload UI su browser (Compose)
```

Pin SDK: **FVM** (`.fvm/`) + stesso tag nell’immagine Docker. Dettaglio, limiti iOS/macOS
in container, Dev Containers: [ENVIRONMENT.md](ENVIRONMENT.md).

## Fase 1

Cards + appearance + animazioni + marketplace shell + **registry renderer** pronto
per viste future. Integrazione Protocol V1 e pack immersivi = dopo.

## Stato

Documentazione allineata; implementazione da D010/D011 (include Docker + FVM).
