/* Rack Repair Survey v5 - Multi-survey support, Light/Dark mode, front-post fields, and photos per frame */

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

/* LOCAL STORAGE KEYS */
const LS_KEYS = { 
  PROFILE: 'rrs_profile', 
  SESSION: 'rrs_session', 
  SURVEY: 'rrs_survey', // legacy single-survey key (for migration)
  THEME: 'rrs_theme',
  SURVEYS_COLLECTION: 'rrs_surveys_collection', // new: many surveys
  CURRENT_SURVEY_ID: 'rrs_current_survey_id'    // new: which one is active
};

/* SURVEY SHAPE */
const emptySurvey = () => ({
  meta: {
    id: null,            // will be set when created
    name: '',            // e.g. "McLane Chicago – 2025-12-04"
    createdAt: null,     // ISO string
    updatedAt: null
  },
  start: { 
    facility_name: '', 
    facility_address: '', 
    surveyor_name: '', 
    survey_date: '', 
    survey_notes: '' 
  },
  frames: [],
  locations: [],
  beams: { Q: '', R: '', S: '', T: '' }
});

/* COLLECTION HELPERS (MULTIPLE SURVEYS) */
function getAllSurveys() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEYS.SURVEYS_COLLECTION)) || {};
  } catch {
    return {};
  }
}

function saveAllSurveys(map) {
  localStorage.setItem(LS_KEYS.SURVEYS_COLLECTION, JSON.stringify(map));
}

function createNewSurvey(metaOverrides = {}) {
  const id = 'sv_' + Date.now();
  const nowIso = new Date().toISOString();
  const s = emptySurvey();
  s.meta = {
    id,
    name: metaOverrides.name || `Survey ${new Date().toLocaleDateString()}`,
    createdAt: nowIso,
    updatedAt: nowIso,
    ...metaOverrides
  };
  const all = getAllSurveys();
  all[id] = s;
  saveAllSurveys(all);
  localStorage.setItem(LS_KEYS.CURRENT_SURVEY_ID, id);
  return s;
}

/* LOAD / SAVE SURVEY (USES COLLECTION + MIGRATION) */
function loadSurvey() {
  const all = getAllSurveys();
  let currentId = localStorage.getItem(LS_KEYS.CURRENT_SURVEY_ID);

  // If we already have a current survey id and it exists, use it
  if (currentId && all[currentId]) {
    return all[currentId];
  }

  // --- Migration path from old single-survey storage (rrs_survey) ---
  try {
    const legacy = JSON.parse(localStorage.getItem(LS_KEYS.SURVEY));
    if (legacy) {
      const id = 'sv_' + Date.now();
      const nowIso = new Date().toISOString();

      // Wrap legacy into new shape if needed
      const migrated = emptySurvey();
      migrated.meta = {
        id,
        name: legacy.start?.facility_name 
          ? `${legacy.start.facility_name} (migrated)`
          : 'Migrated survey',
        createdAt: nowIso,
        updatedAt: nowIso
      };

      // Try to carry over fields that exist
      migrated.start = legacy.start || migrated.start;
      migrated.frames = legacy.frames || [];
      migrated.locations = legacy.locations || [];
      migrated.beams = legacy.beams || migrated.beams;

      const updatedAll = { ...all, [id]: migrated };
      saveAllSurveys(updatedAll);
      localStorage.setItem(LS_KEYS.CURRENT_SURVEY_ID, id);
      return migrated;
    }
  } catch {
    // ignore, we'll just create a fresh survey below
  }

  // Nothing yet: create a brand-new survey
  return createNewSurvey();
}

function saveSurvey() {
  if (!survey || !survey.meta) return;
  const all = getAllSurveys();
  const id = survey.meta.id || localStorage.getItem(LS_KEYS.CURRENT_SURVEY_ID);
  if (!id) return;

  survey.meta.id = id;
  survey.meta.updatedAt = new Date().toISOString();
  all[id] = survey;
  saveAllSurveys(all);
}

/* SESSION LOAD/SAVE */
function loadSession() { 
  try { 
    return JSON.parse(localStorage.getItem(LS_KEYS.SESSION)) || null; 
  } catch { 
    return null; 
  } 
}
function saveSession(s) { 
  localStorage.setItem(LS_KEYS.SESSION, JSON.stringify(s)); 
}

