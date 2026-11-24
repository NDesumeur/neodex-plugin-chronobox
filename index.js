// Chronobox : tout ce qui compte le temps. Chronomètre avec tours, minuteurs (plusieurs en même temps), Pomodoro et comptes à
// rebours jusqu'à une date. Les temps sont calculés depuis l'heure de départ enregistrée : ils restent justes même si NeoDex
// est fermé puis rouvert entre-temps.
const CSS = `
.cbTabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cbTabs .btn,.cbRow .btn{width:auto;margin:0;padding:6px 12px}
.cbBig{text-align:center;margin:12px auto;padding:clamp(10px,2vh,22px) clamp(14px,2.4vw,34px);background:#05010b;box-shadow:0 0 0 3px var(--line),0 0 0 6px #05010b,inset 0 4px 0 rgba(255,255,255,.04);width:max-content;max-width:100%;box-sizing:border-box;overflow:hidden}
.cbPx{display:block;image-rendering:pixelated;max-width:100%;margin:0 auto}
.cbSr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.cbRow{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;margin:8px 0}
.cbRow .f{width:auto;margin:0}
.cbLaps{font:16px monospace;max-height:240px;overflow:auto;margin-top:8px}
.cbLaps div{display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px solid #241c40;color:var(--lilac)}
.cbLaps .best{color:#6ae06a}.cbLaps .worst{color:#ff4fb0}
.cbList{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-top:10px}
.cbCard{background:var(--bg0);border:2px solid var(--line);box-shadow:4px 4px 0 #05010b;padding:12px;position:relative}
.cbCard.ring{border-color:#ffd34f;animation:cbBlink 1s steps(2) infinite}
@keyframes cbBlink{50%{border-color:var(--line)}}
.cbCard .t{text-align:center;margin:8px 0;padding:8px 4px;background:#05010b;box-shadow:inset 0 0 0 2px var(--line)}
.cbCard .n{font-size:15px;color:var(--lilac);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cbCard .x{position:absolute;right:6px;top:4px;cursor:var(--cp,pointer);color:var(--muted)}
.cbBar{height:8px;background:#1a1430;border:1px solid #000;margin-top:6px}
.cbBar i{display:block;height:100%;background:var(--magenta)}
.cbCard .cbRow{justify-content:flex-start;margin:6px 0 0}
.cbCard .btn{padding:3px 10px!important}
.cbNum{width:64px!important}
.cbPhase{text-align:center;font-size:22px;color:#ffd34f;margin-top:4px}
.cbDots{text-align:center;font-size:24px;letter-spacing:6px;color:var(--magenta)}
.cbFocus{display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap;margin:10px 0}.cbFocus label{display:flex;gap:6px;align-items:center;cursor:var(--cp,pointer)}.cbFocus .f{flex:1;min-width:220px;max-width:520px;margin:0}
.cbGrow{display:flex;gap:clamp(14px,3vw,40px);justify-content:center;align-items:flex-end;flex-wrap:wrap;margin-top:14px}
.cbTree{width:clamp(96px,14vh,168px);height:auto;image-rendering:pixelated;background:#05010b;box-shadow:0 0 0 3px var(--line)}
.cbStats{display:flex;flex-direction:column;gap:8px;min-width:260px}.cbWeek{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;align-items:end;height:110px}
.cbWeek div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;height:100%;gap:3px;font-size:12px;color:var(--muted)}.cbWeek i{display:block;width:100%;min-height:2px;background:#4a9a4a;box-shadow:inset 0 2px 0 #7ee07a}.cbWeek .today{color:#fff}.cbWeek .today i{background:#7ee07a}
.cbForest{display:flex;flex-wrap:wrap;gap:2px;max-width:340px}.cbForest canvas{width:30px;height:30px;image-rendering:pixelated}
`;
// les gros chiffres : une police 5 × 7 dessinée à la main, agrandie sans lissage ; derrière chaque chiffre, un « 8 » fantôme comme sur un écran LCD
const PXD = {0: '01110100011001110101110011000101110', 1: '00100011000010000100001000010001110', 2: '01110100010000100010001000100011111', 3: '11110000010000101110000010000111110',
  4: '00010001100101010010111110001000010', 5: '11111100001111000001000011000101110', 6: '01110100001000011110100011000101110', 7: '11111000010001000100010000100001000',
  8: '01110100011000101110100011000101110', 9: '01110100011000101111000010000101110', ':': '00000001000010000000001000010000000', '.': '00000000000000000000000000110001100',
  '-': '00000000000000011111000000000000000', '+': '00000001000010011111001000010000000', ' ': '00000000000000000000000000000000000', j: '00010000000001000010000101001001100'};
