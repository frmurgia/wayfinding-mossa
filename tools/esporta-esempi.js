/* Esporta gli STL (piatti, da stampare) e i cartamodelli SVG di tutti gli esempi.
   Uso:  node tools/esporta-esempi.js        → cartella esempi/ */
const fs = require('fs');
const path = require('path');
const Trama = require('../js/trama.js');
const Piega = require('../js/piega.js');
const Forme = require('../js/forme.js');
const STL = require('../js/stl.js');

const out = path.join(__dirname, '..', 'esempi');
fs.mkdirSync(out, { recursive: true });
const righe = ['| File | Esempio | Ingombro piatto (mm) | Strati | Peso PLA |', '|---|---|---|---|---|'];

for (const es of Forme.ESEMPI) {
  const t = es.strati * 0.2;
  const spec = Forme.FORME[es.forma].costruisci(Object.assign(Forme.parametriDefault(es.forma), es.par || {}), t);
  const g = Trama.genera(Object.assign({}, spec, { cerniere: [], trama: es.trama, spessore: t, larghezzaRilievo: 3.2, altezzaRilievo: 1.6, pittogramma: 'separato' }));
  fs.writeFileSync(path.join(out, `${es.id}_da-stampare.stl`), Buffer.from(STL.scrivi(g.posStampa || g.pos, 'PIEGA ' + es.id)));
  if (g.pittogramma) fs.writeFileSync(path.join(out, `${es.id}_pittogramma.stl`), Buffer.from(STL.scrivi(g.pittogramma, 'PIEGA ' + es.id + ' pittogramma')));
  // metodo 2: pezzo pieno (contorno, fori, asole) — la trama la fa lo slicer
  const gp = Trama.genera(Object.assign({}, spec, { cerniere: [], trama: Object.assign({}, es.trama, { tipo: 'pieno' }), spessore: t, larghezzaRilievo: 3.2, altezzaRilievo: 1.6, pittogramma: 'separato' }));
  fs.writeFileSync(path.join(out, `${es.id}_pieno-per-slicer.stl`), Buffer.from(STL.scrivi(gp.posStampa || gp.pos, 'PIEGA ' + es.id + ' pieno')));
  const m = Piega.prepara(g.pos, g.tag, spec.pieghe, spec.base, { spessore: t });
  const pieg = Piega.applica(m, spec.pieghe, 1, false);
  fs.writeFileSync(path.join(out, `${es.id}_piegato.stl`), Buffer.from(STL.scrivi(pieg, 'PIEGA ' + es.id + ' piegato')));
  // cartamodello
  const poli = g.contorno;
  let a = [1e9, 1e9, -1e9, -1e9];
  for (const p of poli) for (const q of p) { a[0] = Math.min(a[0], q[0]); a[1] = Math.min(a[1], q[1]); a[2] = Math.max(a[2], q[0]); a[3] = Math.max(a[3], q[1]); }
  const M = 15, W = a[2] - a[0] + 2 * M, H = a[3] - a[1] + 2 * M + 12;
  const X = (x) => (x - a[0] + M).toFixed(2), Y = (y) => (a[3] - y + M + 12).toFixed(2);
  const d = poli.map(p => 'M' + p.map(q => `${X(q[0])},${Y(q[1])}`).join('L') + 'Z').join(' ');
  const linee = spec.pieghe.map((p, i) => {
    const col = p.angolo >= 0 ? '#2f64c8' : '#d6423a';
    return `<line x1="${X(p.a[0])}" y1="${Y(p.a[1])}" x2="${X(p.b[0])}" y2="${Y(p.b[1])}" stroke="${col}" stroke-width="0.5" stroke-dasharray="${p.angolo >= 0 ? '4 2.5' : '5 2 1 2'}"/>` +
      `<text x="${X((p.a[0] + p.b[0]) / 2)}" y="${Y((p.a[1] + p.b[1]) / 2)}" dx="1.5" dy="-1.5" font-size="3" fill="${col}" font-family="Helvetica, Arial">${i + 1}: ${p.angolo > 0 ? '+' : ''}${Math.round(p.angolo)}° r${p.raggio}</text>`;
  }).join('\n');
  fs.writeFileSync(path.join(out, `${es.id}_cartamodello.svg`), `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}">
<text x="${M}" y="${M - 2}" font-size="4.5" font-weight="bold" font-family="Helvetica, Arial">PIEGA · cartamodello · ${es.titolo}</text>
<text x="${M}" y="${M + 4}" font-size="3" fill="#555" font-family="Helvetica, Arial">scala 1:1 — stampare al 100% · blu tratteggio = verso l'alto (+) · rosso tratto-punto = verso il basso (−) · r = raggio curva</text>
<path d="${d}" fill="none" stroke="#000" stroke-width="0.35" fill-rule="evenodd"/>
${linee}
</svg>`);
  let vol = 0; const P = g.posStampa || g.pos;
  const PS = g.posStampa || g.pos; for (let i = 0; i < PS.length; i += 9) vol += (P[i] * (P[i + 4] * P[i + 8] - P[i + 5] * P[i + 7]) - P[i + 1] * (P[i + 3] * P[i + 8] - P[i + 5] * P[i + 6]) + P[i + 2] * (P[i + 3] * P[i + 7] - P[i + 4] * P[i + 6])) / 6;
  righe.push(`| ${es.id}_da-stampare.stl | ${es.titolo} | ${(a[2] - a[0]).toFixed(0)} × ${(a[3] - a[1]).toFixed(0)} | ${es.strati} | ~${(Math.abs(vol) / 1000 * 1.24).toFixed(0)} g |`);
  console.log('✓', es.id);
}
fs.writeFileSync(path.join(out, 'ELENCO.md'), '# Esempi pronti\n\nGenerati da `node tools/esporta-esempi.js`. Strato 0,2 mm, linea 1,2 mm (ugello 0,4).\n' +
  '`*_da-stampare.stl` = trama già modellata (metodo 1). `*_pieno-per-slicer.stl` = pezzo pieno con fori e asole, la trama la fa lo slicer (metodo 2, 0 strati sopra/sotto, 2 perimetri, griglia 12–20%).\n' +
  'I pittogrammi sono file a parte (`*_pittogramma.stl`), da stampare in nero e innestare a pressione nei fori della tessera.\n\n' + righe.join('\n') + '\n');
