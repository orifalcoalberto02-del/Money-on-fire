import { firebaseConfig } from './config.js';

/* ========== utilità ========== */
const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const eur = n => new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', useGrouping: 'always' }).format(Math.round((n || 0) * 100) / 100);
const todayISO = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10); };
const curYM = () => todayISO().slice(0, 7);
const ymParts = ym => ym.split('-').map(Number);
const addMonths = (ym, n) => { const [y, m] = ymParts(ym); const d = new Date(y, m - 1 + n, 1); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; };
const daysIn = ym => { const [y, m] = ymParts(ym); return new Date(y, m, 0).getDate(); };
const monthLabel = ym => { const [y, m] = ymParts(ym); const s = new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); };
const monthShort = ym => { const [y, m] = ymParts(ym); return new Date(y, m - 1, 1).toLocaleDateString('it-IT', { month: 'short' }).replace('.', ''); };
const dayLabel = iso => new Date(iso + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
const daysBetween = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const newId = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2, 10));
const sum = a => a.reduce((s, x) => s + (+x.amount || 0), 0);
const hue = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const catColor = s => `hsl(${hue(s)} 50% 46%)`;
const parseAmt = v => {
  let s = String(v ?? '').trim().replace(/\s/g, '');
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : NaN;
};
const fmtInput = n => (n === '' || n == null ? '' : (typeof n === 'number' ? n.toFixed(2) : String(n)).replace('.', ','));
const rem = d => Math.max(0, Math.round(((+d.amount || 0) - (+d.paid || 0)) * 100) / 100);

const DEF_OUT = ['Casa', 'Spesa', 'Trasporti', 'Auto', 'Ristoranti', 'Salute', 'Svago', 'Abbonamenti', 'Shopping', 'Attrezzatura', 'Software', 'Tasse e IVA', 'Altro'];
const DEF_IN = ['Lavoro', 'Stipendio', 'Rimborso', 'Regalo', 'Altro'];

const IC = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  tx: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  rec: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
  debt: '<path d="M7 7h13l-3-3M17 17H4l3 3"/>',
  stats: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  set: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  cam: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${IC[k]}</svg>`;

/* ===== icone delle categorie (riconosciute dal nome, anche per categorie nuove) ===== */
const CI = {
  casa: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  spesa: '<path d="M3 4h2.5l2.2 11h10.6l2-8H6.5"/><circle cx="9.5" cy="19.5" r="1.4"/><circle cx="17" cy="19.5" r="1.4"/>',
  trasporti: '<rect x="4" y="3" width="16" height="14" rx="3"/><path d="M4 11h16M8 21v-4M16 21v-4"/><path d="M8.5 14h.01M15.5 14h.01"/>',
  auto: '<path d="M5 16l1.5-5.5A2 2 0 0 1 8.4 9h7.2a2 2 0 0 1 1.9 1.5L19 16"/><rect x="3" y="16" width="18" height="4" rx="1.5"/><path d="M7.5 18h.01M16.5 18h.01"/>',
  ristoranti: '<path d="M6 3v6a2 2 0 0 0 4 0V3M8 11v10"/><path d="M17 21V3c-2.2 1.3-3 4-3 7v3h3"/>',
  salute: '<path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"/>',
  svago: '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M10 9.5v5l4.5-2.5z"/>',
  abbonamenti: '<path d="M3 12a9 9 0 0 1 15.5-6.2L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.2L3 16M3 21v-5h5"/>',
  shopping: '<path d="M5 8h14l-1 12H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/>',
  attrezzatura: '<path d="M4 8h3l1.5-2h7L17 8h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  software: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14"/>',
  tasse: '<path d="M19 5L5 19"/><circle cx="7.5" cy="7.5" r="2.2"/><circle cx="16.5" cy="16.5" r="2.2"/>',
  bollette: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
  viaggi: '<path d="M3 11l18-7-7 18-3-8z"/>',
  sport: '<path d="M6 8v8M3.5 10v4M18 8v8M20.5 10v4M6 12h12"/>',
  istruzione: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H19v3H6.5A2.5 2.5 0 0 1 4 20.5z"/>',
  lavoro: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 5v2M3 13h18"/>',
  stipendio: '<rect x="3" y="6" width="18" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6.5 9.5h.01M17.5 14.5h.01"/>',
  rimborso: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',
  regalo: '<rect x="4" y="10" width="16" height="10" rx="1.5"/><path d="M3 7h18v3H3zM12 7v13M12 7c-2.5 0-4-1-4-2.5S9.5 2.5 12 7zM12 7c2.5 0 4-1 4-2.5S14.5 2.5 12 7z"/>',
  altro: '<path d="M6 12h.01M12 12h.01M18 12h.01"/>',
  tag: '<path d="M3 12V4h8l10 10-8 8z"/><path d="M7.5 8.5h.01"/>'
};
const CAT_KEYS = [
  ['altro', /^(altro|varie|varie ed eventuali|generico)$/],
  ['abbonamenti', /abbonam|netflix|spotify|disney|prime video|dazn|icloud|youtube|subscription/],
  ['tasse', /tass|\biva\b|imposte|\binps\b|\bf24\b|commercialista|contribut/],
  ['bollette', /bollett|\bluce\b|\bgas\b|energia|utenz|internet|wifi|telefon|fibra|\bacqua\b|rifiut|\btari\b|\bsim\b/],
  ['viaggi', /viagg|vacanz|hotel|\bvolo\b|\bvoli\b|airbnb|aere|booking/],
  ['sport', /sport|palestr|piscin|calcio|baseball|allenam|fitness/],
  ['istruzione', /scuola|corso|\blibr|istruz|formaz|univers|didatt/],
  ['attrezzatura', /attrezz|camera|obiettiv|fotocam|treppiede|gimbal|microfon|memory|scheda|\bssd\b|batteri|hardware/],
  ['software', /softw|\bapp\b|licenz|adobe|dominio|hosting|plugin|programm/],
  ['trasporti', /trasport|treno|\bbus\b|autobus|metro|\bgtt\b|\batm\b|taxi|uber|biglietto|italo|trenitalia|pedagg|autostrad/],
  ['auto', /auto|benzin|carburant|diesel|gasolio|\bgpl\b|parcheggi|assicuraz|bollo|meccanic|gommista|tagliando|revisione|lavaggio/],
  ['salute', /salut|farmac|medic|dentist|visit|ospedal|ticket|analisi|ottic|terapi/],
  ['ristoranti', /ristor|pizz|trattor|osteria|\bbar\b|caff|pranz|\bcena\b|aperitiv|gelat|sushi|panin|fast ?food|mensa|delivery/],
  ['svago', /svago|cinema|film|concert|teatro|event|mostra|museo|giochi|videogioc|diverti/],
  ['spesa', /spesa|supermerc|aliment|market|esselunga|\bcoop\b|conad|carrefour|lidl|eurospin|\bpam\b|despar/],
  ['casa', /casa|affitto|mutuo|condomin|arred|mobil/],
  ['regalo', /regal|\bdono\b|compleann/],
  ['shopping', /shop|abbigl|vestit|scarpe|amazon|acquist|negozio|elettron/],
  ['stipendio', /stipend|\bpaga\b|salario/],
  ['rimborso', /rimbors|storno|\bresa\b/],
  ['lavoro', /lavor|fattur|client|freelance|compenso|ingaggio|progett/]
];
const normCat = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();
const catIconKey = name => {
  const n = normCat(name);
  if (!n) return 'altro';
  for (const [k, re] of CAT_KEYS) if (re.test(n)) return k;
  return 'tag';
};
const catIcon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${CI[catIconKey(name)]}</svg>`;
const cico = (cat, type = 'out') => `<span class="cico${type === 'in' ? ' in' : ''}">${catIcon(cat)}</span>`;
const tTitle = t => t.title || t.note || t.category || 'Senza titolo';