/* GLOBAL STATE */
let survey = loadSurvey();
let session = loadSession();

/* THEME */
const body = document.body;
const modeToggle = $('#modeToggle');
const savedTheme = localStorage.getItem(LS_KEYS.THEME) || 'light';
if (savedTheme === 'dark') { 
  body.classList.add('dark'); 
  if (modeToggle) modeToggle.checked = true; 
}
if (modeToggle) {
  modeToggle.addEventListener('change', () => {
    if (modeToggle.checked) { 
      body.classList.add('dark'); 
      localStorage.setItem(LS_KEYS.THEME, 'dark'); 
    } else { 
      body.classList.remove('dark'); 
      localStorage.setItem(LS_KEYS.THEME, 'light'); 
    }
  });
}

/* AUTH */
const authScreen = $('#authScreen'),
      appScreen = $('#appScreen'),
      showSignIn = $('#showSignIn'),
      showSignUp = $('#showSignUp'),
      signInForm = $('#signInForm'),
      signUpForm = $('#signUpForm'),
      rememberMe = $('#rememberMe'),
      signOutBtn = $('#signOutBtn'),
      currentUser = $('#currentUser');

function updateAuthUI() { 
  if (session) { 
    authScreen.classList.add('hidden'); 
    appScreen.classList.remove('hidden'); 
    currentUser.textContent = session.firstName ? `${session.firstName} ${session.lastName}` : session.email; 
  } else { 
    authScreen.classList.remove('hidden'); 
    appScreen.classList.add('hidden'); 
    currentUser.textContent = ''; 
  } 
}
updateAuthUI();

if (showSignIn && showSignUp && signInForm && signUpForm) {
  showSignIn.addEventListener('click', () => { 
    showSignIn.classList.add('active'); 
    showSignUp.classList.remove('active'); 
    signInForm.classList.remove('hidden'); 
    signUpForm.classList.add('hidden'); 
  });
  showSignUp.addEventListener('click', () => { 
    showSignUp.classList.add('active'); 
    showSignIn.classList.remove('active'); 
    signUpForm.classList.remove('hidden'); 
    signInForm.classList.add('hidden'); 
  });
}

function getProfiles() { 
  try { 
    return JSON.parse(localStorage.getItem(LS_KEYS.PROFILE)) || {}; 
  } catch { 
    return {}; 
  } 
}
function setProfiles(map) { 
  localStorage.setItem(LS_KEYS.PROFILE, JSON.stringify(map)); 
}

if (signUpForm) {
  signUpForm.addEventListener('submit', e => { 
    e.preventDefault(); 
    const first = $('#su_first').value.trim(),
          last  = $('#su_last').value.trim(),
          email = $('#su_email').value.trim().toLowerCase(),
          phone = $('#su_phone').value.trim(),
          pass  = $('#su_password').value,
          comp  = $('#su_company').value.trim(); 
    if (!first || !last || !email || !pass) return alert('Please fill required fields.'); 
    const profiles = getProfiles(); 
    if (profiles[email]) return alert('An account with that email already exists.'); 
    profiles[email] = { first, last, email, phone, pass, comp }; 
    setProfiles(profiles); 
    alert('Account created! You can now sign in.'); 
    showSignIn.click(); 
  });
}

if (signInForm) {
  signInForm.addEventListener('submit', e => { 
    e.preventDefault(); 
    const email = $('#si_email').value.trim().toLowerCase(),
          pass  = $('#si_password').value,
          profiles = getProfiles(),
          p = profiles[email]; 
    if (!p || p.pass !== pass) return alert('Invalid email or password.'); 
    session = { email, firstName: p.first, lastName: p.last }; 
    saveSession(session); 
    if (!rememberMe.checked) { 
      window.addEventListener('beforeunload', () => localStorage.removeItem(LS_KEYS.SESSION)); 
    } 
    updateAuthUI(); 
  });
}

if (signOutBtn) {
  signOutBtn.addEventListener('click', () => { 
    localStorage.removeItem(LS_KEYS.SESSION); 
    session = null; 
    updateAuthUI(); 
  });
}

