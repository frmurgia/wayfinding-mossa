# Profili PrusaSlicer — Original Prusa i3 MK3S, ugello 0,4, PLA

Ricavati dalla configurazione della stampante del laboratorio (PrusaSlicer 2.9.6).

**Come si importano:** PrusaSlicer → File → Importa → Importa configurazione… → scegli il file `.ini`.
Poi salva i tre preset (stampa, filamento, stampante) con un nome tipo “PIEGA”.

| File | Per quali STL |
|---|---|
| `PIEGA_MK3S_metodo2_riempimento-slicer.ini` | `*_pieno-per-slicer.stl`, `*_tessera-piena-per-slicer.stl` — **consigliato** |
| `PIEGA_MK3S_metodo1_trama-modellata.ini` | `*_da-stampare.stl`, `*_tessera.stl`, `*_pittogramma.stl` |

## Cosa è cambiato rispetto alla configurazione originale

| Impostazione | Prima | Ora | Perché |
|---|---|---|---|
| Evita di attraversare i perimetri | no | **sì** | gli spostamenti restano sopra la plastica: niente fili nelle celle |
| Ritrai solo attraversando i perimetri | no | **sì** | meno ritrazioni |
| Solleva Z (Z-hop) | 0,4 mm | **0** | con centinaia di spostamenti l’ugello saliva e scendeva di continuo e trascinava fili |
| Spostamento minimo per ritrarre | 1 mm | **2 mm** | meno ritrazioni sui salti brevi |
| Compensazione piede d’elefante | 0,2 mm | **0** | assottigliava le linee del primo strato da 1,2 a 0,8 mm |
| Altezza strato | 0,30 (DRAFT) | **0,20** | i pezzi sono progettati in strati da 0,2 (8 strati = 1,6 mm) |
| Temperatura | 215 / 210 °C | **210 / 200 °C** | meno colature |
| Larghezza perimetri | 0,5 | **0,6** | linea da 1,2 mm = 2 perimetri esatti, niente riempimenti a pezzetti |
| Larghezza primo strato | 0,42 | **0,5** | più aderenza delle linee sottili |
| Giunzione | allineata | **posteriore** | i puntini delle cuciture finiscono tutti su un lato |
| *solo metodo 2* — strati solidi sopra/sotto e spessori minimi | 4/3, 0,7/0,5 mm | **0 / 0** | senza azzerare anche gli spessori minimi PrusaSlicer aggiunge comunque la pelle piena |
| *solo metodo 2* — riempimento | griglia 15% 45°, linea 0,5 | griglia 15% 45°, **linea 0,6** | trama a rombi con linee robuste |