let toastTimer;
function toast(msg) {
  const t = $('#toast'); t.textContent = msg; t.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}
const run = p => Promise.resolve(p).catch(e => { console.error(e); toast('Errore: ' + (e.message || e)); });

/* ========== stato ========== */
const S = {
  tx: [], rec: [], debt: [], settings: { budgets: {} },
  view: 'home', ym: curYM(), scope: 'all', search: '', showSettled: false,
  mode: 'local', user: null, authReady: false, fatal: '', onSubmit: null, curDebt: null
};
try { S.scope = localStorage.getItem('cassa:scope') || 'all'; } catch { /* ignora */ }

const inScope = x => S.scope === 'all' || (x.scope || 'personale') === S.scope;
const monthTx = (ym = S.ym) => S.tx.filter(t => inScope(t) && (t.date || '').startsWith(ym));

/* ========== archivio: locale ========== */
function localStore() {
  const KEY = 'cassa:data';
  const save = () => localStorage.setItem(KEY, JSON.stringify({ tx: S.tx, rec: S.rec, debt: S.debt, settings: S.settings }));
  return {
    kind: 'local',
    start() {
      let d = {};
      try { d = JSON.parse(localStorage.getItem(KEY)) || {}; } catch { /* dati illeggibili */ }
      S.tx = d.tx || []; S.rec = d.rec || []; S.debt = d.debt || [];
      S.settings = { budgets: {}, ...(d.settings || {}) };
      render();
    },
    async add(col, obj, id = newId()) { S[col].push({ ...obj, id }); save(); render(); },
    async update(col, id, patch) {
      const i = S[col].findIndex(x => x.id === id);
      if (i >= 0) { S[col][i] = { ...S[col][i], ...patch }; save(); render(); }
    },
    async remove(col, id) { S[col] = S[col].filter(x => x.id !== id); save(); render(); },
    async saveSettings(p) { S.settings = { ...S.settings, ...p }; save(); render(); },
    async logout() { }
  };
}

/* ========== archivio: cloud (Firebase) ========== */
async function firebaseStore() {
  const base = 'https://www.gstatic.com/firebasejs/10.14.1/';
  const [A, Au, F] = await Promise.all([
    import(base + 'firebase-app.js'),
    import(base + 'firebase-auth.js'),
    import(base + 'firebase-firestore.js')
  ]);
  const app = A.initializeApp(firebaseConfig);
  const auth = Au.getAuth(app);
  const db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  let unsubs = [], uid = null;
  const stop = () => { unsubs.forEach(u => u()); unsubs = []; };
  return {
    kind: 'cloud',
    auth: {
      signIn: (e, p) => Au.signInWithEmailAndPassword(auth, e, p),
      signUp: (e, p) => Au.createUserWithEmailAndPassword(auth, e, p),
      reset: e => Au.sendPasswordResetEmail(auth, e)
    },
    start() {
      Au.onAuthStateChanged(auth, user => {
        stop(); S.user = user; S.authReady = true;
        if (user) {
          uid = user.uid;
          for (const col of ['tx', 'rec', 'debt']) {
            unsubs.push(F.onSnapshot(F.collection(db, 'users', uid, col), snap => {
              S[col] = snap.docs.map(d => ({ ...d.data(), id: d.id })); render();
            }, err => toast('Sincronizzazione: ' + err.message)));
          }
          unsubs.push(F.onSnapshot(F.doc(db, 'users', uid, 'meta', 'settings'), snap => {
            S.settings = { budgets: {}, ...(snap.data() || {}) }; render();
          }, err => toast('Sincronizzazione: ' + err.message)));
        } else {
          uid = null; S.tx = []; S.rec = []; S.debt = []; S.settings = { budgets: {} };
          closeSheet();
        }
        render();
      });
    },
    add: (col, obj, id = newId()) => F.setDoc(F.doc(db, 'users', uid, col, id), obj),
    update: (col, id, patch) => F.updateDoc(F.doc(db, 'users', uid, col, id), patch),
    remove: (col, id) => F.deleteDoc(F.doc(db, 'users', uid, col, id)),
    saveSettings: p => F.setDoc(F.doc(db, 'users', uid, 'meta', 'settings'), { ...S.settings, ...p }),
    logout: () => Au.signOut(auth)
  };
}

let store;
const create = (col, data) => run(store.add(col, { ...data, createdAt: Date.now() }));

/* ========== calcoli ========== */
function dueList() {
  const cur = curYM(), t = todayISO();
  return S.rec
    .filter(r => r.active !== false && inScope(r))
    .map(r => {
      const day = Math.min(Math.max(+r.day || 1, 1), daysIn(cur));
      const due = `${cur}-${String(day).padStart(2, '0')}`;
      const paid = S.tx.some(x => x.recId === r.id && (x.date || '').startsWith(cur));
      return { r, due, paid, late: due < t };
    })
    .filter(x => !x.paid)
    .sort((a, b) => a.due.localeCompare(b.due));
}
const allCats = () => [...new Set([...DEF_OUT, ...DEF_IN, ...S.tx.map(t => t.category), ...S.rec.map(r => r.category)])].filter(Boolean).sort((a, b) => a.localeCompare(b, 'it'));

/* ========== viste ========== */
const headerHTML = () => `
<header class="top">
  <div class="trow"><h1>Cassa</h1><button class="icon" data-act="settings" aria-label="Impostazioni">${icon('set')}</button></div>
  ${S.view === 'debt' ? '' : `<div class="seg scope">${[['all', 'Tutto'], ['personale', 'Personale'], ['lavoro', 'Lavoro']]
    .map(([v, l]) => `<button class="${S.scope === v ? 'on' : ''}" data-act="scope" data-v="${v}">${l}</button>`).join('')}</div>`}
</header>`;

const TABS = [['home', 'Home'], ['tx', 'Movimenti'], ['rec', 'Ricorrenti'], ['debt', 'Debiti'], ['stats', 'Analisi']];
const navHTML = () => `<nav class="tabs">${TABS.map(([v, l]) =>
  `<button class="${S.view === v ? 'on' : ''}" data-act="tab" data-view="${v}">${icon(v)}<span>${l}</span></button>`).join('')}</nav>`;
const fabHTML = () => S.view === 'stats' ? '' : `<button class="fab" data-act="add" aria-label="Aggiungi">+</button>`;