/* TABS */
$$('.tab-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.tab;
    $$('.tab').forEach(t => t.classList.remove('active'));
    $('#' + id).classList.add('active');
  });
});

/* START TAB */
['facility_name','facility_address','surveyor_name','survey_date','survey_notes'].forEach(id => {
  const el = $('#' + id); 
  if (!el) return;
  el.value = survey.start[id] || ''; 
  el.addEventListener('input', () => { 
    survey.start[id] = el.value; 
    saveSurvey(); 
  });
});

/* FRAMES TAB */
const numberSelect = $('#f_number');
const suffixSelect = $('#f_suffix');

function buildFrameNumberDropdown() { 
  if (!numberSelect) return;
  numberSelect.innerHTML = ''; 
  for (let i = 1; i <= 25; i++) { 
    const o = document.createElement('option'); 
    o.value = String(i); 
    o.textContent = 'Frame ' + i; 
    numberSelect.appendChild(o); 
  } 
}

function buildSuffixDropdown(usedSet = new Set()) { 
  if (!suffixSelect) return;
  suffixSelect.innerHTML = ''; 
  const emptyOpt = document.createElement('option'); 
  emptyOpt.value = ''; 
  emptyOpt.textContent = '(none)'; 
  suffixSelect.appendChild(emptyOpt); 
  'abcdefghijklmnopqrstuvwxyz'.split('').forEach(ch => { 
    const o = document.createElement('option'); 
    o.value = ch; 
    o.textContent = ch; 
    if (usedSet.has(ch)) o.disabled = true; 
    suffixSelect.appendChild(o); 
  }); 
}

buildFrameNumberDropdown(); 
buildSuffixDropdown();

function usedSuffixesFor(num) { 
  const used = new Set(); 
  survey.frames.forEach(f => { 
    if (String(f.frameNumber) === String(num)) used.add(f.frameSuffix || ''); 
  }); 
  return used; 
}

function updateSuffixAvailability() { 
  if (!numberSelect || !suffixSelect) return;
  const num = numberSelect.value; 
  const used = usedSuffixesFor(num); 
  const baseUsed = used.has(''); 
  suffixSelect.disabled = !baseUsed; 
  buildSuffixDropdown(used); 
  if (baseUsed) { 
    const first = [...suffixSelect.options].find(o => !o.disabled && o.value !== ''); 
    if (first) suffixSelect.value = first.value; 
  } else { 
    suffixSelect.value = ''; 
  } 
}

if (numberSelect) {
  numberSelect.addEventListener('change', updateSuffixAvailability); 
  updateSuffixAvailability();
}

/* Photo inputs */
async function readFileAsDataURL(file) { 
  return await new Promise((res, rej) => { 
    const fr = new FileReader(); 
    fr.onload = () => res(fr.result); 
    fr.onerror = rej; 
    fr.readAsDataURL(file); 
  }); 
}

const photoInputs = [
  { input: '#photo_front', preview: '#preview_front', key: 'front' },
  { input: '#photo_side', preview: '#preview_side', key: 'side' },
  { input: '#photo_struts', preview: '#preview_struts', key: 'struts' }
];

const photoData = { front: null, side: null, struts: null };

photoInputs.forEach(({ input, preview, key }) => {
  const inp = $(input);
  if (!inp) return;
  inp.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) { 
      const dataUrl = await readFileAsDataURL(file); 
      photoData[key] = dataUrl; 
      const prev = $(preview);
      if (prev) prev.src = dataUrl; 
    }
  });
});