console.log(righe.join('\n'));

/* ---------- libreria pittogrammi: pezzo nero + tessera + disegno, in due misure ---------- */
const dirP = path.join(out, 'pittogrammi');
fs.mkdirSync(dirP, { recursive: true });
const trama = { tipo: 'rombi', passo: 7, larghezza: 1.2, angolo: 0, bordo: 2.4 };
const elenco = ['# Pittogrammi', '', 'Due misure: `60mm/` e `100mm/` (tessera 60 o 100 mm, linea 3,2 o 5,3 mm, spessori sempre 1,6 mm). Non scalare i file nello slicer.', '',
  'Per ogni segno: `*_pittogramma.stl` (si stampa così com’è: faccia a vista sul piatto, perni verso l’alto),',
  '`*_tessera.stl` (trama a rombi già modellata), `*_tessera-piena-per-slicer.stl` (metodo 2) e `*.svg` (disegno su griglia 10 × 10).', '',
  '`tavola-pittogrammi.svg`: tutti i segni su un foglio, da stampare in scala 1:1.', ''];
for (const lato of [60, 100]) {
  const d = path.join(dirP, lato + 'mm');
  fs.mkdirSync(d, { recursive: true });
  const w = +(3.2 * lato / 60).toFixed(1);
  for (const c of Forme.CATEGORIE_GLIFI) for (const id of c.ids) {
    const spec = Forme.FORME.tessera.costruisci({ A: lato, glifo: id }, 1.6);
    const base = { area: spec.area, rilievi: spec.rilievi, larghezzaRilievo: w, altezzaRilievo: 1.6, pittogramma: 'separato', spessore: 1.6 };
    const g = Trama.genera(Object.assign({}, base, { trama }));
    const gp = Trama.genera(Object.assign({}, base, { trama: { tipo: 'pieno' } }));
    fs.writeFileSync(path.join(d, `${id}_pittogramma.stl`), Buffer.from(STL.scrivi(g.pittogramma, 'PIEGA ' + id)));
    fs.writeFileSync(path.join(d, `${id}_tessera.stl`), Buffer.from(STL.scrivi(g.posStampa, 'PIEGA tessera ' + id)));
    fs.writeFileSync(path.join(d, `${id}_tessera-piena-per-slicer.stl`), Buffer.from(STL.scrivi(gp.posStampa, 'PIEGA tessera piena ' + id)));
    if (lato === 60) fs.writeFileSync(path.join(dirP, `${id}.svg`), '<?xml version="1.0" encoding="UTF-8"?>\n' + Forme.svgGlifo(id, { griglia: true, dimensione: '44mm', margine: 0 }));
  }
}
// set "griglia": una tessera universale + pittogrammi con perni quadrati nelle celle
elenco.push('## Set a griglia (tessera universale)', '',
  'Cartelle `griglia-60mm/` (passo 6) e `griglia-100mm/` (passo 7,5): una sola `tessera-griglia.stl` va bene per tutti i segni;',
  'i `*_pittogramma-griglia.stl` hanno perni quadrati che entrano tra le linee e si possono mettere in qualsiasi cella.',
  'La tessera a griglia va stampata con la trama modellata (metodo 1): la griglia dello slicer non è allineata al centro della tessera.', '');
