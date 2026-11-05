# PIEGA — L’Opificio Digitale

Simulatore di piegatura per pezzi stampati in 3D **a solo riempimento** (trama), pensato per il laboratorio di wayfinding della 3a L CAT, IT “Lorenzo Mossa”, Oristano.

Dal pezzo piatto (STL, STEP o una forma del corso) all’oggetto piegato con **curve morbide**: si tracciano le linee di piega, si sceglie il raggio della curva e si guarda il pezzo chiudersi in 3D.

## Come si apre

- **Doppio clic su `index.html`**: funziona anche senza internet (le librerie sono in `vendor/`).
  Solo la lettura dei file **STEP/IGES** scarica un lettore da internet (~8 MB, la prima volta).
- In alternativa, da terminale nella cartella: `python3 -m http.server 8765` e poi `http://localhost:8765`.
- Si può pubblicare così com’è su GitHub Pages.

## Cosa c’è

| Scheda | A cosa serve |
|---|---|
| **Laboratorio** (pagina principale) | 1 pezzo piatto (forma del corso o file) · 2 trama e stampa · 3 pieghe · 4 esporta |
| **Esempi** | gli oggetti pronti per la presentazione del corso, con anteprima |
| **Pittogrammi** | 35 segni (direzioni, servizi, luoghi della scuola, differenziata, piani): STL del pezzo nero + tessera, tutti in un .zip, tavola SVG per la carta |
| **▶ Presenta** | schermo intero: ogni esempio si piega e si apre da solo, con didascalia. Frecce ← → per cambiare, Esc per uscire |
| **Agganci** | i 4 sistemi di aggancio proposti (arpione, clip a U, gancio ripiegato, viti) |
| **Guida** | percorso del corso, impostazioni slicer, piegatura con acqua calda, regole di progetto |

### Pieghe
- **✎ Piega** (tasto P): trascina sulla vista dall’alto, da un bordo all’altro del pezzo. Maiusc = 0°/45°/90°.
- **⌖ Base** (tasto B): la parte che resta ferma.
- **Angolo**: + verso l’alto, − verso il piatto (i rilievi restano all’esterno).
- **Raggio**: raggio interno della curva. Raggio grande = curva ampia (colonne, onde).
- **Fase**: le pieghe con la stessa fase si chiudono insieme → ordine di montaggio.
- Ogni colore nella vista dall’alto è una parte rigida; la fascia grigia è la zona che si curva.

### Esporta
- **STL da stampare** — il pezzo piatto con la trama.
- **STL piegato** — per controllare ingombri o fare render.
- **Immagine PNG** — per le slide.
- **Cartamodello SVG** — contorno e pieghe in scala 1:1, da stampare su carta e provare a piegare.
- **Salva / Apri progetto** — file `.piega.json` (contiene anche l’STL importato).

## Online
https://frmurgia.github.io/wayfinding-mossa/

## Cartella `esempi/`
STL piatti (da stampare), STL piegati e cartamodelli SVG di tutti gli esempi. Elenco con pesi e ingombri in `esempi/ELENCO.md`. In `esempi/pittogrammi/` tutti i pittogrammi (pezzo nero, tessera, disegno SVG e tavola).
Per rigenerarli dopo una modifica alle forme: `node tools/esporta-esempi.js`.

## Struttura del codice
| File | Contenuto |
|---|---|
| `js/trama.js` | generatore delle trame (griglia, rombi, triangoli, nido d’ape, onde), bordo, zone cerniera, parti piene, fori, rilievi, estrusione |
| `js/piega.js` | motore di piegatura: regioni, albero delle pieghe, curvatura con raggio reale, fasi |
| `js/forme.js` | forme parametriche, pittogrammi monolinea (griglia 10×10), esempi e agganci |
| `js/app.js` | interfaccia (three.js r147) |
| `js/contenuti.js` | testi delle schede Agganci e Guida |
| `js/stl.js` | lettura/scrittura STL |

Per aggiungere un pittogramma: in `js/forme.js`, oggetto `GLIFI`, una lista di polilinee su griglia 10×10.

## Note e limiti
- La simulazione è geometrica: la lunghezza della trama si conserva lungo la curva, ma non calcola il ritorno elastico né le collisioni tra parti.
- Le misure degli agganci sono un punto di partenza: vanno verificate con un provino (vedi scheda Agganci).
- Il peso indicato è stimato per il PLA (1,24 g/cm³).