function pxText(g, parts, ghost) {  // parts : [[texte, échelle, couleur]] ; renvoie la largeur
  let x = 0; const H = Math.max(...parts.map(q => q[1])) * 7;
  for (const [t, s, col] of parts) for (const ch of t) {
    const m = PXD[ch] ?? PXD[' '], w = ch === ':' || ch === '.' ? 3 : 5, dx = ch === ':' || ch === '.' ? -1 : 0, y0 = H - s * 7;
    if (g) for (let k = 0; k < 35; k++) { const cx = k % 5 + dx, on = m[k] === '1', gh = ghost && w === 5 && PXD[8][k] === '1'; if ((on || gh) && cx >= 0 && cx < w) { g.fillStyle = on ? col : ghost; g.fillRect(x + cx * s, y0 + Math.floor(k / 5) * s, s, s); } }
    x += (w + 1) * s;
  }
  return x;
}
function pxTime(box, parts) {  // dessine dans box (une seule fois par texte) ; le texte reste lisible pour les lecteurs d'écran et le test
  const text = parts.map(q => q[0]).join(''), key = text + '|' + parts.map(q => q[1]).join(',');
  if (box.dataset.k === key) return; box.dataset.k = key;
  let c = box.querySelector('canvas'), sr = box.querySelector('.cbSr');
  if (!c) { c = document.createElement('canvas'); c.className = 'cbPx'; sr = document.createElement('span'); sr.className = 'cbSr'; box.replaceChildren(sr, c); }
  sr.textContent = text;
  const S = Math.max(...parts.map(q => q[1])); c.width = Math.max(1, pxText(null, parts) + S); c.height = S * 8; const g = c.getContext('2d');
  g.save(); g.translate(Math.ceil(S / 3), Math.ceil(S / 3)); pxText(g, parts.map(q => [q[0], q[1], '#05010b'])); g.restore();  // l'ombre
  pxText(g, parts, 'rgba(255,255,255,.06)');
}
function drawTree(g, prog) {
  const R = (c, x, y, w, h) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  g.clearRect(0, 0, 24, 24); R('#5a3a22', 0, 20, 24, 4); R('#4a9a4a', 0, 19, 24, 1); R('#4a2e1a', 4, 22, 2, 1); R('#4a2e1a', 17, 21, 2, 1);
  if (prog < .15) { R('#8a5a2a', 11, 18, 2, 2); R('#c08a4a', 11, 18, 1, 1); return 0; }
  if (prog < .35) { R('#3a8a3a', 11, 15, 1, 4); R('#5ab85a', 9, 14, 2, 2); R('#5ab85a', 12, 13, 2, 2); return 1; }
  if (prog < .6) { R('#3a8a3a', 11, 12, 1, 7); R('#4aa04a', 8, 9, 7, 4); R('#5ab85a', 9, 8, 5, 2); R('#7ee07a', 10, 8, 2, 1); return 2; }
  if (prog < .85) { R('#5a3a22', 11, 12, 2, 7); R('#2f6a32', 7, 5, 10, 8); R('#3a8a3a', 8, 4, 8, 7); R('#5ab85a', 9, 4, 4, 2); return 3; }
  R('#5a3a22', 10, 11, 3, 8); R('#4a2e1a', 12, 11, 1, 8); R('#2f6a32', 4, 4, 16, 9); R('#3a8a3a', 5, 2, 14, 9); R('#4aa04a', 6, 1, 10, 6); R('#7ee07a', 7, 2, 4, 2); R('#ff7a9a', 8, 7, 1, 1); R('#ff7a9a', 15, 5, 1, 1); R('#ff7a9a', 12, 9, 1, 1); return 4;
}
const bigS = () => Math.max(6, Math.min(14, Math.round(innerHeight / 88))), cardS = () => Math.max(4, Math.min(7, Math.round(innerHeight / 170)));
const pad = (n, w = 2) => String(Math.floor(n)).padStart(w, '0');
function fmt(ms, cs = true) { const neg = ms < 0; ms = Math.abs(ms); const h = Math.floor(ms / 3600000), m = Math.floor(ms / 60000) % 60, s = Math.floor(ms / 1000) % 60;
  return (neg ? '-' : '') + (h ? h + ':' + pad(m) : pad(m)) + ':' + pad(s) + (cs ? '.' + pad(ms / 10 % 100) : ''); }
