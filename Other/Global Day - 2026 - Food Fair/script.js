/* Global Day '26 — zero-build static site. No tracking, analytics, external JS, or API keys. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const scenes = $$('.scene');
  const stage = $('#main');
  const menu = $('#sceneMenu');
  const menuToggle = $('#menuToggle');
  const prevButton = $('#prevScene');
  const nextButton = $('#nextScene');
  const videoBox = $('#videoPlayer');
  const videos = {
    jolly: {
      id: 'wi7T7pJsnC0',
      source: 'JOLLY · YOUTUBE',
      title: 'British Highschoolers try Michelin star food for the first time!',
      poster: 'assets/a-shared-bite.webp',
      posterAlt: 'Stylized illustration of students sharing a bite together'
    },
    masterchef: {
      id: 'YGxRv5MELgo',
      source: 'MASTERCHEF WORLD · YOUTUBE',
      title: 'Perfecting Plating | MasterChef Canada | MasterChef World',
      poster: 'assets/chef-at-work.webp',
      posterAlt: 'Stylized illustration of a chef carefully finishing a dish'
    }
  };
  let selectedVideo = 'jolly';
  let current = 0;
  let toastTimer;
  const posterTemplate = videoBox.innerHTML;
  const pad = n => String(n).padStart(2, '0');

  function notify(text) {
    const toast = $('#toast');
    toast.textContent = text;
    toast.classList.add('show');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove('show'), 2900);
  }

  // Leaving video scene, switching video tabs, hiding page, or opening chapters
  // tears down the iframe (not merely CSS-hiding it): sound/playback stops immediately.
  function resetVideoPlayer() {
    const oldFrame = videoBox.querySelector('iframe');
    if (oldFrame) {
      oldFrame.src = 'about:blank';
      oldFrame.remove();
    }
    videoBox.innerHTML = posterTemplate;
    const poster = $('#videoPosterImage');
    poster.src = videos[selectedVideo].poster;
    poster.alt = videos[selectedVideo].posterAlt;
  }
  function chooseVideo(key) {
    if (!(key in videos)) return;
    selectedVideo = key;
    resetVideoPlayer();
    const video = videos[key];
    $('#videoSource').textContent = video.source;
    $('#videoTitle').textContent = video.title;
    $('#videoExternal').href = `https://www.youtube.com/watch?v=${video.id}`;
    $$('.video-tab').forEach(button => {
      const active = button.dataset.video === key;
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-selected', String(active));
    });
  }
  function playVideo() {
    const video = videos[selectedVideo];
    const iframe = document.createElement('iframe');
    iframe.title = video.title;
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.referrerPolicy = 'strict-origin-when-cross-origin';
    iframe.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&playsinline=1`;
    videoBox.replaceChildren(iframe);
  }
  $$('.video-tab').forEach(tab => tab.addEventListener('click', () => chooseVideo(tab.dataset.video)));
  videoBox.addEventListener('click', e => { if (e.target.closest('#videoPlay')) playVideo(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) resetVideoPlayer(); });
  window.addEventListener('pagehide', resetVideoPlayer);

  function closeMenu({ restoreFocus = false } = {}) {
    menu.classList.remove('is-open');
    menu.setAttribute('aria-hidden', 'true');
    menuToggle.setAttribute('aria-expanded', 'false');
    menu.inert = true;
    if (restoreFocus) menuToggle.focus();
  }
  function toggleMenu() {
    if (menu.classList.contains('is-open')) { closeMenu({ restoreFocus: true }); return; }
    resetVideoPlayer(); // No hidden video continues while reading chapters.
    menu.inert = false;
    menu.classList.add('is-open');
    menu.setAttribute('aria-hidden', 'false');
    menuToggle.setAttribute('aria-expanded', 'true');
    $('#menuClose').focus();
  }
  function goTo(index, { updateHash = true } = {}) {
    if (!Number.isFinite(Number(index))) return;
    const nextIndex = Math.max(0, Math.min(scenes.length - 1, Number(index)));
    if (nextIndex !== current) resetVideoPlayer();
    current = nextIndex;
    scenes.forEach((slide, i) => {
      const active = i === current;
      slide.classList.toggle('is-active', active);
      slide.setAttribute('aria-hidden', String(!active));
      slide.inert = !active;
      if (active) slide.scrollTop = 0;
    });
    $('#slideCounter').textContent = pad(current + 1);
    $('#totalSlides').textContent = String(scenes.length);
    $('#sceneTitle').textContent = scenes[current].dataset.title;
    $('#progressFill').style.width = `${(current + 1) / scenes.length * 100}%`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === scenes.length - 1;
    document.body.classList.toggle('on-first-slide', current === 0);
    $$('#menuGrid [data-goto]').forEach(button => {
      if (Number(button.dataset.goto) === current) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    if (updateHash) history.replaceState(null, '', `#${scenes[current].id}`);
    closeMenu();
  }

  // Starting slide can be linked directly with a URL fragment.
  scenes.forEach((scene, i) => { scene.inert = i !== 0; });
  const requested = scenes.findIndex(scene => scene.id === location.hash.slice(1));
  goTo(requested >= 0 ? requested : 0, { updateHash: false });
  $$('[data-goto]').forEach(button => button.addEventListener('click', () => goTo(button.dataset.goto)));
  prevButton.addEventListener('click', () => goTo(current - 1));
  nextButton.addEventListener('click', () => goTo(current + 1));
  menuToggle.addEventListener('click', toggleMenu);
  $('#menuClose').addEventListener('click', () => closeMenu({ restoreFocus: true }));
  window.addEventListener('hashchange', () => {
    const index = scenes.findIndex(scene => scene.id === location.hash.slice(1));
    if (index >= 0 && index !== current) goTo(index, { updateHash: false });
  });
  function toggleFullscreen() {
    if (document.fullscreenElement) { document.exitFullscreen?.(); return; }
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen().catch(() => notify('Fullscreen not available here. Try the browser F11 key.'));
    } else notify('Use F11 in your browser for fullscreen.');
  }
  $('#fullscreenToggle').addEventListener('click', toggleFullscreen);
  document.addEventListener('keydown', e => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const editing = Boolean(e.target.closest('input,textarea,select,[contenteditable="true"]'));
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      e.preventDefault(); closeMenu({ restoreFocus: true }); return;
    }
    if (editing || menu.classList.contains('is-open')) return;
    if (e.key.toLowerCase() === 'f' && !e.repeat) { e.preventDefault(); toggleFullscreen(); return; }
    const onControl = Boolean(e.target.closest('button,a,[role="tab"]'));
    if ((e.key === 'ArrowRight' || e.key === 'PageDown' || (e.key === ' ' && !onControl))) {
      e.preventDefault(); goTo(current + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault(); goTo(current - 1);
    } else if (e.key === 'Home' && !onControl) {
      e.preventDefault(); goTo(0);
    } else if (e.key === 'End' && !onControl) {
      e.preventDefault(); goTo(scenes.length - 1);
    }
  });
  let swipe = null;
  stage.addEventListener('touchstart', e => {
    if (e.touches.length !== 1 || e.target.closest('button,input,textarea,select,iframe,.planner-form')) return;
    swipe = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, { passive: true });
  stage.addEventListener('touchend', e => {
    if (!swipe || e.changedTouches.length !== 1) return;
    const dx = e.changedTouches[0].clientX - swipe.x;
    const dy = e.changedTouches[0].clientY - swipe.y;
    swipe = null;
    if (Math.abs(dx) > 85 && Math.abs(dx) > Math.abs(dy) * 1.8) goTo(current + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Each class sees exactly its assigned outreach target in the reusable planner.
  const targets = {
    '1I TOK 1': { short: '1J · PRE-IB', detail: 'Invite and involve students from the 1J pre-IB class.' },
    '1I TOK 2': { short: '1K · PRE-IB', detail: 'Invite and involve students from the 1K pre-IB class.' },
    '1I TOK 3': { short: '2I · ENGLISH A ONLY', detail: 'Invite and involve 2I English A classes only—not English B.' },
    '1I TOK 4': { short: '2I · ENGLISH B ONLY', detail: 'Invite and involve 2I English B classes only—not English A.' }
  };
  const form = $('#teamForm');
  const inputs = [...form.querySelectorAll('input,textarea,select')];
  const formKey = 'global-day-2026-ibg-v2-team-brief';
  const completionFields = ['tokClass','culture','dish','expert','budget','members','story','outreach','video','service','virtue'];
  try {
    const saved = JSON.parse(localStorage.getItem(formKey) || '{}');
    inputs.forEach(input => {
      if (typeof saved[input.name] === 'string') input.value = saved[input.name];
    });
  } catch (error) { /* May fail in locked-down browsers. Site still works. */ }
  function formValues() { return Object.fromEntries(inputs.map(input => [input.name, input.value.trim()])); }
  function updateForm() {
    const data = formValues();
    const target = targets[data.tokClass];
    $('#targetClass').textContent = target?.short || 'SELECT YOUR TOK CLASS ↑';
    $('#targetDetail').textContent = target?.detail || 'Each TOK class has its own assigned outreach group.';
    const completed = completionFields.filter(name => Boolean(data[name])).length;
    const progress = Math.round(100 * completed / completionFields.length);
    $('#completionPercent').textContent = `${progress}%`;
    $('#completionBar').style.width = `${progress}%`;
    const msg = $('#budgetFeedback');
    msg.className = '';
    const budget = Number(data.budget);
    if (!data.budget) msg.textContent = 'Teacher must sign off on your group before budget approval. Keep receipts.';
    else if (budget > 200) { msg.classList.add('warning'); msg.textContent = 'Above the 150–200 DKK range. Revise your plan or speak to your teacher. Approval is still required.'; }
    else if (budget < 150) { msg.textContent = 'Below the 150–200 DKK working budget. Confirm the allocation and group plan with your teacher.'; }
    else { msg.classList.add('good'); msg.textContent = 'Within the working budget range. Teacher sign-off is still required BEFORE budget approval.'; }
    try { localStorage.setItem(formKey, JSON.stringify(data)); } catch (error) {}
  }
  inputs.forEach(input => input.addEventListener('input', updateForm));
  inputs.forEach(input => input.addEventListener('change', updateForm));
  updateForm();

  $('#downloadBrief').addEventListener('click', () => {
    const data = formValues();
    if (!data.culture && !data.dish && !data.members && !data.tokClass) {
      notify('Add your TOK class, culture, dish or group members before downloading.'); return;
    }
    const target = targets[data.tokClass];
    const get = key => data[key] || 'To be decided';
    const contents = [
      'GLOBAL DAY 2026 — GROUP PROPOSAL / WORKING DRAFT',
      'Ikast-Brande Gymnasium | Wednesday 2 December 2026 | Module 5',
      '==================================================',
      `TOK CLASS: ${get('tokClass')}`,
      `ASSIGNED OUTREACH: ${target ? target.short : 'Choose TOK class'}`,
      `OUTREACH INSTRUCTIONS: ${target ? target.detail : 'Choose TOK class to see assignment'}`,
      '',
      `COUNTRY OR CUISINE: ${get('culture')}`,
      `DISH: ${get('dish')}`,
      `CUISINE EXPERT / LEAD: ${get('expert')}`,
      `ESTIMATED GROUP BUDGET: ${get('budget')} DKK (working range 150–200 DKK)`,
      '',
      'GROUP MEMBERS AND ROLES:', get('members'), '',
      'CULTURAL STORY / HISTORY / WHY THIS DISH:', get('story'), '',
      'ASSIGNED CLASS INVITATION PLAN:', get('outreach'), '',
      'ONE-MINUTE VIDEO PLAN:', get('video'), '',
      'PREPARATION, COOKING & MODULE 5 SERVICE:', get('service'), '',
      'VIRTUE CONNECTION:', get('virtue'), '',
      'SCHOOL REQUIREMENTS — CHECK WITH YOUR TEACHER',
      '[ ] Group is large enough for multiple roles; NO groups of two',
      '[ ] Teacher signs off on group BEFORE budget approval',
      '[ ] Group budget confirmed (working budget: 150–200 DKK)',
      '[ ] ALL purchase receipts will be retained',
      '[ ] Country/cuisine selected freely (not necessarily birthplace)',
      '[ ] Cuisine lead has solid knowledge of the chosen cuisine',
      '[ ] Students in the ASSIGNED class invited and involved',
      '[ ] One-minute video covers dish, history, reasons, cultural meaning, a virtue connection',
      '[ ] Food prepared and cooked ON WEDNESDAY 2 DECEMBER',
      '[ ] Food brought to Global Day food fair in MODULE 5',
      '[ ] Hosts eat beforehand; food saved for STX visitors',
      '',
      'Teacher approval: ________________________ Date: __________',
      'NOTE: Downloaded plan is not proof of approval. This website does not submit information.'
    ].join('\n');
    const name = (data.culture || data.dish || 'food-fair').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,30) || 'food-fair';
    const blobUrl = URL.createObjectURL(new Blob([contents], { type: 'text/plain;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl; link.download = `global-day-2026-${name}-group-brief.txt`;
    document.body.append(link); link.click(); link.remove();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1600);
    notify('Working group brief downloaded. Ask your teacher to approve the group.');
  });
  $('#printBrief').addEventListener('click', () => window.print());
  $('#resetBrief').addEventListener('click', () => {
    if (!window.confirm('Clear this team plan saved in your browser?')) return;
    form.reset(); updateForm(); notify('Local group plan cleared.');
  });
})();
