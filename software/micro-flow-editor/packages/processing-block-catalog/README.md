# @spaghettilab/processing-block-catalog

Catalogo authoring dei blocchi funzionali del Device Processing Graph (S074).

`GET_CATALOG` espone ancora solo i Module Driver. Questo pacchetto è la fonte host
dei Block/Rule/schedule/event finché il protocollo non li elenca. I `typeId` shipped
coincidono con i driver firmware (`spaghetti_blocks/`, Rule `threshold`); non sono
nomi UI inventati.

La Library AppBlocks è mappata solo dove esiste un analogo SpaghettiLAB. La tab
Features non è in questo dump e resta `runtime: "feature"`. Loop illimitati,
HTTP/socket e display senza hardware sul Core restano `out-of-scope` o `node-red`.
Blocchi vendor-only non entrano nel catalogo.