function renderFrameList() {
  const list = $('#frameList'); 
  if (!list) return;
  list.innerHTML = '';
  if (!survey.frames.length) { 
    list.innerHTML = '<div class="muted">No frame types added yet.</div>'; 
    return; 
  }
  survey.frames.forEach((f, idx) => {
    const div = document.createElement('div'); 
    div.className = 'item';
    const title = `Frame ${f.frameNumber}${f.frameSuffix || ''}`;
    const grow = document.createElement('div'); 
    grow.className = 'grow'; 
    grow.innerHTML = `<strong>${title}</strong>`;
    const meta = document.createElement('div'); 
    meta.className = 'pill'; 
    meta.textContent = `${f.styleBrand || 'Brand ?'} • Punch: ${f.punchType || '?'} • P1:${f.backerP1} P2:${f.backerP2}`;
    const imgs = document.createElement('div'); 
    imgs.className = 'row';
    ['front','side','struts'].forEach(k => { 
      if (f.photos && f.photos[k]) { 
        const i = document.createElement('span'); 
        i.className = 'pill'; 
        i.textContent = k; 
        imgs.appendChild(i);
      } 
    });
    const edit = document.createElement('button'); 
    edit.className = 'btn small'; 
    edit.textContent = 'Edit';
    const del = document.createElement('button'); 
    del.className = 'btn small'; 
    del.textContent = 'Delete';

    edit.addEventListener('click', () => {
      $('#f_depth').value = f.depth; 
      $('#f_post_width').value = f.postWidth; 
      $('#f_post_depth').value = f.postDepth;
      $('#f_backer_p1').value = f.backerP1; 
      $('#f_backer_p2').value = f.backerP2;
      $('#f_style_brand').value = f.styleBrand; 
      $('#f_color').value = f.color; 
      $('#f_punch_type').value = f.punchType;
      if (numberSelect) numberSelect.value = String(f.frameNumber); 
      updateSuffixAvailability(); 
      if (suffixSelect) suffixSelect.value = f.frameSuffix || '';
      // load previews
      photoData.front = f.photos?.front || null; 
      photoData.side = f.photos?.side || null; 
      photoData.struts = f.photos?.struts || null;
      const pf = $('#preview_front'), ps = $('#preview_side'), pr = $('#preview_struts');
      if (pf) pf.src = photoData.front || ''; 
      if (ps) ps.src = photoData.side || ''; 
      if (pr) pr.src = photoData.struts || '';
      survey.frames.splice(idx, 1); 
      saveSurvey(); 
      renderFrameList(); 
      populateFrameDropdown();
    });

    del.addEventListener('click', () => { 
      if (confirm('Delete this frame type?')) { 
        survey.frames.splice(idx, 1); 
        saveSurvey(); 
        renderFrameList(); 
        populateFrameDropdown(); 
      } 
    });

    div.append(grow, meta, imgs, edit, del); 
    list.appendChild(div);
  });
}

function populateFrameDropdown() {
  const dd = $('#loc_frame'); 
  if (!dd) return;
  dd.innerHTML = '';
  if (!survey.frames.length) { 
    const o = document.createElement('option'); 
    o.text = 'No frames yet'; 
    dd.appendChild(o); 
    return; 
  }
  survey.frames.forEach((f, i) => {
    const title = `Frame ${f.frameNumber}${f.frameSuffix || ''}`;
    const o = document.createElement('option'); 
    o.value = i; 
    o.text = title; 
    dd.appendChild(o);
  });
}
renderFrameList(); 
populateFrameDropdown();

const clearFrameBtn = $('#clearFrameBtn');
if (clearFrameBtn) {
  clearFrameBtn.addEventListener('click', () => {
    photoData.front = photoData.side = photoData.struts = null;
    ['#preview_front','#preview_side','#preview_struts'].forEach(sel => { 
      const img = $(sel); 
      if (img) img.src = ''; 
    });
    updateSuffixAvailability();
  });
}