for (const [lato, passo] of [[60, 6], [100, 7.5]]) {
  const d = path.join(dirP, 'griglia-' + lato + 'mm');
  fs.mkdirSync(d, { recursive: true });
  const w = +(3.2 * lato / 60).toFixed(1);
  const tg = { tipo: 'griglia', passo, larghezza: 1.2, angolo: 0, bordo: 2.4 };
  let tessera = null;
  for (const c of Forme.CATEGORIE_GLIFI) for (const id of c.ids) {
    const spec = Forme.FORME.tessera.costruisci({ A: lato, glifo: id }, 1.6);
    const g = Trama.genera({ area: spec.area, rilievi: spec.rilievi, larghezzaRilievo: w, altezzaRilievo: 1.6, pittogramma: 'separato', trama: tg, spessore: 1.6 });
    if (!g.innestoGriglia) throw new Error('griglia non attiva per ' + id);
    fs.writeFileSync(path.join(d, `${id}_pittogramma-griglia.stl`), Buffer.from(STL.scrivi(g.pittogramma, 'PIEGA griglia ' + id)));
    tessera = tessera || g.posStampa;
  }
  fs.writeFileSync(path.join(d, 'tessera-griglia.stl'), Buffer.from(STL.scrivi(tessera, 'PIEGA tessera griglia ' + lato)));
}
for (const c of Forme.CATEGORIE_GLIFI) {
  elenco.push(`## ${c.nome}`, '');
  for (const id of c.ids) elenco.push(`- **${Forme.GLIFI[id].nome}** — \`${id}_…\``);
  elenco.push('');
}
fs.writeFileSync(path.join(dirP, 'ELENCO.md'), elenco.join('\n'));
console.log('✓ pittogrammi:', Forme.CATEGORIE_GLIFI.reduce((a, c) => a + c.ids.length, 0), '× 2 misure');
// tavola con tutti i segni (stessa impaginazione della scheda Pittogrammi del sito)
{
  const cel = 26, outT = [];
  let h = 8;
  for (const c of Forme.CATEGORIE_GLIFI) {
    outT.push(`<text x="5" y="${h + 6}" font-size="5" font-family="Helvetica,Arial" font-weight="bold">${c.nome}</text>`); h += 9;
    c.ids.forEach((id, i) => {
      const x = 5 + (i % 7) * cel, y = h + Math.floor(i / 7) * (cel + 6);
      outT.push(`<g transform="translate(${x},${y})">${Forme.svgGlifo(id, { griglia: true, dimensione: 22, margine: 0 })}<text x="11" y="26.5" font-size="3" text-anchor="middle" font-family="Helvetica,Arial">${Forme.GLIFI[id].nome}</text></g>`);
    });
    h += Math.ceil(c.ids.length / 7) * (cel + 6) + 3;
  }
  const W = 7 * cel + 10;
  fs.writeFileSync(path.join(dirP, 'tavola-pittogrammi.svg'), `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${h}mm" viewBox="0 0 ${W} ${h}"><rect width="100%" height="100%" fill="#fff"/>${outT.join('')}</svg>`);
}