const monthNav = () => `<div class="mnav"><button class="icon" data-act="prev" aria-label="Mese precedente">‹</button><strong>${monthLabel(S.ym)}</strong><button class="icon" data-act="next" aria-label="Mese successivo">›</button></div>`;

const txRow = t => {
  const sub = [...new Set([t.category, t.scope === 'lavoro' ? 'Lavoro' : '', t.recId ? 'Ricorrente' : '', t.title && t.note ? t.note : ''].filter(Boolean))].join(' · ');
  return `<button class="item" data-act="edit-tx" data-id="${t.id}">${cico(t.category, t.type)}
    <span class="mid"><b>${esc(tTitle(t))}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span>
    <span class="amt ${t.type}">${t.type === 'in' ? '+' : '−'}${eur(t.amount)}</span></button>`;
};

/* Analisi rapida: riquadri proporzionali alle categorie dove spendi di più nel mese */
const QA_COLORS = ['#e87a3a', '#f0975f', '#f5b794', '#f9e3d3', '#efefed'];
function quickAnalysis(tx) {
  const outs = tx.filter(t => t.type === 'out'), tot = sum(outs);
  if (!tot) return `<div class="card empty">Nessuna spesa in questo mese.</div>`;
  const by = {};
  outs.forEach(t => { const k = t.category || 'Altro'; (by[k] ||= { v: 0, n: 0 }); by[k].v += t.amount; by[k].n++; });
  const top = Object.entries(by).sort((a, b) => b[1].v - a[1].v).slice(0, 5);
  const cols = [[], []], sums = [0, 0];
  top.forEach(([name, o], rank) => {
    const share = o.v / tot * 100, c = sums[0] <= sums[1] ? 0 : 1;
    cols[c].push({ name, o, share, rank }); sums[c] += share;
  });
  const tile = ({ name, o, share, rank }) => `<button class="qt" style="--g:${Math.max(share, 6).toFixed(1)};--c:${QA_COLORS[rank]}" data-act="tab" data-view="stats">
    <span class="qh"><span class="qi">${catIcon(name)}</span><span><b>${esc(name)}</b><small>${eur(o.v)}<br>${o.n} ${o.n === 1 ? 'movimento' : 'movimenti'}</small></span></span>
    <span class="pc">${share < 1 ? '&lt;1' : Math.round(share)}<i>%</i></span></button>`;
  return `<div class="qa">${cols.filter(c => c.length).map(c => `<div class="qa-col">${c.map(tile).join('')}</div>`).join('')}</div>`;
}

function homeView() {
  const tx = monthTx();
  const inc = sum(tx.filter(t => t.type === 'in')), out = sum(tx.filter(t => t.type === 'out')), bal = inc - out;
  const due = S.ym === curYM() ? dueList() : [];
  const t0 = todayISO();
  const open = S.debt.filter(d => !d.settled);
  const cred = open.filter(d => d.dir === 'credit').reduce((s, d) => s + rem(d), 0);
  const dbt = open.filter(d => d.dir === 'debt').reduce((s, d) => s + rem(d), 0);
  const recent = tx.slice().sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0)).slice(0, 5);
  return `${monthNav()}
  <section class="hero card">
    <small>Saldo del mese</small>
    <div class="big ${bal < 0 ? 'neg' : ''}">${eur(bal)}</div>
    <div class="split"><div><small>Entrate</small><b class="in">${eur(inc)}</b></div><div><small>Uscite</small><b class="out">${eur(out)}</b></div></div>
  </section>
  ${due.length ? `<h3>Da pagare questo mese</h3><div class="card list">${due.map(x => {
    const diff = daysBetween(t0, x.due);
    const when = diff < 0 ? 'scaduto' : diff === 0 ? 'oggi' : diff === 1 ? 'domani' : `tra ${diff} giorni`;
    return `<div class="item">${cico(x.r.category, x.r.type)}<span class="mid"><b>${esc(x.r.name)}</b><small class="${diff < 0 ? 'warn' : ''}">${dayLabel(x.due)} · ${when}</small></span>
      <span class="amt ${(x.r.type || 'out')}">${eur(x.r.amount)}</span><button class="chip" data-act="pay-rec" data-id="${x.r.id}">Fatto</button></div>`;
  }).join('')}</div>` : ''}
  <div class="two">
    <button class="card stat" data-act="tab" data-view="debt"><small>Ti devono</small><b class="in">${eur(cred)}</b></button>
    <button class="card stat" data-act="tab" data-view="debt"><small>Devi</small><b class="out">${eur(dbt)}</b></button>
  </div>
  <h3>Ultimi movimenti</h3>
  ${recent.length ? `<div class="card list">${recent.map(txRow).join('')}</div>` : `<div class="card empty">Ancora nessun movimento.<br>Tocca + per aggiungere il primo.</div>`}
  <h3>Analisi rapida</h3>${quickAnalysis(tx)}`;
}

function txListHTML() {
  const q = S.search.trim().toLowerCase();
  const list = monthTx().filter(t => !q || `${t.title || ''} ${t.note || ''} ${t.category || ''}`.toLowerCase().includes(q))
    .sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || 0) - (a.createdAt || 0));
  if (!list.length) return `<div class="card empty" style="margin-top:12px">${q ? 'Nessun risultato.' : 'Nessun movimento in questo mese.<br>Tocca + per aggiungerne uno.'}</div>`;
  const groups = []; let cur = null;
  for (const t of list) {
    if (!cur || cur.d !== t.date) { cur = { d: t.date, items: [] }; groups.push(cur); }
    cur.items.push(t);
  }
  return groups.map(g => `<h4 class="day">${dayLabel(g.d)}</h4><div class="card list">${g.items.map(txRow).join('')}</div>`).join('');
}
const txView = () => `${monthNav()}<input class="search" id="q" type="search" placeholder="Cerca per titolo o categoria" value="${esc(S.search)}"><div id="txlist">${txListHTML()}</div>`;

function recView() {
  const list = S.rec.filter(inScope).slice().sort((a, b) => (+a.day || 0) - (+b.day || 0));
  const fixed = sum(list.filter(r => r.active !== false && (r.type || 'out') === 'out'));
  return `<section class="hero card"><small>Costi fissi mensili</small><div class="big">${eur(fixed)}</div>
    <small>${list.filter(r => r.active !== false && (r.type || 'out') === 'out').length} pagamenti attivi</small></section>
  <h3>Pagamenti ricorrenti</h3>
  ${list.length ? `<div class="card list">${list.map(r => `<button class="item" data-act="edit-rec" data-id="${r.id}" style="${r.active === false ? 'opacity:.5' : ''}">
    ${cico(r.category, r.type)}
    <span class="mid"><b>${esc(r.name)}</b><small>Il ${+r.day || 1} di ogni mese${r.category ? ' · ' + esc(r.category) : ''}${r.scope === 'lavoro' ? ' · Lavoro' : ''}${r.active === false ? ' · in pausa' : ''}</small></span>
    <span class="amt ${r.type || 'out'}">${eur(r.amount)}</span></button>`).join('')}</div>`
    : `<div class="card empty">Aggiungi affitto, abbonamenti, rate…<br>Ti ricorderò quando sono in scadenza.</div>`}`;
}