const addFrameBtn = $('#addFrameBtn');
if (addFrameBtn) {
  addFrameBtn.addEventListener('click', () => {
    const depth = parseFloat($('#f_depth').value || '0');
    const postWidth = $('#f_post_width').value || '';
    const postDepth = $('#f_post_depth').value || '';
    const backerP1 = $('#f_backer_p1').value || '';
    const backerP2 = $('#f_backer_p2').value || '';
    const styleBrand = $('#f_style_brand').value || '';
    const color = $('#f_color').value.trim();
    const punchType = $('#f_punch_type').value || '';
    const frameNumber = numberSelect ? parseInt(numberSelect.value, 10) : NaN;
    const frameSuffix = suffixSelect ? suffixSelect.value : '';

    if (!depth || !postWidth || !postDepth || !backerP1 || !backerP2 || !styleBrand || !punchType || !frameNumber) {
      return alert('Please complete all required frame fields.');
    }
    const used = new Set(); 
    survey.frames.forEach(f => { 
      if (f.frameNumber === frameNumber) used.add(f.frameSuffix || ''); 
    });
    if (used.has('') && !frameSuffix) { 
      return alert('Frame ' + frameNumber + ' already exists. Choose a suffix (a,b,c,...) for another variant.'); 
    }
    if ([...survey.frames].some(f => f.frameNumber === frameNumber && (f.frameSuffix || '') === frameSuffix)) {
      return alert('That Frame Number + suffix already exists.');
    }

    const f = {
      depth, postWidth, postDepth, backerP1, backerP2, styleBrand, color, punchType, frameNumber, frameSuffix,
      photos: { front: photoData.front, side: photoData.side, struts: photoData.struts }
    };
    survey.frames.push(f); 
    saveSurvey();
    renderFrameList(); 
    populateFrameDropdown();
    const frameForm = $('#frameForm');
    if (frameForm) frameForm.reset();
    ['#preview_front','#preview_side','#preview_struts'].forEach(sel => { 
      const img = $(sel); 
      if (img) img.src = ''; 
    });
    photoData.front = photoData.side = photoData.struts = null;
    buildFrameNumberDropdown(); 
    updateSuffixAvailability();
  });
}

/* LOCATIONS TAB */
(function buildHeightDropdown() {
  const dd = $('#loc_height'); 
  if (!dd) return;
  dd.innerHTML = '';
  for (let inches = 24; inches <= 192; inches++) {
    const feet = Math.floor(inches / 12), 
          inch = inches % 12;
    const label = `${feet}' ${inch}" (${inches}")`;
    const opt = document.createElement('option'); 
    opt.value = inches; 
    opt.text = label;
    dd.appendChild(opt);
  }
})();

['Q','R','S','T'].forEach(k => {
  const el = $('#beam_' + k);
  if (!el) return;
  el.value = survey.beams[k] || '';
  el.addEventListener('input', () => { 
    survey.beams[k] = el.value; 
    saveSurvey(); 
  });
});

function renderLocList() {
  const list = $('#locList'); 
  if (!list) return;
  list.innerHTML = '';
  if (!survey.locations.length) { 
    list.innerHTML = '<div class="muted">No damage locations logged yet.</div>'; 
    return; 
  }
  survey.locations.forEach((loc, idx) => {
    const div = document.createElement('div'); 
    div.className = 'item';
    const frame = survey.frames[loc.frameIndex];
    const frameName = frame ? `Frame ${frame.frameNumber}${frame.frameSuffix || ''}` : `Frame #${loc.frameIndex + 1}`;
    const grow = document.createElement('div'); 
    grow.className = 'grow';
    grow.innerHTML = `<strong>${frameName}</strong> — ${loc.where} — ${loc.type} — ${loc.height}" — H:${loc.hstruts} D:${loc.dstruts}`;
    const edit = document.createElement('button'); 
    edit.className = 'btn small'; 
    edit.textContent = 'Edit';
    const del = document.createElement('button'); 
    del.className = 'btn small'; 
    del.textContent = 'Delete';

    edit.addEventListener('click', () => {
      const lf = $('#loc_frame'),
            lw = $('#loc_where'),
            lt = $('#loc_type'),
            lh = $('#loc_height'),
            lhs = $('#loc_hstruts'),
            lds = $('#loc_dstruts');
      if (lf) lf.value = loc.frameIndex;
      if (lw) lw.value = loc.where;
      if (lt) lt.value = loc.type;
      if (lh) lh.value = String(loc.height);
      if (lhs) lhs.value = String(loc.hstruts);
      if (lds) lds.value = String(loc.dstruts);
      survey.locations.splice(idx, 1); 
      saveSurvey(); 
      renderLocList();
    });

    del.addEventListener('click', () => { 
      if (confirm('Delete this entry?')) { 
        survey.locations.splice(idx, 1); 
        saveSurvey(); 
        renderLocList(); 
      } 
    });

    div.append(grow, edit, del); 
    list.appendChild(div);
  });
}
renderLocList();

