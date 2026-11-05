/* =====================================================================
   PIEGA — motore di piegatura per pezzi piatti stampati in 3D
   1. "fotografa" il pezzo dall'alto (raster) e lo taglia lungo le linee
      di piega: ogni zona collegata diventa una REGIONE (come un cartamodello)
   2. a partire dalla regione BASE (fissa) costruisce l'albero delle pieghe
   3. ogni regione ruota attorno alla sua linea di piega, con un raggio di
      curvatura reale (la plastica si curva, non si spezza)
   Funziona con qualsiasi mesh piatta (STL/STEP) o generata da Trama.
   ===================================================================== */
(function (root) {
  'use strict';

  const RAD = Math.PI / 180;

  function datiPiega(p) {
    const ax = p.a[0], ay = p.a[1], bx = p.b[0], by = p.b[1];
    const len = Math.hypot(bx - ax, by - ay);
    const dx = len ? (bx - ax) / len : 1, dy = len ? (by - ay) / len : 0;
    return { ax, ay, bx, by, len, dx, dy, nx: -dy, ny: dx };
  }

  /* ---------- taglio dei triangoli con una serie di piani verticali paralleli ----------
     piani: n·p = c_j (c crescenti). Ogni triangolo viene tagliato solo dai piani che attraversa. */
  function tagliaFette(pos, tag, nx, ny, cs, filtro) {
    const eps = 1e-6;
    const P = [], T = [];
    const n = pos.length / 9;
    const taglia = (V, c, out) => {
      const D = V.map(v => nx * v[0] + ny * v[1] - c);
      for (const sg of [1, -1]) {
        const poly = [];
        for (let a = 0; a < V.length; a++) {
          const b = (a + 1) % V.length, da = sg * D[a], db = sg * D[b];
          if (da >= -eps) poly.push(V[a]);
          if ((da > eps && db < -eps) || (da < -eps && db > eps)) {
            const t = D[a] / (D[a] - D[b]);
            poly.push([V[a][0] + (V[b][0] - V[a][0]) * t, V[a][1] + (V[b][1] - V[a][1]) * t, V[a][2] + (V[b][2] - V[a][2]) * t]);
          }
        }
        if (poly.length >= 3) out.push(poly);
      }
    };
    for (let i = 0; i < n; i++) {
      const o = i * 9;
      const d0 = nx * pos[o] + ny * pos[o + 1], d1 = nx * pos[o + 3] + ny * pos[o + 4], d2 = nx * pos[o + 6] + ny * pos[o + 7];
      const mn = Math.min(d0, d1, d2) + eps, mx = Math.max(d0, d1, d2) - eps;
      let attivi = null;
      if (mx > mn && (!filtro || filtro(pos, o))) {
        for (const c of cs) if (c > mn && c < mx) (attivi || (attivi = [])).push(c);
      }
      if (!attivi) {
        for (let k = 0; k < 9; k++) P.push(pos[o + k]);
        T.push(tag[i]);
        continue;
      }
      let polys = [[[pos[o], pos[o + 1], pos[o + 2]], [pos[o + 3], pos[o + 4], pos[o + 5]], [pos[o + 6], pos[o + 7], pos[o + 8]]]];
      for (const c of attivi) {
        const nuovi = [];
        for (const V of polys) taglia(V, c, nuovi);
        polys = nuovi;
      }
      for (const V of polys) {
        for (let k = 1; k + 1 < V.length; k++) {
          P.push(V[0][0], V[0][1], V[0][2], V[k][0], V[k][1], V[k][2], V[k + 1][0], V[k + 1][1], V[k + 1][2]);
          T.push(tag[i]);
        }
      }
    }
    return { pos: new Float32Array(P), tag: new Uint8Array(T) };
  }

  /* ---------- preparazione ---------- */
  function prepara(posOrig, tagOrig, pieghe, base, opz) {
    opz = opz || {};
    const avvisi = [];
    const nTri = posOrig.length / 9;
    const tag0 = tagOrig && tagOrig.length === nTri ? tagOrig : new Uint8Array(nTri);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, zmin = Infinity, zmax = -Infinity;
    for (let i = 0; i < posOrig.length; i += 3) {
      const x = posOrig[i], y = posOrig[i + 1], z = posOrig[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
      if (z < zmin) zmin = z; if (z > zmax) zmax = z;
    }
    const t = opz.spessore || Math.max(0.2, zmax - zmin);
    const zm = zmin + t / 2;

    /* --- raster dell'impronta --- */
    const area = Math.max(1, (maxX - minX) * (maxY - minY));
    const px = opz.pixel || Math.min(0.5, Math.max(0.15, Math.sqrt(area / 1.6e6)));
    const pad = 6;
    const W = Math.ceil((maxX - minX) / px) + 2 * pad, H = Math.ceil((maxY - minY) / px) + 2 * pad;
    const ox = minX - pad * px, oy = minY - pad * px;
    const occ = new Uint8Array(W * H);
    for (let i = 0; i < nTri; i++) {
      const o = i * 9;
      const ax = (posOrig[o] - ox) / px, ay = (posOrig[o + 1] - oy) / px;
      const bx = (posOrig[o + 3] - ox) / px, by = (posOrig[o + 4] - oy) / px;
      const cx = (posOrig[o + 6] - ox) / px, cy = (posOrig[o + 7] - oy) / px;
      const ar = (bx - ax) * (cy - ay) - (by - ay) * (cx - ax);
      if (Math.abs(ar) < 1e-6) continue;
      const s = ar > 0 ? 1 : -1;
      const x0 = Math.max(0, Math.floor(Math.min(ax, bx, cx))), x1 = Math.min(W - 1, Math.ceil(Math.max(ax, bx, cx)));
      const y0 = Math.max(0, Math.floor(Math.min(ay, by, cy))), y1 = Math.min(H - 1, Math.ceil(Math.max(ay, by, cy)));
      for (let y = y0; y <= y1; y++) {
        const qy = y + 0.5;
        for (let x = x0; x <= x1; x++) {
          const qx = x + 0.5;
          const e0 = s * ((bx - ax) * (qy - ay) - (by - ay) * (qx - ax));
          const e1 = s * ((cx - bx) * (qy - by) - (cy - by) * (qx - bx));
          const e2 = s * ((ax - cx) * (qy - cy) - (ay - cy) * (qx - cx));
          if (e0 >= 0 && e1 >= 0 && e2 >= 0) occ[y * W + x] = 1;
        }
      }
    }

    /* --- muri lungo le pieghe --- */
    const F = pieghe.map(datiPiega);
    const muro = new Uint8Array(W * H);
    F.forEach((f) => {
      if (f.len < 0.5) return;
      const ext = 2.5 * px;
      for (let s = -ext; s <= f.len + ext; s += px * 0.4) {
        const cx = Math.floor((f.ax + f.dx * s - ox) / px), cy = Math.floor((f.ay + f.dy * s - oy) / px);
        for (let yy = cy - 1; yy <= cy + 1; yy++) for (let xx = cx - 1; xx <= cx + 1; xx++) {
          if (xx >= 0 && yy >= 0 && xx < W && yy < H) muro[yy * W + xx] = 1;
        }
      }
    });

    /* --- etichettatura delle regioni (4-connessione) --- */
    const lab = new Int32Array(W * H);
    const coda = new Int32Array(W * H);
    let nLab = 0;
    const dim = [0];
    for (let i = 0; i < W * H; i++) {
      if (!occ[i] || muro[i] || lab[i]) continue;
      nLab++;
      let h = 0, q = 0, cnt = 0;
      coda[q++] = i; lab[i] = nLab;
      while (h < q) {
        const c = coda[h++]; cnt++;
        const x = c % W;
        const vic = [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W];
        for (const v of vic) {
          if (v < 0 || v >= W * H || lab[v] || !occ[v] || muro[v]) continue;
          lab[v] = nLab; coda[q++] = v;
        }
      }
      dim.push(cnt);
    }
    const cella = (x, y) => {
      const ix = Math.floor((x - ox) / px), iy = Math.floor((y - oy) / px);
      if (ix < 0 || iy < 0 || ix >= W || iy >= H) return -1;
      return iy * W + ix;
    };
    const etichetta = (arr, x, y, r) => {
      const c0 = cella(x, y);
      if (c0 >= 0 && arr[c0] > 0) return arr[c0];
      const ix = Math.floor((x - ox) / px), iy = Math.floor((y - oy) / px);
      for (let rr = 1; rr <= (r || 0); rr++) {
        for (let yy = iy - rr; yy <= iy + rr; yy++) for (let xx = ix - rr; xx <= ix + rr; xx++) {
          if (Math.max(Math.abs(xx - ix), Math.abs(yy - iy)) !== rr) continue;
          if (xx < 0 || yy < 0 || xx >= W || yy >= H) continue;
          const v = arr[yy * W + xx];
          if (v > 0) return v;
        }
      }
      return 0;
    };

    /* --- adiacenze attraverso le pieghe --- */
    const adiac = Array.from({ length: nLab + 1 }, () => []);
    const off = 2.6 * px;
    F.forEach((f, k) => {
      if (f.len < 0.5) return;
      const visti = new Set();
      for (let s = px * 0.5; s < f.len; s += px * 0.5) {
        const qx = f.ax + f.dx * s, qy = f.ay + f.dy * s;
        const L = etichetta(lab, qx + f.nx * off, qy + f.ny * off, 1);
        const R = etichetta(lab, qx - f.nx * off, qy - f.ny * off, 1);
        if (L > 0 && R > 0 && L !== R) {
          const key = L + ':' + R;
          if (visti.has(key)) continue;
          visti.add(key);
          adiac[R].push({ a: L, piega: k, lato: 1 });
          adiac[L].push({ a: R, piega: k, lato: -1 });
        }
      }
    });

    /* --- regione base e albero (visita in ampiezza) --- */
    let baseLab = 0;
    if (base) baseLab = etichetta(lab, base[0], base[1], 40);
    if (!baseLab) {
      let best = 0;
      for (let i = 1; i <= nLab; i++) if (dim[i] > best) { best = dim[i]; baseLab = i; }
      if (base) avvisi.push('Il punto base non cade sul pezzo: uso la parte più grande.');
    }
    const padre = new Int32Array(nLab + 1).fill(-1);
    const piegaDi = new Int32Array(nLab + 1).fill(-1);
    const latoDi = new Int8Array(nLab + 1);
    const prof = new Int32Array(nLab + 1);
    const raggiunta = new Uint8Array(nLab + 1);
    const ordine = [];
    const piegaUsata = new Array(F.length).fill(0); // bitmask lati usati
    const profPiega = new Array(F.length).fill(0);
    if (baseLab) {
      raggiunta[baseLab] = 1;
      const q = [baseLab];
      while (q.length) {
        const r = q.shift();
        ordine.push(r);
        for (const e of adiac[r]) {
          if (raggiunta[e.a]) continue;
          raggiunta[e.a] = 1;
          padre[e.a] = r; piegaDi[e.a] = e.piega; latoDi[e.a] = e.lato; prof[e.a] = prof[r] + 1;
          piegaUsata[e.piega] |= (e.lato > 0 ? 1 : 2);
          profPiega[e.piega] = profPiega[e.piega] ? Math.min(profPiega[e.piega], prof[e.a]) : prof[e.a];
          q.push(e.a);
        }
      }
    }
    F.forEach((f, k) => {
      if (f.len >= 0.5 && !piegaUsata[k]) avvisi.push(`La piega ${k + 1} non divide il pezzo: allungala fino ai bordi (o oltre).`);
    });

    /* --- etichette finali: espande le regioni raggiunte di qualche pixel (non oltre i muri) --- */
    const fin = new Int32Array(W * H);
    const dist = new Uint8Array(W * H);
    let h = 0, q = 0;
    for (let i = 0; i < W * H; i++) {
      const l = lab[i];
      if (l > 0 && raggiunta[l]) { fin[i] = l; coda[q++] = i; }
    }
    const DMAX = 10;
    while (h < q) {
      const c = coda[h++];
      if (dist[c] >= DMAX) continue;
      const x = c % W;
      const vic = [x > 0 ? c - 1 : -1, x < W - 1 ? c + 1 : -1, c - W, c + W];
      for (const v of vic) {
        if (v < 0 || v >= W * H || fin[v] || muro[v]) continue;
        fin[v] = fin[c]; dist[v] = dist[c] + 1; coda[q++] = v;
      }
    }

    /* --- suddivisione della mesh nelle zone di curvatura --- */
    let pos = posOrig, tag = tag0;
    F.forEach((f, k) => {
      if (!piegaUsata[k]) return;
      const p = pieghe[k];
      const R = (p.raggio || 0) + t / 2;
      const thMax = Math.max(30, Math.abs(p.angolo || 0)) * RAD;
      const Lmax = R * thMax;
      const N = Math.max(3, Math.ceil(thMax / RAD / 7)); // una fetta ogni ~7°: curve lisce
      const m = 3;
      const filtro = (P, o) => {
        for (let v = 0; v < 3; v++) {
          const u = (P[o + v * 3] - f.ax) * f.dx + (P[o + v * 3 + 1] - f.ay) * f.dy;
          if (u >= -m && u <= f.len + m) return true;
        }
        return false;
      };
      for (const sg of [1, -1]) {
        if (!(piegaUsata[k] & (sg > 0 ? 1 : 2))) continue;
        const nx = sg * f.nx, ny = sg * f.ny, c0 = nx * f.ax + ny * f.ay;
        const cs = [];
        for (let j = 0; j <= N; j++) cs.push(c0 + (Lmax * j) / N);
        const r = tagliaFette(pos, tag, nx, ny, cs, filtro);
        pos = r.pos; tag = r.tag;
      }
    });

    /* --- assegna ogni vertice a una regione --- */
    const nV = pos.length / 3;
    const regV = new Int32Array(nV);
    const banda = 2.6 * px;
    for (let v = 0; v < nV; v++) {
      const x = pos[v * 3], y = pos[v * 3 + 1];
      let r = 0;
      for (let k = 0; k < F.length && !r; k++) {
        const f = F[k];
        if (!piegaUsata[k]) continue;
        const rx = x - f.ax, ry = y - f.ay;
        const s = rx * f.nx + ry * f.ny, u = rx * f.dx + ry * f.dy;
        if (Math.abs(s) < banda && u > -banda && u < f.len + banda) {
          const sg = s >= 0 ? 1 : -1;
          const fx = f.ax + f.dx * u, fy = f.ay + f.dy * u;
          r = etichetta(fin, fx + f.nx * sg * 3.2 * px, fy + f.ny * sg * 3.2 * px, 2);
        }
      }
      if (!r) r = etichetta(fin, x, y, 4);
      regV[v] = r > 0 ? r : -1;
    }

    return {
      pos, tag, regV, t, zm,
      angoliPreparati: pieghe.map(p => Math.max(30, Math.abs(p.angolo || 0))),
      raggiPreparati: pieghe.map(p => p.raggio || 0),
      padre, piegaDi, latoDi, ordine, baseLab, profPiega, piegaUsata,
      raster: { W, H, px, ox, oy, lab: fin, raggiunta, base: baseLab, nLab },
      avvisi
    };
  }

  /* ---------- trasformazioni ---------- */
  // parametri di una piega per la regione figlia
  function parametri(f, p, lato, theta, t, zm) {
    return {
      ax: f.ax, ay: f.ay, dx: f.dx, dy: f.dy,
      nx: f.nx * lato, ny: f.ny * lato,
      sig: theta < 0 ? -1 : 1, th: Math.abs(theta),
      R: Math.max(0.01, (p.raggio || 0) + t / 2), zm
    };
  }

  // piega "morbida": zona curva di lunghezza R·θ poi tratto rigido
  function curva(P, x, y, z, soloRigido, out) {
    const rx = x - P.ax, ry = y - P.ay;
    const u = rx * P.dx + ry * P.dy;
    const s = rx * P.nx + ry * P.ny;
    if (!soloRigido && s <= 0) { out[0] = x; out[1] = y; out[2] = z; return; }
    const zt = P.sig * (z - P.zm);
    const R = P.R, th = P.th, L = R * th, rho = R - zt;
    let s2, z2;
    if (!soloRigido && s < L) {
      const ph = s / R;
      s2 = rho * Math.sin(ph); z2 = R - rho * Math.cos(ph);
    } else {
      const c = Math.cos(th), sn = Math.sin(th);
      s2 = rho * sn + (s - L) * c; z2 = R - rho * c + (s - L) * sn;
    }
    out[0] = P.ax + P.dx * u + P.nx * s2;
    out[1] = P.ay + P.dy * u + P.ny * s2;
    out[2] = P.zm + P.sig * z2;
  }

  function applicaAff(M, x, y, z, out) {
    out[0] = M[0] * x + M[1] * y + M[2] * z + M[9];
    out[1] = M[3] * x + M[4] * y + M[5] * z + M[10];
    out[2] = M[6] * x + M[7] * y + M[8] * z + M[11];
  }

  const ID = new Float64Array([1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0]);

  function componi(Mp, P) {
    const tmp = [0, 0, 0], o = [0, 0, 0];
    const f = (x, y, z, r) => { curva(P, x, y, z, true, tmp); applicaAff(Mp, tmp[0], tmp[1], tmp[2], r); };
    f(0, 0, 0, o);
    const M = new Float64Array(12);
    const e = [[1, 0, 0], [0, 1, 0], [0, 0, 1]], r = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
      f(e[i][0], e[i][1], e[i][2], r);
      M[i] = r[0] - o[0]; M[3 + i] = r[1] - o[1]; M[6 + i] = r[2] - o[2];
    }
    M[9] = o[0]; M[10] = o[1]; M[11] = o[2];
    return M;
  }

  /* frazione di piega per ogni piega (tutte insieme o a fasi) */
  function frazioni(pieghe, progresso, sequenza) {
    if (!sequenza) return pieghe.map(() => progresso);
    const fasi = [...new Set(pieghe.map(p => p.fase || 1))].sort((a, b) => a - b);
    const n = fasi.length;
    return pieghe.map(p => {
      const i = fasi.indexOf(p.fase || 1);
      return Math.min(1, Math.max(0, progresso * n - i));
    });
  }

  function applica(mod, pieghe, progresso, sequenza, out) {
    const F = pieghe.map(datiPiega);
    const fr = frazioni(pieghe, progresso, sequenza);
    const nL = mod.padre.length;
    const aff = new Array(nL);
    const par = new Array(nL);
    aff[mod.baseLab] = ID;
    for (const r of mod.ordine) {
      if (r === mod.baseLab) continue;
      const k = mod.piegaDi[r];
      const p = pieghe[k];
      if (!p) { aff[r] = aff[mod.padre[r]]; continue; }
      const theta = (p.angolo || 0) * RAD * fr[k];
      par[r] = parametri(F[k], p, mod.latoDi[r], theta, mod.t, mod.zm);
      aff[r] = componi(aff[mod.padre[r]], par[r]);
    }
    const pos = mod.pos, nV = pos.length / 3;
    if (!out || out.length !== pos.length) out = new Float32Array(pos.length);
    const tmp = [0, 0, 0], res = [0, 0, 0];
    for (let v = 0; v < nV; v++) {
      const r = mod.regV[v];
      const x = pos[v * 3], y = pos[v * 3 + 1], z = pos[v * 3 + 2];
      if (r <= 0 || r === mod.baseLab || !aff[r]) { out[v * 3] = x; out[v * 3 + 1] = y; out[v * 3 + 2] = z; continue; }
      if (par[r]) {
        curva(par[r], x, y, z, false, tmp);
        applicaAff(aff[mod.padre[r]], tmp[0], tmp[1], tmp[2], res);
      } else applicaAff(aff[r], x, y, z, res);
      out[v * 3] = res[0]; out[v * 3 + 1] = res[1]; out[v * 3 + 2] = res[2];
    }
    return out;
  }

  /* lunghezza della zona curva (per disegnarla in 2D) */
  function lunghezzaCurva(p, t) { return ((p.raggio || 0) + t / 2) * Math.abs(p.angolo || 0) * RAD; }

  const Piega = { prepara, applica, lunghezzaCurva, datiPiega, frazioni };
  root.Piega = Piega;
  if (typeof module !== 'undefined' && module.exports) module.exports = Piega;
})(typeof self !== 'undefined' ? self : globalThis);