function debtView() {
  const groups = {};
  S.debt.filter(d => S.showSettled || !d.settled).forEach(d => {
    const k = (d.person || '').trim().toLowerCase();
    (groups[k] ||= { name: (d.person || '').trim(), items: [] }).items.push(d);
  });
  const arr = Object.values(groups).map(g => ({
    ...g, net: g.items.filter(d => !d.settled).reduce((s, d) => s + (d.dir === 'credit' ? 1 : -1) * rem(d), 0)
  })).sort((a, b) => a.name.localeCompare(b.name, 'it'));
  const open = S.debt.filter(d => !d.settled);
  const cred = open.filter(d => d.dir === 'credit').reduce((s, d) => s + rem(d), 0);
  const dbt = open.filter(d => d.dir === 'debt').reduce((s, d) => s + rem(d), 0);
  return `<div class="two" style="margin-top:6px">
    <div class="card stat"><small>Ti devono</small><b class="in">${eur(cred)}</b></div>
    <div class="card stat"><small>Devi</small><b class="out">${eur(dbt)}</b></div></div>
  <h3>Persone</h3>
  ${arr.length ? arr.map(g => `<div class="card grp" style="margin-bottom:12px">
    <div class="person"><b>${esc(g.name)}</b><span class="amt ${g.net > 0 ? 'in' : g.net < 0 ? 'out' : ''}">${g.net > 0 ? 'ti deve ' + eur(g.net) : g.net < 0 ? 'devi ' + eur(-g.net) : 'siete pari'}</span></div>
    <div class="list">${g.items.map(d => `<button class="item" data-act="edit-debt" data-id="${d.id}" style="${d.settled ? 'opacity:.5' : ''}">
      <span class="mid"><b>${esc(d.note || (d.dir === 'credit' ? 'Mi deve' : 'Devo'))}</b>
      <small>${d.dir === 'credit' ? 'Ti deve' : 'Devi'} · ${dayLabel(d.date)}${d.settled ? ' · saldato' : (d.paid > 0 ? ` · su ${eur(d.amount)}` : '')}</small></span>
      <span class="amt ${d.dir === 'credit' ? 'in' : 'out'}">${eur(d.settled ? d.amount : rem(d))}</span></button>`).join('')}</div></div>`).join('')
    : `<div class="card empty">Nessun debito o credito aperto.<br>Tocca + per aggiungerne uno.</div>`}
  <button class="link" data-act="toggle-settled">${S.showSettled ? 'Nascondi i saldati' : 'Mostra anche i saldati'}</button>`;
}

function chart6() {
  const months = [...Array(6)].map((_, i) => addMonths(S.ym, i - 5));
  const data = months.map(m => {
    const t = S.tx.filter(x => inScope(x) && (x.date || '').startsWith(m));
    return { m, i: sum(t.filter(x => x.type === 'in')), o: sum(t.filter(x => x.type === 'out')) };
  });
  const max = Math.max(1, ...data.flatMap(d => [d.i, d.o]));
  const W = 360, H = 150, base = H - 20, avail = base - 8, bw = 15, slot = W / 6;
  const bars = data.map((d, k) => {
    const gx = slot * k + (slot - (bw * 2 + 4)) / 2;
    const hi = d.i / max * avail, ho = d.o / max * avail;
    return `<rect class="b-in" x="${gx.toFixed(1)}" y="${(base - hi).toFixed(1)}" width="${bw}" height="${hi.toFixed(1)}" rx="3"><title>Entrate ${eur(d.i)}</title></rect>
      <rect class="b-out" x="${(gx + bw + 4).toFixed(1)}" y="${(base - ho).toFixed(1)}" width="${bw}" height="${ho.toFixed(1)}" rx="3"><title>Uscite ${eur(d.o)}</title></rect>
      <text class="lbl" x="${(slot * k + slot / 2).toFixed(1)}" y="${H - 5}">${esc(monthShort(d.m))}</text>`;
  }).join('');
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Entrate e uscite degli ultimi sei mesi">${bars}</svg>`;
}

function statsView() {
  const tx = monthTx(), outs = tx.filter(t => t.type === 'out');
  const by = {};
  outs.forEach(t => { const k = t.category || 'Altro'; by[k] = (by[k] || 0) + t.amount; });
  const rows = Object.entries(by).sort((a, b) => b[1] - a[1]);
  const tot = rows.reduce((s, r) => s + r[1], 0);
  const budgets = S.settings.budgets || {};
  const bRows = Object.entries(budgets).filter(([, v]) => v > 0).map(([c, v]) => ({ c, v, s: by[c] || 0 })).sort((a, b) => b.s / b.v - a.s / a.v);
  const yr = S.ym.slice(0, 4);
  const w = S.tx.filter(t => t.scope === 'lavoro' && (t.date || '').startsWith(yr));
  const wi = sum(w.filter(t => t.type === 'in')), wo = sum(w.filter(t => t.type === 'out'));
  return `${monthNav()}
  <h3>Spese per categoria</h3>
  ${rows.length ? `<div class="card">${rows.map(([c, v]) => `<div class="brow"><div class="top2"><span class="nm">${cico(c)}<b>${esc(c)}</b></span><span class="amt">${eur(v)} <small>· ${Math.round(v / tot * 100)}%</small></span></div>
    <div class="bar"><i style="width:${(v / tot * 100).toFixed(1)}%"></i></div></div>`).join('')}</div>`
    : `<div class="card empty">Nessuna spesa in questo mese.</div>`}
  <h3>Budget</h3>
  <div class="card">${bRows.length ? bRows.map(b => `<div class="brow"><div class="top2"><span class="nm">${cico(b.c)}<b>${esc(b.c)}</b></span><span class="amt ${b.s > b.v ? 'out' : ''}">${eur(b.s)} <small>/ ${eur(b.v)}</small></span></div>
    <div class="bar"><i class="${b.s > b.v ? 'over' : ''}" style="width:${Math.min(100, b.s / b.v * 100).toFixed(1)}%"></i></div></div>`).join('')
    : `<div class="empty">Nessun budget impostato.</div>`}
    <div class="brow"><button class="link" style="margin:0" data-act="budgets">${bRows.length ? 'Modifica budget' : 'Imposta budget'}</button></div></div>
  <h3>Ultimi 6 mesi</h3>
  <div class="card" style="padding:14px 10px 4px">${chart6()}<div class="legend"><span><i style="background:var(--in)"></i>Entrate</span><span><i style="background:var(--out)"></i>Uscite</span></div></div>
  <h3>Lavoro ${yr}</h3>
  <div class="card pad"><div class="split"><div><small>Entrate</small><b class="in">${eur(wi)}</b></div><div><small>Spese</small><b class="out">${eur(wo)}</b></div><div><small>Differenza</small><b>${eur(wi - wo)}</b></div></div>
    <p class="mut" style="margin-top:10px;font-size:.85rem">Somma dei movimenti segnati come “Lavoro” nell'anno, indipendentemente dal filtro in alto.</p></div>`;
}

