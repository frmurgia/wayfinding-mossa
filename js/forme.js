/* =====================================================================
   FORME — forme parametriche, pittogrammi monolinea e esempi del corso
   Tutte le misure in mm. Il pezzo è disegnato piatto sul piano XY.
   Angolo di piega: + verso l'alto (lato stampato in superficie),
                    − verso il basso (lato appoggiato al piatto).
   ===================================================================== */
(function (root) {
  'use strict';

  const PI = Math.PI;
  const rett = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const cerchio = (cx, cy, r, n) => {
    n = n || 28;
    const p = [];
    for (let i = 0; i < n; i++) p.push([cx + r * Math.cos(2 * PI * i / n), cy + r * Math.sin(2 * PI * i / n)]);
    return p;
  };
  const arco = (cx, cy, r, a0, a1, n) => {
    n = n || 16;
    const p = [];
    for (let i = 0; i <= n; i++) {
      const a = (a0 + (a1 - a0) * i / n) * PI / 180;
      p.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return p;
  };
  // punta di freccia alla fine di una polilinea
  const punta = (pts, l) => {
    const n = pts.length, q = pts[n - 1], p = pts[n - 2];
    const a = Math.atan2(q[1] - p[1], q[0] - p[0]);
    return [[q[0] - l * Math.cos(a - 0.7), q[1] - l * Math.sin(a - 0.7)], q, [q[0] - l * Math.cos(a + 0.7), q[1] - l * Math.sin(a + 0.7)]];
  };

  /* ---------- pittogrammi monolinea su griglia 10×10 ---------- */
  const GLIFI = {
    nessuno: { nome: '— nessuno —', tratti: [] },
    freccia: { nome: 'Freccia →', tratti: [{ pts: [[1, 5], [9, 5]] }, { pts: [[5.4, 8.6], [9, 5], [5.4, 1.4]] }] },
    freccia_su: { nome: 'Freccia ↑', tratti: [{ pts: [[5, 1], [5, 9]] }, { pts: [[1.4, 5.4], [5, 9], [8.6, 5.4]] }] },
    freccia_diag: { nome: 'Freccia ↙', tratti: [{ pts: [[8.5, 8.5], [1.8, 1.8]] }, { pts: [[1.8, 6.6], [1.8, 1.8], [6.6, 1.8]] }] },
    scale: { nome: 'Scale', tratti: [{ pts: [[1, 1.5], [3.5, 1.5], [3.5, 4], [6, 4], [6, 6.5], [8.5, 6.5], [8.5, 9]] }] },
    persona: {
      nome: 'Persona', tratti: [
        { pts: cerchio(5, 8.2, 1.1, 18), chiusa: true },
        { pts: [[5, 6.4], [5, 3.4]] }, { pts: [[2.6, 5.6], [7.4, 5.6]] }, { pts: [[3.3, 0.8], [5, 3.4], [6.7, 0.8]] }
      ]
    },
    info: {
      nome: 'Info', tratti: [
        { pts: cerchio(5, 8.3, 0.9, 14), chiusa: true },
        { pts: [[3.6, 6], [5.2, 6], [5.2, 1.5]] }, { pts: [[3.5, 1.5], [6.8, 1.5]] }
      ]
    },
    uscita: {
      nome: 'Uscita', tratti: [
        { pts: [[5.5, 2.6], [5.5, 1], [1.2, 1], [1.2, 9], [5.5, 9], [5.5, 7.4]] },
        { pts: [[3.4, 5], [9, 5]] }, { pts: [[7, 7], [9, 5], [7, 3]] }
      ]
    },
    laboratorio: {
      nome: 'Laboratorio', tratti: [
        { pts: [[3.6, 9], [6.4, 9]] },
        { pts: [[4.2, 9], [4.2, 6], [1.4, 1.2], [8.6, 1.2], [5.8, 6], [5.8, 9]] },
        { pts: [[2.7, 3.4], [7.3, 3.4]] }
      ]
    },
    riciclo: (() => {
      const a1 = arco(5, 5, 3.6, 35, 165, 14), a2 = arco(5, 5, 3.6, 215, 345, 14);
      return { nome: 'Riciclo', tratti: [{ pts: a1 }, { pts: punta(a1, 1.6) }, { pts: a2 }, { pts: punta(a2, 1.6) }] };
    })(),
    caffe: {
      nome: 'Bar / caffè', tratti: [
        { pts: [[1.6, 6.2], [2.2, 1.4], [6.4, 1.4], [7, 6.2]], chiusa: true },
        { pts: arco(7.1, 4.2, 1.5, -80, 80, 10) },
        { pts: [[3.2, 7.6], [3.2, 9.2]] }, { pts: [[5.4, 7.6], [5.4, 9.2]] }
      ]
    },
    ascensore: {
      nome: 'Ascensore', tratti: [
        { pts: rett(1.2, 0.8, 8.8, 9.2), chiusa: true },
        { pts: [[3, 5.8], [5, 7.8], [7, 5.8]] }, { pts: [[3, 4.2], [5, 2.2], [7, 4.2]] }
      ]
    },
    // raccolta differenziata
    plastica: {
      nome: 'Plastica (bottiglia)', tratti: [
        { pts: [[4, 9.3], [6, 9.3]] },
        { pts: [[4.3, 9.3], [4.3, 7.9], [2.9, 6.5], [2.9, 0.8], [7.1, 0.8], [7.1, 6.5], [5.7, 7.9], [5.7, 9.3]] },
        { pts: [[2.9, 4.2], [7.1, 4.2]] }
      ]
    },
    carta: {
      nome: 'Carta (foglio)', tratti: [
        { pts: [[2.2, 0.8], [2.2, 9.2], [6, 9.2], [7.8, 7.4], [7.8, 0.8]], chiusa: true },
        { pts: [[6, 9.2], [6, 7.4], [7.8, 7.4]] },
        { pts: [[3.7, 5.4], [6.3, 5.4]] }, { pts: [[3.7, 3.2], [6.3, 3.2]] }
      ]
    },
    vetro: {
      nome: 'Vetro (barattolo)', tratti: [
        { pts: rett(2.8, 8, 7.2, 9.3), chiusa: true },
        { pts: [[3.4, 8], [2.4, 6.6], [2.4, 0.8], [7.6, 0.8], [7.6, 6.6], [6.6, 8]] },
        { pts: [[4, 2.4], [4, 5.2]] }
      ]
    },
    organico: (() => {
      const sx = arco(3.9, 4.3, 2.9, 80, 280, 14), dx = arco(6.1, 4.3, 2.9, -100, 100, 14);
      return {
        nome: 'Organico (mela)', tratti: [
          { pts: sx.concat(dx), chiusa: true },
          { pts: [[5, 7.2], [5.5, 9.3]] }, { pts: [[5.4, 8.3], [6.5, 9.2], [7.6, 8.8]] }
        ]
      };
    })(),
    secco: {
      nome: 'Secco (cestino)', tratti: [
        { pts: [[1.6, 7.9], [8.4, 7.9]] }, { pts: [[4, 7.9], [4, 9.2], [6, 9.2], [6, 7.9]] },
        { pts: [[2.5, 7.9], [3.2, 0.8], [6.8, 0.8], [7.5, 7.9]] },
        { pts: [[4.3, 6.4], [4.5, 2.3]] }, { pts: [[5.7, 6.4], [5.5, 2.3]] }
      ]
    },
    wc: {
      nome: 'WC', tratti: [
        { pts: [[0.6, 7.6], [1.8, 2.4], [3.1, 6], [4.4, 2.4], [5.6, 7.6]] },
        { pts: arco(8.1, 5, 2.6, 50, 310, 16) }
      ]
    }
  };

  // pittogramma -> tratti in mm (centro, lato, rotazione in gradi)
  function glifo(id, cx, cy, lato, rot, specchiaY) {
    const g = GLIFI[id] || GLIFI.nessuno;
    const a = (rot || 0) * PI / 180, c = Math.cos(a), s = Math.sin(a), k = lato / 10;
    return g.tratti.map(t => ({
      chiusa: !!t.chiusa,
      pts: t.pts.map(p => {
        const x = (p[0] - 5) * k, y = (specchiaY ? 5 - p[1] : p[1] - 5) * k;
        return [cx + x * c - y * s, cy + x * s + y * c];
      })
    }));
  }

  const opzGlifi = Object.keys(GLIFI).map(k => [k, GLIFI[k].nome]);
  const glifoRetro = (id, cx, cy, lato) => /^freccia/.test(id) ? glifo(id, cx, cy, lato, 0, true) : glifo(id, cx, cy, lato, 180);

  // fascia cerniera sul lato mobile (dove la plastica si curva)
  function zonaCurva(a, b, latoNormale, lunghezza, extra) {
    // a,b: linea di piega; latoNormale: +1/-1 rispetto alla normale (-dy,dx)
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy);
    const nx = -dy / l * latoNormale, ny = dx / l * latoNormale;
    const c = lunghezza / 2;
    return { a: [a[0] + nx * c, a[1] + ny * c], b: [b[0] + nx * c, b[1] + ny * c], larghezza: lunghezza + (extra || 3) };
  }
  const lungCurva = (r, t, gradi) => (r + t / 2) * Math.abs(gradi) * PI / 180;
  // misure condivise tra cestino e fondo (devono combaciare)
  const FONDO = { hf: 15, rf: 2, gioco: 0.6, hw: 10 };
  const quotaAsolaFondo = (t) => t + FONDO.rf + FONDO.hf + (0.5 + t / 2);
  function rettTondo(cx, cy, mezzaL, mezzaH, r, n) {
    r = Math.max(0.01, Math.min(r, mezzaL, mezzaH)); n = n || 10;
    const pts = [];
    const angoli = [[mezzaL - r, mezzaH - r, 0], [-mezzaL + r, mezzaH - r, 90], [-mezzaL + r, -mezzaH + r, 180], [mezzaL - r, -mezzaH + r, 270]];
    for (const [ax, ay, a0] of angoli) for (let i = 0; i <= n; i++) {
      const a = (a0 + 90 * i / n) * PI / 180;
      pts.push([cx + ax + r * Math.cos(a), cy + ay + r * Math.sin(a)]);
    }
    return pts;
  }

  /* ---------- FORME ---------- */
  const FORME = {
    piastra: {
      nome: 'Piastra con una piega',
      parametri: [
        { k: 'L', nome: 'Lunghezza', min: 30, max: 250, passo: 1, def: 120 },
        { k: 'H', nome: 'Larghezza', min: 20, max: 200, passo: 1, def: 70 },
        { k: 'pos', nome: 'Posizione piega', min: 5, max: 245, passo: 1, def: 40 },
        { k: 'ang', nome: 'Angolo', min: -180, max: 180, passo: 5, def: 90 },
        { k: 'r', nome: 'Raggio curva', min: 0, max: 80, passo: 0.5, def: 15 },
        { k: 'glifo', nome: 'Pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'nessuno' }
      ],
      costruisci(p, t) {
        const x = -p.L / 2 + Math.min(p.pos, p.L - 5);
        const piega = { a: [x, -p.H / 2 - 1], b: [x, p.H / 2 + 1], angolo: p.ang, raggio: p.r, fase: 1 };
        return {
          area: [rett(-p.L / 2, -p.H / 2, p.L / 2, p.H / 2)],
          pieghe: [piega],
          cerniere: [zonaCurva(piega.a, piega.b, 1, lungCurva(p.r, t, p.ang), 4)],
          rilievi: p.glifo !== 'nessuno' ? glifo(p.glifo, (x + p.L / 2) / 2, 0, Math.min(p.H, p.L / 2 - p.pos / 2) - 16) : [],
          base: [(x + p.L / 2) / 2, 0]
        };
      }
    },

    cestino: {
      nome: 'Cestino per la spazzatura',
      parametri: [
        { k: 'S', nome: 'Lato interno', min: 60, max: 200, passo: 1, def: 120 },
        { k: 'H', nome: 'Altezza', min: 60, max: 210, passo: 1, def: 200 },
        { k: 'R', nome: 'Raggio angoli', min: 5, max: 60, passo: 1, def: 20 },
        { k: 'pezzi', nome: 'Stampato in', tipo: 'sel', opzioni: [['2', '2 metà uguali'], ['1', '1 pezzo unico']], def: '2' },
        { k: 'glifo', nome: 'Pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'plastica' }
      ],
      costruisci(p, t) {
        const { S, H } = p;
        const R = Math.min(p.R, S / 2 - 1);
        const lato = S - 2 * R;                     // tratto dritto di ogni lato
        const Lc = lungCurva(R, t, 90);              // lunghezza di ogni angolo curvo
        const due = String(p.pezzi) !== '1';
        const nAngoli = due ? 2 : 4;
        const linguetta = 14;                        // sormonto della giunta
        // sequenza: mezzo lato, (angolo, lato)…, angolo, mezzo lato
        const tratti = [{ tipo: 'lato', l: lato / 2 }];
        for (let i = 0; i < nAngoli; i++) {
          tratti.push({ tipo: 'angolo', l: Lc });
          tratti.push({ tipo: 'lato', l: i === nAngoli - 1 ? lato / 2 : lato });
        }
        const Lparete = tratti.reduce((a, b) => a + b.l, 0);
        const W = linguetta + Lparete;
        // la base (ferma) è il lato pieno centrale
        const iBase = due ? 2 : 4;
        let x = linguetta;
        const pos = tratti.map(tr => { const x0 = x; x += tr.l; return [x0, x]; });
        const pieghe = [];
        tratti.forEach((tr, i) => {
          if (tr.tipo !== 'angolo') return;
          const [x0, x1] = pos[i];
          const xf = i < iBase ? x1 : x0;            // la linea di piega sta dal lato della base
          pieghe.push({ nome: 'angolo ' + (pieghe.length + 1), a: [xf, -1], b: [xf, H + 1], angolo: -90, raggio: R, fase: 1 });
        });
        // ganci sulla linguetta e asole all'altra estremità (giunto C)
        const Rh = 0.5 + t / 2, hw = 10, hl = t + 5;
        const quote = [H * 0.18, H * 0.5, H * 0.82];
        const area = [rett(0, 0, W, H)], pieni = [], fori = [];
        const xs = Lparete - Rh;                     // dove il gancio dell'altra metà attraversa la parete
        quote.forEach((yc) => {
          const g = rett(-hl, yc - hw / 2, 0.5, yc + hw / 2);
          area.push(g); pieni.push(g);
          pieghe.push({ nome: 'gancio', a: [0, yc - hw / 2 - 1], b: [0, yc + hw / 2 + 1], angolo: -90, raggio: 0.5, fase: 2 });
          fori.push(rett(xs - (t + 1.2) / 2, yc - (hw + 1) / 2, xs + (t + 1.2) / 2, yc + (hw + 1) / 2));
        });
        const [b0, b1] = pos[iBase];
        const xb = (b0 + b1) / 2;
        // asole per i ganci del fondo, al centro di ogni lato pieno
        const ya = quotaAsolaFondo(t);
        tratti.forEach((tr, i) => {
          if (tr.tipo !== 'lato' || tr.l < lato - 0.01) return;
          const xc = (pos[i][0] + pos[i][1]) / 2;
          fori.push(rett(xc - (FONDO.hw + 1) / 2, ya - (t + 1.2) / 2, xc + (FONDO.hw + 1) / 2, ya + (t + 1.2) / 2));
        });
        return {
          area, pieghe, pieni, fori, cerniere: [],
          rilievi: glifo(p.glifo, xb, H * 0.58, Math.min(lato, H) - 14),
          base: [xb, H / 2],
          // seconda metà = la stessa stampa ruotata di 180° attorno all'asse del cestino
          copia: due ? { x: 2 * xb, z: -S } : null,
          vistaRuota: [90, 0, 0]
        };
      }
    },

    fondo: {
      nome: 'Fondo del cestino',
      parametri: [
        { k: 'S', nome: 'Lato interno cestino', min: 60, max: 200, passo: 1, def: 120 },
        { k: 'R', nome: 'Raggio angoli cestino', min: 5, max: 60, passo: 1, def: 20 }
      ],
      costruisci(p, t) {
        const { S } = p;
        const R = Math.min(p.R, S / 2 - 1);
        const { hf, rf, gioco, hw } = FONDO;
        const d = S / 2 - gioco - rf - t;             // distanza delle linee di piega dal centro
        const rc = Math.max(1, R - (S / 2 - d));       // raggio degli angoli del piatto
        const Lc = lungCurva(rf, t, 90);
        const L = Lc + hf;                             // lunghezza alette
        const m = d - rc;                              // metà del tratto dritto
        const area = [rettTondo(0, 0, d, d, rc, 12)];
        const pieghe = [], pieni = [];
        const lati = [[1, 0], [0, 1], [-1, 0], [0, -1]];
        lati.forEach(([ux, uy], i) => {
          const vx = -uy, vy = ux;                     // direzione lungo il lato
          const P = (s, u) => [ux * u + vx * s, uy * u + vy * s];
          area.push([P(-m, d - 0.5), P(m, d - 0.5), P(m, d + L), P(-m, d + L)]);
          pieghe.push({ nome: 'aletta ' + (i + 1), a: P(-m - 1, d), b: P(m + 1, d), angolo: 90, raggio: rf, fase: 1 });
          if (ux !== 0) {                              // ganci sui due lati che vanno contro i lati pieni del cestino
            const g = [P(-hw / 2, d + L - 0.5), P(hw / 2, d + L - 0.5), P(hw / 2, d + L + t + 5), P(-hw / 2, d + L + t + 5)];
            area.push(g); pieni.push(g);
            pieghe.push({ nome: 'gancio', a: P(-hw / 2 - 1, d + L), b: P(hw / 2 + 1, d + L), angolo: -90, raggio: 0.5, fase: 2 });
          }
        });
        return { area, pieghe, pieni, fori: [], cerniere: [], rilievi: [], base: [0, 0] };
      }
    },

    scatola: {
      nome: 'Scatola (pianta a croce)',
      parametri: [
        { k: 'A', nome: 'Lato A', min: 60, max: 200, passo: 1, def: 130 },
        { k: 'B', nome: 'Lato B', min: 40, max: 160, passo: 1, def: 90 },
        { k: 'H', nome: 'Altezza pareti', min: 15, max: 80, passo: 1, def: 42 },
        { k: 'r', nome: 'Raggio curva', min: 0.5, max: 20, passo: 0.5, def: 8 },
        { k: 'alette', nome: 'Alette con gancio', tipo: 'bool', def: 1 }
      ],
      costruisci(p, t) {
        const { A, B, H, r } = p;
        const area = [
          rett(-A / 2, -B / 2 - H, A / 2, B / 2 + H),
          rett(-A / 2 - H, -B / 2, A / 2 + H, B / 2)
        ];
        const pieghe = [
          { nome: 'parete sud', a: [-A / 2, -B / 2], b: [A / 2, -B / 2], angolo: 90, raggio: r, fase: 1 },
          { nome: 'parete nord', a: [-A / 2, B / 2], b: [A / 2, B / 2], angolo: 90, raggio: r, fase: 1 },
          { nome: 'parete ovest', a: [-A / 2, -B / 2], b: [-A / 2, B / 2], angolo: 90, raggio: r, fase: 1 },
          { nome: 'parete est', a: [A / 2, -B / 2], b: [A / 2, B / 2], angolo: 90, raggio: r, fase: 1 }
        ];
        const Lc = lungCurva(r, t, 90);
        const cerniere = [
          zonaCurva([-A / 2, -B / 2], [A / 2, -B / 2], -1, Lc),
          zonaCurva([-A / 2, B / 2], [A / 2, B / 2], 1, Lc),
          zonaCurva([-A / 2, -B / 2], [-A / 2, B / 2], 1, Lc),
          zonaCurva([A / 2, -B / 2], [A / 2, B / 2], -1, Lc)
        ];
        const pieni = [], fori = [];
        if (p.alette) {
          const ra = 0.5;                     // raggio piega aletta/gancio
          const R = r + t / 2, Ra = ra + t / 2;
          const off = r + t;                  // l'aletta gira attorno allo spessore della parete
          const c = Lc + 1.5;                 // lascia libera la zona curva della parete
          const tl = 14, m = 3, hw = 8, hl = t + 5;
          const xg = -A / 2 - (c + H) / 2;    // centro del gancio (parete ovest)
          const hg = -A / 2 - xg;             // stessa quota sulla parete nord/sud
          const xs = -A / 2 - R + Ra * (1 - PI / 2) + tl + Ra; // posizione asola sulla parete nord
          for (const sx of [1, -1]) for (const sy of [1, -1]) {
            const X = (x) => sx * x, Y = (y) => sy * y;
            const box = (x0, y0, x1, y1) => rett(Math.min(X(x0), X(x1)), Math.min(Y(y0), Y(y1)), Math.max(X(x0), X(x1)), Math.max(Y(y0), Y(y1)));
            // prolunga della parete laterale + aletta + gancio
            area.push(box(-A / 2 - H, B / 2 - 1, -A / 2 - c, B / 2 + off));
            const aletta = box(-A / 2 - H + m, B / 2 + off - 0.5, -A / 2 - c - m, B / 2 + off + tl);
            const gancio = box(xg - hw / 2, B / 2 + off + tl - 0.5, xg + hw / 2, B / 2 + off + tl + hl);
            area.push(aletta, gancio); pieni.push(aletta, gancio);
            pieghe.push({ nome: 'aletta', a: [X(-A / 2 - H - 1), Y(B / 2 + off)], b: [X(-A / 2 - c + 0.5), Y(B / 2 + off)], angolo: 90, raggio: ra, fase: 2 });
            pieghe.push({ nome: 'gancio', a: [X(xg - hw / 2 - 1), Y(B / 2 + off + tl)], b: [X(xg + hw / 2 + 1), Y(B / 2 + off + tl)], angolo: 90, raggio: ra, fase: 3 });
            // asola nella parete nord/sud
            fori.push(box(xs - (t + 1.2) / 2, B / 2 + hg - (hw + 1) / 2, xs + (t + 1.2) / 2, B / 2 + hg + (hw + 1) / 2));
          }
        }
        return { area, pieghe, cerniere, pieni, fori, base: [0, 0] };
      }
    },

    vassoio: {
      nome: 'Modulo a vassoio con arpioni',
      parametri: [
        { k: 'A', nome: 'Larghezza', min: 30, max: 200, passo: 1, def: 60 },
        { k: 'B', nome: 'Altezza', min: 30, max: 200, passo: 1, def: 60 },
        { k: 'd', nome: 'Profondità', min: 6, max: 40, passo: 1, def: 14 },
        { k: 'T', nome: 'Spessore lastra PP', min: 3, max: 20, passo: 0.5, def: 6 },
        { k: 'r', nome: 'Raggio curva', min: 0.5, max: 10, passo: 0.5, def: 4 },
        { k: 'arpioni', nome: 'Arpioni', tipo: 'bool', def: 1 },
        { k: 'glifo', nome: 'Pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'freccia' }
      ],
      costruisci(p, t) {
        const { A, B, d, T, r } = p;
        const area = [rett(-A / 2, -B / 2 - d, A / 2, B / 2 + d), rett(-A / 2 - d, -B / 2, A / 2 + d, B / 2)];
        const pieghe = [
          { nome: 'bordo alto', a: [-A / 2, B / 2], b: [A / 2, B / 2], angolo: -90, raggio: r, fase: 1 },
          { nome: 'bordo basso', a: [-A / 2, -B / 2], b: [A / 2, -B / 2], angolo: -90, raggio: r, fase: 1 },
          { nome: 'bordo sinistro', a: [-A / 2, -B / 2], b: [-A / 2, B / 2], angolo: -90, raggio: r, fase: 1 },
          { nome: 'bordo destro', a: [A / 2, -B / 2], b: [A / 2, B / 2], angolo: -90, raggio: r, fase: 1 }
        ];
        const Lc = lungCurva(r, t, 90);
        const cerniere = [
          zonaCurva([-A / 2, B / 2], [A / 2, B / 2], 1, Lc), zonaCurva([-A / 2, -B / 2], [A / 2, -B / 2], -1, Lc),
          zonaCurva([-A / 2, -B / 2], [-A / 2, B / 2], 1, Lc), zonaCurva([A / 2, -B / 2], [A / 2, B / 2], -1, Lc)
        ];
        const pieni = [], fori = [];
        const R = r + t / 2;
        const zp = t / 2 - R - (d - R * PI / 2); // faccia superiore della lastra
        const asole = [];
        if (p.arpioni) {
          const wn = 10, wb = 13.5, wt = 6, la = 8;
          for (const sy of [1, -1]) {
            const y0 = B / 2 + d - 1, y1 = B / 2 + d + T + 0.6;
            const poly = [[-wn / 2, y0], [wn / 2, y0], [wn / 2, y1], [wb / 2, y1 + 0.8], [wt / 2, y1 + la], [-wt / 2, y1 + la], [-wb / 2, y1 + 0.8], [-wn / 2, y1]]
              .map(q => [q[0], sy * q[1]]);
            area.push(poly); pieni.push(poly);
            fori.push(rett(-0.8, Math.min(sy * (y1 - 3), sy * (y1 + la + 1)), 0.8, Math.max(sy * (y1 - 3), sy * (y1 + la + 1))));
            const yc = sy * (B / 2 + R);
            asole.push(rett(-wn / 2 - 0.3, yc - (t + 0.6) / 2, wn / 2 + 0.3, yc + (t + 0.6) / 2));
          }
        }
        return {
          area, pieghe, cerniere, pieni, fori,
          rilievi: glifo(p.glifo, 0, 0, Math.min(A, B) - 18),
          base: [0, 0],
          riferimento: { tipo: 'lastra', poligono: rett(-A / 2 - 45, -B / 2 - 35, A / 2 + 45, B / 2 + 35), fori: asole, z0: zp - T, z1: zp }
        };
      }
    },

    clip: {
      nome: 'Tessera a clip sul bordo (U)',
      parametri: [
        { k: 'A', nome: 'Larghezza', min: 30, max: 160, passo: 1, def: 60 },
        { k: 'B', nome: 'Altezza', min: 30, max: 160, passo: 1, def: 60 },
        { k: 'T', nome: 'Spessore lastra PP', min: 3, max: 20, passo: 0.5, def: 6 },
        { k: 'ritorno', nome: 'Aletta sul retro', min: 10, max: 80, passo: 1, def: 30 },
        { k: 'glifo', nome: 'Pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'freccia' }
      ],
      costruisci(p, t) {
        const { A, B, T } = p;
        const r = T / 2, arcoL = lungCurva(r, t, 180);
        const piega = { nome: 'clip a U', a: [A / 2, -B / 2 - 1], b: [A / 2, B / 2 + 1], angolo: -180, raggio: r, fase: 1 };
        return {
          area: [rett(-A / 2, -B / 2, A / 2 + arcoL + p.ritorno, B / 2)],
          pieghe: [piega],
          cerniere: [zonaCurva(piega.a, piega.b, -1, arcoL, 4)],
          pieni: [rett(A / 2 + arcoL + p.ritorno - 6, -B / 2, A / 2 + arcoL + p.ritorno, B / 2)],
          rilievi: glifo(p.glifo, 0, 0, Math.min(A, B) - 16),
          base: [0, 0],
          riferimento: { tipo: 'lastra', poligono: rett(A / 2 - 150, -B / 2 - 45, A / 2, B / 2 + 45), fori: [], z0: -T, z1: 0 }
        };
      }
    },

    bandiera: {
      nome: 'Segnale a bandiera (prisma)',
      parametri: [
        { k: 'f', nome: 'Larghezza faccia', min: 30, max: 90, passo: 1, def: 60 },
        { k: 'L', nome: 'Lunghezza', min: 60, max: 220, passo: 1, def: 170 },
        { k: 'r', nome: 'Raggio spigoli', min: 0.5, max: 20, passo: 0.5, def: 7 },
        { k: 'g1', nome: 'Pittogramma lato 1', tipo: 'sel', opzioni: opzGlifi, def: 'freccia' },
        { k: 'g2', nome: 'Pittogramma lato 2', tipo: 'sel', opzioni: opzGlifi, def: 'scale' }
      ],
      costruisci(p, t) {
        const { f, L } = p, r = p.r, ang = -120;
        const Lc = lungCurva(r, t, ang);
        const area = [rett(-1.5 * f, -L / 2, 1.5 * f, L / 2), rett(1.5 * f - 1, -L / 2 + 12, 1.5 * f + 13, L / 2 - 12)];
        const pieghe = [
          { nome: 'spigolo 1', a: [-f / 2, -L / 2 - 1], b: [-f / 2, L / 2 + 1], angolo: ang, raggio: r, fase: 1 },
          { nome: 'spigolo 2', a: [f / 2, -L / 2 - 1], b: [f / 2, L / 2 + 1], angolo: ang, raggio: r, fase: 1 },
          { nome: 'linguetta', a: [1.5 * f, -L / 2 + 11], b: [1.5 * f, L / 2 - 11], angolo: ang, raggio: 0.5, fase: 2 }
        ];
        const fori = [cerchio(0, L / 2 - 12, 2.2), cerchio(0, -L / 2 + 12, 2.2),
          cerchio(1.5 * f + 7, L / 4, 1.8), cerchio(1.5 * f + 7, -L / 4, 1.8),
          cerchio(-1.5 * f + 7, L / 4, 1.8), cerchio(-1.5 * f + 7, -L / 4, 1.8)];
        const pieni = [cerchio(0, L / 2 - 12, 5), cerchio(0, -L / 2 + 12, 5), rett(1.5 * f, -L / 2 + 12, 1.5 * f + 13, L / 2 - 12),
          cerchio(-1.5 * f + 7, L / 4, 4), cerchio(-1.5 * f + 7, -L / 4, 4)];
        const lato = Math.min(f - 18, L - 30);
        return {
          area, pieghe, fori, pieni,
          cerniere: [zonaCurva(pieghe[0].a, pieghe[0].b, -1, Lc, 4), zonaCurva(pieghe[1].a, pieghe[1].b, 1, Lc, 4)],
          rilievi: glifo(p.g1, -f, 0, lato, -90).concat(glifo(p.g2, f, 0, lato, 90)),
          base: [0, 0],
          vistaRuota: [0, 180, 0]
        };
      }
    },

    fascia: {
      nome: 'Fascia curva per colonna',
      parametri: [
        { k: 'L', nome: 'Lunghezza', min: 120, max: 400, passo: 1, def: 240 },
        { k: 'H', nome: 'Altezza', min: 40, max: 160, passo: 1, def: 90 },
        { k: 'Rc', nome: 'Raggio colonna', min: 20, max: 150, passo: 1, def: 45 },
        { k: 'g1', nome: 'Pittogramma 1', tipo: 'sel', opzioni: opzGlifi, def: 'info' },
        { k: 'g2', nome: 'Pittogramma 2', tipo: 'sel', opzioni: opzGlifi, def: 'freccia' },
        { k: 'g3', nome: 'Pittogramma 3', tipo: 'sel', opzioni: opzGlifi, def: 'laboratorio' }
      ],
      costruisci(p, t) {
        const { L, H, Rc } = p;
        const x0 = -L / 2 + 12;
        const R = Rc + t / 2;
        const ang = -Math.min(355, (L - 12 - 4) / R * 180 / PI);
        const lato = H - 26, passo = Math.min(lato + 30, (L - 40) / 3);
        const R2 = R; // posizioni dei pittogrammi lungo la fascia
        const cx = (i) => x0 + 10 + lato / 2 + i * passo;
        return {
          area: [rett(-L / 2, -H / 2, L / 2, H / 2)],
          pieghe: [{ nome: 'curvatura', a: [x0, -H / 2 - 1], b: [x0, H / 2 + 1], angolo: ang, raggio: Rc, fase: 1 }],
          cerniere: [],
          rilievi: glifo(p.g1, cx(0), 0, lato).concat(glifo(p.g2, cx(1), 0, lato)).concat(glifo(p.g3, cx(2), 0, lato)),
          base: [-L / 2 + 5, 0],
          riferimento: { tipo: 'colonna', cx: x0, cz: t / 2 - R2, r: Rc - 0.3, y0: -H / 2 - 60, y1: H / 2 + 60 },
          vistaRuota: [90, 0, 0]
        };
      }
    },

    targhetta: {
      nome: 'Targhetta a bandiera da porta',
      parametri: [
        { k: 'L', nome: 'Lunghezza', min: 60, max: 240, passo: 1, def: 150 },
        { k: 'H', nome: 'Altezza', min: 30, max: 120, passo: 1, def: 55 },
        { k: 'fl', nome: 'Flangia a muro', min: 18, max: 70, passo: 1, def: 40 },
        { k: 'r', nome: 'Raggio curva', min: 0.5, max: 25, passo: 0.5, def: 10 },
        { k: 'glifo', nome: 'Pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'laboratorio' },
        { k: 'glifo2', nome: 'Secondo pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'freccia' }
      ],
      costruisci(p, t) {
        const { L, H, fl, r } = p;
        const piega = { nome: 'flangia', a: [-L / 2, -H / 2 - 1], b: [-L / 2, H / 2 + 1], angolo: -90, raggio: r, fase: 1 };
        const Lc = lungCurva(r, t, 90);
        const xh = -L / 2 - Math.max(Lc + 7, fl * 0.55);
        const R = r + t / 2;
        const xw = -L / 2 - R - t / 2;
        return {
          area: [rett(-L / 2 - fl, -H / 2, L / 2, H / 2)],
          pieghe: [piega],
          cerniere: [zonaCurva(piega.a, piega.b, -1, Lc, 4)],
          fori: [cerchio(xh, H / 4, 2.25), cerchio(xh, -H / 4, 2.25)],
          pieni: [cerchio(xh, H / 4, 5.5), cerchio(xh, -H / 4, 5.5)],
          rilievi: glifo(p.glifo, -L / 2 + H / 2 + 2, 0, H - 16).concat(glifo(p.glifo2, L / 2 - H / 2 - 2, 0, H - 16)),
          base: [0, 0],
          riferimento: { tipo: 'lastra', poligono: rett(xw - 12, -H / 2 - 70, xw, H / 2 + 70), fori: [], z0: -fl - 60, z1: 40, colore: '#d9d6cf' },
          vistaRuota: [90, 0, 0]
        };
      }
    },

    onda: {
      nome: 'Pannello a onda (curve a S)',
      parametri: [
        { k: 'L', nome: 'Lunghezza', min: 120, max: 240, passo: 1, def: 230 },
        { k: 'H', nome: 'Altezza', min: 40, max: 200, passo: 1, def: 80 },
        { k: 'R', nome: 'Raggio curve', min: 8, max: 80, passo: 1, def: 26 },
        { k: 'ang', nome: 'Angolo curve', min: 20, max: 150, passo: 5, def: 90 },
        { k: 'g1', nome: 'Pittogramma 1', tipo: 'sel', opzioni: opzGlifi, def: 'scale' },
        { k: 'g2', nome: 'Pittogramma 2', tipo: 'sel', opzioni: opzGlifi, def: 'freccia_su' }
      ],
      costruisci(p, t) {
        const { L, H, R, ang } = p;
        const Lc = lungCurva(R, t, ang);
        const piatto = Math.max(20, (L - 2 * Lc) / 3);
        const x1 = -L / 2 + piatto, x2 = x1 + Lc + piatto;
        const lato = Math.min(H - 20, piatto - 10);
        return {
          area: [rett(-L / 2, -H / 2, L / 2, H / 2)],
          pieghe: [
            { nome: 'curva 1', a: [x1, -H / 2 - 1], b: [x1, H / 2 + 1], angolo: -ang, raggio: R, fase: 1 },
            { nome: 'curva 2', a: [x2, -H / 2 - 1], b: [x2, H / 2 + 1], angolo: ang, raggio: R, fase: 1 }
          ],
          cerniere: [],
          rilievi: glifo(p.g1, (-L / 2 + x1) / 2, 0, lato).concat(glifo(p.g2, x1 + Lc + piatto / 2, 0, lato, -ang)),
          base: [-L / 2 + 5, 0],
          vistaRuota: [90, 0, 0]
        };
      }
    },

    molletta: {
      nome: 'Molletta (striscia ripiegata a U)',
      parametri: [
        { k: 'uso', nome: 'Uso', tipo: 'sel', opzioni: [['porta', 'Appendiporta (sull’anta)'], ['tubo', 'Appesa a un tubo o cavo']], def: 'porta' },
        { k: 'W', nome: 'Larghezza', min: 30, max: 200, passo: 1, def: 70 },
        { k: 'A', nome: 'Gamba davanti', min: 30, max: 200, passo: 1, def: 110 },
        { k: 'B', nome: 'Gamba dietro', min: 20, max: 200, passo: 1, def: 70 },
        { k: 'sp', nome: 'Spessore anta / Ø tubo', min: 4, max: 60, passo: 1, def: 40 },
        { k: 'g1', nome: 'Pittogramma davanti', tipo: 'sel', opzioni: opzGlifi, def: 'laboratorio' },
        { k: 'g2', nome: 'Pittogramma dietro', tipo: 'sel', opzioni: opzGlifi, def: 'laboratorio' }
      ],
      costruisci(p, t) {
        const { W, A, B } = p;
        const r = p.sp / 2;                          // raggio interno = metà spessore dell'anta / raggio del tubo
        const Lc = lungCurva(r, t, 180);
        const yf = A;                                // linea di piega in cima alla gamba davanti
        const yB = yf + Lc;                          // inizio della gamba dietro
        const lato = Math.min(W - 16, A - 20);
        const latoB = Math.min(W - 16, B - 14);
        const porta = p.uso !== 'tubo';
        return {
          area: [rett(-W / 2, 0, W / 2, yB + B)],
          pieghe: [{ nome: 'curva a U', a: [-W / 2 - 1, yf], b: [W / 2 + 1, yf], angolo: -180, raggio: r, fase: 1 }],
          cerniere: [],
          rilievi: glifo(p.g1, 0, A / 2, lato).concat(latoB > 12 ? glifoRetro(p.g2, 0, yB + B / 2, latoB) : []),
          base: [0, A / 2],
          riferimento: porta
            ? { tipo: 'lastra', poligono: rett(-W / 2 - 90, yf - 260, W / 2 + 90, yf), fori: [], z0: -2 * r, z1: 0, colore: '#c9a77c' }
            : { tipo: 'tubo', y: yf, z: t / 2 - (r + t / 2), r: Math.max(1, r - 0.3), x0: -W / 2 - 120, x1: W / 2 + 120 },
          vistaRuota: [90, 0, 0]
        };
      }
    },

    tessera: {
      nome: 'Tessera pittogramma (piatta)',
      parametri: [
        { k: 'A', nome: 'Lato', min: 30, max: 200, passo: 1, def: 60 },
        { k: 'glifo', nome: 'Pittogramma', tipo: 'sel', opzioni: opzGlifi, def: 'scale' }
      ],
      costruisci(p) {
        return {
          area: [rett(-p.A / 2, -p.A / 2, p.A / 2, p.A / 2)],
          pieghe: [], cerniere: [],
          rilievi: glifo(p.glifo, 0, 0, p.A - 16),
          base: [0, 0]
        };
      }
    }
  };

  function parametriDefault(idForma) {
    const o = {};
    for (const q of FORME[idForma].parametri) o[q.k] = q.def;
    return o;
  }

  /* ---------- ESEMPI per la presentazione del corso ---------- */
  const ESEMPI = [
    {
      id: 'cestino', forma: 'cestino', titolo: 'Il cestino', lezione: 'Lezione 5 — Stampa a solo riempimento e piegatura',
      testo: 'Un cestino per la differenziata fatto con due rettangoli uguali, stampati solo come trama. In acqua calda ogni metà si curva attorno a un tubo (raggio 20 mm) e prende due angoli morbidi; le due metà si chiudono con tre ganci che entrano nelle asole. Il fondo è un terzo pezzo con quattro alette che si aggancia alle asole in basso.',
      aggancio: 'C — tre ganci ripiegati nelle asole',
      trama: { tipo: 'rombi', passo: 8, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'fondo', forma: 'fondo', titolo: 'Il fondo del cestino', lezione: 'Lezione 5 — Stampa a solo riempimento e piegatura',
      testo: 'Un quadrato con gli angoli arrotondati e quattro alette che si alzano con una curva morbida. Si infila nel cestino dal basso: due ganci si piegano verso l’esterno ed entrano nelle asole dei lati pieni.',
      aggancio: 'C — due ganci ripiegati nelle asole del cestino',
      trama: { tipo: 'rombi', passo: 8, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'scatola', forma: 'scatola', titolo: 'La scatola', lezione: 'Lezione 5 — Stampa a solo riempimento e piegatura',
      testo: 'Un rettangolo stampato solo come trama (nido d’ape, 8 layer) diventa una scatola portaoggetti dagli spigoli morbidi: le pareti si curvano in acqua calda attorno a un tubo, le alette girano attorno agli angoli e il gancio entra nell’asola. Nessuna colla, nessuna vite.',
      aggancio: 'C — gancio ripiegato nell’asola',
      trama: { tipo: 'nido', passo: 8, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'bianco', coloreRilievo: 'nero'
    },
    {
      id: 'vassoio', forma: 'vassoio', titolo: 'Il modulo 1u a vassoio', lezione: 'Lezione 4–5 — Moduli del sistema',
      testo: 'La tessera base del sistema (60 × 60 mm). I quattro bordi piegati all’indietro danno spessore al modulo; due arpioni a molla entrano nelle asole fresate nella lastra di plastica riciclata e la agganciano da dietro.',
      aggancio: 'A — linguetta ad arpione nell’asola fresata',
      trama: { tipo: 'rombi', passo: 7, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'clip', forma: 'clip', titolo: 'La tessera a clip', lezione: 'Lezione 7–8 — Montaggio sulle lastre',
      testo: 'La tessera si piega a U di 180° direttamente sul bordo della lastra (la lastra stessa fa da dima). Raggio interno = metà dello spessore della lastra: si stringe da sola e si sfila quando serve.',
      aggancio: 'B — clip a U termoformata sul bordo',
      trama: { tipo: 'griglia', passo: 6, larghezza: 1.2, angolo: 45, bordo: 2.4 }, strati: 8, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'diff-plastica', forma: 'clip', par: { glifo: 'plastica' }, titolo: 'Differenziata · Plastica', lezione: 'Progetto — L’isola della differenziata',
      testo: 'Cinque tessere a clip, una per contenitore: stessa forma, solo tre trame (rombi, pallini, griglia quadrata). Colore = materiale, segno = oggetto. Si agganciano al bordo della lastra sopra ogni bidone.',
      aggancio: 'B — clip a U · pittogramma a innesto',
      trama: { tipo: 'rombi', passo: 7, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'diff-carta', forma: 'clip', par: { glifo: 'carta' }, titolo: 'Differenziata · Carta', lezione: 'Progetto — L’isola della differenziata',
      testo: 'Pallini: anelli che si toccano, una trama leggera e flessibile. Il foglio con l’angolo piegato si disegna con tre linee.',
      aggancio: 'B — clip a U · pittogramma a innesto',
      trama: { tipo: 'pallini', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'blu', coloreRilievo: 'bianco'
    },
    {
      id: 'diff-vetro', forma: 'clip', par: { glifo: 'vetro' }, titolo: 'Differenziata · Vetro', lezione: 'Progetto — L’isola della differenziata',
      testo: 'Griglia quadrata, come una piastrella. Il barattolo è fatto solo di rettangoli: si disegna sulla griglia 10 × 10 senza curve.',
      aggancio: 'B — clip a U · pittogramma a innesto',
      trama: { tipo: 'griglia', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'verde', coloreRilievo: 'bianco'
    },
    {
      id: 'diff-organico', forma: 'clip', par: { glifo: 'organico' }, titolo: 'Differenziata · Organico', lezione: 'Progetto — L’isola della differenziata',
      testo: 'Rombi come la plastica, colore marrone. La mela è l’unico segno con le curve: due archi e un picciolo.',
      aggancio: 'B — clip a U · pittogramma a innesto',
      trama: { tipo: 'rombi', passo: 7, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'marrone', coloreRilievo: 'bianco'
    },
    {
      id: 'diff-secco', forma: 'clip', par: { glifo: 'secco' }, titolo: 'Differenziata · Secco', lezione: 'Progetto — L’isola della differenziata',
      testo: 'Pallini, grigio: il “tutto il resto”. Con cinque tessere uguali il sistema si legge da lontano, prima ancora del segno.',
      aggancio: 'B — clip a U · pittogramma a innesto',
      trama: { tipo: 'pallini', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'grigio', coloreRilievo: 'nero'
    },
    {
      id: 'bandiera', forma: 'bandiera', titolo: 'Il segnale a bandiera', lezione: 'Lezione 2 — Wayfinding: leggibile da entrambi i lati',
      testo: 'Una striscia con tre facce si chiude in un prisma dagli spigoli arrotondati: due facce inclinate, leggibili da chi arriva da destra e da sinistra nel corridoio. La terza faccia ha i fori per appenderlo (qui è mostrato capovolto, come un leggio).',
      aggancio: 'C — linguetta interna + 2 rivetti',
      trama: { tipo: 'triangoli', passo: 8, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'bianco', coloreRilievo: 'nero'
    },
    {
      id: 'fascia', forma: 'fascia', titolo: 'La fascia per colonna', lezione: 'Lezione 5 — Pieghe con raggio grande',
      testo: 'Non tutte le pieghe sono spigoli: con un raggio grande la trama si avvolge attorno a un pilastro. La trama a onde si allunga e si accorcia senza rompersi.',
      aggancio: 'B — chiusura elastica attorno alla colonna',
      trama: { tipo: 'onde', passo: 7, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 6, colore: 'bianco', coloreRilievo: 'nero'
    },
    {
      id: 'onda', forma: 'onda', titolo: 'Il pannello a onda', lezione: 'Lezione 5 — Dare volume con le curve',
      testo: 'Due curve morbide di verso opposto trasformano una striscia piatta in un’onda: il cartello si stacca dal muro, prende luce e ombra e indica la direzione anche con la sua forma. Le curve si formano su un tubo in acqua calda.',
      aggancio: 'D — viti nella parte piatta a muro',
      trama: { tipo: 'onde', passo: 7, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 7, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'appendiporta', forma: 'molletta', par: { uso: 'porta', g1: 'laboratorio', g2: 'laboratorio' }, titolo: 'L’appendiporta', lezione: 'Lezione 5 — Dare volume con le curve',
      testo: 'Una sola striscia ripiegata a U con una curva larga quanto lo spessore dell’anta: si appoggia sopra la porta senza viti e si legge dal corridoio e dall’aula. Si piega in acqua calda direttamente sulla porta, o su un listello dello stesso spessore.',
      aggancio: 'B — molletta a U sull’anta',
      trama: { tipo: 'griglia', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'bianco', coloreRilievo: 'nero'
    },
    {
      id: 'appeso', forma: 'molletta', par: { uso: 'tubo', W: 90, A: 90, B: 90, sp: 16, g1: 'freccia', g2: 'freccia' }, titolo: 'Il cartello appeso', lezione: 'Lezione 2 — Wayfinding: leggibile da entrambi i lati',
      testo: 'La stessa striscia, ripiegata attorno a un tubo o a un cavo teso nel corridoio: due facce uguali, una per chi arriva da ciascun lato. La freccia sul retro è specchiata, così indica la stessa direzione reale.',
      aggancio: 'B — anello attorno al tubo',
      trama: { tipo: 'pallini', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'giallo', coloreRilievo: 'nero'
    },
    {
      id: 'targhetta', forma: 'targhetta', titolo: 'La targhetta a bandiera', lezione: 'Lezione 3 — CAD e stampa, la targhetta',
      testo: 'Il primo oggetto: una targhetta che sporge dal muro accanto alla porta dell’aula. Una sola curva morbida (raggio 10 mm) crea la flangia da avvitare. Due pittogrammi neri stampati a parte e innestati con perni.',
      aggancio: 'D — viti nei fori rinforzati',
      trama: { tipo: 'griglia', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 8, colore: 'bianco', coloreRilievo: 'nero'
    },
    {
      id: 'tessera', forma: 'tessera', titolo: 'Il pittogramma', lezione: 'Lezione 4 — Pittogrammi e icone del sistema',
      testo: 'Ogni pittogramma è disegnato su una griglia 10 × 10 con un solo spessore di linea. Sulla carta prima, poi in CAD: lo stesso segno diventa un pezzo nero sottile, stampato a parte, che si innesta sulla tessera con piccoli perni.',
      aggancio: '—',
      trama: { tipo: 'rombi', passo: 6, larghezza: 1.2, angolo: 0, bordo: 2.4 }, strati: 6, colore: 'giallo', coloreRilievo: 'nero'
    }
  ];

  const AGGANCI = [
    { id: 'A', nome: 'Linguetta ad arpione', dove: 'modulo → lastra', come: 'Linguetta piena piegata a 90°, spinta in un’asola fresata. La punta è divisa da una fessura: si stringe passando e si riapre dietro la lastra.', misure: 'Collo 10 mm, punta 13,5 mm, fessura 1,6 mm. Asola: 10,6 × (spessore + 0,6) mm, fresa Ø3.', pro: 'Smontabile, nessun attrezzo, posizione precisa.', contro: 'Le asole restano visibili se il modulo si sposta.' },
    { id: 'B', nome: 'Clip a U termoformata', dove: 'modulo → bordo lastra', come: 'Il modulo si piega a 180° in acqua calda usando la lastra come dima: raggio interno = metà spessore lastra.', misure: 'Aletta sul retro ≥ 25 mm. Lastra 4–10 mm.', pro: 'Zero fori, si adatta a ogni lastra, scorre lungo il bordo.', contro: 'Solo sui bordi della lastra.' },
    { id: 'C', nome: 'Gancio ripiegato', dove: 'pezzo → pezzo (chiusure)', come: 'Una linguetta piena passa in un’asola e si ripiega dietro (acqua calda o phon).', misure: 'Gancio 8 × (spessore + 5) mm; asola larga spessore + 1,2 mm.', pro: 'Molto resistente, tutto stampato.', contro: 'Semi-permanente: per smontare si riscalda.' },
    { id: 'E', nome: 'Pittogramma a innesto', dove: 'pittogramma → tessera', come: 'Il segno nero si stampa a parte, capovolto (la faccia a vista sul piatto, liscia). Sotto le linee ha 2–4 perni che entrano a pressione in fori con anello pieno ricavati nella trama, come nelle tessere Nimeto.', misure: 'Linea 3,2 mm, spessore 1,6 mm, perni Ø2 mm lunghi quasi quanto la tessera: il retro resta piatto.', pro: 'Due colori senza cambio filamento; il segno si cambia senza ristampare la tessera.', contro: 'Fori e perni vanno provati con un provino (Ø 1,9 / 2,0 / 2,1).' },
    { id: 'D', nome: 'Viti / rivetti', dove: 'pezzo → muro o lastra', come: 'Fori con anello pieno attorno (la trama da sola si strapperebbe).', misure: 'Foro Ø4,5 per vite M4, anello pieno Ø11.', pro: 'Universale.', contro: 'Serve un attrezzo; meno “sistema”.' }
  ];

  const COLORI = {
    bianco: { nome: 'Bianco', hex: '#f2f1ec' },
    giallo: { nome: 'Giallo', hex: '#f1d82a' },
    nero: { nome: 'Nero', hex: '#262626' },
    grigio: { nome: 'Grigio', hex: '#9da3a6' },
    blu: { nome: 'Blu', hex: '#2f64c8' },
    verde: { nome: 'Verde', hex: '#4f9a62' },
    rosso: { nome: 'Rosso', hex: '#d6423a' },
    arancio: { nome: 'Arancio', hex: '#ee8a2a' },
    marrone: { nome: 'Marrone', hex: '#7a5232' }
  };

  const Forme = { FORME, ESEMPI, AGGANCI, GLIFI, COLORI, glifo, parametriDefault, rett, cerchio };
  root.Forme = Forme;
  if (typeof module !== 'undefined' && module.exports) module.exports = Forme;
})(typeof self !== 'undefined' ? self : globalThis);
