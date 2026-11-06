/* =====================================================================
   PIEGA — interfaccia: vista 3D, editor delle pieghe, esempi, export
   ===================================================================== */
(function () {
  'use strict';
  const { FORME, ESEMPI, COLORI, AGGANCI } = Forme;
  const $ = (id) => document.getElementById(id);
  const RAD = Math.PI / 180;

  /* ------------------------------------------------------------------ stato */
  const S = {
    sorgente: 'forma', forma: 'cestino', par: Forme.parametriDefault('cestino'),
    file: null, modoFile: 'solido',
    trama: { tipo: 'nido', passo: 8, larghezza: 1.2, angolo: 0, bordo: 2.4 },
    strati: 8, hStrato: 0.2, rilievo: { w: 3.2, h: 1.6 }, pittogramma: 'separato', cerniere: false,
    colore: 'bianco', coloreRilievo: 'nero',
    spec: null, pieghe: [], base: [0, 0],
    progresso: 1, fasi: true, play: false, dir: 1, attesaFine: 0, loop: false,
    geom: null, modello: null, mostraRif: true, esempio: null,
    sel: -1, strumento: 'sel',
    pres: { attiva: false, idx: 0, pausa: false }
  };
  const spessore = () => +(S.strati * S.hStrato).toFixed(3);
  const clona = (o) => JSON.parse(JSON.stringify(o));

  /* --------------------------------------------------------------- scena 3D */
  const cont = $('vista3d');
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  cont.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#eeede9');
  const camera = new THREE.PerspectiveCamera(32, 1, 1, 50000);
  camera.up.set(0, 0, 1);
  const controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.12;

  const emi = new THREE.HemisphereLight(0xffffff, 0xb4b1a8, 0.62);
  emi.position.set(0, 0, 1);
  scene.add(emi);
  const sole = new THREE.DirectionalLight(0xffffff, 0.78);
  sole.castShadow = true;
  sole.shadow.mapSize.set(2048, 2048);
  sole.shadow.bias = -0.0004;
  sole.shadow.normalBias = 0.4;
  scene.add(sole, sole.target);
  const riempi = new THREE.DirectionalLight(0xffffff, 0.28);
  scene.add(riempi);

  const suolo = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.ShadowMaterial({ opacity: 0.14 }));
  suolo.receiveShadow = true;
  scene.add(suolo);
  const griglia = new THREE.GridHelper(1000, 100, 0xd2d0c9, 0xe0ded8);
  griglia.rotation.x = Math.PI / 2;
  scene.add(griglia);

  const gruppo = new THREE.Group();
  scene.add(gruppo);

  const matBase = new THREE.MeshStandardMaterial({ color: COLORI.bianco.hex, roughness: 0.62, metalness: 0, side: THREE.DoubleSide, flatShading: true });
  const matRil = new THREE.MeshStandardMaterial({ color: COLORI.nero.hex, roughness: 0.5, metalness: 0, side: THREE.DoubleSide, flatShading: true });
  const geo = new THREE.BufferGeometry();
  const mesh = new THREE.Mesh(geo, [matBase, matRil]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  gruppo.add(mesh);
  // seconda copia dello stesso pezzo (es. le due metà del cestino): condivide la geometria
  const meshCopia = new THREE.Mesh(geo, [matBase, matRil]);
  meshCopia.castShadow = meshCopia.receiveShadow = true;
  meshCopia.rotation.y = Math.PI;
  meshCopia.visible = false;
  gruppo.add(meshCopia);
  let rifObj = null;

  function texturaPP(base) {
    const c = document.createElement('canvas');
    c.width = c.height = 512;
    const g = c.getContext('2d');
    g.fillStyle = base; g.fillRect(0, 0, 512, 512);
    const pal = ['#e9e3d0', '#d6423a', '#2f64c8', '#f1d82a', '#4f9a62', '#1d1d1b', '#ffffff', '#5f7482', '#ee8a2a'];
    let seme = 7;
    const rnd = () => ((seme = (seme * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 1600; i++) {
      g.fillStyle = pal[Math.floor(rnd() * pal.length)];
      g.globalAlpha = 0.55 + rnd() * 0.4;
      g.beginPath();
      g.ellipse(rnd() * 512, rnd() * 512, 1.5 + rnd() * 7, 1 + rnd() * 3.5, rnd() * Math.PI, 0, Math.PI * 2);
      g.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  }
  const texPP = texturaPP('#8fa3b0');

  function creaRiferimento(rif) {
    if (!rif) return null;
    if (rif.tipo === 'lastra') {
      const pos = Trama.solido([rif.poligono], rif.fori || [], rif.z0, rif.z1);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      const uv = new Float32Array(pos.length / 3 * 2);
      for (let i = 0; i < pos.length / 3; i++) {
        const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
        uv[i * 2] = (x + z * 0.7) / 140; uv[i * 2 + 1] = (y + z * 0.3) / 140;
      }
      g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      g.computeVertexNormals();
      const m = rif.colore
        ? new THREE.MeshStandardMaterial({ color: rif.colore, roughness: 0.95, flatShading: true })
        : new THREE.MeshStandardMaterial({ map: texPP, roughness: 0.7, flatShading: true });
      const o = new THREE.Mesh(g, m);
      o.castShadow = o.receiveShadow = true;
      return o;
    }
    if (rif.tipo === 'tubo') {
      const g = new THREE.CylinderGeometry(rif.r, rif.r, rif.x1 - rif.x0, 48, 1);
      g.rotateZ(Math.PI / 2);
      const o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#9aa1a6', roughness: 0.35, metalness: 0.6 }));
      o.position.set((rif.x0 + rif.x1) / 2, rif.y, rif.z);
      o.castShadow = o.receiveShadow = true;
      return o;
    }
    if (rif.tipo === 'colonna') {
      const h = rif.y1 - rif.y0;
      const g = new THREE.CylinderGeometry(rif.r, rif.r, h, 80, 1);
      const o = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: '#cdc8bd', roughness: 0.92 }));
      o.position.set(rif.cx, (rif.y0 + rif.y1) / 2, rif.cz);
      o.castShadow = o.receiveShadow = true;
      return o;
    }
    return null;
  }

  /* ----------------------------------------------------------- pipeline */
  function costruisciSpec() {
    if (S.sorgente !== 'forma') { S.spec = null; return; }
    const vecchie = S.pieghe;
    S.spec = FORME[S.forma].costruisci(S.par, spessore());
    const nuove = clona(S.spec.pieghe || []);
    if (vecchie.length === nuove.length) {
      nuove.forEach((p, i) => {
        if (vecchie[i].modificata) { p.angolo = vecchie[i].angolo; p.raggio = vecchie[i].raggio; p.fase = vecchie[i].fase; p.modificata = true; }
      });
    }
    S.pieghe = nuove;
    S.base = (S.spec.base || [0, 0]).slice();
  }

  function generaGeometria() {
    const t = spessore();
    if (S.sorgente === 'forma') {
      const s = S.spec;
      S.geom = Trama.genera({
        area: s.area, fori: s.fori, pieni: s.pieni, cerniere: S.cerniere ? s.cerniere : [],
        rilievi: s.rilievi, larghezzaRilievo: S.rilievo.w, altezzaRilievo: S.rilievo.h, pittogramma: S.pittogramma,
        trama: S.trama, spessore: t
      });
    } else if (S.file) {
      if (S.modoFile === 'solido') {
        S.geom = { pos: S.file.pos, tag: null, spessore: S.file.spessore, contorno: null };
      } else {
        if (!S.file.impronta) S.file.impronta = Trama.impronta(S.file.pos);
        S.geom = Trama.genera({ areaPaths: S.file.impronta, trama: S.trama, spessore: t });
      }
    } else {
      S.geom = { pos: new Float32Array(0), tag: null, spessore: t };
    }
  }

  function riordina(m) {
    const nT = m.tag.length;
    let n0 = 0;
    for (let i = 0; i < nT; i++) if (!m.tag[i]) n0++;
    m.nBase = n0;
    if (n0 === nT) return;
    const pos = new Float32Array(m.pos.length), reg = new Int32Array(m.regV.length), tag = new Uint8Array(nT);
    let a = 0, b = n0;
    for (let i = 0; i < nT; i++) {
      const d = m.tag[i] ? b++ : a++;
      tag[d] = m.tag[i];
      for (let k = 0; k < 9; k++) pos[d * 9 + k] = m.pos[i * 9 + k];
      for (let k = 0; k < 3; k++) reg[d * 3 + k] = m.regV[i * 3 + k];
    }
    m.pos = pos; m.regV = reg; m.tag = tag;
  }

  function prepara() {
    const g = S.geom;
    const m = Piega.prepara(g.pos, g.tag, S.pieghe, S.base, { spessore: g.spessore });
    riordina(m);
    S.modello = m;
    const n = m.pos.length;
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n), 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(n), 3));
    geo.clearGroups();
    geo.addGroup(0, m.nBase * 3, 0);
    if (m.nBase * 3 < n / 3) geo.addGroup(m.nBase * 3, n / 3 - m.nBase * 3, 1);
    // riferimento (lastra / colonna)
    if (rifObj) { gruppo.remove(rifObj); rifObj.geometry.dispose(); rifObj = null; }
    const rif = S.sorgente === 'forma' && S.spec ? S.spec.riferimento : null;
    rifObj = creaRiferimento(rif);
    if (rifObj) { rifObj.visible = S.mostraRif; gruppo.add(rifObj); }
    $('btnRif').classList.toggle('nascosto', !rifObj);
    $('btnRif').textContent = !rif ? 'Lastra' : rif.tipo === 'colonna' ? 'Colonna' : rif.tipo === 'tubo' ? 'Tubo' : rif.colore === '#c9a77c' ? 'Porta' : rif.colore ? 'Muro' : 'Lastra';
    const cp = S.sorgente === 'forma' && S.spec ? S.spec.copia : null;
    meshCopia.visible = !!cp;
    if (cp) meshCopia.position.set(cp.x, 0, cp.z);
    const vr = (S.sorgente === 'forma' && S.spec && S.spec.vistaRuota) || [0, 0, 0];
    gruppo.rotation.set(vr[0] * RAD, vr[1] * RAD, vr[2] * RAD);
    calcolaScatola();
    aggiornaPosa();
    regioniCanvas = null;
    disegna2D();
    aggiornaInfo();
    renderLista();
  }

  function aggiornaPosa() {
    const m = S.modello;
    if (!m) return;
    const attr = geo.getAttribute('position');
    Piega.applica(m, S.pieghe, S.progresso, S.fasi, attr.array);
    attr.needsUpdate = true;
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    geo.computeBoundingBox();
    $('valProgresso').textContent = Math.round(S.progresso * 100) + '%';
    $('progresso').value = Math.round(S.progresso * 1000);
  }

  // scatola della scena (pezzo piatto + piegato + riferimento) per suolo, ombre e inquadratura
  function calcolaScatola() {
    const m = S.modello;
    gruppo.updateMatrixWorld(true);
    const box = new THREE.Box3(), boxP = new THREE.Box3();
    const tmp = new THREE.Vector3();
    const piegato = Piega.applica(m, S.pieghe, 1, false);
    const oggetti = meshCopia.visible ? [mesh, meshCopia] : [mesh];
    for (const ob of oggetti) {
      ob.updateMatrixWorld(true);
      for (const arr of [piegato, m.pos]) {
        for (let i = 0; i < arr.length; i += 3 * 7) {
          tmp.set(arr[i], arr[i + 1], arr[i + 2]).applyMatrix4(ob.matrixWorld);
          box.expandByPoint(tmp);
          if (arr === piegato) boxP.expandByPoint(tmp);
        }
      }
    }
    if (rifObj && rifObj.visible) {
      rifObj.geometry.computeBoundingBox();
      const b2 = rifObj.geometry.boundingBox.clone().applyMatrix4(rifObj.matrixWorld);
      box.union(b2);
      // la lastra entra nell'inquadratura solo in parte
      const c2 = b2.getCenter(new THREE.Vector3()), s2 = b2.getSize(new THREE.Vector3()).multiplyScalar(0.3);
      boxP.union(new THREE.Box3(c2.clone().sub(s2), c2.clone().add(s2)));
    }
    S.scatolaPiegata = boxP.isEmpty() ? null : boxP;
    if (box.isEmpty()) box.set(new THREE.Vector3(-50, -50, 0), new THREE.Vector3(50, 50, 10));
    S.scatola = box;
    const z0 = box.min.z - 0.05;
    suolo.position.z = z0;
    griglia.position.z = z0 - 0.02;
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2 + 20;
    sole.position.set(c.x - r * 0.6, c.y - r * 0.9, c.z + r * 1.6);
    sole.target.position.copy(c);
    const sc = sole.shadow.camera;
    sc.left = -r * 1.3; sc.right = r * 1.3; sc.top = r * 1.3; sc.bottom = -r * 1.3; sc.near = 1; sc.far = r * 6;
    sc.updateProjectionMatrix();
    riempi.position.set(c.x + r, c.y + r * 0.6, c.z + r * 0.5);
  }

  function inquadra(vista) {
    const box = (S.progresso > 0.5 && S.scatolaPiegata) || S.scatola;
    if (!box) return;
    const c = box.getCenter(new THREE.Vector3());
    const r = Math.max(30, box.getSize(new THREE.Vector3()).length() / 2);
    const dist = r / Math.sin(camera.fov * RAD / 2) * (camera.aspect < 1.2 ? 1.1 : 0.95);
    const dir = vista === 'alto' ? new THREE.Vector3(0, -0.0001, 1)
      : vista === 'fronte' ? new THREE.Vector3(0, -1, 0.12)
        : new THREE.Vector3(-0.62, -0.95, 0.72);
    dir.normalize();
    camera.position.copy(c).addScaledVector(dir, dist);
    camera.near = dist / 100; camera.far = dist * 20;
    camera.updateProjectionMatrix();
    controls.target.copy(c);
    controls.update();
  }

  // livelli: 3 forma, 2 geometria, 1 preparazione
  let timer = null, livelloAtteso = 0, inquadraDopo = false;
  function programma(livello, inq) {
    livelloAtteso = Math.max(livelloAtteso, livello);
    inquadraDopo = inquadraDopo || !!inq;
    clearTimeout(timer);
    timer = setTimeout(() => esegui(), 90);
  }
  function esegui() {
    const l = livelloAtteso, inq = inquadraDopo;
    livelloAtteso = 0; inquadraDopo = false;
    $('attesa').classList.remove('nascosto');
    $('attesaTesto').textContent = l >= 2 ? 'Genero la trama…' : 'Calcolo le pieghe…';
    setTimeout(() => {
      try {
        if (l >= 3) costruisciSpec();
        if (l >= 2) generaGeometria();
        prepara();
        if (inq) inquadra('iso');
      } catch (e) {
        console.error(e);
        mostraAvvisi(['Errore nel calcolo: ' + e.message]);
      }
      $('attesa').classList.add('nascosto');
    }, 20);
  }
  function ricalcolaSubito(livello, inq) {
    livelloAtteso = Math.max(livelloAtteso, livello);
    inquadraDopo = inquadraDopo || !!inq;
    clearTimeout(timer);
    esegui();
  }

  /* --------------------------------------------------------------- HUD */
  function mostraAvvisi(lista) {
    $('avvisi').innerHTML = lista.map(a => `<div>⚠ ${a}</div>`).join('<br>');
  }

  function volume(pos) {
    let v = 0;
    for (let i = 0; i < pos.length; i += 9) {
      v += (pos[i] * (pos[i + 4] * pos[i + 8] - pos[i + 5] * pos[i + 7])
        - pos[i + 1] * (pos[i + 3] * pos[i + 8] - pos[i + 5] * pos[i + 6])
        + pos[i + 2] * (pos[i + 3] * pos[i + 7] - pos[i + 4] * pos[i + 6])) / 6;
    }
    return Math.abs(v);
  }

  function aggiornaInfo() {
    const m = S.modello, g = S.geom;
    // titolo
    const es = ESEMPI.find(e => e.id === S.esempio);
    $('titoloEsempio').innerHTML = es ? `${es.titolo}<small>${es.lezione}</small>`
      : S.sorgente === 'forma' ? `${FORME[S.forma].nome}<small>Forma parametrica</small>`
        : S.file ? `${S.file.nome}<small>File importato</small>` : 'Carica un file';
    if (!g || !g.pos.length) { $('info').textContent = ''; return; }
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, maxZ = -Infinity;
    for (let i = 0; i < g.pos.length; i += 3) {
      const x = g.pos[i], y = g.pos[i + 1], z = g.pos[i + 2];
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; if (z > maxZ) maxZ = z;
    }
    const w = maxX - minX, h = maxY - minY;
    const grammi = volume(g.posStampa || g.pos) / 1000 * 1.24;
    const grammiP = g.pittogramma ? volume(g.pittogramma) / 1000 * 1.24 : 0;
    const [pw, ph] = $('selPiatto').value.split('x').map(Number);
    const entra = (w <= pw && h <= ph) || (w <= ph && h <= pw);
    const stratiTot = Math.round(maxZ / S.hStrato);
    $('info').textContent = `Piatto ${w.toFixed(0)} × ${h.toFixed(0)} × ${maxZ.toFixed(1)} mm · ${(g.pos.length / 9).toLocaleString('it-IT')} triangoli`;
    $('infoStampa').innerHTML = `Ingombro ${w.toFixed(0)} × ${h.toFixed(0)} mm · ~${stratiTot} strati · circa <b>${grammi.toFixed(1)} g</b> di PLA` +
      (entra ? ' · <b style="color:#2b7a3d">entra nel piatto</b>' : ' · <b style="color:#d6423a">non entra nel piatto!</b>');
    $('infoStampa').innerHTML += `<br>Slicer: larghezza perimetri <b>${(S.trama.larghezza / 2).toFixed(2).replace('.', ',')} mm</b> (= linea ÷ 2), evita di attraversare i perimetri, ritrai solo fuori dal pezzo, niente Z-hop al 1° strato (vedi Guida).`;
    // metodo 2: valori per far generare la stessa trama allo slicer
    if (S.sorgente === 'forma' || S.modoFile === 'trama') {
      const tr = S.trama, w = 0.45, passo = tr.passo;
      const fam = { griglia: 2, rombi: 2, linee: 1, triangoli: 3, nido: 2, onde: 2, pallini: 2 }[tr.tipo] || 2;
      const dens = Math.min(100, Math.round(fam * w / passo * 100));
      const nomi = { griglia: 'Griglia', rombi: 'Griglia a 45° (Cura: direzioni [30,150])', triangoli: 'Triangoli', nido: 'Nido d’ape', linee: 'Rettilineo', onde: 'Giroide (simile)', pallini: '— nessuno slicer fa i pallini: usa il metodo 1' };
      $('infoStampa').innerHTML += `<br><b>Metodo 2 (riempimento dello slicer)</b>: trama “Pieno” qui, poi nello slicer 0 strati sopra/sotto, 2 perimetri, riempimento <b>${nomi[tr.tipo] || tr.tipo}</b>` +
        (tr.tipo === 'pallini' ? '' : ` al <b>${dens}%</b> (Cura: distanza linee <b>${passo} mm</b>), larghezza linea riempimento 0,6 mm.`);
    }
    if (g.pittogramma) {
      const p0 = g.perni[0];
      $('infoStampa').innerHTML += g.innestoGriglia
        ? `<br>Pittogramma a parte: ~${grammiP.toFixed(1)} g, ${g.perni.length} perni <b>quadrati ${p0 ? p0.d.toFixed(1).replace('.', ',') : '–'} mm</b> che entrano nelle celle della griglia: <b>la tessera è universale</b>, il segno si sposta di una cella alla volta e si ruota di 90°.`
        : `<br>Pittogramma a parte: ~${grammiP.toFixed(1)} g, ${g.perni.length} perni Ø${p0 ? p0.d.toFixed(1) : '–'} mm a pressione. Con la <b>griglia quadrata</b> la tessera diventa universale.`;
    }
    $('expPitto').classList.toggle('nascosto', !g.pittogramma);
    if (S.sorgente === 'forma' && S.spec && S.spec.copia) $('infoStampa').innerHTML += '<br><b>Stampa questo pezzo 2 volte</b>: le due metà sono identiche.';
    const avv = (m ? m.avvisi.slice() : []);
    if (!entra) avv.push(`Il pezzo piatto (${w.toFixed(0)} × ${h.toFixed(0)} mm) non entra nel piatto ${pw} × ${ph}.`);
    if (S.sorgente === 'file' && S.modoFile === 'solido' && g.spessore > 4) avv.push('Il pezzo è spesso più di 4 mm: per piegarlo con l’acqua calda conviene stamparlo come trama.');
    mostraAvvisi(avv);
    $('contaPieghe').textContent = S.pieghe.length ? `${S.pieghe.length}` : '';
  }

  /* -------------------------------------------------------- pannello UI */
  function popolaPannello() {
    $('selForma').innerHTML = Object.keys(FORME).map(k => `<option value="${k}">${FORME[k].nome}</option>`).join('');
    $('tTipo').innerHTML = Object.keys(Trama.TIPI_TRAMA).map(k => `<option value="${k}">${Trama.TIPI_TRAMA[k]}</option>`).join('');
    const campioni = (id, chiave) => {
      $(id).innerHTML = Object.keys(COLORI).map(k => `<button data-c="${k}" title="${COLORI[k].nome}" style="background:${COLORI[k].hex}"></button>`).join('');
      $(id).addEventListener('click', (e) => {
        const b = e.target.closest('button'); if (!b) return;
        S[chiave] = b.dataset.c; aggiornaColori();
      });
    };
    campioni('colPezzo', 'colore');
    campioni('colRilievo', 'coloreRilievo');
  }

  function aggiornaColori() {
    matBase.color.set(COLORI[S.colore].hex);
    matRil.color.set(COLORI[S.coloreRilievo].hex);
    for (const [id, k] of [['colPezzo', 'colore'], ['colRilievo', 'coloreRilievo']]) {
      $(id).querySelectorAll('button').forEach(b => b.classList.toggle('attivo', b.dataset.c === S[k]));
    }
  }

  function renderParametri() {
    const box = $('parametriForma');
    box.innerHTML = '';
    for (const q of FORME[S.forma].parametri) {
      const l = document.createElement('label');
      const v = S.par[q.k];
      if (q.tipo === 'sel') {
        l.className = 'campo largo';
        l.innerHTML = `<span>${q.nome}</span><select>${q.opzioni.map(o => `<option value="${o[0]}" ${o[0] === v ? 'selected' : ''}>${o[1]}</option>`).join('')}</select>`;
      } else if (q.tipo === 'bool') {
        l.className = 'campo check';
        l.innerHTML = `<input type="checkbox" ${v ? 'checked' : ''}><span>${q.nome}</span>`;
      } else {
        l.className = 'campo';
        l.innerHTML = `<span>${q.nome}</span><input type="number" min="${q.min}" max="${q.max}" step="${q.passo}" value="${v}">`;
      }
      const inp = l.querySelector('input,select');
      inp.addEventListener('change', () => {
        let val = q.tipo === 'sel' ? inp.value : q.tipo === 'bool' ? (inp.checked ? 1 : 0) : +inp.value;
        if (q.tipo !== 'sel' && q.tipo !== 'bool') { val = Math.min(q.max, Math.max(q.min, val || q.def)); inp.value = val; }
        S.par[q.k] = val;
        // tessera pittogramma: la linea del segno cresce con il lato (3,2 mm ogni 60 mm)
        if (S.forma === 'tessera' && q.k === 'A') { S.rilievo.w = +(3.2 * val / 60).toFixed(1); $('rLarg').value = S.rilievo.w; }
        programma(3);
      });
      box.appendChild(l);
    }
  }

  function aggiornaPannello() {
    document.querySelectorAll('#segSorgente button').forEach(b => b.classList.toggle('attivo', b.dataset.v === S.sorgente));
    document.querySelectorAll('#segModoFile button').forEach(b => b.classList.toggle('attivo', b.dataset.v === S.modoFile));
    $('boxForma').classList.toggle('nascosto', S.sorgente !== 'forma');
    $('boxFile').classList.toggle('nascosto', S.sorgente !== 'file');
    $('selForma').value = S.forma;
    renderParametri();
    $('tTipo').value = S.trama.tipo; $('tPasso').value = S.trama.passo; $('tLarg').value = S.trama.larghezza;
    $('tAng').value = S.trama.angolo; $('tBordo').value = S.trama.bordo;
    $('tStrati').value = S.strati; $('tHStrato').value = S.hStrato; $('tPitto').value = S.pittogramma; $('chkCerniere').checked = S.cerniere;
    $('rLarg').value = S.rilievo.w; $('rAlt').value = S.rilievo.h;
    $('chkFasi').checked = S.fasi;
    $('nomeFile').textContent = S.file ? `${S.file.nome} · spessore ${S.file.spessore.toFixed(2)} mm` : 'Nessun file caricato.';
    const disabTrama = S.sorgente === 'file' && S.modoFile === 'solido';
    $('secTrama').style.opacity = disabTrama ? 0.45 : 1;
    aggiornaColori();
  }

  const COL_SU = '#2f64c8', COL_GIU = '#d6423a';
  function renderLista() {
    const box = $('listaPieghe');
    box.innerHTML = '';
    const m = S.modello;
    if (!S.pieghe.length) {
      box.innerHTML = '<p class="nota">Nessuna piega. Premi “+ Disegna piega” e traccia una linea sul pezzo nella vista dall’alto.</p>';
    }
    S.pieghe.forEach((p, i) => {
      const usata = !m || (m.piegaUsata[i] || 0);
      const d = document.createElement('div');
      d.className = 'piega' + (i === S.sel ? ' sel' : '');
      d.innerHTML = `
        <span class="num" style="background:${p.angolo >= 0 ? COL_SU : COL_GIU}">${i + 1}</span>
        <span class="nome" title="Seleziona">${p.nome || 'piega ' + (i + 1)}</span>
        <span class="azioni"><button data-a="inv" title="Inverti verso (su/giù)">⇅</button><button data-a="del" title="Elimina">✕</button></span>
        <div class="slider"><input type="range" min="-180" max="180" step="1" value="${p.angolo}"><input type="number" min="-360" max="360" step="1" value="${p.angolo}"></div>
        <div class="dettagli">
          <label class="raggio">raggio <input type="range" data-r min="0" max="80" step="0.5" value="${Math.min(80, p.raggio || 0)}"><input type="number" data-k="raggio" min="0" max="300" step="0.5" value="${p.raggio || 0}"></label>
          <label>fase <input type="number" data-k="fase" min="1" max="9" step="1" value="${p.fase || 1}"></label>
        </div>
        ${usata ? '' : '<div class="avviso">Non divide il pezzo: allungala fino ai bordi (⟷ Estendi).</div>'}`;
      const [rng, num] = d.querySelectorAll('.slider input');
      const setAng = (v) => {
        p.angolo = v; p.modificata = true;
        rng.value = Math.max(-180, Math.min(180, v)); num.value = v;
        d.querySelector('.num').style.background = v >= 0 ? COL_SU : COL_GIU;
        cambioAngolo(i);
      };
      rng.addEventListener('input', () => setAng(+rng.value));
      num.addEventListener('change', () => setAng(Math.max(-360, Math.min(360, +num.value || 0))));
      d.querySelectorAll('.dettagli input').forEach(inp => inp.addEventListener('change', () => {
        p[inp.dataset.k] = Math.max(+inp.min, +inp.value || 0); p.modificata = true;
        if (inp.dataset.k === 'raggio') programma(1); else aggiornaPosa();
      }));
      const rr = d.querySelector('[data-r]'), rn = d.querySelector('[data-k=raggio]');
      rr.addEventListener('input', () => { rn.value = rr.value; });
      rr.addEventListener('change', () => { p.raggio = +rr.value; p.modificata = true; programma(1); });
      rn.addEventListener('input', () => { rr.value = Math.min(80, +rn.value || 0); });
      d.querySelector('.nome').addEventListener('click', () => { S.sel = i; renderLista(); disegna2D(); });
      d.querySelector('[data-a=inv]').addEventListener('click', () => setAng(-p.angolo));
      d.querySelector('[data-a=del]').addEventListener('click', () => eliminaPiega(i));
      box.appendChild(d);
    });
    $('contaPieghe').textContent = S.pieghe.length ? `${S.pieghe.length}` : '';
  }

  function cambioAngolo(i) {
    const m = S.modello;
    if (m && Math.abs(S.pieghe[i].angolo) > (m.angoliPreparati[i] || 0) + 0.01) programma(1);
    else aggiornaPosa();
    disegna2D();
  }

  function eliminaPiega(i) {
    S.pieghe.splice(i, 1);
    S.sel = -1;
    programma(1);
    renderLista();
  }

  /* ----------------------------------------------------------- vista 2D */
  const tela = $('tela2d'), ctx = tela.getContext('2d');
  const V2 = { k: 2, ox: 0, oy: 0, adattata: false };
  let regioniCanvas = null;
  const PAL = ['#f1d82a', '#8cbbe8', '#f2a585', '#a5d6a0', '#cdb0ec', '#f5c86f', '#8fd5cd', '#eba3c2', '#bcc6cf'];

  const aSchermo = (x, y) => [x * V2.k + V2.ox, -y * V2.k + V2.oy];
  const aMondo = (sx, sy) => [(sx - V2.ox) / V2.k, -(sy - V2.oy) / V2.k];

  function adatta2D() {
    const m = S.modello;
    if (!m) return;
    const r = m.raster;
    const w = r.W * r.px, h = r.H * r.px;
    const cw = tela.clientWidth, ch = tela.clientHeight;
    V2.k = Math.min((cw - 40) / w, (ch - 30) / h);
    V2.ox = cw / 2 - (r.ox + w / 2) * V2.k;
    V2.oy = ch / 2 + (r.oy + h / 2) * V2.k;
    V2.adattata = true;
  }

  function creaRegioniCanvas() {
    const r = S.modello.raster;
    const c = document.createElement('canvas');
    c.width = r.W; c.height = r.H;
    const g = c.getContext('2d');
    const img = g.createImageData(r.W, r.H);
    const rgb = PAL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
    // regioni grezze (non espanse) per un disegno pulito
    for (let y = 0; y < r.H; y++) {
      for (let x = 0; x < r.W; x++) {
        const l = r.lab[y * r.W + x];
        if (!l) continue;
        const o = ((r.H - 1 - y) * r.W + x) * 4;
        let col;
        if (l === r.base) col = [61, 61, 58];
        else if (!r.raggiunta[l]) col = [200, 198, 190];
        else col = rgb[(l * 5) % rgb.length];
        img.data[o] = col[0]; img.data[o + 1] = col[1]; img.data[o + 2] = col[2]; img.data[o + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
    regioniCanvas = c;
  }

  function disegna2D() {
    const dpr = window.devicePixelRatio || 1;
    const cw = tela.clientWidth, ch = tela.clientHeight;
    if (tela.width !== Math.round(cw * dpr) || tela.height !== Math.round(ch * dpr)) {
      tela.width = Math.round(cw * dpr); tela.height = Math.round(ch * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, cw, ch);
    const m = S.modello;
    if (!m) return;
    if (!V2.adattata) adatta2D();
    // griglia mm
    const [x0, y1] = aMondo(0, 0), [x1, y0] = aMondo(cw, ch);
    const passi = V2.k > 4 ? 5 : 10;
    for (let x = Math.floor(x0 / passi) * passi; x <= x1; x += passi) {
      const sx = aSchermo(x, 0)[0];
      ctx.strokeStyle = x % 50 === 0 ? '#e2e0da' : '#f1f0ec'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx, ch); ctx.stroke();
    }
    for (let y = Math.floor(y0 / passi) * passi; y <= y1; y += passi) {
      const sy = aSchermo(0, y)[1];
      ctx.strokeStyle = y % 50 === 0 ? '#e2e0da' : '#f1f0ec';
      ctx.beginPath(); ctx.moveTo(0, sy); ctx.lineTo(cw, sy); ctx.stroke();
    }
    // regioni
    if (!regioniCanvas) creaRegioniCanvas();
    const r = m.raster;
    const [rx, ry] = aSchermo(r.ox, r.oy + r.H * r.px);
    ctx.imageSmoothingEnabled = V2.k * r.px < 1;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(regioniCanvas, rx, ry, r.W * r.px * V2.k, r.H * r.px * V2.k);
    ctx.globalAlpha = 1;
    // zone di curvatura + linee
    S.pieghe.forEach((p, i) => {
      const f = Piega.datiPiega(p);
      const usata = m.piegaUsata[i] || 0;
      const Lc = Piega.lunghezzaCurva(p, m.t);
      for (const sg of [1, -1]) {
        if (!(usata & (sg > 0 ? 1 : 2)) || Lc < 0.05) continue;
        const nx = f.nx * sg * Lc, ny = f.ny * sg * Lc;
        const pts = [[f.ax, f.ay], [f.bx, f.by], [f.bx + nx, f.by + ny], [f.ax + nx, f.ay + ny]].map(q => aSchermo(q[0], q[1]));
        ctx.fillStyle = 'rgba(29,29,27,.13)';
        ctx.beginPath(); pts.forEach((q, j) => j ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); ctx.closePath(); ctx.fill();
      }
      const a = aSchermo(f.ax, f.ay), b = aSchermo(f.bx, f.by);
      const col = !usata ? '#d6423a' : p.angolo >= 0 ? COL_SU : COL_GIU;
      ctx.strokeStyle = col;
      ctx.lineWidth = i === S.sel ? 3 : 2;
      ctx.setLineDash(p.angolo >= 0 ? [8, 5] : [10, 4, 2, 4]);
      if (!usata) ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
      ctx.setLineDash([]);
      // etichetta
      const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx, my, 10, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(i + 1), mx, my + 0.5);
      if (i === S.sel) {
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1d1d1b'; ctx.lineWidth = 2;
        for (const q of [a, b]) { ctx.fillRect(q[0] - 5, q[1] - 5, 10, 10); ctx.strokeRect(q[0] - 5, q[1] - 5, 10, 10); }
        ctx.fillStyle = '#1d1d1b'; ctx.textAlign = 'left';
        ctx.fillText(`${p.angolo > 0 ? '+' : ''}${p.angolo}°  r ${p.raggio || 0}`, mx + 14, my - 12);
      }
    });
    // linea in disegno
    if (inter && inter.tipo === 'disegna') {
      const a = aSchermo(inter.a[0], inter.a[1]), b = aSchermo(inter.b[0], inter.b[1]);
      ctx.strokeStyle = '#1d1d1b'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.setLineDash([]);
      const l = Math.hypot(inter.b[0] - inter.a[0], inter.b[1] - inter.a[1]);
      ctx.fillStyle = '#1d1d1b'; ctx.textAlign = 'left'; ctx.fillText(`${l.toFixed(1)} mm`, b[0] + 8, b[1] - 8);
    }
    // base
    const pb = aSchermo(S.base[0], S.base[1]);
    ctx.fillStyle = '#f1d82a'; ctx.strokeStyle = '#1d1d1b'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(pb[0], pb[1], 8, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#1d1d1b'; ctx.beginPath(); ctx.arc(pb[0], pb[1], 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.font = 'bold 10px ' + getComputedStyle(document.body).fontFamily; ctx.textAlign = 'left'; ctx.fillText('BASE', pb[0] + 11, pb[1] + 3);
    // scala
    const lmm = V2.k > 6 ? 10 : V2.k > 1.5 ? 50 : 100;
    ctx.fillStyle = '#1d1d1b'; ctx.fillRect(12, ch - 16, lmm * V2.k, 4);
    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily; ctx.fillText(`${lmm} mm`, 16 + lmm * V2.k, ch - 12);
  }

  /* interazione 2D */
  let inter = null;
  const posMouse = (e) => { const r = tela.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function aggancia(p, e) {
    const g = +$('selSnap').value;
    let x = Math.round(p[0] / g) * g, y = Math.round(p[1] / g) * g;
    const m = S.modello;
    if (m) { // aggancio ai bordi dell'ingombro
      const r = m.raster, tol = 8 / V2.k;
      const bx = [r.ox + 6 * r.px, r.ox + (r.W - 6) * r.px], by = [r.oy + 6 * r.px, r.oy + (r.H - 6) * r.px];
      for (const v of bx) if (Math.abs(p[0] - v) < tol) x = +v.toFixed(2);
      for (const v of by) if (Math.abs(p[1] - v) < tol) y = +v.toFixed(2);
    }
    return [x, y];
  }
  function distSeg(p, a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy || 1;
    const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / l2));
    return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy);
  }

  tela.addEventListener('pointerdown', (e) => {
    tela.setPointerCapture(e.pointerId);
    const s = posMouse(e), w = aMondo(s[0], s[1]);
    if (e.button === 1 || e.button === 2) { inter = { tipo: 'pan', s, ox: V2.ox, oy: V2.oy }; return; }
    if (S.strumento === 'base') {
      S.base = aggancia(w); inter = null; programma(1); disegna2D(); return;
    }
    if (S.strumento === 'piega') {
      const a = aggancia(w); inter = { tipo: 'disegna', a, b: a.slice() }; return;
    }
    // selezione: maniglie
    if (S.sel >= 0) {
      const p = S.pieghe[S.sel];
      for (const k of ['a', 'b']) {
        const q = aSchermo(p[k][0], p[k][1]);
        if (Math.hypot(q[0] - s[0], q[1] - s[1]) < 9) { inter = { tipo: 'maniglia', k, i: S.sel }; return; }
      }
    }
    // selezione: linee
    let best = -1, bd = 8;
    S.pieghe.forEach((p, i) => {
      const d = distSeg(s, aSchermo(p.a[0], p.a[1]), aSchermo(p.b[0], p.b[1]));
      if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0) {
      S.sel = best; renderLista();
      const p = S.pieghe[best];
      inter = { tipo: 'sposta', i: best, w0: w, a0: p.a.slice(), b0: p.b.slice(), mosso: false };
      disegna2D(); return;
    }
    if (S.sel >= 0) { S.sel = -1; renderLista(); }
    inter = { tipo: 'pan', s, ox: V2.ox, oy: V2.oy };
    disegna2D();
  });
  tela.addEventListener('pointermove', (e) => {
    if (!inter) return;
    const s = posMouse(e), w = aMondo(s[0], s[1]);
    if (inter.tipo === 'pan') { V2.ox = inter.ox + s[0] - inter.s[0]; V2.oy = inter.oy + s[1] - inter.s[1]; }
    else if (inter.tipo === 'disegna') {
      let b = aggancia(w);
      if (e.shiftKey) {
        const dx = w[0] - inter.a[0], dy = w[1] - inter.a[1], l = Math.hypot(dx, dy);
        const ang = Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) * (Math.PI / 4);
        b = [inter.a[0] + Math.cos(ang) * l, inter.a[1] + Math.sin(ang) * l].map(v => +v.toFixed(2));
      }
      inter.b = b;
    } else if (inter.tipo === 'maniglia') {
      S.pieghe[inter.i][inter.k] = aggancia(w);
    } else if (inter.tipo === 'sposta') {
      const g = +$('selSnap').value;
      const dx = Math.round((w[0] - inter.w0[0]) / g) * g, dy = Math.round((w[1] - inter.w0[1]) / g) * g;
      const p = S.pieghe[inter.i];
      p.a = [inter.a0[0] + dx, inter.a0[1] + dy]; p.b = [inter.b0[0] + dx, inter.b0[1] + dy];
      inter.mosso = inter.mosso || dx !== 0 || dy !== 0;
    }
    disegna2D();
  });
  tela.addEventListener('pointerup', () => {
    if (!inter) return;
    const it = inter; inter = null;
    if (it.tipo === 'disegna') {
      if (Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) > 2) {
        S.pieghe.push({ nome: 'piega ' + (S.pieghe.length + 1), a: it.a, b: it.b, angolo: 90, raggio: 10, fase: 1, modificata: true });
        S.sel = S.pieghe.length - 1;
        impostaStrumento('sel');
        programma(1);
      }
    } else if (it.tipo === 'maniglia' || (it.tipo === 'sposta' && it.mosso)) {
      S.pieghe[it.i].modificata = true;
      programma(1);
    }
    disegna2D();
  });
  tela.addEventListener('contextmenu', (e) => e.preventDefault());
  tela.addEventListener('wheel', (e) => {
    e.preventDefault();
    const s = posMouse(e), w = aMondo(s[0], s[1]);
    V2.k = Math.max(0.2, Math.min(60, V2.k * Math.exp(-e.deltaY * 0.0015)));
    V2.ox = s[0] - w[0] * V2.k; V2.oy = s[1] + w[1] * V2.k;
    disegna2D();
  }, { passive: false });

  function impostaStrumento(v) {
    S.strumento = v;
    document.querySelectorAll('#segStrumento button').forEach(b => b.classList.toggle('attivo', b.dataset.v === v));
    tela.style.cursor = v === 'sel' ? 'default' : 'crosshair';
    $('sugg2d').textContent = v === 'piega' ? 'Trascina da un bordo all’altro del pezzo · Maiusc = 0°/45°/90°'
      : v === 'base' ? 'Clicca la parte che resta ferma'
        : 'Clicca una linea per selezionarla · trascina le maniglie · rotella = zoom · trascina il vuoto = sposta';
  }

  function estendiSelezionata() {
    if (S.sel < 0 || !S.modello) return;
    const p = S.pieghe[S.sel], r = S.modello.raster;
    const f = Piega.datiPiega(p);
    const xs = [r.ox, r.ox + r.W * r.px], ys = [r.oy, r.oy + r.H * r.px];
    let t0 = -Infinity, t1 = Infinity;
    for (const [o, d, lo, hi] of [[f.ax, f.dx, xs[0], xs[1]], [f.ay, f.dy, ys[0], ys[1]]]) {
      if (Math.abs(d) < 1e-9) continue;
      const ta = (lo - o) / d, tb = (hi - o) / d;
      t0 = Math.max(t0, Math.min(ta, tb)); t1 = Math.min(t1, Math.max(ta, tb));
    }
    if (!isFinite(t0) || !isFinite(t1)) return;
    p.a = [+(f.ax + f.dx * t0).toFixed(2), +(f.ay + f.dy * t0).toFixed(2)];
    p.b = [+(f.ax + f.dx * t1).toFixed(2), +(f.ay + f.dy * t1).toFixed(2)];
    p.modificata = true;
    programma(1);
  }

  /* --------------------------------------------------------- file / CAD */
  // aperto da file:// il wasm locale non si può leggere: si usa la CDN; servito via http si usa la copia in vendor/
  const OCCT = location.protocol === 'file:' ? 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.23/dist/' : 'vendor/occt/';
  let occtPromessa = null;
  function caricaOCCT() {
    if (occtPromessa) return occtPromessa;
    occtPromessa = new Promise((ok, ko) => {
      const s = document.createElement('script');
      s.src = OCCT + 'occt-import-js.js';
      s.onload = () => window.occtimportjs({ locateFile: (f) => OCCT + f }).then(ok, ko);
      s.onerror = () => { occtPromessa = null; ko(new Error('Serve una connessione internet per leggere i file STEP/IGES (oppure esporta in STL).')); };
      document.head.appendChild(s);
    });
    return occtPromessa;
  }
  async function leggiCAD(buf, ext) {
    const occt = await caricaOCCT();
    const dati = new Uint8Array(buf);
    const res = (ext === 'iges' || ext === 'igs') ? occt.ReadIgesFile(dati, null) : occt.ReadStepFile(dati, null);
    if (!res || !res.success) throw new Error('Il file non è stato letto correttamente.');
    const out = [];
    for (const m of res.meshes) {
      const p = m.attributes.position.array, idx = m.index.array;
      for (let i = 0; i < idx.length; i++) out.push(p[idx[i] * 3], p[idx[i] * 3 + 1], p[idx[i] * 3 + 2]);
    }
    return new Float32Array(out);
  }

  function normalizza(pos, autoOrienta) {
    const bb = () => {
      const mn = [Infinity, Infinity, Infinity], mx = [-Infinity, -Infinity, -Infinity];
      for (let i = 0; i < pos.length; i += 3) for (let k = 0; k < 3; k++) { const v = pos[i + k]; if (v < mn[k]) mn[k] = v; if (v > mx[k]) mx[k] = v; }
      return [mn, mx];
    };
    let [mn, mx] = bb();
    if (autoOrienta) {
      const dim = [mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]];
      const asse = dim.indexOf(Math.min(...dim));
      if (asse !== 2) {
        const q = new Float32Array(pos.length);
        for (let i = 0; i < pos.length; i += 3) {
          const x = pos[i], y = pos[i + 1], z = pos[i + 2];
          if (asse === 0) { q[i] = y; q[i + 1] = z; q[i + 2] = x; } else { q[i] = z; q[i + 1] = x; q[i + 2] = y; }
        }
        pos = q;
        [mn, mx] = bb();
      }
    }
    const cx = (mn[0] + mx[0]) / 2, cy = (mn[1] + mx[1]) / 2;
    const q = new Float32Array(pos.length);
    for (let i = 0; i < pos.length; i += 3) { q[i] = pos[i] - cx; q[i + 1] = pos[i + 1] - cy; q[i + 2] = pos[i + 2] - mn[2]; }
    return { pos: q, spessore: mx[2] - mn[2] };
  }

  async function caricaFile(file) {
    const ext = file.name.split('.').pop().toLowerCase();
    $('attesa').classList.remove('nascosto');
    $('attesaTesto').textContent = ext === 'stl' ? 'Leggo il file…' : 'Leggo il file CAD (la prima volta scarico il lettore STEP)…';
    try {
      const buf = await file.arrayBuffer();
      const grezzo = ext === 'stl' ? STL.leggi(buf) : await leggiCAD(buf, ext);
      if (!grezzo.length) throw new Error('Il file è vuoto.');
      const n = normalizza(grezzo, true);
      S.file = { nome: file.name, pos: n.pos, spessore: n.spessore, impronta: null };
      S.sorgente = 'file'; S.esempio = null; S.spec = null;
      S.pieghe = []; S.base = [0, 0]; S.sel = -1;
      S.strati = Math.max(2, Math.min(40, Math.round(n.spessore / S.hStrato)));
      aggiornaPannello();
      V2.adattata = false;
      ricalcolaSubito(2, true);
    } catch (e) {
      console.error(e);
      mostraAvvisi(['Non riesco ad aprire il file: ' + e.message]);
    }
    $('attesa').classList.add('nascosto');
  }

  function ruotaFile(tipo) {
    if (!S.file) return;
    const p = S.file.pos, q = new Float32Array(p.length);
    for (let i = 0; i < p.length; i += 3) {
      const x = p[i], y = p[i + 1], z = p[i + 2];
      let r;
      if (tipo === 'x') r = [x, -z, y];
      else if (tipo === 'y') r = [z, y, -x];
      else if (tipo === 'z') r = [-y, x, z];
      else r = [x, -y, -z];
      q[i] = r[0]; q[i + 1] = r[1]; q[i + 2] = r[2];
    }
    const n = normalizza(q, false);
    S.file.pos = n.pos; S.file.spessore = n.spessore; S.file.impronta = null;
    S.pieghe = []; S.base = [0, 0]; S.sel = -1;
    aggiornaPannello();
    V2.adattata = false;
    ricalcolaSubito(2, true);
  }

  /* ------------------------------------------------------------ esempi */
  function caricaEsempio(id, opz) {
    opz = opz || {};
    const es = ESEMPI.find(e => e.id === id);
    if (!es) return;
    S.sorgente = 'forma'; S.forma = es.forma; S.par = Object.assign(Forme.parametriDefault(es.forma), es.par || {});
    S.trama = clona(es.trama); S.strati = es.strati; S.hStrato = 0.2;
    S.colore = es.colore; S.coloreRilievo = es.coloreRilievo;
    S.esempio = id; S.sel = -1; S.pieghe = [];
    if (opz.progresso !== undefined) S.progresso = opz.progresso;
    aggiornaPannello();
    V2.adattata = false;
    ricalcolaSubito(3, true);
  }

  /* ------------------------------------------------------------ export */
  // zip "store" di un solo file (serve dove i .stl non si possono scaricare direttamente)
  const CRC = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function zipUno(nome, dati) {
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < dati.length; i++) crc = CRC[(crc ^ dati[i]) & 0xFF] ^ (crc >>> 8);
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const n = new TextEncoder().encode(nome), L = 30 + n.length, C = 46 + n.length;
    const buf = new ArrayBuffer(L + dati.length + C + 22), dv = new DataView(buf), u8 = new Uint8Array(buf);
    const testa = (o, centrale) => {
      dv.setUint32(o, centrale ? 0x02014b50 : 0x04034b50, true);
      let q = o + 4;
      if (centrale) { dv.setUint16(q, 20, true); q += 2; }
      dv.setUint16(q, 20, true); dv.setUint16(q + 2, 0x0800, true); dv.setUint16(q + 4, 0, true);
      dv.setUint16(q + 6, 0, true); dv.setUint16(q + 8, 0x21, true);
      dv.setUint32(q + 10, crc, true); dv.setUint32(q + 14, dati.length, true); dv.setUint32(q + 18, dati.length, true);
      dv.setUint16(q + 22, n.length, true); dv.setUint16(q + 24, 0, true);
      q += 26;
      if (centrale) { dv.setUint16(q, 0, true); dv.setUint16(q + 2, 0, true); dv.setUint16(q + 4, 0, true); dv.setUint32(q + 6, 0, true); dv.setUint32(q + 10, 0, true); q += 14; }
      u8.set(n, q);
    };
    testa(0, false); u8.set(dati, L); testa(L + dati.length, true);
    const e = L + dati.length + C;
    dv.setUint32(e, 0x06054b50, true); dv.setUint16(e + 8, 1, true); dv.setUint16(e + 10, 1, true);
    dv.setUint32(e + 12, C, true); dv.setUint32(e + 16, L + dati.length, true);
    return new Blob([buf]);
  }

  function zipMolti(voci) { // voci: [{nome, dati: Uint8Array}]
    const parti = [], centrali = [];
    let off = 0;
    for (const v of voci) {
      let crc = 0xFFFFFFFF;
      for (let i = 0; i < v.dati.length; i++) crc = CRC[(crc ^ v.dati[i]) & 0xFF] ^ (crc >>> 8);
      crc = (crc ^ 0xFFFFFFFF) >>> 0;
      const n = new TextEncoder().encode(v.nome);
      const loc = new DataView(new ArrayBuffer(30));
      loc.setUint32(0, 0x04034b50, true); loc.setUint16(4, 20, true); loc.setUint16(6, 0x0800, true);
      loc.setUint16(10, 0, true); loc.setUint16(12, 0x21, true); loc.setUint32(14, crc, true);
      loc.setUint32(18, v.dati.length, true); loc.setUint32(22, v.dati.length, true); loc.setUint16(26, n.length, true);
      const cen = new DataView(new ArrayBuffer(46));
      cen.setUint32(0, 0x02014b50, true); cen.setUint16(4, 20, true); cen.setUint16(6, 20, true); cen.setUint16(8, 0x0800, true);
      cen.setUint16(14, 0x21, true); cen.setUint32(16, crc, true); cen.setUint32(20, v.dati.length, true); cen.setUint32(24, v.dati.length, true);
      cen.setUint16(28, n.length, true); cen.setUint32(42, off, true);
      parti.push(new Uint8Array(loc.buffer), n, v.dati);
      centrali.push(new Uint8Array(cen.buffer), n);
      off += 30 + n.length + v.dati.length;
    }
    const lc = centrali.reduce((a, b) => a + b.length, 0);
    const fine = new DataView(new ArrayBuffer(22));
    fine.setUint32(0, 0x06054b50, true); fine.setUint16(8, voci.length, true); fine.setUint16(10, voci.length, true);
    fine.setUint32(12, lc, true); fine.setUint32(16, off, true);
    return new Blob(parti.concat(centrali, [new Uint8Array(fine.buffer)]));
  }

  // dentro claude.ai i file passano dalla capability "downloads"; fuori, da un normale link
  let scaricamenti = null;
  if (window.claude && window.claude.use) window.claude.use('downloads').then(d => { scaricamenti = d; }).catch(() => {});
  async function scarica(blob, nome) {
    if (window.claude) {
      if (!scaricamenti) { mostraAvvisi(['Il salvataggio dei file non è disponibile in questa vista.']); return; }
      if (/\.stl$/i.test(nome)) { blob = zipUno(nome, new Uint8Array(await blob.arrayBuffer())); nome = nome.replace(/\.stl$/i, '.zip'); }
      try { await scaricamenti.save({ filename: nome, data: blob }); }
      catch (e) { if (e && e.code !== 'declined') mostraAvvisi(['File non salvato: ' + (e.message || e.code)]); }
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nome;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }
  const nomeBase = () => (S.esempio || (S.sorgente === 'forma' ? S.forma : (S.file ? S.file.nome.replace(/\.[^.]+$/, '') : 'pezzo')))
    .toLowerCase().replace(/[^a-z0-9_-]+/g, '-');

  function esportaPNG() {
    const pr = renderer.getPixelRatio();
    renderer.setPixelRatio(Math.max(2.5, pr));
    ridimensiona();
    renderer.render(scene, camera);
    renderer.domElement.toBlob((b) => {
      scarica(b, `${nomeBase()}.png`);
      renderer.setPixelRatio(pr); ridimensiona();
    }, 'image/png');
  }

  function esportaSVG() {
    let poli = S.geom && S.geom.contorno;
    if (!poli && S.file) {
      if (!S.file.impronta) S.file.impronta = Trama.impronta(S.file.pos);
      poli = Trama.fromPaths(S.file.impronta);
    }
    if (!poli || !poli.length) return;
    let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
    for (const p of poli) for (const q of p) { mnx = Math.min(mnx, q[0]); mxx = Math.max(mxx, q[0]); mny = Math.min(mny, q[1]); mxy = Math.max(mxy, q[1]); }
    const m = 15, W = mxx - mnx + 2 * m, H = mxy - mny + 2 * m + 12;
    const X = (x) => (x - mnx + m).toFixed(2), Y = (y) => (mxy - y + m + 12).toFixed(2);
    const path = poli.map(p => 'M' + p.map(q => `${X(q[0])},${Y(q[1])}`).join('L') + 'Z').join(' ');
    const linee = S.pieghe.map((p, i) => {
      const col = p.angolo >= 0 ? COL_SU : COL_GIU;
      const dash = p.angolo >= 0 ? '4 2.5' : '5 2 1 2';
      const mx = (p.a[0] + p.b[0]) / 2, my = (p.a[1] + p.b[1]) / 2;
      return `<line x1="${X(p.a[0])}" y1="${Y(p.a[1])}" x2="${X(p.b[0])}" y2="${Y(p.b[1])}" stroke="${col}" stroke-width="0.5" stroke-dasharray="${dash}"/>
        <text x="${X(mx)}" y="${Y(my)}" font-size="3.2" fill="${col}" font-family="Helvetica, Arial" dx="1.5" dy="-1.5">${i + 1}: ${p.angolo > 0 ? '+' : ''}${p.angolo}° f${p.fase || 1}</text>`;
    }).join('\n');
    const titolo = (ESEMPI.find(e => e.id === S.esempio) || {}).titolo || nomeBase();
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W.toFixed(1)}mm" height="${H.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(2)} ${H.toFixed(2)}">
  <text x="${m}" y="${m - 2}" font-size="4.5" font-family="Helvetica, Arial" font-weight="bold">PIEGA · cartamodello · ${titolo}</text>
  <text x="${m}" y="${m + 4}" font-size="3" font-family="Helvetica, Arial" fill="#555">scala 1:1 — stampare al 100% · tratteggio blu = piega verso l'alto (+) · tratto-punto rosso = verso il basso (−)</text>
  <path d="${path}" fill="none" stroke="#000" stroke-width="0.35" fill-rule="evenodd"/>
  ${linee}
  <rect x="${m}" y="${(H - 6).toFixed(2)}" width="10" height="1.5" fill="#000"/><text x="${m + 12}" y="${(H - 4.6).toFixed(2)}" font-size="3" font-family="Helvetica, Arial">10 mm</text>
</svg>`;
    scarica(new Blob([svg], { type: 'image/svg+xml' }), `${nomeBase()}_cartamodello.svg`);
  }

  function aBase64(buf) {
    let s = '';
    const b = new Uint8Array(buf);
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
    return btoa(s);
  }
  function daBase64(str) {
    const s = atob(str), b = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
    return b.buffer;
  }
  function esportaJSON() {
    const prog = {
      app: 'PIEGA', versione: 1,
      sorgente: S.sorgente, forma: S.forma, par: S.par, esempio: S.esempio,
      trama: S.trama, strati: S.strati, hStrato: S.hStrato, rilievo: S.rilievo,
      colore: S.colore, coloreRilievo: S.coloreRilievo,
      pieghe: S.pieghe, base: S.base, fasi: S.fasi, modoFile: S.modoFile,
      file: S.file ? { nome: S.file.nome, stl: aBase64(STL.scrivi(S.file.pos)) } : null
    };
    scarica(new Blob([JSON.stringify(prog)], { type: 'application/json' }), `${nomeBase()}.piega.json`);
  }
  async function apriJSON(file) {
    try {
      const p = JSON.parse(await file.text());
      if (p.app !== 'PIEGA') throw new Error('non è un progetto PIEGA');
      Object.assign(S, {
        sorgente: p.sorgente, forma: p.forma, par: p.par, esempio: p.esempio, trama: p.trama, strati: p.strati, hStrato: p.hStrato,
        rilievo: p.rilievo, colore: p.colore, coloreRilievo: p.coloreRilievo, fasi: p.fasi, modoFile: p.modoFile || 'solido', sel: -1
      });
      if (p.file) {
        const n = normalizza(STL.leggi(daBase64(p.file.stl)), false);
        S.file = { nome: p.file.nome, pos: n.pos, spessore: n.spessore, impronta: null };
      }
      if (S.sorgente === 'forma') costruisciSpec();
      S.pieghe = p.pieghe; S.base = p.base;
      aggiornaPannello();
      V2.adattata = false;
      ricalcolaSubito(2, true);
    } catch (e) { mostraAvvisi(['Progetto non valido: ' + e.message]); }
  }

  /* ----------------------------------------------------------- schede */
  const anteprime = {};
  function apriScheda(nome) {
    const box = $('contenutoSovrapposto');
    if (nome === 'esempi') {
      box.innerHTML = `<h1>Esempi</h1><p class="sottotitolo">Gli oggetti per presentare il laboratorio: ognuno parte da un pezzo piatto stampato solo come trama e prende volume con una o più pieghe.</p>
      <div class="carte">${ESEMPI.map((e, i) => `<div class="carta">
        <div class="anteprima" data-ant="${e.id}">${anteprime[e.id] ? `<img src="${anteprime[e.id]}" alt="${e.titolo}">` : 'anteprima in preparazione…'}</div>
        <div class="corpo"><span class="lezione">${e.lezione}</span><h3>${e.titolo}</h3><p>${e.testo}</p>
        <span class="tag">Aggancio ${e.aggancio}</span>
        <div class="riga-bottoni"><button data-apri="${e.id}" class="primario">Apri</button><button data-presenta="${i}">▶ Presenta da qui</button></div></div></div>`).join('')}</div>`;
      box.querySelectorAll('[data-apri]').forEach(b => b.addEventListener('click', () => { chiudiScheda(); caricaEsempio(b.dataset.apri, { progresso: 1 }); }));
      box.querySelectorAll('[data-presenta]').forEach(b => b.addEventListener('click', () => { chiudiScheda(); avviaPresentazione(+b.dataset.presenta); }));
      preparaAnteprime();
    } else if (nome === 'pittogrammi') {
      box.innerHTML = `<h1>Pittogrammi</h1>
      <p class="sottotitolo">${Object.keys(Forme.GLIFI).length - 1} segni disegnati su una griglia 10 × 10 con un solo spessore di linea e le estremità arrotondate.
      Ognuno si stampa a parte (nero, faccia a vista sul piatto) e si innesta con i perni sulla tessera 60 × 60 mm.</p>
      <div class="riga-bottoni">
        <label class="campo inline"><span>Lato tessera</span><select id="pitLato"><option value="60">60 mm</option><option value="80">80 mm</option><option value="100">100 mm</option></select></label>
        <button class="primario" id="pitTutti">Scarica tutti gli STL (.zip)</button><button id="pitTavola">Tavola da stampare su carta (SVG)</button></div>
      <p class="nota" id="pitNota"></p>
      ${Forme.CATEGORIE_GLIFI.map(c => `<h2>${c.nome}</h2><div class="glifi">${c.ids.map(id => `
        <div class="glifo"><div class="disegno">${Forme.svgGlifo(id, { griglia: true, margine: 0.4 })}</div>
        <b>${Forme.GLIFI[id].nome}</b>
        <div class="riga-bottoni"><button data-g-apri="${id}" class="primario">Su tessera</button><button data-g-stl="${id}">STL</button></div></div>`).join('')}</div>`).join('')}`;
      const notaLato = () => { $('pitNota').textContent = `Tessera ${latoTessera} × ${latoTessera} mm · linea del segno ${lineaPer(latoTessera)} mm · spessori 1,6 mm. Non scalare i file nello slicer: genera la misura giusta qui.`; };
      $('pitLato').value = String(latoTessera); notaLato();
      $('pitLato').addEventListener('change', () => { latoTessera = +$('pitLato').value; notaLato(); });
      box.querySelectorAll('[data-g-apri]').forEach(b => b.addEventListener('click', () => { chiudiScheda(); apriGlifo(b.dataset.gApri); }));
      box.querySelectorAll('[data-g-stl]').forEach(b => b.addEventListener('click', () => {
        const g = pezziGlifo(b.dataset.gStl);
        scarica(new Blob([STL.scrivi(g.pittogramma, 'PIEGA pittogramma ' + b.dataset.gStl)]), `pittogramma_${b.dataset.gStl}_${latoTessera}mm.stl`);
      }));
      $('pitTutti').addEventListener('click', () => {
        const voci = [];
        for (const c of Forme.CATEGORIE_GLIFI) for (const id of c.ids) {
          const g = pezziGlifo(id);
          voci.push({ nome: `pittogrammi/${id}_pittogramma.stl`, dati: new Uint8Array(STL.scrivi(g.pittogramma, 'PIEGA ' + id)) });
          voci.push({ nome: `tessere/${id}_tessera.stl`, dati: new Uint8Array(STL.scrivi(g.posStampa, 'PIEGA tessera ' + id)) });
        }
        scarica(zipMolti(voci), `pittogrammi-piega-${latoTessera}mm.zip`);
      });
      $('pitTavola').addEventListener('click', () => scarica(new Blob([tavolaSVG()], { type: 'image/svg+xml' }), 'tavola-pittogrammi.svg'));
    } else if (nome === 'agganci') box.innerHTML = Contenuti.agganci(AGGANCI);
    else box.innerHTML = Contenuti.guida();
    $('sovrapposto').classList.remove('nascosto');
    $('sovrapposto').querySelector('.foglio').scrollTop = 0;
  }
  // tessera 60×60 + pittogramma a innesto per un segno
  let latoTessera = 60;
  const lineaPer = (lato) => +(3.2 * lato / 60).toFixed(1);   // la linea cresce con la tessera
  function pezziGlifo(id) {
    const spec = FORME.tessera.costruisci({ A: latoTessera, glifo: id }, 1.6);
    return Trama.genera({ area: spec.area, rilievi: spec.rilievi, larghezzaRilievo: lineaPer(latoTessera), altezzaRilievo: 1.6,
      pittogramma: 'separato', trama: S.trama, spessore: 1.6 });
  }
  function apriGlifo(id) {
    S.sorgente = 'forma'; S.forma = 'tessera'; S.par = { A: latoTessera, glifo: id }; S.esempio = null; S.pieghe = []; S.sel = -1;
    S.pittogramma = 'separato'; S.rilievo = { w: lineaPer(latoTessera), h: 1.6 }; S.strati = 8;
    aggiornaPannello(); V2.adattata = false; ricalcolaSubito(3, true);
  }
  function tavolaSVG() {
    const cel = 26, out = [];
    let h = 8;
    for (const c of Forme.CATEGORIE_GLIFI) {
      out.push(`<text x="5" y="${h + 6}" font-size="5" font-family="Helvetica,Arial" font-weight="bold">${c.nome}</text>`); h += 9;
      c.ids.forEach((id, i) => {
        const x = 5 + (i % 7) * cel, y = h + Math.floor(i / 7) * (cel + 6);
        out.push(`<g transform="translate(${x},${y})">${Forme.svgGlifo(id, { griglia: true, dimensione: 22, margine: 0 })}<text x="11" y="26.5" font-size="3" text-anchor="middle" font-family="Helvetica,Arial">${Forme.GLIFI[id].nome}</text></g>`);
      });
      h += Math.ceil(c.ids.length / 7) * (cel + 6) + 3;
    }
    const W = 7 * cel + 10;
    return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${W}mm" height="${h}mm" viewBox="0 0 ${W} ${h}"><rect width="100%" height="100%" fill="#fff"/>${out.join('')}</svg>`;
  }

  function chiudiScheda() { $('sovrapposto').classList.add('nascosto'); }

  // anteprime degli esempi renderizzate con un secondo renderer
  let rendAnt = null, antInCorso = false;
  function preparaAnteprime() {
    if (antInCorso) return;
    const daFare = ESEMPI.filter(e => !anteprime[e.id]);
    if (!daFare.length) return;
    antInCorso = true;
    if (!rendAnt) {
      rendAnt = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      rendAnt.setSize(480, 360);
      rendAnt.shadowMap.enabled = true;
    }
    let i = 0;
    const passo = () => {
      if (i >= daFare.length) { antInCorso = false; return; }
      const e = daFare[i++];
      try { anteprime[e.id] = renderAnteprima(e); } catch (err) { console.error(err); }
      const el = document.querySelector(`[data-ant="${e.id}"]`);
      if (el && anteprime[e.id]) el.innerHTML = `<img src="${anteprime[e.id]}" alt="${e.titolo}">`;
      setTimeout(passo, 30);
    };
    setTimeout(passo, 50);
  }
  function renderAnteprima(e) {
    const t = e.strati * 0.2;
    const spec = FORME[e.forma].costruisci(Object.assign(Forme.parametriDefault(e.forma), e.par || {}), t);
    const g = Trama.genera({ area: spec.area, fori: spec.fori, pieni: spec.pieni, cerniere: [], rilievi: spec.rilievi, larghezzaRilievo: 3.2, altezzaRilievo: 1.6, pittogramma: 'separato', trama: e.trama, spessore: t });
    const m = Piega.prepara(g.pos, g.tag, spec.pieghe, spec.base, { spessore: t });
    riordina(m);
    const pos = Piega.applica(m, spec.pieghe, 1, false);
    const sc = new THREE.Scene();
    sc.background = new THREE.Color('#eeede9');
    const gg = new THREE.BufferGeometry();
    gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    gg.addGroup(0, m.nBase * 3, 0); gg.addGroup(m.nBase * 3, pos.length / 3 - m.nBase * 3, 1);
    gg.computeVertexNormals();
    const mb = matBase.clone(); mb.color.set(COLORI[e.colore].hex);
    const mr = matRil.clone(); mr.color.set(COLORI[e.coloreRilievo].hex);
    const me = new THREE.Mesh(gg, [mb, mr]); me.castShadow = true;
    const gr = new THREE.Group(); gr.add(me);
    const rif = creaRiferimento(spec.riferimento); if (rif) gr.add(rif);
    if (spec.copia) { const mc = new THREE.Mesh(gg, [mb, mr]); mc.castShadow = true; mc.rotation.y = Math.PI; mc.position.set(spec.copia.x, 0, spec.copia.z); gr.add(mc); }
    const vr = spec.vistaRuota || [0, 0, 0]; gr.rotation.set(vr[0] * RAD, vr[1] * RAD, vr[2] * RAD);
    sc.add(gr);
    gr.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(gr);
    const c = box.getCenter(new THREE.Vector3()), r = box.getSize(new THREE.Vector3()).length() / 2;
    const h = new THREE.HemisphereLight(0xffffff, 0xb4b1a8, 0.62); h.position.set(0, 0, 1); sc.add(h);
    const d = new THREE.DirectionalLight(0xffffff, 0.78); d.position.set(c.x - r * 0.6, c.y - r * 0.9, c.z + r * 1.6); d.target.position.copy(c);
    d.castShadow = true; d.shadow.mapSize.set(1024, 1024);
    Object.assign(d.shadow.camera, { left: -r * 1.4, right: r * 1.4, top: r * 1.4, bottom: -r * 1.4, near: 1, far: r * 6 });
    d.shadow.camera.updateProjectionMatrix(); sc.add(d, d.target);
    const f = new THREE.DirectionalLight(0xffffff, 0.28); f.position.set(c.x + r, c.y + r * 0.6, c.z + r * 0.5); sc.add(f);
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(20000, 20000), new THREE.ShadowMaterial({ opacity: 0.14 }));
    pl.position.z = box.min.z - 0.05; pl.receiveShadow = true; sc.add(pl);
    const cam = new THREE.PerspectiveCamera(30, 4 / 3, 1, 50000); cam.up.set(0, 0, 1);
    const dir = new THREE.Vector3(-0.62, -0.95, 0.72).normalize();
    cam.position.copy(c).addScaledVector(dir, r / Math.sin(15 * RAD) * 0.92); cam.lookAt(c);
    rendAnt.render(sc, cam);
    const url = rendAnt.domElement.toDataURL('image/jpeg', 0.88);
    gg.dispose();
    return url;
  }

  /* ------------------------------------------------------ presentazione */
  function avviaPresentazione(idx) {
    S.pres.attiva = true; S.pres.idx = idx || 0; S.pres.pausa = false;
    document.body.classList.add('presentazione');
    $('didascalia').classList.remove('nascosto');
    controls.autoRotate = true; controls.autoRotateSpeed = 0.7;
    ridimensiona();
    mostraDiapositiva();
  }
  function mostraDiapositiva() {
    const e = ESEMPI[S.pres.idx];
    $('didLezione').textContent = e.lezione;
    $('didConta').textContent = `${S.pres.idx + 1} / ${ESEMPI.length}`;
    $('didTitolo').textContent = e.titolo;
    $('didTesto').textContent = e.testo;
    $('didAggancio').textContent = e.aggancio;
    caricaEsempio(e.id, { progresso: 0 });
    S.loop = true; S.play = !S.pres.pausa; S.dir = 1; S.attesaFine = performance.now() + 900;
    $('didPausa').textContent = S.pres.pausa ? '▶' : '❚❚';
  }
  function esciPresentazione() {
    S.pres.attiva = false;
    document.body.classList.remove('presentazione');
    $('didascalia').classList.add('nascosto');
    controls.autoRotate = false; S.loop = false; S.play = false; aggiornaPlay();
    ridimensiona();
    inquadra('iso');
  }
  function diapositiva(d) {
    S.pres.idx = (S.pres.idx + d + ESEMPI.length) % ESEMPI.length;
    mostraDiapositiva();
  }

  /* --------------------------------------------------------- animazione */
  function aggiornaPlay() { $('btnPlay').textContent = S.play ? '❚❚' : '▶'; }
  function avviaPlay() {
    if (S.play) { S.play = false; aggiornaPlay(); return; }
    if (S.progresso >= 0.999) S.progresso = 0;
    S.dir = 1; S.play = true; S.attesaFine = 0; aggiornaPlay();
  }

  let tPrec = performance.now();
  function ciclo(t) {
    const dt = Math.min(0.05, (t - tPrec) / 1000);
    tPrec = t;
    if (S.play && S.modello && t > S.attesaFine) {
      const nFasi = S.fasi ? new Set(S.pieghe.map(p => p.fase || 1)).size : 1;
      const durata = 1.6 + 1.1 * nFasi;
      S.progresso += S.dir * dt / durata;
      if (S.progresso >= 1) {
        S.progresso = 1;
        if (S.loop) { S.dir = -1; S.attesaFine = t + 2600; } else { S.play = false; aggiornaPlay(); }
      } else if (S.progresso <= 0) {
        S.progresso = 0; S.dir = 1; S.attesaFine = t + 900;
      }
      aggiornaPosa();
    }
    controls.update();
    renderer.render(scene, camera);
    requestAnimationFrame(ciclo);
  }

  function ridimensiona() {
    const w = cont.clientWidth, h = cont.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    disegna2D();
  }

  /* ------------------------------------------------------------- eventi */
  function collega() {
    document.querySelectorAll('#segSorgente button').forEach(b => b.addEventListener('click', () => {
      if (b.dataset.v === S.sorgente) return;
      S.sorgente = b.dataset.v; S.esempio = null; S.sel = -1;
      if (S.sorgente === 'forma') { S.pieghe = []; aggiornaPannello(); V2.adattata = false; ricalcolaSubito(3, true); }
      else {
        aggiornaPannello();
        if (S.file) { S.pieghe = []; V2.adattata = false; ricalcolaSubito(2, true); }
        else { S.geom = { pos: new Float32Array(0), tag: null, spessore: 1 }; S.pieghe = []; prepara(); }
      }
    }));
    document.querySelectorAll('#segModoFile button').forEach(b => b.addEventListener('click', () => {
      S.modoFile = b.dataset.v; aggiornaPannello(); if (S.file) programma(2);
    }));
    $('selForma').addEventListener('change', () => {
      S.forma = $('selForma').value; S.par = Forme.parametriDefault(S.forma); S.esempio = null; S.pieghe = []; S.sel = -1;
      renderParametri(); V2.adattata = false; ricalcolaSubito(3, true);
    });
    const tramaInput = (id, k, liv) => $(id).addEventListener('change', () => {
      const v = $(id).type === 'number' ? +$(id).value : $(id).value;
      if (k.startsWith('t.')) S.trama[k.slice(2)] = v;
      else if (k.startsWith('r.')) S.rilievo[k.slice(2)] = v;
      else S[k] = v;
      programma(liv);
    });
    tramaInput('tTipo', 't.tipo', 2); tramaInput('tPasso', 't.passo', 2); tramaInput('tLarg', 't.larghezza', 2);
    tramaInput('tAng', 't.angolo', 2); tramaInput('tBordo', 't.bordo', 2);
    tramaInput('tStrati', 'strati', 3); tramaInput('tHStrato', 'hStrato', 3);
    tramaInput('rLarg', 'r.w', 2); tramaInput('rAlt', 'r.h', 2);

    const inFile = $('inFile'), drop = $('dropZone');
    inFile.addEventListener('change', () => { if (inFile.files[0]) caricaFile(inFile.files[0]); inFile.value = ''; });
    ['dragenter', 'dragover'].forEach(ev => window.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('sopra'); }));
    ['dragleave', 'drop'].forEach(ev => window.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('sopra'); }));
    window.addEventListener('drop', (e) => {
      const f = e.dataTransfer && e.dataTransfer.files[0];
      if (!f) return;
      if (/\.json$/i.test(f.name)) apriJSON(f); else caricaFile(f);
    });
    $('rotX').addEventListener('click', () => ruotaFile('x'));
    $('rotY').addEventListener('click', () => ruotaFile('y'));
    $('rotZ').addEventListener('click', () => ruotaFile('z'));
    $('capovolgi').addEventListener('click', () => ruotaFile('c'));

    $('btnNuovaPiega').addEventListener('click', () => impostaStrumento('piega'));
    $('btnResetPieghe').addEventListener('click', () => {
      if (S.sorgente === 'forma') { S.pieghe = []; S.sel = -1; ricalcolaSubito(3); }
      else { S.pieghe = []; S.sel = -1; ricalcolaSubito(1); }
    });
    document.querySelectorAll('#segStrumento button').forEach(b => b.addEventListener('click', () => impostaStrumento(b.dataset.v)));
    $('btnEstendi').addEventListener('click', estendiSelezionata);
    $('btnAdatta').addEventListener('click', () => { adatta2D(); disegna2D(); });

    $('progresso').addEventListener('input', () => { S.progresso = +$('progresso').value / 1000; S.play = false; aggiornaPlay(); aggiornaPosa(); });
    $('btnPlay').addEventListener('click', avviaPlay);
    $('chkFasi').addEventListener('change', () => { S.fasi = $('chkFasi').checked; aggiornaPosa(); });

    document.querySelectorAll('[data-cam]').forEach(b => b.addEventListener('click', () => inquadra(b.dataset.cam)));
    $('btnRif').addEventListener('click', () => {
      S.mostraRif = !S.mostraRif;
      $('btnRif').classList.toggle('attivo', S.mostraRif);
      if (rifObj) rifObj.visible = S.mostraRif;
    });

    $('selPiatto').addEventListener('change', aggiornaInfo);
    $('expPiatto').addEventListener('click', () => S.geom && S.geom.pos.length && scarica(new Blob([STL.scrivi(S.geom.posStampa || S.geom.pos, 'PIEGA piatto ' + nomeBase())]), `${nomeBase()}_da-stampare.stl`));
    $('expPitto').addEventListener('click', () => S.geom && S.geom.pittogramma && scarica(new Blob([STL.scrivi(S.geom.pittogramma, 'PIEGA pittogramma ' + nomeBase())]), `${nomeBase()}_pittogramma.stl`));
    $('tPitto').addEventListener('change', () => { S.pittogramma = $('tPitto').value; programma(2); });
    $('chkCerniere').addEventListener('change', () => { S.cerniere = $('chkCerniere').checked; programma(2); });
    $('expPiegato').addEventListener('click', () => S.modello && scarica(new Blob([STL.scrivi(geo.getAttribute('position').array, 'PIEGA piegato ' + nomeBase())]), `${nomeBase()}_piegato-${Math.round(S.progresso * 100)}.stl`));
    $('expPNG').addEventListener('click', esportaPNG);
    $('expJSON').addEventListener('click', esportaJSON);
    $('expSVG').addEventListener('click', esportaSVG);
    $('inJSON').addEventListener('change', () => { const f = $('inJSON').files[0]; if (f) apriJSON(f); $('inJSON').value = ''; });

    document.querySelectorAll('[data-scheda]').forEach(b => b.addEventListener('click', () => apriScheda(b.dataset.scheda)));
    $('chiudiSovrapposto').addEventListener('click', chiudiScheda);
    $('sovrapposto').addEventListener('click', (e) => { if (e.target.id === 'sovrapposto') chiudiScheda(); });
    $('btnPresenta').addEventListener('click', () => avviaPresentazione(Math.max(0, ESEMPI.findIndex(e => e.id === S.esempio))));
    $('didPrec').addEventListener('click', () => diapositiva(-1));
    $('didSucc').addEventListener('click', () => diapositiva(1));
    $('didEsci').addEventListener('click', esciPresentazione);
    $('didPausa').addEventListener('click', () => {
      S.pres.pausa = !S.pres.pausa; S.play = !S.pres.pausa; controls.autoRotate = !S.pres.pausa;
      $('didPausa').textContent = S.pres.pausa ? '▶' : '❚❚';
    });

    window.addEventListener('keydown', (e) => {
      const inCampo = /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName);
      if (S.pres.attiva) {
        if (e.key === 'ArrowRight' || e.key === 'PageDown') { diapositiva(1); e.preventDefault(); }
        else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { diapositiva(-1); e.preventDefault(); }
        else if (e.key === 'Escape') esciPresentazione();
        else if (e.key === ' ') { $('didPausa').click(); e.preventDefault(); }
        return;
      }
      if (e.key === 'Escape') { chiudiScheda(); inter = null; impostaStrumento('sel'); disegna2D(); return; }
      if (inCampo) return;
      if ((e.key === 'Delete' || e.key === 'Backspace') && S.sel >= 0) { eliminaPiega(S.sel); e.preventDefault(); }
      else if (e.key === ' ') { avviaPlay(); e.preventDefault(); }
      else if (e.key === 'p' || e.key === 'P') impostaStrumento('piega');
      else if (e.key === 'v' || e.key === 'V') impostaStrumento('sel');
      else if (e.key === 'b' || e.key === 'B') impostaStrumento('base');
    });

    new ResizeObserver(ridimensiona).observe(cont);
    new ResizeObserver(() => { disegna2D(); }).observe(tela);
  }

  /* -------------------------------------------------------------- avvio */
  popolaPannello();
  collega();
  impostaStrumento('sel');
  ridimensiona();
  caricaEsempio('cestino', { progresso: 1 });
  requestAnimationFrame(ciclo);
  setTimeout(preparaAnteprime, 2500);
  window.PIEGA = { S, caricaEsempio, inquadra, caricaFile };
})();