const addLocationBtn = $('#addLocationBtn');
if (addLocationBtn) {
  addLocationBtn.addEventListener('click', () => {
    if (!survey.frames.length) return alert('Please add at least one frame type first.');
    const lf = $('#loc_frame'),
          lw = $('#loc_where'),
          lt = $('#loc_type'),
          lh = $('#loc_height'),
          lhs = $('#loc_hstruts'),
          lds = $('#loc_dstruts');
    const entry = {
      frameIndex: parseInt(lf?.value || '0', 10) || 0,
      where: (lw?.value || '').trim(),
      type: lt?.value || '',
      height: parseInt(lh?.value, 10),
      hstruts: parseInt(lhs?.value, 10),
      dstruts: parseInt(lds?.value, 10),
      beams: { ...survey.beams }
    };
    if (!entry.where) return alert('Enter a location of damage.');
    survey.locations.push(entry); 
    saveSurvey();
    renderLocList();
    const locForm = $('#locForm');
    if (locForm) locForm.reset();
  });
}

/* EXPORT */
function exportToExcelHTML() {
  const esc = (s) => (s == null ? '' : String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'));
  const start = survey.start, 
        frames = survey.frames, 
        locs = survey.locations;

  let html = `
  <html>
  <head><meta charset="UTF-8"></head>
  <body>
  <h2>Rack Repair Survey — Summary</h2>
  <h3>Start</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <tr><th>Survey Name</th><td>${esc(survey.meta?.name || '')}</td></tr>
    <tr><th>Facility name</th><td>${esc(start.facility_name)}</td></tr>
    <tr><th>Facility address</th><td>${esc(start.facility_address)}</td></tr>
    <tr><th>Surveyor name</th><td>${esc(start.surveyor_name)}</td></tr>
    <tr><th>Date</th><td>${esc(start.survey_date)}</td></tr>
    <tr><th>Notes</th><td>${esc(start.survey_notes)}</td></tr>
    <tr><th>Beam Q</th><td>${esc(survey.beams.Q)}</td></tr>
    <tr><th>Beam R</th><td>${esc(survey.beams.R)}</td></tr>
    <tr><th>Beam S</th><td>${esc(survey.beams.S)}</td></tr>
    <tr><th>Beam T</th><td>${esc(survey.beams.T)}</td></tr>
  </table>

  <h3>Frame Types</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <tr>
      <th>#</th><th>Frame Number</th><th>Depth (in)</th><th>Front Post Width</th><th>Front Post Depth</th>
      <th>Backer P1</th><th>Backer P2</th><th>Frame Style (Brand)</th><th>Color</th><th>Hole Punch Style</th>
      <th>Front</th><th>Side</th><th>Struts Close-up</th>
    </tr>`;
  frames.forEach((f, i) => {
    const title = `Frame ${f.frameNumber}${f.frameSuffix || ''}`;
    const img = (d) => d ? `<img src="${d}" style="max-height:120px">` : '';
    html += `<tr>
      <td>${i + 1}</td><td>${esc(title)}</td><td>${esc(f.depth)}</td><td>${esc(f.postWidth)}</td><td>${esc(f.postDepth)}</td>
      <td>${esc(f.backerP1)}</td><td>${esc(f.backerP2)}</td><td>${esc(f.styleBrand)}</td><td>${esc(f.color)}</td><td>${esc(f.punchType)}</td>
      <td>${img(f.photos?.front)}</td><td>${img(f.photos?.side)}</td><td>${img(f.photos?.struts)}</td>
    </tr>`;
  });
  html += `</table>

  <h3>Damage Locations</h3>
  <table border="1" cellspacing="0" cellpadding="4">
    <tr>
      <th>#</th><th>Frame Type</th><th>Location of damage</th><th>Type of repair</th>
      <th>Height (in)</th><th>H Struts</th><th>D Struts</th>
      <th>Q</th><th>R</th><th>S</th><th>T</th>
    </tr>`;
  locs.forEach((L, i) => {
    const f = frames[L.frameIndex];
    const fname = f ? `Frame ${f.frameNumber}${f.frameSuffix || ''}` : `Frame #${L.frameIndex + 1}`;
    html += `<tr>
      <td>${i + 1}</td><td>${esc(fname)}</td><td>${esc(L.where)}</td><td>${esc(L.type)}</td>
      <td>${esc(L.height)}</td><td>${esc(L.hstruts)}</td><td>${esc(L.dstruts)}</td>
      <td>${esc(L.beams.Q)}</td><td>${esc(L.beams.R)}</td><td>${esc(L.beams.S)}</td><td>${esc(L.beams.T)}</td>
    </tr>`;
  });
  html += `</table>
  </body></html>`;

  const blob = new Blob([html], { type: 'application/vnd.ms-excel' });
  const link = document.createElement('a');
  const dt = new Date();
  const fname = `RackRepairSurvey_${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}.xls`;
  link.href = URL.createObjectURL(blob);
  link.download = fname;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
}

/* SURVEY PICKER (OPTIONAL UI: <select id="surveyPicker">...) */
function renderSurveyPicker() {
  const picker = $('#surveyPicker');
  if (!picker) return;
  const all = getAllSurveys();
  const currentId = survey.meta?.id || localStorage.getItem(LS_KEYS.CURRENT_SURVEY_ID);

  picker.innerHTML = '';
  const values = Object.values(all);
  if (!values.length) return;

  values
    .sort((a, b) => (a.meta.createdAt || '').localeCompare(b.meta.createdAt || ''))
    .forEach(sv => {
      const opt = document.createElement('option');
      opt.value = sv.meta.id;
      opt.textContent = sv.meta.name || sv.meta.id;
      if (sv.meta.id === currentId) opt.selected = true;
      picker.appendChild(opt);
    });
}

const surveyPicker = $('#surveyPicker');
if (surveyPicker) {
  surveyPicker.addEventListener('change', (e) => {
    const id = e.target.value;
    const all = getAllSurveys();
    if (!all[id]) return;
    localStorage.setItem(LS_KEYS.CURRENT_SURVEY_ID, id);
    survey = all[id];

    // re-hydrate UI from this survey
    ['facility_name','facility_address','surveyor_name','survey_date','survey_notes'].forEach(id => {
      const el = $('#' + id);
      if (el) el.value = survey.start[id] || '';
    });
    ['Q','R','S','T'].forEach(k => {
      const el = $('#beam_' + k);
      if (el) el.value = survey.beams[k] || '';
    });
    renderFrameList(); 
    populateFrameDropdown(); 
    renderLocList(); 
    buildFrameNumberDropdown(); 
    updateSuffixAvailability();
  });
}

/* GLOBAL CLICK HANDLERS */
document.addEventListener('click', e => {
  if (e.target && e.target.id === 'exportExcelBtn') exportToExcelHTML();
});

document.addEventListener('click', e => {
  if (e.target && e.target.id === 'exportJsonBtn') {
    const blob = new Blob([JSON.stringify(survey, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'rack_repair_survey.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  }
});

document.addEventListener('click', e => {
  if (e.target && e.target.id === 'newSurveyBtn') {
    if (!confirm('Start a new survey? Your current survey will stay saved and you can come back to it.')) return;

    const defaultName = survey.start.facility_name 
      ? `${survey.start.facility_name} – ${new Date().toLocaleDateString()}`
      : `Survey ${new Date().toLocaleDateString()}`;

    const name = prompt('Name for this new survey:', defaultName) || defaultName;

    survey = createNewSurvey({ name });

    // Reset UI fields
    ['facility_name','facility_address','surveyor_name','survey_date','survey_notes'].forEach(id => {
      const el = $('#' + id);
      if (el) el.value = '';
    });
    ['Q','R','S','T'].forEach(k => {
      const el = $('#beam_' + k);
      if (el) el.value = '';
    });
    ['#preview_front','#preview_side','#preview_struts'].forEach(sel => { 
      const img = $(sel); 
      if (img) img.src = ''; 
    });

    // Re-render lists
    renderFrameList(); 
    populateFrameDropdown(); 
    renderLocList();
    buildFrameNumberDropdown(); 
    updateSuffixAvailability();
    renderSurveyPicker();

    alert('New survey started.');
  }
});

/* hydrate */
const yearEl = $('#year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

(function hydrate() { 
  renderFrameList(); 
  populateFrameDropdown(); 
  renderLocList(); 
  renderSurveyPicker();
})();
