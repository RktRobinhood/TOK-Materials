/* GLOBAL DAY '26 | One lightweight vanilla-JS file. No API, server, analytics or dependencies. */
(() => {
  'use strict';
  const allScenes = [...document.querySelectorAll('.scene')];
  const $ = (selector) => document.querySelector(selector);
  const stage = $('#main');
  const menu = $('#sceneMenu');
  const menuToggle = $('#menuToggle');
  const prev = $('#prevScene');
  const next = $('#nextScene');
  let sceneIndex = 0;
  let toastTimeout;

  const padded = n => String(n).padStart(2, '0');
  function message(text) {
    const toast = $('#toast');
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600);
  }
  function closeMenu() {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
  }
  function toggleMenu() {
    const open = !menu.classList.contains('is-open');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menuToggle.setAttribute('aria-expanded', String(open));
    if (open) $('#menuClose').focus();
    else menuToggle.focus();
  }
  function goTo(index, { updateUrl = true } = {}) {
    index = Math.max(0, Math.min(allScenes.length - 1, Number(index)));
    if (!Number.isFinite(index)) return;
    const oldIndex = sceneIndex;
    sceneIndex = index;
    allScenes.forEach((slide, i) => {
      const active = i === index;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      if (active && oldIndex !== index) slide.scrollTop = 0;
    });
    $('#slideCounter').textContent = padded(index + 1);
    $('#sceneTitle').textContent = allScenes[index].dataset.title;
    $('#progressFill').style.width = `${(index + 1) / allScenes.length * 100}%`;
    prev.disabled = index === 0;
    next.disabled = index === allScenes.length - 1;
    if (updateUrl) window.history.replaceState(null, '', `#${allScenes[index].id}`);
    closeMenu();
  }
  allScenes.forEach((s, i) => s.inert = i !== 0);
  const startId = window.location.hash.replace(/^#/, '');
  const startIndex = allScenes.findIndex(s => s.id === startId);
  goTo(startIndex >= 0 ? startIndex : 0, { updateUrl: false });

  document.querySelectorAll('[data-goto]').forEach(btn => btn.addEventListener('click', () => goTo(btn.dataset.goto)));
  prev.addEventListener('click', () => goTo(sceneIndex - 1));
  next.addEventListener('click', () => goTo(sceneIndex + 1));
  menuToggle.addEventListener('click', toggleMenu);
  $('#menuClose').addEventListener('click', () => { closeMenu(); menuToggle.focus(); });
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const editing = e.target.closest('input,textarea,select,[contenteditable="true"]');
    if (e.key === 'Escape' && menu.classList.contains('is-open')) { e.preventDefault(); closeMenu(); menuToggle.focus(); return; }
    if (e.key.toLowerCase() === 'f' && !editing && !menu.classList.contains('is-open')) { e.preventDefault(); toggleFullscreen(); return; }
    if (editing || menu.classList.contains('is-open')) return;
    // Do not steal Space/arrow activation from focused interactive controls.
    const onControl = e.target.closest('button,a,[role="tab"]');
    if (onControl && [' ', 'Enter'].includes(e.key)) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !onControl)) { e.preventDefault(); goTo(sceneIndex + 1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goTo(sceneIndex - 1); }
    else if (e.key === 'Home' && !onControl) { e.preventDefault(); goTo(0); }
    else if (e.key === 'End' && !onControl) { e.preventDefault(); goTo(allScenes.length - 1); }
  });
  window.addEventListener('hashchange', () => {
    const index = allScenes.findIndex(s => s.id === window.location.hash.slice(1));
    if (index >= 0 && index !== sceneIndex) goTo(index, { updateUrl: false });
  });

  let touchStart = null;
  stage.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || e.target.closest('input,textarea,button,iframe,.planner-form')) return;
    touchStart = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (!touchStart || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - touchStart.x;
    const dy = e.changedTouches[0].clientY - touchStart.y;
    touchStart = null;
    if (Math.abs(dx) > 95 && Math.abs(dx) > Math.abs(dy) * 1.8) goTo(sceneIndex + (dx < 0 ? 1 : -1));
  }, { passive: true });

  function toggleFullscreen() {
    if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
    if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen().catch(() => message('Fullscreen is not available here. Use F11 if needed.'));
    else message('Use F11 in your browser for fullscreen.');
  }
  $('#fullscreenToggle').addEventListener('click', toggleFullscreen);

  // Before / after: a deliberately inexpensive, illustrated, non-prescriptive example.
  let elevated = false;
  $('#elevateToggle').addEventListener('click', () => {
    elevated = !elevated;
    $('#elevateToggle').setAttribute('aria-pressed', String(elevated));
    $('#biteImage').src = elevated ? 'assets/bite-after.svg' : 'assets/bite-before.svg';
    $('#biteImage').alt = elevated ? 'Illustration of the same potato bite elevated with colour, texture and garnishes' : 'Illustration of a simple everyday potato bite';
    $('#biteImage').classList.remove('pop');
    void $('#biteImage').offsetWidth;
    $('#biteImage').classList.add('pop');
    $('#biteTitle').textContent = elevated ? 'SAME INGREDIENT. NEW EXPERIENCE.' : 'START WITH SOMETHING SIMPLE.';
    $('#biteDescription').textContent = elevated ? 'Colour + contrast + a deliberate serving = a more memorable bite.' : 'A familiar ingredient. A genuine connection to the dish.';
    $('#elevateToggle').innerHTML = elevated ? 'BACK TO BASICS <span aria-hidden="true">↺</span>' : 'ELEVATE THE BITE <span aria-hidden="true">↗</span>';
  });

  // Video: no tracking/embed request until play is clicked. Both are official YouTube pages.
  const videos = {
    jolly: { id: 'wi7T7pJsnC0', source: 'JOLLY / YOUTUBE', title: 'British Highschoolers try Michelin star food for the first time!' },
    masterchef: { id: 'YGxRv5MELgo', source: 'MASTERCHEF WORLD / YOUTUBE', title: 'Perfecting Plating | MasterChef Canada | MasterChef World' }
  };
  let selectedVideo = 'jolly';
  const videoPlayer = $('#videoPlayer');
  const initialPreview = videoPlayer.innerHTML;
  function setVideo(key) {
    if (!(key in videos)) return;
    selectedVideo = key;
    const v = videos[key];
    videoPlayer.innerHTML = initialPreview;
    $('#videoSource').textContent = v.source;
    $('#videoTitle').textContent = v.title;
    $('#videoExternal').href = `https://www.youtube.com/watch?v=${v.id}`;
    document.querySelectorAll('.video-tab').forEach(tab => {
      const active = tab.dataset.video === key;
      tab.classList.toggle('is-selected', active);
      tab.setAttribute('aria-selected', String(active));
    });
    $('#videoPlay').addEventListener('click', playVideo);
  }
  function playVideo() {
    const video = videos[selectedVideo];
    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`;
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    videoPlayer.replaceChildren(iframe);
  }
  document.querySelectorAll('.video-tab').forEach(btn => btn.addEventListener('click', () => setVideo(btn.dataset.video)));
  $('#videoPlay').addEventListener('click', playVideo);

  const lenses = {
    memory: { num:'01', kicker:'THE FOOD YOU GREW UP WITH', title:'A taste of home.', body:'Who makes it? When do you eat it? What memory, person or place lives inside this recipe?' },
    history: { num:'02', kicker:'FOOD HAS A PAST', title:'History you can taste.', body:'Did trade, migration, geography or resourcefulness shape the dish? Which part of its history is worth sharing?' },
    celebration: { num:'03', kicker:'FOOD BRINGS PEOPLE TOGETHER', title:'The occasion matters.', body:'Is it made for a festival, a family gathering or an ordinary Sunday? Who shares it, and why?' },
    innovation: { num:'04', kicker:'TRADITIONS ARE NOT FROZEN', title:'Culture keeps moving.', body:'How has the dish been adapted over time? What makes a creative version respectful rather than a cliché?' }
  };
  document.querySelectorAll('.lens-button').forEach(btn => btn.addEventListener('click', () => {
    const lens = lenses[btn.dataset.lens];
    document.querySelectorAll('.lens-button').forEach(b => b.classList.toggle('selected', b === btn));
    $('#lensNumber').textContent = lens.num;
    $('#lensKicker').textContent = lens.kicker;
    $('#lensHeading').textContent = lens.title;
    $('#lensCopy').textContent = lens.body;
  }));

  const beats = [
    { counter:'01 / THE OPENING TEN SECONDS', title:'Make us curious.', body:'Start with an image, sound, surprising detail or one strong line that makes someone want to taste your dish.', time:'00:00 → 00:10' },
    { counter:'02 / THE ROOTS', title:'Give it a past.', body:'Where does this dish come from? Offer one accurate detail about its history, place or tradition.', time:'00:10 → 00:25' },
    { counter:'03 / YOUR CONNECTION', title:'Make it personal.', body:'Why this dish, and why did your team choose it? Show the ingredient, person, celebration or experience that connects you.', time:'00:25 → 00:40' },
    { counter:'04 / THE BIGGER IDEA', title:'Show the meaning.', body:'What does this food reveal about the culture? Is there a fitting virtue—wisdom, hospitality or another? Explain rather than just name it.', time:'00:40 → 00:55' },
    { counter:'05 / THE HAND-OFF', title:'Invite a taste.', body:'Finish with a short line inviting visitors to try it and ask a question. Make it a conversation starter.', time:'00:55 → 01:00' }
  ];
  document.querySelectorAll('.film-beat').forEach(btn => btn.addEventListener('click', () => {
    const index = Number(btn.dataset.beat);
    const beat = beats[index];
    document.querySelectorAll('.film-beat').forEach(b => { const active = b === btn; b.classList.toggle('selected', active); b.setAttribute('aria-selected', String(active)); });
    $('#beatCounter').textContent = beat.counter;
    $('#beatTitle').textContent = beat.title;
    $('#beatBody').textContent = beat.body;
    $('#beatTime').textContent = beat.time;
  }));

  // Editable, privacy-conscious group brief: localStorage only; the website collects nothing.
  const KEY = 'ibg-global-day-2026-team-brief-v1';
  const form = $('#teamForm');
  const fields = [...form.querySelectorAll('input,textarea')];
  const requiredForProgress = ['cuisine','dish','expert','budget','crew','meaning','outreach','video','service'];
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || '{}');
    fields.forEach(field => { if (typeof saved[field.name] === 'string') field.value = saved[field.name]; });
  } catch (_) { /* e.g., blocked browser storage; the form remains usable. */ }
  function values() { return Object.fromEntries(fields.map(field => [field.name, field.value.trim()])); }
  function updatePlan() {
    const v = values();
    const complete = requiredForProgress.filter(name => v[name] !== '').length;
    const pct = Math.round(100 * complete / requiredForProgress.length);
    $('#completionPercent').textContent = `${pct}%`;
    $('#completionBar').style.width = `${pct}%`;
    const budget = Number(v.budget);
    const info = $('#budgetFeedback');
    info.classList.remove('good', 'warning');
    if (!v.budget) info.textContent = 'Teacher sign-off comes before budget approval or spending.';
    else if (budget > 200) { info.classList.add('warning'); info.textContent = 'Above the 150–200 DKK working range. Discuss the budget with your teacher before buying anything.'; }
    else if (budget < 150) { info.textContent = 'Below the working range—fine as an idea, but confirm the approved budget with your teacher.'; }
    else { info.classList.add('good'); info.textContent = 'Within the working range. Still requires teacher approval before spending.'; }
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (_) {}
  }
  fields.forEach(field => field.addEventListener('input', updatePlan));
  updatePlan();
  $('#downloadBrief').addEventListener('click', () => {
    const v = values();
    if (!v.dish && !v.cuisine && !v.crew) { message('Add your cuisine, dish or group members first.'); return; }
    const name = (v.cuisine || 'global-day').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0,36) || 'global-day';
    const text = [
      'GLOBAL DAY 2026 — FOOD FAIR TEAM BRIEF',
      'Ikast-Brande Gymnasium | Wednesday 2 December | Module 5',
      '----------------------------------------',
      '',
      `COUNTRY / CUISINE: ${v.cuisine || 'Not decided'}`,
      `DISH: ${v.dish || 'Not decided'}`,
      `CULTURAL / CULINARY KNOW-HOW: ${v.expert || 'Not decided'}`,
      `ESTIMATED SPEND (DKK): ${v.budget || 'Not decided'}`,
      '',
      'GROUP MEMBERS AND RESPONSIBILITIES:', v.crew || 'Not decided',
      '',
      'CULTURAL STORY / WHY THIS DISH:', v.meaning || 'Not decided',
      '',
      '2i ENGLISH B RECRUITMENT PLAN:', v.outreach || 'Not decided',
      '',
      'ONE-MINUTE VIDEO PLAN:', v.video || 'Not decided',
      '',
      'COOKING / SERVICE PLAN:', v.service || 'Not decided',
      '',
      'VIRTUE CONNECTION (IF FITTING):', v.virtue || 'Not decided',
      '',
      'TEACHER APPROVAL — TO BE COMPLETED WITH TEACHER:',
      '[ ] Group approved (not a pair; workable size)',
      '[ ] Budget approved BEFORE buying ingredients',
      '[ ] Receipts planned / assigned',
      '[ ] Food preparation and cooking planned for Global Day',
      '[ ] Video includes origin, choice and cultural meaning',
      '[ ] 2i English B students contacted',
      '[ ] Allergen information / safe serving considered',
      '[ ] Guest portions protected until STX arrives',
      '',
      'NOTE: This is a planning document, not proof of approval.'
    ].join('\n');
    const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = `global-day-${name}-team-brief.txt`; document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1200);
    message('Team brief downloaded. Bring it to your teacher for approval.');
  });
  $('#printBrief').addEventListener('click', () => window.print());
  $('#resetBrief').addEventListener('click', () => {
    if (!window.confirm('Clear the entire team plan saved in this browser?')) return;
    form.reset(); updatePlan(); message('Local team brief cleared.');
  });
})();
