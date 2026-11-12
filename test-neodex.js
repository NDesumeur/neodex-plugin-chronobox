// lancé par le test « local » de NeoDex : le chronomètre et un tour, un minuteur d'une seconde qui sonne, le Pomodoro, un compte à rebours
module.exports = async ({ pj, sleep }) => {
  const click = q => pj(`document.querySelector(${JSON.stringify(q)}).click(), 0`);
  await sleep(400);
  await click('[data-tab=stop]'); await click('#cb_go'); await sleep(700); await click('#cb_lap'); await click('#cb_go');
  const sw = await pj(`document.getElementById('cb_sw').textContent`), laps = await pj(`document.querySelectorAll('.cbLaps div').length`);
  if (!/^00:00\.[5-9]/.test(sw) || laps !== 1) throw new Error('chronomètre : ' + sw + ' / ' + laps + ' tour(s)');
  await click('#cb_lap');
  await click('[data-tab=timer]');
  await pj(`(() => { const s = (id, v) => { const i = document.getElementById(id); i.value = v; }; s('cb_tname', 'Test'); s('cb_tmin', 0); s('cb_tsec', 1); document.getElementById('cb_tadd').click(); })(), 0`); await sleep(100);
  await pj(`[...document.querySelectorAll('.cbCard')].pop().querySelector('.cbRow .btn').click(), 0`); await sleep(1600);
  if (!await pj(`[...document.querySelectorAll('.cbCard')].pop().classList.contains('ring')`)) throw new Error('le minuteur n\'a pas sonné');
  await pj(`[...document.querySelectorAll('.cbCard')].pop().querySelector('.x').click(), 0`);
  await click('[data-tab=pomo]');
  if (!/Travail/.test(await pj(`document.getElementById('cb_phase').textContent`))) throw new Error('pomodoro');
  await pj(`[...document.querySelectorAll('button')].find(b => b.textContent === '⏭ Passer').click(), 0`);
  if (!/Petite pause/.test(await pj(`document.getElementById('cb_phase').textContent`))) throw new Error('pomodoro passer');
  await pj(`[...document.querySelectorAll('button')].find(b => b.textContent === '⟲ Recommencer').click(), 0`);
  await click('[data-tab=event]'); await sleep(100);
  if (!/Nouvel an/.test(await pj(`document.querySelector('.cbList').textContent`))) throw new Error('compte à rebours');
  await click('[data-tab=timer]'); await sleep(200);
  return 'chronomètre, minuteur, Pomodoro et compte à rebours ok';
};