function fmtDays(ms) { const d = Math.floor(Math.abs(ms) / 86400000), rest = Math.abs(ms) % 86400000; return [d, fmt(rest, false)]; }
// l'état d'un chrono : {start, acc} ; en marche si start !== null ; temps écoulé = acc + (maintenant - start)
const elapsed = (c, now) => c.acc + (c.start !== null ? now - c.start : 0);
// la sonnerie : trois bips pixel, joués avec WebAudio
let ac = null;
function beep(times = 3) { try { ac = ac || new AudioContext(); if (ac.state === 'suspended') ac.resume(); const t = ac.currentTime;
  for (let i = 0; i < times; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = i % 2 ? 1320 : 880; g.gain.setValueAtTime(.12, t + i * .22); g.gain.setValueAtTime(0, t + i * .22 + .15); o.connect(g); g.connect(ac.destination); o.start(t + i * .22); o.stop(t + i * .22 + .16); } } catch {} }
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast } = ctx.host;
  ctx.host.addStyle(CSS);
  console.assert(pxText(null, [['12:34', 2, '#fff']]) === 4 * 12 + 8 && Object.values(PXD).every(m => m.length === 35), 'chronobox : police pixel');
  console.assert(fmt(3723456) === '1:02:03.45' && fmt(59999, false) === '00:59' && elapsed({acc: 500, start: 1000}, 3000) === 2500 && fmtDays(90061000)[0] === 1, 'chronobox : formats');
  let data = null; try { data = await ctx.folder.read('chronobox'); } catch {}
  const st = {tab: data?.tab || 'stop', sw: data?.sw || {acc: 0, start: null, laps: []}, timers: data?.timers || [{id: 1, name: 'Thé', dur: 180000, acc: 0, start: null}, {id: 2, name: 'Pâtes', dur: 600000, acc: 0, start: null}],
    pomo: data?.pomo || {work: 25, short: 5, long: 15, every: 4, phase: 0, done: 0, acc: 0, start: null}, events: data?.events || [{id: 1, name: 'Nouvel an', at: new Date(new Date().getFullYear() + 1, 0, 1).getTime()}], sound: data?.sound ?? true, log: data?.log || {}};
  st.pomo.focus ??= true; st.pomo.sites ??= 'youtube.com, twitch.tv, reddit.com, x.com, tiktok.com, instagram.com, facebook.com';
  let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => ctx.folder.write('chronobox', st).catch(() => {}), 300); };
  const ring = (msg) => { if (st.sound) beep(); toast(msg); try { if (document.hidden) new Notification('Chronobox', {body: msg}); } catch {} };
  // ---------- l'interface ----------
  view.innerHTML = '';
  const wrap = el('div', 'appWrap wide'), head = el('div', 'agHead'), tabs = el('div', 'cbTabs'), body = el('div', 'sysCard px');
  head.append(el('span', 'label', 'Chronobox · le temps qui passe')); wrap.append(head, tabs, body); view.append(wrap);
  const TABS = [['stop', '⏱ Chronomètre'], ['timer', '⏲ Minuteurs'], ['pomo', '🍅 Pomodoro'], ['event', '📅 Comptes à rebours']];
  function drawTabs() { tabs.replaceChildren(...TABS.map(([k, t]) => { const b = el('button', 'btn px' + (st.tab === k ? ' main' : ''), t); b.dataset.tab = k; b.onclick = () => { st.tab = k; save(); drawTabs(); build(); }; return b; }),
    (() => { const b = el('button', 'btn px' + (st.sound ? ' main' : ''), st.sound ? '🔔 Son' : '🔕 Muet'); b.onclick = () => { st.sound = !st.sound; save(); drawTabs(); if (st.sound) beep(1); }; return b; })()); }
  const btn = (t, f, cls = '') => { const b = el('button', 'btn px ' + cls, t); b.onclick = f; return b; };
  let refresh = () => {};
  // ---------- chronomètre ----------
  function buildStop() {
    const big = el('div', 'cbBig'), row = el('div', 'cbRow'), laps = el('div', 'cbLaps'); big.id = 'cb_sw'; big.translate = false; laps.translate = false;
    const go = btn('', () => { const now = Date.now(), c = st.sw; if (c.start === null) c.start = now; else { c.acc += now - c.start; c.start = null; } save(); draw(); }, 'main'), lap = btn('', () => { const c = st.sw; if (c.start !== null) { c.laps.push(elapsed(c, Date.now())); save(); drawLaps(); } else { c.acc = 0; c.laps = []; save(); draw(); drawLaps(); } });
    go.id = 'cb_go'; lap.id = 'cb_lap';
    row.append(go, lap); body.append(big, row, laps);
    function drawLaps() { const L = st.sw.laps, d = L.map((t, i) => t - (L[i - 1] || 0)), mn = Math.min(...d), mx = Math.max(...d);
      laps.replaceChildren(...L.map((t, i) => [t, i]).reverse().map(([t, i]) => { const r = el('div', d.length > 1 && d[i] === mn ? 'best' : d.length > 1 && d[i] === mx ? 'worst' : ''); r.append(el('span', '', '#' + (i + 1)), el('span', '', '+' + fmt(d[i])), el('span', '', fmt(t))); return r; })); }
    function draw() { const on = st.sw.start !== null; go.textContent = on ? '❚❚ Pause' : st.sw.acc ? '▶ Reprendre' : '▶ Démarrer'; lap.textContent = on ? '⚑ Tour' : '⟲ Remettre à zéro'; lap.disabled = !on && !st.sw.acc; }
    refresh = now => { const t = elapsed(st.sw, now), s = fmt(t), k = s.lastIndexOf('.'), S = bigS(); pxTime(big, [[s.slice(0, k), S, '#ffffff'], [s.slice(k), Math.round(S * .55), '#d9c6ff']]); };
    draw(); drawLaps();
  }
  // ---------- minuteurs ----------
  function buildTimers() {
    const list = el('div', 'cbList'), add = el('div', 'cbRow'), quick = el('div', 'cbRow'), nm = el('input', 'f'), hh = el('input', 'f cbNum'), mm = el('input', 'f cbNum'), ss = el('input', 'f cbNum');
    nm.placeholder = 'Nom'; nm.translate = false; hh.type = mm.type = ss.type = 'number'; hh.min = mm.min = ss.min = 0; hh.value = 0; mm.value = 5; ss.value = 0; hh.title = 'heures'; mm.title = 'minutes'; ss.title = 'secondes'; hh.max = 99; mm.max = 999; ss.max = 59; hh.id = 'cb_thour'; nm.id = 'cb_tname'; mm.id = 'cb_tmin'; ss.id = 'cb_tsec';
    const addB = btn('+ Minuteur', () => { const dur = Math.min(99 * 3600, (+hh.value || 0) * 3600 + (+mm.value || 0) * 60 + (+ss.value || 0)) * 1000; if (dur <= 0) return toast('Durée nulle'); st.timers.push({id: Date.now(), name: nm.value.trim() || fmt(dur, false), dur, acc: 0, start: null}); nm.value = ''; save(); drawList(); }, 'main');
    addB.id = 'cb_tadd'; add.append(nm, hh, el('span', 'hint', 'h'), mm, el('span', 'hint', 'min'), ss, el('span', 'hint', 's'), addB);
    for (const m of [1, 3, 5, 10, 15, 25, 30, 45, 60, 120]) quick.append(btn(m < 60 ? m + ' min' : m / 60 + ' h', () => { hh.value = m / 60 | 0; mm.value = m % 60; ss.value = 0; }));
    body.append(add, quick, list);
    const cards = new Map();
    function drawList() {
      cards.clear(); list.replaceChildren(...st.timers.map(t => { const c = el('div', 'cbCard'), n = el('div', 'n', t.name), tt = el('div', 't'), bar = el('div', 'cbBar'), fill = el('i'), row = el('div', 'cbRow'), x = el('span', 'x', '✕');
        n.translate = false; tt.translate = false; bar.append(fill); x.title = 'Supprimer'; x.onclick = () => { st.timers = st.timers.filter(k => k !== t); save(); drawList(); };
        const go = btn('', () => { const now = Date.now(); if (elapsed(t, now) >= t.dur) { t.acc = 0; t.start = now; t.rang = false; } else if (t.start === null) t.start = now; else { t.acc += now - t.start; t.start = null; } save(); upd(); });
        const rs = btn('⟲', () => { t.acc = 0; t.start = null; t.rang = false; save(); upd(); }); const plus = btn('+1 min', () => { t.dur += 60000; t.rang = false; save(); upd(); });
        row.append(go, rs, plus); c.append(x, n, tt, bar, row); c.dataset.id = t.id;
        const upd = () => { const on = t.start !== null, left = t.dur - elapsed(t, Date.now()); go.textContent = left <= 0 ? '⟲ Relancer' : on ? '❚❚' : '▶'; }; upd();
        cards.set(t, {c, tt, fill, upd}); return c; }));
    }
    refresh = now => { for (const [t, k] of cards) { const left = t.dur - elapsed(t, now); pxTime(k.tt, [[fmt(Math.max(0, left) + (left > 0 ? 999 : 0), false), cardS(), left <= 0 ? '#ffd34f' : '#ffffff']]); k.fill.style.width = Math.min(100, elapsed(t, now) / t.dur * 100) + '%'; k.c.classList.toggle('ring', left <= 0 && t.start !== null); } };
    drawList();
  }
  // ---------- Pomodoro ----------
  const PHASES = ['Travail', 'Petite pause', 'Grande pause'];
  const phaseLen = p => (p.phase === 0 ? p.work : p.phase === 1 ? p.short : p.long) * 60000;
  const dk = t => { const d = new Date(t); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); };
  let pomoDraw = () => {}, focusKey = '', focusWarned = false, lastFocus = null;
  function pomoNext(auto, now = Date.now()) {
    const p = st.pomo;
    if (p.phase === 0) { const w = Math.min(elapsed(p, now), phaseLen(p)); if (auto || w >= 60000) { const l = st.log[dk(now)] ??= {min: 0, n: 0}; l.min += Math.round(w / 60000); if (auto) l.n++; } p.done++; p.phase = p.done % p.every === 0 ? 2 : 1; }
    else p.phase = 0;
    p.acc = 0; p.start = auto ? now : null; save(); syncFocus(); pomoDraw(); if (auto) ring(PHASES[p.phase] + (p.phase ? ' ! Un arbre de plus dans ta forêt.' : ' !'));
  }
  // la concentration : seulement pendant le travail en marche ; un appel à NeoDex quand ça change, pas à chaque image
  function syncFocus() {
    if (!ctx.focus) return;
    const p = st.pomo, on = p.focus && p.phase === 0 && p.start !== null, end = on ? p.start + phaseLen(p) - p.acc : 0, key = on ? end + '|' + p.sites : '';
    if (key === focusKey) return; focusKey = key;
    ctx.focus(on ? {minutes: Math.max(1, (end - Date.now()) / 60000 + .5), block: p.sites.split(/[\s,;]+/).filter(Boolean)} : {minutes: 0})
      .then(r => { lastFocus = r; }).catch(e => { focusKey = ''; if (!focusWarned) { focusWarned = true; toast('Mode concentration indisponible : ' + e.message); } });
  }
  function buildPomo() {
    const p = st.pomo, ph = el('div', 'cbPhase'), big = el('div', 'cbBig'), dots = el('div', 'cbDots'), row = el('div', 'cbRow'), cfg = el('div', 'cbRow'); big.translate = false; ph.id = 'cb_phase';
    const go = btn('', () => { const now = Date.now(); if (p.start === null) p.start = now; else { p.acc += now - p.start; p.start = null; } save(); syncFocus(); draw(); }, 'main');
    const skip = btn('⏭ Passer', () => pomoNext(false)), rs = btn('⟲ Recommencer', () => { Object.assign(p, {phase: 0, done: 0, acc: 0, start: null}); save(); syncFocus(); draw(); });
    go.id = 'cb_pgo';
    row.append(go, skip, rs);
    for (const [k, t] of [['work', 'Travail'], ['short', 'Petite pause'], ['long', 'Grande pause'], ['every', 'Grande pause tous les']]) { const i = el('input', 'f cbNum'); i.type = 'number'; i.min = 1; i.max = k === 'every' ? 12 : 180; i.value = p[k]; i.onchange = () => { p[k] = Math.max(1, Math.min(+i.max, Math.round(+i.value) || 1)); i.value = p[k]; save(); syncFocus(); draw(); }; cfg.append(el('span', 'hint', t), i, el('span', 'hint', k === 'every' ? '🍅' : 'min')); }
    // le mode concentration, l'arbre qui pousse, la forêt du jour et la semaine
    const foc = el('div', 'cbFocus'), lab = el('label'), cb = el('input'), sites = el('input', 'f');
    cb.type = 'checkbox'; cb.checked = p.focus; cb.id = 'cb_focus'; lab.append(cb, el('span', '', 'Mode concentration')); lab.title = 'Pendant le travail : notifications en silence et ces sites bloqués dans NeoDex';
    sites.value = p.sites; sites.id = 'cb_sites'; sites.placeholder = 'Sites à bloquer, séparés par des virgules'; sites.translate = false; sites.spellcheck = false;
    cb.onchange = () => { p.focus = cb.checked; save(); syncFocus(); }; sites.onchange = () => { p.sites = sites.value; save(); syncFocus(); };
    foc.append(lab, sites); if (!ctx.focus) foc.append(el('span', 'hint', 'Mets NeoDex à jour (3.4.2 ou plus) pour bloquer les sites et couper les notifications.'));
    const grow = el('div', 'cbGrow'), tree = el('canvas', 'cbTree'), stats = el('div', 'cbStats'); tree.width = tree.height = 24; tree.id = 'cb_tree'; tree.setAttribute('role', 'img');
    grow.append(tree, stats); body.append(ph, big, dots, row, foc, grow, cfg);
    const tg = tree.getContext('2d'); let stage = -1;
    function drawStats() {
      const now = new Date(), mon = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (now.getDay() + 6) % 7), days = [...Array(7)].map((_, i) => dk(new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + i, 12)));
      const L = days.map(d => st.log[d] || {min: 0, n: 0}), mx = Math.max(60, ...L.map(l => l.min)), tot = L.reduce((a, l) => a + l.min, 0), trees = L.reduce((a, l) => a + l.n, 0);
      const week = el('div', 'cbWeek'); week.id = 'cb_week';
      days.forEach((d, i) => { const c = el('div', d === dk(now) ? 'today' : ''), bar = el('i'); bar.style.height = L[i].min / mx * 80 + '%'; c.title = L[i].min + ' min, ' + L[i].n + ' 🌳'; c.append(el('span', '', L[i].min ? String(L[i].min) : ''), bar, el('span', '', 'LMMJVSD'[i])); week.append(c); });
      const forest = el('div', 'cbForest'), today = st.log[dk(now)]?.n || 0;
      for (let i = 0; i < Math.min(today, 24); i++) { const t = el('canvas'); t.width = t.height = 24; drawTree(t.getContext('2d'), 1); forest.append(t); }
      if (today > 24) forest.append(el('span', 'hint', '+' + (today - 24)));
      stats.replaceChildren(el('span', 'label', 'Cette semaine'), week, el('span', 'hint', Math.floor(tot / 60) + ' h ' + pad(tot % 60) + ' min de travail · ' + trees + ' arbre(s) planté(s)'), el('span', 'label', today ? 'Ta forêt du jour' : 'Termine un temps de travail pour planter un arbre'), forest);
    }
    function draw() { drawStats(); go.textContent = p.start !== null ? '❚❚ Pause' : '▶ Démarrer'; ph.replaceChildren(el('span', '', PHASES[p.phase])); dots.textContent = '●'.repeat(p.done % p.every) + '○'.repeat(p.every - p.done % p.every); }
    pomoDraw = draw;
    refresh = now => { let left = phaseLen(p) - elapsed(p, now); if (left <= 0 && p.start !== null) { pomoNext(true, now); left = phaseLen(p); }
      const prog = p.phase === 0 ? Math.min(1, elapsed(p, now) / phaseLen(p)) : 1; if (Math.floor(prog * 40) !== stage) { stage = Math.floor(prog * 40); const k = drawTree(tg, prog); tree.setAttribute('aria-label', ['Une graine', 'Une pousse', 'Un petit plant', 'Un jeune arbre', 'Un grand arbre'][k] + (p.phase === 0 && p.start === null && p.acc ? ', en pause' : '')); } pxTime(big, [[fmt(Math.max(0, left) + 999, false), bigS(), p.phase ? '#7ee07a' : '#ffffff']]); };
    draw();
  }
  // ---------- comptes à rebours vers une date ----------
  function buildEvents() {
    const list = el('div', 'cbList'), add = el('div', 'cbRow'), nm = el('input', 'f'), when = el('input', 'f');
    nm.placeholder = 'Événement'; nm.translate = false; when.type = 'datetime-local'; const d = new Date(Date.now() + 7 * 86400000); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); when.value = d.toISOString().slice(0, 16);
    add.append(nm, when, btn('+ Ajouter', () => { const at = new Date(when.value).getTime(); if (!at) return toast('Date invalide'); st.events.push({id: Date.now(), name: nm.value.trim() || when.value.replace('T', ' '), at}); st.events.sort((a, b) => a.at - b.at); nm.value = ''; save(); drawList(); }, 'main'));
    body.append(add, list);
    const cards = [];
    function drawList() { cards.length = 0; list.replaceChildren(...st.events.map(e => { const c = el('div', 'cbCard'), n = el('div', 'n', e.name), dd = el('div', 't'), sub = el('div', 'hint'), x = el('span', 'x', '✕');
      n.translate = false; dd.translate = false; sub.translate = false; sub.textContent = new Date(e.at).toLocaleString('fr-FR', {dateStyle: 'full', timeStyle: 'short'}); x.onclick = () => { st.events = st.events.filter(k => k !== e); save(); drawList(); };
      c.append(x, n, dd, sub); cards.push([e, dd]); return c; })); }
    refresh = now => { for (const [e, dd] of cards) { const left = e.at - now, [days, rest] = fmtDays(left); const S = cardS(), col = left < 0 ? '#8f7bb8' : '#ffffff'; pxTime(dd, [[(left < 0 ? '+' : '') + days, S, col], [' j ', Math.max(3, S - 2), '#d9c6ff'], [rest, S, col]]); } };
    drawList();
  }
  function build() { body.replaceChildren(); pomoDraw = () => {}; ({stop: buildStop, timer: buildTimers, pomo: buildPomo, event: buildEvents})[st.tab](); refresh(Date.now()); }
  // une seule boucle : l'affichage, et les minuteurs qui sonnent même quand leur onglet n'est pas ouvert
  let raf = 0;
  function loop() { if (!view.isConnected) return; const now = Date.now();
    for (const t of st.timers) if (t.start !== null && !t.rang && elapsed(t, now) >= t.dur) { t.rang = true; save(); ring((t.name || 'Minuteur') + ' : terminé !'); }
    if (st.tab !== 'pomo' && st.pomo.start !== null && phaseLen(st.pomo) - elapsed(st.pomo, now) <= 0) pomoNext(true, now);
    refresh(now); raf = requestAnimationFrame(loop); }
  ctx.onClose?.(() => cancelAnimationFrame(raf));
  console.assert((() => { const c = document.createElement('canvas').getContext('2d'); return [0, .2, .5, .7, 1].map(x => drawTree(c, x)).join() === '0,1,2,3,4'; })(), 'chronobox : arbre');
  view.__cb = {st, pomoNext, syncFocus, get lastFocus() { return lastFocus; }};  // pour le test « local »
  drawTabs(); build(); syncFocus(); raf = requestAnimationFrame(loop);
}