const loginHTML = () => `<main class="login"><div class="logo">€</div><h1>Cassa</h1>
  <p class="mut" style="margin-top:6px">Accedi per vedere i tuoi dati su iPhone e Mac.</p>
  <form id="lf"><label class="fld">Email<input type="email" name="email" autocomplete="username" required></label>
  <label class="fld">Password<input type="password" name="password" autocomplete="current-password" minlength="6" required></label>
  <p id="lerr" class="err" role="alert"></p>
  <button class="btn primary">Accedi</button>
  <button type="button" class="btn" data-act="signup">Crea account</button>
  <button type="button" class="link" data-act="reset">Password dimenticata?</button></form></main>`;

function render() {
  const app = $('#app'), y = window.scrollY;
  if (S.fatal) {
    app.innerHTML = `<main class="login"><div class="logo">€</div><h1>Cassa</h1><p class="err">${esc(S.fatal)}</p><button class="btn primary" data-act="retry">Riprova</button></main>`;
    return;
  }
  if (S.mode === 'cloud') {
    if (!S.authReady) { app.innerHTML = '<div class="splash">Caricamento…</div>'; return; }
    if (!S.user) { if (!$('#lf', app)) app.innerHTML = loginHTML(); return; }
  }
  const views = { home: homeView, tx: txView, rec: recView, debt: debtView, stats: statsView };
  const focused = document.activeElement && document.activeElement.id === 'q';
  app.innerHTML = headerHTML() + `<main>${views[S.view]()}</main>` + navHTML() + fabHTML();
  window.scrollTo(0, y);
  if (focused) { const q = $('#q'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
}

/* ========== fogli (modali) ========== */
function openSheet(title, body, onMount) {
  const el = $('#sheet');
  el.innerHTML = `<div class="scrim" data-act="close"></div><div class="panel" role="dialog" aria-modal="true" aria-label="${esc(title)}">
    <div class="grab"></div><div class="phead"><h2>${esc(title)}</h2><button class="icon" data-act="close" aria-label="Chiudi">✕</button></div>${body}</div>`;
  el.classList.add('open'); document.body.classList.add('lock');
  if (onMount) onMount(el);
}
function closeSheet() {
  $('#sheet').classList.remove('open'); $('#sheet').innerHTML = '';
  document.body.classList.remove('lock'); S.onSubmit = null; S.curDebt = null;
  releaseOcr();
}
const segRadio = (name, opts, val) => `<div class="seg">${opts.map(([v, l]) =>
  `<label><input type="radio" name="${name}" value="${v}" ${v === val ? 'checked' : ''}><span>${l}</span></label>`).join('')}</div>`;
const catList = () => `<datalist id="cats">${allCats().map(c => `<option value="${esc(c)}">`).join('')}</datalist>`;

/* ========== scontrino: lettura sul dispositivo ==========
   La foto viene letta in memoria e poi scartata: non viene salvata, né nell'archivio
   dell'app né altrove, e non viene inviata a nessun servizio. */
let ocrPromise = null, ocrLogger = null, scanning = false;
const absUrl = p => new URL(p, document.baseURI).href;
const simdOK = () => {
  try { return WebAssembly.validate(new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 5, 1, 96, 0, 1, 123, 3, 2, 1, 0, 10, 10, 1, 8, 0, 65, 0, 253, 15, 253, 98, 11])); }
  catch { return false; }
};
function getOcr() {
  if (!ocrPromise) {
    ocrPromise = (async () => {
      const T = (await import('./ocr/tesseract.esm.min.js')).default;
      const w = await T.createWorker('ita', 1, {
        workerPath: absUrl('ocr/worker.min.js'),
        corePath: absUrl(simdOK() ? 'ocr/tesseract-core-simd-lstm.wasm.js' : 'ocr/tesseract-core-lstm.wasm.js'),
        langPath: absUrl('ocr'),
        cacheMethod: 'none',
        logger: m => ocrLogger && ocrLogger(m)
      });
      await w.setParameters({ tessedit_pageseg_mode: '6', preserve_interword_spaces: '1' });
      return w;
    })().catch(err => { ocrPromise = null; throw err; });
  }
  return ocrPromise;
}
function releaseOcr() {
  const p = ocrPromise; ocrPromise = null; ocrLogger = null;
  if (p) p.then(w => w.terminate()).catch(() => { });
}

// ridimensiona e aumenta il contrasto (solo in memoria) per aiutare la lettura
async function prepImage(file) {
  let bmp;
  try { bmp = await createImageBitmap(file, { imageOrientation: 'from-image' }); }
  catch { bmp = await createImageBitmap(file); }
  const sc = Math.min(1, 2400 / Math.max(bmp.width, bmp.height));
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(bmp.width * sc)); cv.height = Math.max(1, Math.round(bmp.height * sc));
  const ctx = cv.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bmp, 0, 0, cv.width, cv.height); bmp.close();
  const img = ctx.getImageData(0, 0, cv.width, cv.height), d = img.data, hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) { const g = (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114) | 0; d[i] = g; hist[g]++; }
  const n = d.length / 4; let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > n * 0.02) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > n * 0.10) { hi = v; break; } }
  if (hi - lo < 40) { lo = 0; hi = 255; }
  const k = 255 / (hi - lo);
  for (let i = 0; i < d.length; i += 4) { const g = Math.max(0, Math.min(255, (d[i] - lo) * k)); d[i] = d[i + 1] = d[i + 2] = g; d[i + 3] = 255; }
  ctx.putImageData(img, 0, 0);
  return cv;
}

const RCAT = [
  ['Salute', /farmaci|parafarm|ottica|medic|dentist|ambulator/],
  ['Auto', /benzin|carburant|\bgpl\b|\beni\b|\bq8\b|tamoil|\besso\b|agip|self service|gasolio|parcheggi|lavaggio|autostrad|telepass/],
  ['Trasporti', /trenitalia|\bitalo\b|\bgtt\b|\batm\b|\btaxi\b|flixbus|biglietto (bus|metro|treno)/],
  ['Ristoranti', /ristor|pizzer|trattor|osteria|\bbar\b|caffe|gelater|panin|sushi|coperto|kebab|mcdonald|burger/],
  ['Spesa', /supermerc|esselunga|\bcoop\b|conad|carrefour|lidl|eurospin|\bpam\b|despar|\biper\b|aliment|panetter|macelle|ortofrut|\bpenny\b|\bmd\b|simply/],
  ['Attrezzatura', /fotocamer|obiettiv|media ?world|unieuro|elettronic|batteri|scheda sd/],
  ['Shopping', /abbigl|\bzara\b|h&m|decathlon|\bikea\b|amazon|calzature|scarpe/],
  ['Casa', /ferramenta|leroy|brico|casalingh/],
  ['Svago', /cinema|teatro|museo|biglietteria|ticketone/]
];
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

