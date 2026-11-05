/* STL — lettura (binario/ASCII) e scrittura (binario) di triangoli non indicizzati */
(function (root) {
  'use strict';

  function leggi(buffer) {
    const dv = new DataView(buffer);
    if (buffer.byteLength >= 84) {
      const n = dv.getUint32(80, true);
      if (84 + n * 50 === buffer.byteLength) {
        const pos = new Float32Array(n * 9);
        for (let i = 0; i < n; i++) {
          const o = 84 + i * 50 + 12;
          for (let k = 0; k < 9; k++) pos[i * 9 + k] = dv.getFloat32(o + k * 4, true);
        }
        return pos;
      }
    }
    // ASCII
    const txt = new TextDecoder().decode(new Uint8Array(buffer));
    const re = /vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g;
    const v = [];
    let m;
    while ((m = re.exec(txt))) v.push(+m[1], +m[2], +m[3]);
    if (!v.length) throw new Error('File STL non riconosciuto');
    return new Float32Array(v.length - (v.length % 9) === v.length ? v : v.slice(0, v.length - (v.length % 9)));
  }

  function scrivi(pos, intestazione) {
    const n = Math.floor(pos.length / 9);
    const buf = new ArrayBuffer(84 + n * 50);
    const dv = new DataView(buf);
    const h = (intestazione || 'PIEGA - Opificio Digitale').slice(0, 79);
    for (let i = 0; i < h.length; i++) dv.setUint8(i, h.charCodeAt(i) & 0x7f);
    dv.setUint32(80, n, true);
    for (let i = 0; i < n; i++) {
      const o = i * 9, b = 84 + i * 50;
      const ux = pos[o + 3] - pos[o], uy = pos[o + 4] - pos[o + 1], uz = pos[o + 5] - pos[o + 2];
      const vx = pos[o + 6] - pos[o], vy = pos[o + 7] - pos[o + 1], vz = pos[o + 8] - pos[o + 2];
      let nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
      const l = Math.hypot(nx, ny, nz) || 1;
      dv.setFloat32(b, nx / l, true); dv.setFloat32(b + 4, ny / l, true); dv.setFloat32(b + 8, nz / l, true);
      for (let k = 0; k < 9; k++) dv.setFloat32(b + 12 + k * 4, pos[o + k], true);
      dv.setUint16(b + 48, 0, true);
    }
    return buf;
  }

  const STL = { leggi, scrivi };
  root.STL = STL;
  if (typeof module !== 'undefined' && module.exports) module.exports = STL;
})(typeof self !== 'undefined' ? self : globalThis);
