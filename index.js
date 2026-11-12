// Chronobox : tout ce qui compte le temps. Chronomètre avec tours, minuteurs (plusieurs en même temps), Pomodoro et comptes à
// rebours jusqu'à une date. Les temps sont calculés depuis l'heure de départ enregistrée : ils restent justes même si NeoDex
// est fermé puis rouvert entre-temps.
const CSS = `
.cbTabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.cbTabs .btn,.cbRow .btn{width:auto;margin:0;padding:6px 12px}
.cbBig{font:64px monospace;color:#fff;text-align:center;letter-spacing:2px;margin:10px 0;font-variant-numeric:tabular-nums}
.cbBig small{font-size:32px;color:var(--lilac)}
.cbRow{display:flex;gap:6px;flex-wrap:wrap;align-items:center;justify-content:center;margin:8px 0}
.cbRow .f{width:auto;margin:0}
.cbLaps{font:14px monospace;max-height:240px;overflow:auto;margin-top:8px}
.cbLaps div{display:flex;justify-content:space-between;padding:3px 8px;border-bottom:1px solid #241c40;color:var(--lilac)}
.cbLaps .best{color:#6ae06a}.cbLaps .worst{color:#ff4fb0}
.cbList{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px;margin-top:10px}
.cbCard{background:var(--bg0);border:2px solid var(--line);padding:10px;position:relative}
.cbCard.ring{border-color:#ffd34f;animation:cbBlink 1s steps(2) infinite}
@keyframes cbBlink{50%{border-color:var(--line)}}
.cbCard .t{font:30px monospace;color:#fff;text-align:center;margin:6px 0;font-variant-numeric:tabular-nums}
.cbCard .n{font-size:13px;color:var(--lilac);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cbCard .x{position:absolute;right:6px;top:4px;cursor:var(--cp,pointer);color:var(--muted)}
.cbBar{height:8px;background:#1a1430;border:1px solid #000;margin-top:6px}
.cbBar i{display:block;height:100%;background:var(--magenta)}
.cbCard .cbRow{justify-content:flex-start;margin:6px 0 0}
.cbCard .btn{padding:3px 10px!important}
.cbNum{width:64px!important}
.cbPhase{text-align:center;font-size:18px;color:#ffd34f;margin-top:4px}
.cbDots{text-align:center;font-size:18px;letter-spacing:6px;color:var(--magenta)}
`;
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
  console.assert(fmt(3723456) === '1:02:03.45' && fmt(59999, false) === '00:59' && elapsed({acc: 500, start: 1000}, 3000) === 2500 && fmtDays(90061000)[0] === 1, 'chronobox : formats');
  let data = null; try { data = await ctx.folder.read('chronobox'); } catch {}
  const st = {tab: data?.tab || 'stop', sw: data?.sw || {acc: 0, start: null, laps: []}, timers: data?.timers || [{id: 1, name: 'Thé', dur: 180000, acc: 0, start: null}, {id: 2, name: 'Pâtes', dur: 600000, acc: 0, start: null}],
    pomo: data?.pomo || {work: 25, short: 5, long: 15, every: 4, phase: 0, done: 0, acc: 0, start: null}, events: data?.events || [{id: 1, name: 'Nouvel an', at: new Date(new Date().getFullYear() + 1, 0, 1).getTime()}], sound: data?.sound ?? true};
  let saveT = 0; const save = () => { clearTimeout(saveT); saveT = setTimeout(() => ctx.folder.write('chronobox', st).catch(() => {}), 300); };
  const ring = (msg) => { if (st.sound) beep(); toast(msg); try { if (document.hidden) new Notification('Chronobox', {body: msg}); } catch {} };
  // ---------- l'interface ----------
  view.innerHTML = '';
  const wrap = el('div', 'appWrap'), head = el('div', 'agHead'), tabs = el('div', 'cbTabs'), body = el('div', 'sysCard px');
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
    refresh = now => { const t = elapsed(st.sw, now), s = fmt(t), k = s.lastIndexOf('.'); big.replaceChildren(s.slice(0, k), el('small', '', s.slice(k))); };
    draw(); drawLaps();
  }
  // ---------- minuteurs ----------
  function buildTimers() {
    const list = el('div', 'cbList'), add = el('div', 'cbRow'), nm = el('input', 'f'), mm = el('input', 'f cbNum'), ss = el('input', 'f cbNum');
    nm.placeholder = 'Nom'; nm.translate = false; mm.type = ss.type = 'number'; mm.min = ss.min = 0; mm.value = 5; ss.value = 0; mm.title = 'minutes'; ss.title = 'secondes'; mm.max = 999; ss.max = 59; nm.id = 'cb_tname'; mm.id = 'cb_tmin'; ss.id = 'cb_tsec';
    const addB = btn('+ Minuteur', () => { const dur = ((+mm.value || 0) * 60 + (+ss.value || 0)) * 1000; if (dur <= 0) return toast('Durée nulle'); st.timers.push({id: Date.now(), name: nm.value.trim() || fmt(dur, false), dur, acc: 0, start: null}); nm.value = ''; save(); drawList(); }, 'main');
    addB.id = 'cb_tadd'; add.append(nm, mm, el('span', 'hint', 'min'), ss, el('span', 'hint', 's'), addB);
    for (const m of [1, 3, 5, 10, 15, 30, 60]) add.append(btn(m + ' min', () => { mm.value = m; ss.value = 0; }));
    body.append(add, list);
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
    refresh = now => { for (const [t, k] of cards) { const left = t.dur - elapsed(t, now); k.tt.textContent = fmt(Math.max(0, left) + (left > 0 ? 999 : 0), false); k.fill.style.width = Math.min(100, elapsed(t, now) / t.dur * 100) + '%'; k.c.classList.toggle('ring', left <= 0 && t.start !== null); } };
    drawList();
  }
  // ---------- Pomodoro ----------
  const PHASES = ['Travail', 'Petite pause', 'Grande pause'];
  const phaseLen = p => (p.phase === 0 ? p.work : p.phase === 1 ? p.short : p.long) * 60000;
  function buildPomo() {
    const p = st.pomo, ph = el('div', 'cbPhase'), big = el('div', 'cbBig'), dots = el('div', 'cbDots'), row = el('div', 'cbRow'), cfg = el('div', 'cbRow'); big.translate = false; ph.id = 'cb_phase';
    const go = btn('', () => { const now = Date.now(); if (p.start === null) p.start = now; else { p.acc += now - p.start; p.start = null; } save(); draw(); }, 'main');
    const skip = btn('⏭ Passer', () => next(false)), rs = btn('⟲ Recommencer', () => { Object.assign(p, {phase: 0, done: 0, acc: 0, start: null}); save(); draw(); });
    row.append(go, skip, rs);
    for (const [k, t] of [['work', 'Travail'], ['short', 'Petite pause'], ['long', 'Grande pause'], ['every', 'Grande pause tous les']]) { const i = el('input', 'f cbNum'); i.type = 'number'; i.min = 1; i.max = k === 'every' ? 12 : 180; i.value = p[k]; i.onchange = () => { p[k] = Math.max(1, Math.min(+i.max, Math.round(+i.value) || 1)); i.value = p[k]; save(); draw(); }; cfg.append(el('span', 'hint', t), i, el('span', 'hint', k === 'every' ? '🍅' : 'min')); }
    body.append(ph, big, dots, row, cfg);
    function draw() { go.textContent = p.start !== null ? '❚❚ Pause' : '▶ Démarrer'; ph.replaceChildren(el('span', '', PHASES[p.phase])); dots.textContent = '●'.repeat(p.done % p.every) + '○'.repeat(p.every - p.done % p.every); }
    function next(auto) { if (p.phase === 0) { p.done++; p.phase = p.done % p.every === 0 ? 2 : 1; } else p.phase = 0; p.acc = 0; p.start = auto ? Date.now() : null; save(); draw(); if (auto) ring(PHASES[p.phase] + ' !'); }
    refresh = now => { let left = phaseLen(p) - elapsed(p, now); if (left <= 0 && p.start !== null) { next(true); left = phaseLen(p); } big.textContent = fmt(Math.max(0, left) + 999, false); };
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
    refresh = now => { for (const [e, dd] of cards) { const left = e.at - now, [days, rest] = fmtDays(left); dd.replaceChildren(left < 0 ? '+' : '', String(days), el('small', '', ' j '), rest); dd.style.color = left < 0 ? 'var(--muted)' : ''; } };
    drawList();
  }
  function build() { body.replaceChildren(); ({stop: buildStop, timer: buildTimers, pomo: buildPomo, event: buildEvents})[st.tab](); refresh(Date.now()); }
  // une seule boucle : l'affichage, et les minuteurs qui sonnent même quand leur onglet n'est pas ouvert
  let raf = 0;
  function loop() { if (!view.isConnected) return; const now = Date.now();
    for (const t of st.timers) if (t.start !== null && !t.rang && elapsed(t, now) >= t.dur) { t.rang = true; save(); ring((t.name || 'Minuteur') + ' : terminé !'); }
    if (st.tab !== 'pomo' && st.pomo.start !== null && phaseLen(st.pomo) - elapsed(st.pomo, now) <= 0) { const p = st.pomo; if (p.phase === 0) { p.done++; p.phase = p.done % p.every === 0 ? 2 : 1; } else p.phase = 0; p.acc = 0; p.start = now; save(); ring(PHASES[p.phase] + ' !'); }
    refresh(now); raf = requestAnimationFrame(loop); }
  ctx.onClose?.(() => cancelAnimationFrame(raf));
  drawTabs(); build(); raf = requestAnimationFrame(loop);
}