function parseReceipt(raw) {
  const lines = String(raw).split(/\r?\n/).map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);
  const amtRe = /(\d{1,3}(?:[.\s]\d{3})*|\d+)[.,](\d{2})(?!\d)/g;
  const amountsIn = l => [...l.matchAll(amtRe)].map(m => parseFloat(m[1].replace(/[.\s]/g, '') + '.' + m[2])).filter(n => n > 0 && n < 100000);
  const bad = /(subtotale|sub-totale|\biva\b|imponibile|resto|sconto|punti|non riscoss|risparmio|contant)/i;

  let total = null;
  for (const g of [/totale/i, /da pagare|importo|pagamento|\bpagato\b/i]) {
    for (let i = 0; i < lines.length && total == null; i++) {
      if (!g.test(lines[i]) || bad.test(lines[i])) continue;
      let a = amountsIn(lines[i]);
      if (!a.length && lines[i + 1]) a = amountsIn(lines[i + 1]);
      if (a.length) total = a[a.length - 1];
    }
    if (total != null) break;
  }
  if (total == null) {
    const all = lines.filter(l => !bad.test(l)).flatMap(amountsIn);
    if (all.length) total = Math.max(...all);
  }

  let date = null;
  const today = todayISO();
  for (const m of String(raw).matchAll(/(\d{1,2})\s?[\/\-.]\s?(\d{1,2})\s?[\/\-.]\s?(\d{4}|\d{2})(?!\d)/g)) {
    let [, dd, mm, yy] = m; dd = +dd; mm = +mm; yy = +yy; if (yy < 100) yy += 2000;
    if (dd < 1 || dd > 31 || mm < 1 || mm > 12 || yy < 2000) continue;
    const iso = `${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
    if (new Date(iso + 'T00:00:00').getDate() !== dd || iso > today) continue;
    date = iso; break;
  }

  let title = '';
  const skip = /(p\.?\s?iva|\bc\.?\s?f\.?\b|\bvia\b|viale|piazza|\bcorso\b|\btel\b|\bcap\b|scontrino|documento|fiscale|www\.|@|\d{5}|cassa|operatore|descrizione)/i;
  for (const l of lines.slice(0, 8)) {
    const letters = (l.match(/\p{L}/gu) || []).length;
    if (letters < 3 || letters / l.length < 0.6 || skip.test(l)) continue;
    title = l.replace(/[^\p{L}\p{N}&'.\- ]/gu, ' ').replace(/\b(s\.?\s?p\.?\s?a\.?|s\.?\s?r\.?\s?l\.?|s\.?\s?n\.?\s?c\.?|s\.?\s?a\.?\s?s\.?)\s*$/i, '').replace(/\s+/g, ' ').trim();
    if (title === title.toUpperCase()) title = title.toLowerCase().replace(/(^|[\s'\-])(\p{L})/gu, (_, p, c) => p + c.toUpperCase());
    title = title.slice(0, 40).trim();
    if (title.length >= 3) break; else title = '';
  }

  const nt = norm(raw);
  const category = (RCAT.find(([, re]) => re.test(nt)) || [''])[0];
  return { total, date, title, category };
}

async function scanReceipt(e) {
  const input = e.target, file = input.files[0], msg = $('#scanmsg');
  if (!file || scanning) return;
  scanning = true;
  const say = (t, ok) => { msg.textContent = t; msg.classList.toggle('ok', !!ok); };
  try {
    say('Preparo la foto…');
    const cv = await prepImage(file);
    input.value = ''; // la foto non resta collegata all'app
    say('Preparo il lettore… (la prima volta scarica circa 6 MB, poi resta sul dispositivo)');
    ocrLogger = m => {
      if (!$('#scanmsg')) return;
      if (m.status === 'recognizing text') say(`Leggo lo scontrino… ${Math.round((m.progress || 0) * 100)}%`);
      else if (/loading|initializ/.test(m.status)) say('Preparo il lettore…');
    };
    const worker = await getOcr();
    const { data } = await worker.recognize(cv);
    cv.width = cv.height = 0; // libera subito la memoria della foto
    if (!$('#f')) return; // foglio chiuso nel frattempo
    const r = parseReceipt(data.text || '');
    const fill = (name, val) => {
      const inp = $(`#f [name=${name}]`); if (!inp || val == null || val === '') return false;
      inp.value = val; inp.closest('.fld').classList.add('auto'); return true;
    };
    $('#f input[name=type][value=out]').checked = true;
    const okT = fill('title', r.title), okA = fill('amount', fmtInput(r.total)), okD = fill('date', r.date), okC = fill('category', r.category);
    const miss = [!okA && 'importo', !okT && 'titolo', !okD && 'data'].filter(Boolean);
    if (!okA) say('Non sono riuscito a leggere l\'importo: inseriscilo a mano e controlla il resto.');
    else say(`Fatto. Controlla i campi evidenziati prima di salvare${miss.length ? ` (da completare: ${miss.join(', ')})` : ''}${okC ? '' : '. Scegli tu la categoria'}.`, true);
  } catch (err) {
    console.error(err);
    say('Non riesco a leggere lo scontrino. Se è la prima volta serve la connessione; altrimenti compila a mano.');
  } finally {
    ocrLogger = null; scanning = false; input.value = '';
  }
}

function txSheet(t) {
  const isNew = !t;
  t = t || { type: 'out', title: '', amount: '', date: todayISO(), category: '', scope: S.scope === 'lavoro' ? 'lavoro' : 'personale', note: '' };
  const ttl = t.title || t.note || '', nt = t.title ? (t.note || '') : '';
  openSheet(isNew ? 'Nuovo movimento' : 'Modifica movimento', `${isNew ? `<button type="button" class="scan" data-act="scan">${icon('cam')}<span>Scansiona scontrino<small>Compila i campi dalla foto. La foto non viene salvata.</small></span></button>
    <input type="file" id="rcpt" accept="image/*" hidden><div class="scanmsg" id="scanmsg" aria-live="polite"></div>` : ''}
  <form id="f" autocomplete="off">
    ${segRadio('type', [['out', 'Spesa'], ['in', 'Entrata']], t.type)}
    <label class="fld">Titolo<input name="title" placeholder="Es. Spesa Esselunga, Benzina, Netflix" value="${esc(ttl)}" required></label>
    <label class="fld">Importo (€)<input name="amount" inputmode="decimal" placeholder="0,00" value="${fmtInput(t.amount)}" required></label>
    <label class="fld">Categoria<input name="category" list="cats" placeholder="Es. Casa" value="${esc(t.category)}" required></label>${catList()}
    <label class="fld" style="margin-top:14px">Ambito</label>${segRadio('scope', [['personale', 'Personale'], ['lavoro', 'Lavoro']], t.scope || 'personale')}
    <label class="fld">Data<input type="date" name="date" value="${esc(t.date)}" required></label>
    <label class="fld">Nota<input name="note" placeholder="Facoltativa" value="${esc(nt)}"></label>
    <div class="actions">${isNew ? '' : `<button type="button" class="btn danger" data-act="del-tx" data-id="${t.id}">Elimina</button>`}<button class="btn primary">Salva</button></div></form>`,
  el => {
    if (isNew) { $('[name=title]', el).focus(); $('#rcpt', el).addEventListener('change', scanReceipt); }
    el.querySelectorAll('.fld input').forEach(i => i.addEventListener('input', () => i.closest('.fld').classList.remove('auto')));
  });
  S.onSubmit = e => {
    const f = new FormData(e.target), amount = parseAmt(f.get('amount')), title = f.get('title').trim();
    if (!title) return toast('Scrivi un titolo');
    if (!(amount > 0)) return toast('Importo non valido');
    const data = { type: f.get('type'), title, amount, category: f.get('category').trim() || 'Altro', scope: f.get('scope'), date: f.get('date'), note: f.get('note').trim() };
    if (isNew) create('tx', data); else run(store.update('tx', t.id, data));
    closeSheet();
  };
}

