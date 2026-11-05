/* =====================================================================
   TRAMA — generatore di pezzi "a solo riempimento" (lattice) per FDM
   - pattern 2D (linee, griglia, rombi, triangoli, nido d'ape, onde)
   - bordo perimetrale, zone cerniera, parti piene, fori, rilievi
   - estrusione 2.5D in triangoli (Float32Array) pronta per STL / piega
   Unità: millimetri. Funziona nel browser (script classico) e in Node.
   ===================================================================== */
(function (root) {
  'use strict';

  const CL = root.ClipperLib || (typeof require !== 'undefined' ? require('../vendor/clipper.js') : null);
  const earcut = root.earcut || (typeof require !== 'undefined' ? require('../vendor/earcut.min.js') : null);
  const S = 1000; // mm -> unità intere Clipper (micron)

  /* ---------- conversioni ---------- */
  function toPath(pts) { return pts.map(p => ({ X: Math.round(p[0] * S), Y: Math.round(p[1] * S) })); }
  // ogni poligono dato dall'utente è un contorno pieno: lo orientiamo sempre in senso antiorario
  function toPaths(polys) {
    return polys.map(p => {
      const q = toPath(p);
      return areaSegnata(q) < 0 ? q.reverse() : q;
    });
  }
  function fromPath(path) { return path.map(p => [p.X / S, p.Y / S]); }
  function fromPaths(paths) { return paths.map(fromPath); }

  /* ---------- booleane ---------- */
  function bool(subj, clip, type) {
    const c = new CL.Clipper();
    if (subj && subj.length) c.AddPaths(subj, CL.PolyType.ptSubject, true);
    if (clip && clip.length) c.AddPaths(clip, CL.PolyType.ptClip, true);
    const out = new CL.Paths();
    c.Execute(type, out, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
    return out;
  }
  const unione = (a, b) => bool(a, b || [], CL.ClipType.ctUnion);
  const interseca = (a, b) => (a.length && b.length ? bool(a, b, CL.ClipType.ctIntersection) : []);
  const sottrai = (a, b) => (b && b.length ? bool(a, b, CL.ClipType.ctDifference) : unione(a));

  function offsetChiuso(paths, d, tondo) {
    const co = new CL.ClipperOffset(2, 0.02 * S);
    co.AddPaths(paths, tondo ? CL.JoinType.jtRound : CL.JoinType.jtMiter, CL.EndType.etClosedPolygon);
    const out = new CL.Paths();
    co.Execute(out, d * S);
    return out;
  }

  /* tratti: polilinee [{pts, chiusa}] -> poligoni di larghezza w */
  function tratti(linee, w, tondo) {
    const co = new CL.ClipperOffset(2, 0.02 * S);
    const join = tondo ? CL.JoinType.jtRound : CL.JoinType.jtMiter;
    for (const l of linee) {
      if (!l.pts || l.pts.length < 2) continue;
      const end = l.chiusa ? CL.EndType.etClosedLine : (tondo ? CL.EndType.etOpenRound : CL.EndType.etOpenButt);
      co.AddPath(toPath(l.pts), join, end);
    }
    const out = new CL.Paths();
    co.Execute(out, (w / 2) * S);
    return out;
  }

  function bboxPaths(paths) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of paths) for (const q of p) {
      if (q.X < minX) minX = q.X; if (q.X > maxX) maxX = q.X;
      if (q.Y < minY) minY = q.Y; if (q.Y > maxY) maxY = q.Y;
    }
    return { minX: minX / S, minY: minY / S, maxX: maxX / S, maxY: maxY / S };
  }

  /* ---------- pattern ---------- */
  function famiglia(bb, angDeg, passo, origine, onda) {
    const a = angDeg * Math.PI / 180;
    const d = [Math.cos(a), Math.sin(a)], n = [-Math.sin(a), Math.cos(a)];
    const cx = (bb.minX + bb.maxX) / 2 - origine[0], cy = (bb.minY + bb.maxY) / 2 - origine[1];
    const R = Math.hypot(bb.maxX - bb.minX, bb.maxY - bb.minY) / 2 + passo * 2;
    const cn = cx * n[0] + cy * n[1], cd = cx * d[0] + cy * d[1];
    const linee = [];
    for (let k = Math.ceil((cn - R) / passo); k <= Math.floor((cn + R) / passo); k++) {
      const o = k * passo;
      if (!onda) {
        linee.push({
          pts: [
            [origine[0] + n[0] * o + d[0] * (cd - R), origine[1] + n[1] * o + d[1] * (cd - R)],
            [origine[0] + n[0] * o + d[0] * (cd + R), origine[1] + n[1] * o + d[1] * (cd + R)]
          ]
        });
      } else {
        const pts = [], lam = passo * 2, A = passo * 0.22, step = passo / 4;
        for (let t = cd - R; t <= cd + R + step; t += step) {
          const oo = o + A * Math.sin(2 * Math.PI * t / lam);
          pts.push([origine[0] + n[0] * oo + d[0] * t, origine[1] + n[1] * oo + d[1] * t]);
        }
        linee.push({ pts });
      }
    }
    return linee;
  }

  function nidoDape(bb, angDeg, passo, origine) {
    // esagoni a punta in alto, distanza tra lati opposti = passo
    const s = passo / Math.sqrt(3), wh = passo, a = angDeg * Math.PI / 180;
    const ca = Math.cos(a), sa = Math.sin(a);
    const R = Math.hypot(bb.maxX - bb.minX, bb.maxY - bb.minY) / 2 + passo * 2;
    const cx = (bb.minX + bb.maxX) / 2 - origine[0], cy = (bb.minY + bb.maxY) / 2 - origine[1];
    // centro in coordinate locali (ruotate di -a)
    const lx = cx * ca + cy * sa, ly = -cx * sa + cy * ca;
    const rot = (x, y) => [origine[0] + x * ca - y * sa, origine[1] + x * sa + y * ca];
    const linee = [];
    const j0 = Math.floor((ly - R) / (1.5 * s)) - 1, j1 = Math.ceil((ly + R) / (1.5 * s)) + 1;
    const i0 = Math.floor((lx - R) / wh) - 2, i1 = Math.ceil((lx + R) / wh) + 2;
    for (let j = j0; j <= j1; j++) {
      const yc = j * 1.5 * s, shift = (j & 1) ? wh / 2 : 0;
      // zigzag superiore della riga j
      const zz = [];
      for (let i = i0; i <= i1; i++) {
        const xc = i * wh + shift;
        zz.push(rot(xc - wh / 2, yc + s / 2));
        zz.push(rot(xc, yc + s));
      }
      linee.push({ pts: zz });
      // lati verticali
      for (let i = i0; i <= i1; i++) {
        const xc = i * wh + shift;
        linee.push({ pts: [rot(xc - wh / 2, yc - s / 2), rot(xc - wh / 2, yc + s / 2)] });
      }
    }
    return linee;
  }

  // pallini: anelli tangenti su griglia quadrata (da lontano si leggono come puntini)
  function pallini(bb, angDeg, passo, origine, wLinea) {
    const a = angDeg * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
    const R = Math.hypot(bb.maxX - bb.minX, bb.maxY - bb.minY) / 2 + passo * 2;
    const cx = (bb.minX + bb.maxX) / 2 - origine[0], cy = (bb.minY + bb.maxY) / 2 - origine[1];
    const lx = cx * ca + cy * sa, ly = -cx * sa + cy * ca;
    const r = passo / 2 + (wLinea || 1) * 0.2, n = 20;
    const out = [];
    for (let j = Math.floor((ly - R) / passo); j <= Math.ceil((ly + R) / passo); j++) {
      for (let i = Math.floor((lx - R) / passo); i <= Math.ceil((lx + R) / passo); i++) {
        const x = i * passo, y = j * passo;
        const gx = origine[0] + x * ca - y * sa, gy = origine[1] + x * sa + y * ca;
        if (gx < bb.minX - passo || gx > bb.maxX + passo || gy < bb.minY - passo || gy > bb.maxY + passo) continue;
        const pts = [];
        for (let k = 0; k < n; k++) pts.push([gx + r * Math.cos(2 * Math.PI * k / n), gy + r * Math.sin(2 * Math.PI * k / n)]);
        out.push({ pts, chiusa: true });
      }
    }
    return out;
  }

  function lineePattern(tipo, bb, passo, angolo, origine, wLinea) {
    switch (tipo) {
      case 'pallini': return pallini(bb, angolo, passo, origine, wLinea);
      case 'linee': return famiglia(bb, angolo, passo, origine);
      case 'griglia': return famiglia(bb, angolo, passo, origine).concat(famiglia(bb, angolo + 90, passo, origine));
      case 'rombi': return famiglia(bb, angolo + 30, passo, origine).concat(famiglia(bb, angolo - 30, passo, origine));
      case 'triangoli': return famiglia(bb, angolo, passo, origine)
        .concat(famiglia(bb, angolo + 60, passo, origine)).concat(famiglia(bb, angolo + 120, passo, origine));
      case 'nido': return nidoDape(bb, angolo, passo, origine);
      case 'onde': return famiglia(bb, angolo, passo, origine, true).concat(famiglia(bb, angolo + 90, passo, origine, true));
      default: return [];
    }
  }

  const TIPI_TRAMA = {
    pallini: 'Pallini',
    griglia: 'Griglia quadrata',
    rombi: 'Rombi',
    triangoli: 'Triangoli',
    nido: "Nido d'ape",
    onde: 'Onde (flessibile)',
    linee: 'Linee parallele',
    pieno: 'Pieno (confronto)'
  };

  /* ---------- cerniere: fascia + barrette perpendicolari alla piega ---------- */
  function cerniera(c, wLinea) {
    const ax = c.a[0], ay = c.a[1], bx = c.b[0], by = c.b[1];
    const len = Math.hypot(bx - ax, by - ay);
    if (len < 1e-6) return { fascia: [], barre: [] };
    const d = [(bx - ax) / len, (by - ay) / len], n = [-d[1], d[0]];
    const h = c.larghezza / 2;
    const fascia = [[
      [ax + n[0] * h, ay + n[1] * h], [bx + n[0] * h, by + n[1] * h],
      [bx - n[0] * h, by - n[1] * h], [ax - n[0] * h, ay - n[1] * h]
    ]];
    const passo = c.passo || Math.max(wLinea * 2.6, 2.4);
    const barre = [];
    const m = h + wLinea; // le barre sbordano un po' per saldarsi alla trama
    for (let t = passo / 2; t < len; t += passo) {
      const px = ax + d[0] * t, py = ay + d[1] * t;
      barre.push({ pts: [[px - n[0] * m, py - n[1] * m], [px + n[0] * m, py + n[1] * m]] });
    }
    // due correnti paralleli alla piega: collegano tutte le barrette (scala)
    const e = 50;
    for (const sg of [1, -1]) {
      const o = sg * (h - wLinea / 2);
      barre.push({ pts: [[ax - d[0] * e + n[0] * o, ay - d[1] * e + n[1] * o], [bx + d[0] * e + n[0] * o, by + d[1] * e + n[1] * o]] });
    }
    return { fascia, barre };
  }

  /* ---------- estrusione con suddivisione a tessere ---------- */
  function estrudi(paths, z0, z1, tag, out) {
    if (!paths.length) return out;
    const bb = bboxPaths(paths);
    const TS = 30 * S;
    const ox = Math.round(bb.minX * S) - 3137, oy = Math.round(bb.minY * S) - 2719; // offset dispari: i bordi tessera non coincidono con i contorni
    const nx = Math.ceil((bb.maxX * S - ox) / TS) + 1, ny = Math.ceil((bb.maxY * S - oy) / TS) + 1;
    const rect = (x0, y0, x1, y1) => [{ X: x0, Y: y0 }, { X: x1, Y: y0 }, { X: x1, Y: y1 }, { X: x0, Y: y1 }];

    for (let j = 0; j < ny; j++) {
      const y0 = oy + j * TS, y1 = y0 + TS;
      const riga = interseca(paths, [rect(ox, y0, ox + nx * TS, y1)]);
      if (!riga.length) continue;
      for (let i = 0; i < nx; i++) {
        const x0 = ox + i * TS, x1 = x0 + TS;
        const c = new CL.Clipper();
        c.AddPaths(riga, CL.PolyType.ptSubject, true);
        c.AddPath(rect(x0, y0, x1, y1), CL.PolyType.ptClip, true);
        const tree = new CL.PolyTree();
        c.Execute(CL.ClipType.ctIntersection, tree, CL.PolyFillType.pftNonZero, CL.PolyFillType.pftNonZero);
        const suBordo = (p, q) => (p.X === q.X && (p.X === x0 || p.X === x1)) || (p.Y === q.Y && (p.Y === y0 || p.Y === y1));
        const visita = (node) => {
          const esterno = node.Contour();
          const buchi = node.Childs().map(h => h.Contour());
          capsEPareti(esterno, buchi, z0, z1, tag, out, suBordo);
          for (const h of node.Childs()) for (const isola of h.Childs()) visita(isola);
        };
        for (const n of tree.Childs()) visita(n);
      }
    }
    return out;
  }

  function areaSegnata(c) {
    let a = 0;
    for (let i = 0, n = c.length; i < n; i++) {
      const p = c[i], q = c[(i + 1) % n];
      a += p.X * q.Y - q.X * p.Y;
    }
    return a / 2;
  }

  function pushTri(out, ax, ay, az, bx, by, bz, cx, cy, cz, tag) {
    out.pos.push(ax, ay, az, bx, by, bz, cx, cy, cz);
    out.tag.push(tag);
  }

  function capsEPareti(esterno, buchi, z0, z1, tag, out, suBordo) {
    if (esterno.length < 3) return;
    const ring = (c, vuoleCCW) => {
      const ccw = areaSegnata(c) > 0;
      return ccw === vuoleCCW ? c : c.slice().reverse();
    };
    const E = ring(esterno, true);
    const H = buchi.filter(h => h.length >= 3).map(h => ring(h, false));
    // tappi
    const flat = [], holeIdx = [];
    for (const p of E) flat.push(p.X / S, p.Y / S);
    for (const h of H) { holeIdx.push(flat.length / 2); for (const p of h) flat.push(p.X / S, p.Y / S); }
    const tri = earcut(flat, holeIdx.length ? holeIdx : null, 2);
    for (let i = 0; i < tri.length; i += 3) {
      let a = tri[i], b = tri[i + 1], c = tri[i + 2];
      const ax = flat[a * 2], ay = flat[a * 2 + 1], bx = flat[b * 2], by = flat[b * 2 + 1], cx = flat[c * 2], cy = flat[c * 2 + 1];
      const ar = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (ar >= 0) {
        pushTri(out, ax, ay, z1, bx, by, z1, cx, cy, z1, tag);
        pushTri(out, ax, ay, z0, cx, cy, z0, bx, by, z0, tag);
      } else {
        pushTri(out, ax, ay, z1, cx, cy, z1, bx, by, z1, tag);
        pushTri(out, ax, ay, z0, bx, by, z0, cx, cy, z0, tag);
      }
    }
    // pareti
    const pareti = (c) => {
      for (let i = 0, n = c.length; i < n; i++) {
        const p = c[i], q = c[(i + 1) % n];
        if (suBordo(p, q)) continue;
        const px = p.X / S, py = p.Y / S, qx = q.X / S, qy = q.Y / S;
        pushTri(out, px, py, z0, qx, qy, z0, qx, qy, z1, tag);
        pushTri(out, px, py, z0, qx, qy, z1, px, py, z1, tag);
      }
    };
    pareti(E);
    H.forEach(pareti);
  }

  /* ---------- generatore principale ----------
     spec = {
       area: [poligoni mm] | areaPaths: Paths Clipper,
       fori: [poligoni], pieni: [poligoni],
       trama: { tipo, passo, larghezza, angolo, bordo, origine:[x,y] },
       spessore, cerniere: [{a,b,larghezza,passo}],
       rilievi: [{pts, chiusa}], larghezzaRilievo, altezzaRilievo
     }  -> { pos: Float32Array, tag: Uint8Array (0 base, 1 rilievo), spessore, contorno: [poligoni mm] }
  */
  /* punti dei perni lungo le linee del pittogramma (campionamento del punto più lontano) */
  function puntiPerni(linee, quanti) {
    const campioni = [];
    let lung = 0;
    for (const l of linee) {
      const pts = l.chiusa ? l.pts.concat([l.pts[0]]) : l.pts;
      for (let i = 0; i + 1 < pts.length; i++) {
        const a = pts[i], b = pts[i + 1], d = Math.hypot(b[0] - a[0], b[1] - a[1]);
        lung += d;
        const n = Math.max(1, Math.ceil(d / 0.5));
        for (let k = 0; k <= n; k++) campioni.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]);
      }
    }
    if (!campioni.length) return [];
    const N = quanti || Math.max(2, Math.min(4, Math.round(lung / 30)));
    const cx = campioni.reduce((s, p) => s + p[0], 0) / campioni.length, cy = campioni.reduce((s, p) => s + p[1], 0) / campioni.length;
    // il primo: il più vicino al baricentro tra quelli a metà di un tratto lungo; poi i più lontani
    let scelti = [campioni.reduce((m, p) => (Math.hypot(p[0] - cx, p[1] - cy) > Math.hypot(m[0] - cx, m[1] - cy) ? p : m))];
    while (scelti.length < N) {
      let best = null, bd = -1;
      for (const p of campioni) {
        const d = Math.min(...scelti.map(q => Math.hypot(p[0] - q[0], p[1] - q[1])));
        if (d > bd) { bd = d; best = p; }
      }
      if (bd < 6) break;
      scelti.push(best);
    }
    // un po' all'interno rispetto agli estremi delle linee: sposta verso il campione vicino più interno
    return scelti;
  }

  const cerchioMm = (c, r, n) => Array.from({ length: n || 24 }, (_, i) => [c[0] + r * Math.cos(2 * Math.PI * i / (n || 24)), c[1] + r * Math.sin(2 * Math.PI * i / (n || 24))]);

  function genera(spec) {
    const tr = Object.assign({ tipo: 'griglia', passo: 6, larghezza: 1, angolo: 0, bordo: 2 }, spec.trama || {});
    const t = spec.spessore || 1.6;
    // pittogramma stampato a parte: perni sotto le linee, fori con anello pieno nella tessera
    const separato = spec.pittogramma === 'separato' && spec.rilievi && spec.rilievi.length;
    let perni = [];
    const wR = spec.larghezzaRilievo || 3;
    const rPerno = Math.max(0.9, Math.min(1.6, (wR - 1.2) / 2));
    if (separato) {
      perni = puntiPerni(spec.rilievi);
      spec = Object.assign({}, spec, {
        fori: (spec.fori || []).concat(perni.map(c => cerchioMm(c, rPerno, 20))),
        pieni: (spec.pieni || []).concat(perni.map(c => cerchioMm(c, rPerno + 1.1, 24)))
      });
    }
    let P = spec.areaPaths ? unione(spec.areaPaths) : unione(toPaths(spec.area || []));
    if (spec.fori && spec.fori.length) P = sottrai(P, unione(toPaths(spec.fori)));
    if (!P.length) return { pos: new Float32Array(0), tag: new Uint8Array(0), spessore: t, contorno: [] };
    const bb = bboxPaths(P);
    const origine = tr.origine || [(bb.minX + bb.maxX) / 2, (bb.minY + bb.maxY) / 2];

    let pezzi = [];
    const rilieviPaths = spec.rilievi && spec.rilievi.length ? tratti(spec.rilievi, spec.larghezzaRilievo || 3, true) : [];

    if (tr.tipo === 'pieno') {
      pezzi = P;
    } else {
      // fasce cerniera
      let fasce = [], barre = [];
      for (const c of (spec.cerniere || [])) {
        if (!c.larghezza) continue;
        const r = cerniera(c, tr.larghezza);
        fasce = fasce.concat(toPaths(r.fascia));
        barre = barre.concat(r.barre);
      }
      fasce = unione(fasce);
      const regioneTrama = fasce.length ? sottrai(P, fasce) : P;
      const trama = interseca(tratti(lineePattern(tr.tipo, bb, tr.passo, tr.angolo, origine, tr.larghezza), tr.larghezza, false), regioneTrama);
      const cern = barre.length ? interseca(tratti(barre, tr.larghezza, false), interseca(fasce, P)) : [];
      const bordo = tr.bordo > 0 ? sottrai(P, offsetChiuso(P, -tr.bordo)) : [];
      const pieni = spec.pieni && spec.pieni.length ? interseca(unione(toPaths(spec.pieni)), P) : [];
      pezzi = unione([].concat(trama, cern, bordo, pieni, separato ? [] : interseca(rilieviPaths, P)));
    }
    pezzi = CL.Clipper.CleanPolygons(pezzi, 0.005 * S);
    // elimina schegge minuscole (< 0.15 mm²)
    pezzi = pezzi.filter(p => Math.abs(areaSegnata(p)) > 0.15 * S * S || areaSegnata(p) < 0);
    const out = { pos: [], tag: [] };
    estrudi(pezzi, 0, t, 0, out);
    const nTessera = out.tag.length;
    let pittogramma = null;
    const hR = spec.altezzaRilievo > 0 ? spec.altezzaRilievo : 0;
    if (rilieviPaths.length && hR) {
      estrudi(unione(rilieviPaths), t, t + hR, 1, out);
      if (separato) {
        // perni: dal piano della tessera fin quasi al fondo (il retro resta piatto contro la lastra)
        const cil = toPaths(perni.map(c => cerchioMm(c, rPerno - 0.05, 20)));
        estrudi(unione(cil), 0.25, t, 1, out);
        // pezzo da stampare: capovolto, linee sul piatto e perni verso l'alto
        const q = out.pos.slice(nTessera * 9);
        const zTop = t + hR;
        for (let i = 0; i < q.length; i += 3) { q[i + 1] = -q[i + 1]; q[i + 2] = zTop - q[i + 2]; }
        pittogramma = new Float32Array(q);
      }
    }
    return {
      pos: new Float32Array(out.pos),
      tag: new Uint8Array(out.tag),
      spessore: t,
      contorno: fromPaths(P),
      // ciò che va sul piatto della stampante come pezzo principale
      posStampa: separato ? new Float32Array(out.pos.slice(0, nTessera * 9)) : null,
      pittogramma,
      perni: perni.map(c => ({ x: c[0], y: c[1], d: rPerno * 2 }))
    };
  }

  /* estrusione semplice di poligoni (es. pannello di riferimento) */
  function solido(poligoni, fori, z0, z1) {
    let P = unione(toPaths(poligoni));
    if (fori && fori.length) P = sottrai(P, unione(toPaths(fori)));
    const out = { pos: [], tag: [] };
    estrudi(P, z0, z1, 0, out);
    return new Float32Array(out.pos);
  }

  /* impronta (vista dall'alto) di una mesh qualsiasi -> Paths Clipper */
  function impronta(pos) {
    let acc = [], batch = [];
    const n = pos.length / 9;
    for (let i = 0; i < n; i++) {
      const o = i * 9;
      const ax = pos[o], ay = pos[o + 1], bx = pos[o + 3], by = pos[o + 4], cx = pos[o + 6], cy = pos[o + 7];
      const ar = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (Math.abs(ar) < 1e-6) continue;
      batch.push(ar > 0 ? toPath([[ax, ay], [bx, by], [cx, cy]]) : toPath([[ax, ay], [cx, cy], [bx, by]]));
      if (batch.length >= 3000) { acc.push(unione(batch)); batch = []; }
    }
    if (batch.length) acc.push(unione(batch));
    let tot = [];
    for (const a of acc) tot = tot.concat(a);
    tot = unione(tot);
    // chiude micro-fessure dovute alla triangolazione
    return offsetChiuso(offsetChiuso(tot, 0.02), -0.02);
  }

  const Trama = { genera, solido, impronta, estrudi, tratti, unione, interseca, sottrai, offsetChiuso, toPaths, fromPaths, TIPI_TRAMA, S };
  root.Trama = Trama;
  if (typeof module !== 'undefined' && module.exports) module.exports = Trama;
})(typeof self !== 'undefined' ? self : globalThis);
