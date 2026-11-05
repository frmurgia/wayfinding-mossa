/* Testi delle schede Agganci e Guida */
(function (root) {
  'use strict';

  const lastra = (x, y, w, h) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="#8fa3b0"/>
    ${Array.from({ length: Math.floor(w / 7) }, (_, i) => `<rect x="${x + 3 + i * 7 + (i % 3)}" y="${y + 3 + (i * 5) % (h - 6)}" width="3" height="2" fill="${['#e9e3d0', '#d6423a', '#2f64c8', '#f1d82a', '#4f9a62'][i % 5]}" opacity=".8"/>`).join('')}`;
  const FIG = {
    A: `<svg viewBox="0 0 200 150"><text x="10" y="16" font-size="10" fill="#6f706c">sezione</text>
      ${lastra(10, 74, 180, 18)}<rect x="56" y="74" width="8" height="18" fill="#f5f4f0"/><rect x="136" y="74" width="8" height="18" fill="#f5f4f0"/>
      <path d="M60 30 H140 M60 30 V74 M140 30 V74" stroke="#f1d82a" stroke-width="5" fill="none" stroke-linejoin="round"/>
      <path d="M60 30 H140" stroke="#1d1d1b" stroke-width="1"/>
      <path d="M57.5 72 V93 L53 96 L57 108 H63 L67 96 L62.5 93 V72Z M137.5 72 V93 L133 96 L137 108 H143 L147 96 L142.5 93 V72Z" fill="#f1d82a" stroke="#1d1d1b" stroke-width=".8"/>
      <path d="M60 96 V108 M140 96 V108" stroke="#fff" stroke-width="1.2"/>
      <text x="70" y="132" font-size="9" fill="#1d1d1b">l’arpione si stringe, passa</text><text x="70" y="143" font-size="9" fill="#1d1d1b">e si riapre dietro la lastra</text></svg>`,
    B: `<svg viewBox="0 0 200 150"><text x="10" y="16" font-size="10" fill="#6f706c">sezione</text>
      ${lastra(10, 62, 140, 22)}
      <path d="M30 58 H150 A15 15 0 0 1 150 88 H104" stroke="#f1d82a" stroke-width="5" fill="none"/>
      <path d="M30 58 H150 A15 15 0 0 1 150 88 H104" stroke="#1d1d1b" stroke-width=".8" fill="none"/>
      <path d="M60 40 h40 m-10 -8 l10 8 -10 8" stroke="#1d1d1b" stroke-width="3" fill="none"/>
      <text x="40" y="120" font-size="9" fill="#1d1d1b">raggio interno = ½ spessore lastra</text>
      <text x="40" y="132" font-size="9" fill="#1d1d1b">si piega usando la lastra come dima</text></svg>`,
    C: `<svg viewBox="0 0 200 150"><text x="10" y="16" font-size="10" fill="#6f706c">vista dall’alto dell’angolo</text>
      <path d="M40 130 V40 H170" stroke="#e9e8e3" stroke-width="7" fill="none"/>
      <path d="M40 130 V40 H170" stroke="#9da3a6" stroke-width="1" fill="none"/>
      <rect x="95" y="36" width="8" height="8" fill="#fff"/>
      <path d="M36 128 V30 A4 4 0 0 1 40 26 H95 A3 3 0 0 1 99 29 V48" stroke="#1d1d1b" stroke-width="3" fill="none"/>
      <text x="60" y="20" font-size="9" fill="#1d1d1b">aletta</text><text x="104" y="58" font-size="9" fill="#1d1d1b">gancio nell’asola</text>
      <text x="48" y="90" font-size="9" fill="#6f706c">parete A</text><text x="120" y="32" font-size="9" fill="#6f706c">parete B</text></svg>`,
    E: `<svg viewBox="0 0 200 150"><text x="10" y="16" font-size="10" fill="#6f706c">sezione</text>
      ${lastra(10, 88, 180, 22)}
      <rect x="30" y="80" width="140" height="8" fill="#f1d82a"/><path d="M30 80 H170 M30 88 H170" stroke="#1d1d1b" stroke-width=".6"/>
      <rect x="66" y="80" width="12" height="8" fill="#f1d82a" stroke="#1d1d1b" stroke-width=".8"/><rect x="122" y="80" width="12" height="8" fill="#f1d82a" stroke="#1d1d1b" stroke-width=".8"/>
      <rect x="56" y="70" width="88" height="10" fill="#1d1d1b"/><rect x="70" y="80" width="4" height="7" fill="#1d1d1b"/><rect x="126" y="80" width="4" height="7" fill="#1d1d1b"/>
      <text x="40" y="40" font-size="9" fill="#1d1d1b">pittogramma nero</text><path d="M80 44 V68" stroke="#1d1d1b" stroke-width=".8"/>
      <text x="40" y="132" font-size="9" fill="#1d1d1b">perni nei fori con anello pieno;</text><text x="40" y="143" font-size="9" fill="#1d1d1b">il retro resta piatto sulla lastra</text></svg>`,
    D: `<svg viewBox="0 0 200 150"><text x="10" y="16" font-size="10" fill="#6f706c">sezione</text>
      <rect x="20" y="70" width="160" height="40" fill="#d9d6cf"/>
      <path d="M30 66 H170" stroke="#f2f1ec" stroke-width="6"/><path d="M30 63 H170 M30 69 H170" stroke="#9da3a6" stroke-width=".8"/>
      <rect x="88" y="62" width="24" height="8" fill="#1d1d1b" opacity=".25"/>
      <path d="M92 56 H108 L106 62 H94Z" fill="#6f706c"/><path d="M98 62 V100 L100 104 L102 100 V62" fill="#6f706c"/>
      <text x="40" y="132" font-size="9" fill="#1d1d1b">anello pieno attorno al foro</text></svg>`
  };

  function agganci(AGGANCI) {
    return `<h1>Agganci</h1>
    <p class="sottotitolo">Come si tiene insieme il sistema: resistente ma semplice. Quattro soluzioni, dalla più “di sistema” alla più universale.
    Le misure sono un punto di partenza da verificare con un provino.</p>
    ${AGGANCI.map(a => `<div class="aggancio-carta">${FIG[a.id] || ''}<div>
      <h3><span class="lettera">${a.id}</span>${a.nome}</h3>
      <p>${a.come}</p>
      <dl><dt>Collega</dt><dd>${a.dove}</dd><dt>Misure</dt><dd>${a.misure}</dd><dt>Pro</dt><dd>${a.pro}</dd><dt>Contro</dt><dd>${a.contro}</dd></dl>
    </div></div>`).join('')}
    <h2>La griglia delle asole è il sistema</h2>
    <p>Proposta: tutte le lastre in plastica riciclata hanno le asole fresate a <b>passo fisso di 60 mm</b> (il modulo 1u).
    Così qualsiasi modulo progettato dalla classe (1u, 2u, 3u…) si aggancia in qualsiasi punto di qualsiasi lastra,
    e i moduli si possono spostare quando cambia la destinazione di un’aula. Le lastre si appendono o si avvitano a muro.</p>
    <h2>Provino consigliato (lezione 5)</h2>
    <p>Stampare una striscia con 5 arpioni di larghezza diversa (10,0 · 10,3 · 10,6 · 10,9 · 11,2 mm) e una lastrina con 5 asole uguali:
    si sceglie la coppia che entra con una spinta decisa e non esce tirando.</p>`;
  }

  function guida() {
    return `<h1>Guida</h1>
    <p class="sottotitolo">Dal foglio di carta al cartello appeso: come si usa PIEGA durante il laboratorio.</p>

    <h2>Il percorso</h2>
    <ol class="passi">
      <li><b>Carta.</b> Pittogrammi su griglia 10 × 10, un solo spessore di linea. Cartamodello del modulo: si ritaglia e si piega.</li>
      <li><b>CAD.</b> Si disegna il pezzo <i>piatto</i> (Fusion, Onshape, Tinkercad…) e si esporta in STL o STEP.</li>
      <li><b>PIEGA.</b> Si carica il file, si tracciano le linee di piega e si controlla se l’oggetto piegato funziona.</li>
      <li><b>Stampa.</b> Solo la trama del riempimento: leggera, flessibile, veloce.</li>
      <li><b>Acqua calda.</b> Si ammorbidisce la zona di piega e si piega su una dima.</li>
      <li><b>Lastra.</b> Il modulo si aggancia alla lastra in plastica riciclata fresata a CNC.</li>
    </ol>

    <h2>Usare PIEGA</h2>
    <table class="tab">
      <tr><th>Disegnare una piega</th><td>Strumento <b>✎ Piega</b> nella vista dall’alto: tieni premuto e trascina da un bordo all’altro del pezzo. Con <b>Maiusc</b> la linea resta a 0°/45°/90°.
      La linea deve <b>attraversare tutto il pezzo</b>: se non lo divide in due parti, viene segnalata in rosso.</td></tr>
      <tr><th>Base</th><td>Con <b>⌖ Base</b> clicchi la parte che resta ferma sul tavolo. Tutto il resto si muove rispetto a lei.</td></tr>
      <tr><th>Angolo</th><td><b>+</b> la parte si alza verso di te (il lato stampato in alto finisce all’interno); <b>−</b> si piega verso il piatto (il lato in alto, quello con i rilievi, resta all’esterno).</td></tr>
      <tr><th>Raggio interno</th><td>La plastica non fa spigoli vivi: con il raggio la piega diventa una curva. Raggio grande = colonne, archi, fasce.</td></tr>
      <tr><th>Fasi</th><td>Le pieghe con la stessa fase si chiudono insieme. Serve a spiegare l’<b>ordine di montaggio</b> (prima le pareti, poi le alette, poi i ganci).</td></tr>
      <tr><th>Colori nella vista dall’alto</th><td>Ogni colore è una parte rigida. Il grigio scuro è la base.</td></tr>
      <tr><th>Esporta</th><td><b>STL da stampare</b> = pezzo piatto con la trama · <b>STL piegato</b> = per controllare ingombri o fare render · <b>Cartamodello SVG</b> = contorno e pieghe in scala 1:1 da stampare su carta.</td></tr>
    </table>

    <h2>Stampare solo la trama</h2>
    <h3>Metodo 1 — la trama la genera PIEGA (consigliato)</h3>
    <p>Esporta “STL da stampare”. Nello slicer: 2 perimetri, riempimento qualsiasi (le linee sono così sottili che diventano tutte perimetro),
    altezza strato come in PIEGA. Larghezza linea in PIEGA = circa 3 × ugello (1,2 mm con ugello 0,4).</p>
    <h3>Metodo 2 — la trama la genera lo slicer (consigliato per i pezzi piani)</h3>
    <p>Linee lunghe e continue, quasi nessuna ritrazione, stampa più veloce. In PIEGA scegli trama <b>Pieno</b> ed esporta:
    restano i fori per i perni e le asole, lo slicer ci fa il perimetro attorno (l’anello pieno viene da sé).
    La percentuale giusta per il passo che hai scelto la trovi in “4 · Esporta”: per griglia e rombi è circa <b>2 × 0,45 / passo</b> (passo 6 mm → 15%).
    Ganci e linguette: aggiungi un <b>modificatore</b> con riempimento 100% sopra di loro.</p>
    <table class="tab">
      <tr><th></th><th>PrusaSlicer</th><th>Bambu Studio</th><th>Cura</th></tr>
      <tr><td>Strati superiori / inferiori</td><td>0 / 0</td><td>0 / 0</td><td>Spessore sup./inf. 0</td></tr>
      <tr><td>Perimetri</td><td>2 (fanno da bordo)</td><td>Pareti 2</td><td>Linee parete 2</td></tr>
      <tr><td>Riempimento</td><td>Griglia / Triangoli / Nido d’ape · 12–20%</td><td>Griglia / Triangoli · 12–20%</td><td>Griglia / Triangoli · distanza linee = passo</td></tr>
      <tr><td>Larghezza linea riempimento</td><td>0,6 mm</td><td>0,6 mm</td><td>0,6 mm</td></tr>
      <tr><td>Rombi</td><td>Griglia, angolo 45°</td><td>Griglia, angolo 45°</td><td>Direzioni linee riempimento [30,150]</td></tr>
    </table>
    <p class="box-attenzione">Usa trame <b>uguali in ogni strato</b> (griglia, triangoli, nido d’ape 2D). Giroide, nido d’ape 3D e “rettilineo” cambiano direzione da uno strato all’altro: le linee si toccano poco e il pezzo si delamina quando lo pieghi.
    In PIEGA scegli “Come trama” dopo aver caricato il file per vedere un’anteprima.</p>

    <h2>Primo strato e ritrazioni</h2>
    <p>Una trama è fatta di centinaia di celle: lo slicer fa un giro attorno a ogni buco e tra un giro e l’altro <b>si sposta e ritrae</b>.
    Sul primo strato questo dà linee che partono vuote, filamento consumato dall’estrusore e, con lo Z-hop attivo, l’ugello che urta le linee appena stese.
    Le impostazioni qui sotto tengono gli spostamenti <b>sopra la plastica già stampata</b>, così non serve ritrarre.</p>
    <table class="tab">
      <tr><th>Cosa</th><th>PrusaSlicer</th><th>Bambu Studio / OrcaSlicer</th><th>Cura</th><th>Valore</th></tr>
      <tr><td>Spostamenti dentro il pezzo</td><td>Avoid crossing perimeters ✓</td><td>Avoid crossing wall ✓</td><td>Combing mode: Within Infill (o All)</td><td>attivo</td></tr>
      <tr><td>Ritrai solo se esci dal pezzo</td><td>Only retract when crossing perimeters ✓</td><td>Only retract when crossing wall / Reduce infill retraction ✓</td><td>(lo fa il combing)</td><td>attivo</td></tr>
      <tr><td>Spostamento minimo per ritrarre</td><td>Minimum travel after retraction</td><td>Travel distance threshold</td><td>Retraction minimum travel</td><td>2–3 mm</td></tr>
      <tr><td>Z-hop</td><td>Lift Z = 0 (o “Only lift Z above” 0,3)</td><td>Z hop = 0</td><td>Z hop when retracted ✗</td><td>spento sul 1° strato</td></tr>
      <tr><td>Limite ritrazioni</td><td>—</td><td>—</td><td>Maximum retraction count 10 / window 5 mm</td><td>evita di mangiare il filo</td></tr>
      <tr><td>Lunghezza ritrazione</td><td colspan="3">estrusore diretto 0,6–0,8 mm · bowden 3–5 mm · velocità 35–45 mm/s · “extra al riavvio” 0–0,05 mm</td><td></td></tr>
      <tr><td>Primo strato</td><td colspan="3">altezza 0,2–0,25 mm · larghezza linea 120% · velocità 15–20 mm/s · +5 °C · ventola spenta</td><td></td></tr>
      <tr><td>Adesione</td><td colspan="3">piatto pulito (alcool) · niente brim interno; se i bordi si alzano, brim solo esterno 3 mm</td><td></td></tr>
    </table>
    <h3>Problemi visti sulle prime stampe</h3>
    <table class="tab">
      <tr><th>Cosa si vede</th><th>Perché</th><th>Cosa fare</th></tr>
      <tr><td>Fili sottili dentro le celle</td><td>il filo cola durante gli spostamenti sopra i buchi</td><td>spostamenti dentro il pezzo, ritrazione 0,8 mm (diretto) / 4 mm (bowden), temperatura −5/−10 °C (195–200 °C), velocità di spostamento ≥ 150 mm/s, filamento asciutto (4 h a 45–50 °C se è stato all’aria)</td></tr>
      <tr><td>Puntini o “x” a ogni incrocio</td><td>ogni cella è un giro chiuso: inizio e fine del giro (cucitura) cadono sugli spigoli; dove due linee si incrociano si accumula plastica</td><td>cucitura “posteriore” o “allineata”, <b>pulitura (wipe) attiva</b>, Cura: coasting 0,04 mm³, linear/pressure advance calibrato. Oppure metodo 2: lo slicer stende linee che attraversano gli incroci senza fermarsi</td></tr>
      <tr><td>Trattini o solchi lungo le linee e il bordo</td><td>la linea da 1,2 mm non è un multiplo della larghezza dei perimetri: tra i due perimetri resta uno spazio che lo slicer riempie a pezzetti</td><td><b>larghezza perimetri = linea ÷ 2</b>: 0,6 mm per linee da 1,2 mm (bordo 2,4 = 4 perimetri). Oppure in PIEGA linea 0,9 mm con perimetri da 0,45</td></tr>
      <tr><td>Anelli che spuntano attorno al pittogramma</td><td>(versione precedente dei file)</td><td>già corretto: sotto il segno ora c’è una base piena nascosta, i perni stanno lontani dalle punte. Riscarica i file</td></tr>
    </table>
    <p class="box-attenzione"><b>Se la trama è molto fitta</b> (passo &lt; 6 mm) conviene il <b>metodo 2</b>: in PIEGA scegli trama “Pieno”, esporta e lascia fare il riempimento allo slicer
    (griglia o rombi, 0 strati sopra/sotto, 1 perimetro). Lo slicer stende linee lunghe e continue: quasi nessuna ritrazione. Ganci e linguette, però, vengono a trama anche loro.</p>

    <h2>Piegare con l’acqua calda</h2>
    <table class="tab">
      <tr><th>Materiale</th><th>Si ammorbidisce a circa</th><th>Acqua</th><th>Tempo</th></tr>
      <tr><td>PLA</td><td>55–65 °C</td><td>70–80 °C (non bollente)</td><td>10–20 s</td></tr>
      <tr><td>PETG</td><td>75–85 °C</td><td>90–95 °C</td><td>20–30 s</td></tr>
      <tr><td>ABS / ASA</td><td>~100 °C</td><td>no: pistola termica</td><td>—</td></tr>
    </table>
    <ol>
      <li>Immergi solo la zona di piega (pinza o guanto), oppure usa un phon al massimo sulla linea.</li>
      <li>Appoggia il pezzo sulla <b>dima</b>: quasi sempre una forma curva con il raggio scelto in PIEGA — un tubo in PVC, un barattolo, un manico di scopa, un rotolo di cartone. Per la clip a U, la lastra stessa.</li>
      <li>Piega di 3–5° oltre l’angolo voluto: la plastica torna un po’ indietro.</li>
      <li>Tieni fermo e raffredda in acqua fredda (5 s). Se sbagli, riscaldi e rifai.</li>
    </ol>
    <p class="box-attenzione"><b>Sicurezza.</b> L’acqua calda la gestisce il docente (bollitore + termometro, contenitore stabile, lontano dal bordo del banco).
    Pinze o guanti per immergere i pezzi. Mai acqua bollente con il PLA: il pezzo si deforma tutto.</p>

    <h2>Regole per progettare pieghe che funzionano</h2>
    <ul>
      <li><b>Una sola geometria per pezzo:</b> pallini, griglia quadrata o rombi, uguali anche attraverso le pieghe. La curva la decide la dima, non un cambio di trama.</li>
      <li><b>Pieghe morbide.</b> Con la trama la plastica non fa spigoli: lavora come una curva. Pensa ogni piega come un <b>raggio</b> (5–50 mm) e trova in laboratorio un oggetto cilindrico con quel raggio da usare come dima.</li>
      <li><b>Lunghezza della curva</b> = (raggio + ½ spessore) × angolo in radianti: è la zona grigia nella vista dall’alto. Lì la trama deve essere flessibile (onde, barrette) e senza parti piene.</li>
      <li><b>Raggio ≥ spessore</b> del pezzo. Sotto, le linee esterne si allungano troppo e si spezzano.</li>
      <li><b>Scarichi agli angoli:</b> dove due pieghe si incontrano, togli materiale (pianta a croce) o le pareti si scontrano.</li>
      <li><b>Pieno solo dove serve:</b> ganci, linguette, anelli attorno ai fori. Il resto è trama.</li>
      <li><b>Spessore:</b> 6–10 strati da 0,2 mm (1,2–2 mm). Più spesso = più rigido, ma più difficile da piegare.</li>
      <li><b>Pittogrammi a parte:</b> il segno nero si stampa separato e si innesta con perni nei fori della tessera. Sta sopra la trama: usa pieghe <b>−</b> se deve restare all’esterno.</li>
    </ul>

    <h2>Il sistema modulare (proposta)</h2>
    <table class="tab">
      <tr><th>Modulo</th><th>Misura</th><th>Uso</th></tr>
      <tr><td>1u</td><td>60 × 60 mm</td><td>pittogramma, freccia, numero</td></tr>
      <tr><td>2u, 3u</td><td>120 / 180 × 60 mm</td><td>nome dell’aula, parola breve</td></tr>
      <tr><td>Lastra</td><td>multipli di 60 mm, spessore 6 mm</td><td>plastica riciclata, asole a passo 60 mm fresate a CNC</td></tr>
    </table>
    <p>File e codice: la cartella del progetto contiene <code>esempi/</code> con gli STL pronti da stampare e <code>LEGGIMI.md</code>.</p>`;
  }

  root.Contenuti = { agganci, guida };
})(typeof self !== 'undefined' ? self : globalThis);