function recSheet(r) {
  const isNew = !r;
  r = r || { name: '', amount: '', day: 1, type: 'out', category: '', scope: S.scope === 'lavoro' ? 'lavoro' : 'personale', active: true };
  openSheet(isNew ? 'Nuovo pagamento ricorrente' : 'Modifica ricorrente', `<form id="f" autocomplete="off">
    ${segRadio('type', [['out', 'Spesa'], ['in', 'Entrata']], r.type || 'out')}
    <label class="fld">Nome<input name="name" placeholder="Es. Affitto, Netflix, Rata auto" value="${esc(r.name)}" required></label>
    <label class="fld">Importo (€)<input name="amount" inputmode="decimal" placeholder="0,00" value="${fmtInput(r.amount)}" required></label>
    <label class="fld">Giorno del mese<input type="number" name="day" min="1" max="31" inputmode="numeric" value="${+r.day || 1}" required></label>
    <label class="fld">Categoria<input name="category" list="cats" placeholder="Es. Casa" value="${esc(r.category)}"></label>${catList()}
    <label class="fld" style="margin-top:14px">Ambito</label>${segRadio('scope', [['personale', 'Personale'], ['lavoro', 'Lavoro']], r.scope || 'personale')}
    <label class="chk"><input type="checkbox" name="active" ${r.active !== false ? 'checked' : ''}> Attivo</label>
    <div class="actions">${isNew ? '' : `<button type="button" class="btn danger" data-act="del-rec" data-id="${r.id}">Elimina</button>`}<button class="btn primary">Salva</button></div></form>`,
  el => { if (isNew) $('[name=name]', el).focus(); });
  S.onSubmit = e => {
    const f = new FormData(e.target), amount = parseAmt(f.get('amount'));
    if (!(amount > 0)) return toast('Importo non valido');
    const data = {
      name: f.get('name').trim(), amount, day: Math.min(31, Math.max(1, parseInt(f.get('day'), 10) || 1)),
      type: f.get('type'), category: f.get('category').trim() || 'Altro', scope: f.get('scope'), active: f.get('active') === 'on'
    };
    if (isNew) create('rec', data); else run(store.update('rec', r.id, data));
    closeSheet();
  };
}

function debtSheet(d) {
  const isNew = !d;
  d = d || { dir: 'credit', person: '', amount: '', paid: 0, date: todayISO(), note: '', settled: false };
  S.curDebt = isNew ? null : d.id;
  const pay = isNew ? '' : `<div class="card pay"><small>${d.dir === 'credit' ? 'Ti deve ancora' : 'Devi ancora'}</small><div class="big2">${eur(d.settled ? 0 : rem(d))}</div>
    ${d.settled ? '<p class="mut" style="margin-top:6px">Saldato.</p>' : `<form id="pf"><label class="fld">Registra un pagamento (€)<input id="payamt" inputmode="decimal" placeholder="Importo"></label>
    <div class="actions"><button class="btn primary">Aggiungi pagamento</button><button type="button" class="btn" data-act="debt-settle" data-id="${d.id}">Salda tutto</button></div></form>`}</div>`;
  openSheet(isNew ? 'Nuovo debito / credito' : d.person, `${pay}<form id="f" autocomplete="off">
    ${segRadio('dir', [['credit', 'Mi deve'], ['debt', 'Devo']], d.dir)}
    <label class="fld">Persona<input name="person" placeholder="Nome" value="${esc(d.person)}" required></label>
    <label class="fld">Importo totale (€)<input name="amount" inputmode="decimal" placeholder="0,00" value="${fmtInput(d.amount)}" required></label>
    <label class="fld">Data<input type="date" name="date" value="${esc(d.date)}" required></label>
    <label class="fld">Nota<input name="note" placeholder="Es. cena, prestito, biglietti" value="${esc(d.note)}"></label>
    <div class="actions">${isNew ? '' : `<button type="button" class="btn danger" data-act="del-debt" data-id="${d.id}">Elimina</button>`}<button class="btn primary">Salva</button></div></form>`,
  el => { if (isNew) $('[name=person]', el).focus(); });
  S.onSubmit = e => {
    const f = new FormData(e.target), amount = parseAmt(f.get('amount'));
    if (!(amount > 0)) return toast('Importo non valido');
    const data = { dir: f.get('dir'), person: f.get('person').trim(), amount, date: f.get('date'), note: f.get('note').trim() };
    if (isNew) create('debt', { ...data, paid: 0, settled: false });
    else { const paid = Math.min(+d.paid || 0, amount); run(store.update('debt', d.id, { ...data, paid, settled: paid >= amount })); }
    closeSheet();
  };
}

function budgetSheet() {
  const b = S.settings.budgets || {};
  const cats = [...new Set([...DEF_OUT, ...Object.keys(b), ...S.tx.filter(t => t.type === 'out').map(t => t.category)])]
    .filter(Boolean).sort((x, y) => x.localeCompare(y, 'it'));
  openSheet('Budget mensili', `<p class="mut">Imposta un limite mensile per le categorie che vuoi tenere d'occhio. Lascia vuoto per nessun limite.</p>
    <form id="f">${cats.map(c => `<label class="fld">${esc(c)}<input data-cat="${esc(c)}" inputmode="decimal" placeholder="Nessun limite" value="${b[c] ? fmtInput(b[c]) : ''}"></label>`).join('')}
    <div class="actions"><button class="btn primary">Salva</button></div></form>`);
  S.onSubmit = e => {
    const nb = {};
    e.target.querySelectorAll('[data-cat]').forEach(i => { const v = parseAmt(i.value); if (v > 0) nb[i.dataset.cat] = v; });
    run(store.saveSettings({ budgets: nb })); closeSheet();
  };
}

function settingsSheet() {
  const cloud = S.mode === 'cloud';
  openSheet('Impostazioni', `<div class="card pad"><b>${cloud ? 'Sincronizzazione attiva' : 'Modalità locale'}</b>
    <p class="mut">${cloud ? `Collegato come ${esc(S.user?.email || '')}. I dati si aggiornano su tutti i tuoi dispositivi.`
      : 'I dati restano solo su questo dispositivo. Per sincronizzare iPhone e Mac segui la guida nel file README.'}</p></div>
    <h3>Dati</h3>
    <div class="card list">
      <button class="item" data-act="export-csv"><span class="mid"><b>Esporta movimenti (CSV)</b><small>Si apre con Excel o Numbers</small></span></button>
      <button class="item" data-act="export-json"><span class="mid"><b>Backup completo (JSON)</b><small>Movimenti, ricorrenti, debiti e budget</small></span></button>
      <label class="item" style="cursor:pointer"><span class="mid"><b>Ripristina da backup</b><small>Aggiunge i dati del file a quelli esistenti</small></span><input type="file" id="imp" accept=".json,application/json" hidden></label>
    </div>
    ${cloud ? '<div class="actions"><button class="btn danger" data-act="logout">Esci dall\'account</button></div>' : ''}`,
  el => $('#imp', el).addEventListener('change', importJSON));
}

