# D040 — Fake host e fixture

**Stato:** ✅ DONE
**Dipende da:** D030
**Blocca:** D051

## Obiettivo

FakeHost che dimostra il **caso d'uso visivo** completo senza Node-RED reale.

## Fixture richieste

1. Sistema demo `"Casa demo"`:
   - `salotto.temperatura` (gauge)
   - `giardino.pompa` (animated: idle/running — stream alterna o comando manuale)
   - `giardino.umidita` (value)
   - `ingresso.luce` (switch)
   - altri 4–6 punti generici
2. Layout precaricato con pompa + temperatura visibili.
3. Appearance default + variante "Garden gradient" applicabile.
4. Marketplace: 3 **Visual Pack** fake (`Minimal` cards, `Industrial` teaser schematic,
   `Garden` teaser top_down) — apply aggiorna appearance; view resta `cards`.
5. `GET view` → `{ kind: cards }`.
6. Stream: aggiorna temperatura; toggle pompa → `visualState` running/idle.

## Verifiche

- dimostra che automazione **simulata sotto** (fake toggle pompa) ≠ UI che definisce
  regole — commento in README fixture;
- nessun Protocol V1 / Node-RED nel codice.

## Fine task

- [ ] FakeHost completo.
- [ ] README scenario demo "pompa + temperatura".
