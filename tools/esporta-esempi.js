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
  'I pittogrammi sono file a parte (`*_pittogramma.stl`), da stampare in nero e innestare a pressione nei fori della tessera.\n\n' + righe.join('\n') + '\n');
console.log(righe.join('\n'));