/* ========== esporta / importa ========== */
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function exportCSV() {
  const q = s => `"${String(s ?? '').replace(/"/g, '""')}"`;
  const rows = ['Data;Tipo;Titolo;Importo;Categoria;Ambito;Nota', ...S.tx.slice().sort((a, b) => a.date.localeCompare(b.date)).map(t =>
    [t.date, t.type === 'in' ? 'Entrata' : 'Spesa', q(t.title || t.note || ''), String(t.amount).replace('.', ','), q(t.category), t.scope === 'lavoro' ? 'Lavoro' : 'Personale', q(t.title ? t.note : '')].join(';'))];
  download(`movimenti-${todayISO()}.csv`, '﻿' + rows.join('\r\n'), 'text/csv;charset=utf-8');
}
function exportJSON() {
  download(`cassa-backup-${todayISO()}.json`, JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), tx: S.tx, rec: S.rec, debt: S.debt, settings: S.settings }, null, 2), 'application/json');
}
async function importJSON(e) {
  const file = e.target.files[0]; if (!file) return;
  try {
    const d = JSON.parse(await file.text()); let n = 0;
    for (const col of ['tx', 'rec', 'debt']) for (const it of (Array.isArray(d[col]) ? d[col] : [])) {
      const { id, ...rest } = it; run(store.add(col, rest, id || undefined)); n++;
    }
    if (d.settings && typeof d.settings === 'object') run(store.saveSettings(d.settings));
    closeSheet(); toast(`Importati ${n} elementi`);
  } catch { toast('File di backup non valido'); }
}

/* ========== accesso ========== */
const authMsg = x => ({
  'auth/invalid-credential': 'Email o password errate.', 'auth/wrong-password': 'Email o password errate.', 'auth/user-not-found': 'Email o password errate.',
  'auth/invalid-email': 'Email non valida.', 'auth/email-already-in-use': 'Esiste già un account con questa email.',
  'auth/weak-password': 'Password troppo corta (minimo 6 caratteri).', 'auth/too-many-requests': 'Troppi tentativi. Riprova tra qualche minuto.',
  'auth/network-request-failed': 'Nessuna connessione.', 'auth/missing-password': 'Inserisci la password.'
}[x.code] || ('Errore: ' + (x.message || x.code)));
async function doAuth(fn) {
  const err = $('#lerr'); err.textContent = '';
  try { await fn(); } catch (x) { err.textContent = authMsg(x); }
}
const loginVals = () => { const f = new FormData($('#lf')); return [String(f.get('email') || '').trim(), String(f.get('password') || '')]; };

/* ========== eventi ========== */
document.addEventListener('submit', e => {
  e.preventDefault();
  const id = e.target.id;
  if (id === 'lf') { const [em, pw] = loginVals(); doAuth(() => store.auth.signIn(em, pw)); }
  else if (id === 'pf') {
    const d = S.debt.find(x => x.id === S.curDebt), v = parseAmt($('#payamt').value);
    if (!d) return;
    if (!(v > 0)) return toast('Importo non valido');
    const paid = Math.min(+d.amount, Math.round(((+d.paid || 0) + v) * 100) / 100);
    run(store.update('debt', d.id, { paid, settled: paid >= d.amount }));
    closeSheet(); toast(paid >= d.amount ? 'Saldato' : 'Pagamento registrato');
  } else if (S.onSubmit) S.onSubmit(e);
});

document.addEventListener('input', e => {
  if (e.target.id === 'q') { S.search = e.target.value; $('#txlist').innerHTML = txListHTML(); }
});

document.addEventListener('click', e => {
  const el = e.target.closest('[data-act]'); if (!el) return;
  const a = el.dataset.act, id = el.dataset.id;
  switch (a) {
    case 'tab': S.view = el.dataset.view; window.scrollTo(0, 0); render(); break;
    case 'scope': S.scope = el.dataset.v; try { localStorage.setItem('cassa:scope', S.scope); } catch { /* ignora */ } render(); break;
    case 'prev': S.ym = addMonths(S.ym, -1); render(); break;
    case 'next': S.ym = addMonths(S.ym, 1); render(); break;
    case 'add': if (S.view === 'rec') recSheet(); else if (S.view === 'debt') debtSheet(); else txSheet(); break;
    case 'edit-tx': txSheet(S.tx.find(x => x.id === id)); break;
    case 'edit-rec': recSheet(S.rec.find(x => x.id === id)); break;
    case 'edit-debt': debtSheet(S.debt.find(x => x.id === id)); break;
    case 'del-tx': if (confirm('Eliminare questo movimento?')) { run(store.remove('tx', id)); closeSheet(); } break;
    case 'del-rec': if (confirm('Eliminare questo pagamento ricorrente? I movimenti già registrati restano.')) { run(store.remove('rec', id)); closeSheet(); } break;
    case 'del-debt': if (confirm('Eliminare questa voce?')) { run(store.remove('debt', id)); closeSheet(); } break;
    case 'pay-rec': {
      const r = S.rec.find(x => x.id === id); if (!r) break;
      create('tx', { type: r.type || 'out', amount: r.amount, date: todayISO(), category: r.category || 'Altro', scope: r.scope || 'personale', title: r.name, note: '', recId: r.id });
      toast('Registrato: ' + r.name); break;
    }
    case 'debt-settle': {
      const d = S.debt.find(x => x.id === id); if (!d) break;
      run(store.update('debt', id, { paid: d.amount, settled: true })); closeSheet(); toast('Saldato'); break;
    }
    case 'toggle-settled': S.showSettled = !S.showSettled; render(); break;
    case 'budgets': budgetSheet(); break;
    case 'scan': $('#rcpt')?.click(); break;
    case 'settings': settingsSheet(); break;
    case 'close': closeSheet(); break;
    case 'export-csv': exportCSV(); break;
    case 'export-json': exportJSON(); break;
    case 'logout': closeSheet(); run(store.logout()); break;
    case 'signup': { const [em, pw] = loginVals(); doAuth(() => store.auth.signUp(em, pw)); break; }
    case 'reset': {
      const [em] = loginVals();
      if (!em) { $('#lerr').textContent = 'Scrivi prima la tua email.'; break; }
      doAuth(async () => { await store.auth.reset(em); $('#lerr').textContent = ''; toast('Ti ho inviato un\'email per reimpostare la password'); });
      break;
    }
    case 'retry': location.reload(); break;
  }
});

document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('#sheet').classList.contains('open')) closeSheet(); });

/* ========== avvio ========== */
async function boot() {
  if (firebaseConfig && firebaseConfig.apiKey) {
    S.mode = 'cloud';
    try { store = await firebaseStore(); }
    catch (err) {
      console.error(err);
      S.fatal = 'Non riesco a caricare la sincronizzazione. Controlla la connessione e riprova.';
      render(); return;
    }
  } else {
    store = localStore();
  }
  store.start();
}
boot();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => { }));
}
