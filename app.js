/* Almantec · Control del negocio
   Datos compartidos en un único archivo cifrado (datos.json) en la rama «datos» del propio repositorio de GitHub.
   Se cifra en el navegador con la clave del negocio; GitHub solo ve texto ilegible.
   El navegador guarda una copia para seguir trabajando sin conexión y la sube al volver. */
(() => {
'use strict';

const CFG = window.ALMANTEC_SYNC || {};
const C = window.Calc;

/* ---------- Utilidades ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
const fmtEUR = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', useGrouping: 'always' });
const fmtCompact = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });
const eur = c => fmtEUR.format((c || 0) / 100);                 // céntimos → «1.234,50 €»
const eurN = n => fmtEUR.format(Number(n) || 0);                 // euros → «1.234,50 €»
const axisEur = c => { const v = c / 100; return (Math.abs(v) >= 1000 ? fmtCompact.format(v) : String(Math.round(v))) + ' €'; };
const MONTHS = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const MONTHS_S = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const pad2 = n => String(n).padStart(2, '0');
const todayISO = () => { const d = new Date(); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const curMonth = () => todayISO().slice(0, 7);
const fmtDate = iso => { if (!iso) return '—'; const [y, m, d] = String(iso).slice(0, 10).split('-'); return `${d}/${m}/${y}`; };
const fmtTime = d => d ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) : '';
const fmtDateTime = iso => iso ? new Date(iso).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const monthName = k => k ? `${MONTHS[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}` : '';
const monthShort = (k, withYear) => k ? MONTHS_S[+k.slice(5, 7) - 1] + (withYear ? ' ' + k.slice(2, 4) : '') : '';
const norm = s => String(s ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => { const r = Math.random() * 16 | 0; return (ch === 'x' ? r : (r & 3 | 8)).toString(16); }));
const debounce = (fn, ms) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
const amtCls = c => c === 0 ? 'amt zero' : c < 0 ? 'amt neg' : 'amt';

// Importe escrito a mano → número con 2 decimales, o NaN si no es válido. Acepta «35», «35,5», «1.234,50», «35.50».
function parseMoney(str) {
  let s = String(str ?? '').replace(/[\s€]/g, '');
  if (!s) return null;
  if (s.includes(',') && s.includes('.')) s = s.replace(/\./g, '').replace(',', '.');
  else if (s.includes(',')) s = s.replace(',', '.');
  else if (/^\d{1,3}(\.\d{3})+$/.test(s)) s = s.replace(/\./g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(s)) return NaN;
  const n = Number(s);
  return n > 999999.99 ? NaN : Math.round(n * 100) / 100;
}
const moneyInput = n => n == null || n === '' ? '' : String(Number(n).toFixed(2)).replace('.', ',').replace(/,00$/, '');
const validDate = s => /^\d{4}-\d{2}-\d{2}$/.test(s || '') && !isNaN(new Date(s + 'T12:00:00')) && +s.slice(0, 4) >= 2000 && +s.slice(0, 4) <= 2100;

const ICON = {
  edit: '<svg class="i s" viewBox="0 0 24 24"><path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/></svg>',
  del: '<svg class="i s" viewBox="0 0 24 24"><path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3"/></svg>',
  x: '<svg class="i" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
  search: '<svg class="i" viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
  up: '<svg class="i s" viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  down: '<svg class="i s" viewBox="0 0 24 24"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  euro: '<svg class="i" viewBox="0 0 24 24"><path d="M17 6.5A7 7 0 1 0 17 17.5M4 10h9M4 14h9"/></svg>',
  cost: '<svg class="i" viewBox="0 0 24 24"><path d="M3 7h18v10H3z"/><path d="M7 12h.01M17 12h.01"/><circle cx="12" cy="12" r="2.2"/></svg>',
  trend: '<svg class="i" viewBox="0 0 24 24"><path d="m3 17 6-6 4 4 8-8"/><path d="M15 7h6v6"/></svg>',
  wrench: '<svg class="i" viewBox="0 0 24 24"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L4 17v3h3l5.3-5.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.4-.6-.6-2.4 2.5-2.5Z"/></svg>',
  phone: '<svg class="i" viewBox="0 0 24 24"><rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2"/></svg>',
  clock: '<svg class="i" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  box: '<svg class="i" viewBox="0 0 24 24"><path d="M21 8 12 3 3 8v8l9 5 9-5V8Z"/><path d="m3 8 9 5 9-5M12 13v8"/></svg>',
  wallet: '<svg class="i" viewBox="0 0 24 24"><path d="M3 7a2 2 0 0 1 2-2h13v4"/><path d="M3 7v10a2 2 0 0 0 2 2h15V9H5a2 2 0 0 1-2-2Z"/><path d="M16 14h.01"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24"><path d="m5 12 5 5 9-10"/></svg>',
  info: '<svg class="i s" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
  left: '<svg class="i s" viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg>',
  right: '<svg class="i s" viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg>',
  lock: '<svg class="i" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
  cloudOff: '<svg class="i" viewBox="0 0 24 24"><path d="M3 3l18 18M8 7a6 6 0 0 1 9.7 3.1A4.5 4.5 0 0 1 20 18.5M17 19H7a5 5 0 0 1-1.6-9.7"/></svg>',
};

const REP_ESTADO = { pendiente: ['Pendiente', 't-o'], en_proceso: ['En proceso', 't-b'], finalizada: ['Finalizada', 't-g'] };
const REP_PAGO = { pendiente: ['Pago pendiente', 't-r'], pagado: ['Pagado', 't-g'] };
const MOV_ESTADO = { disponible: ['Disponible', 't-b'], reservado: ['Reservado', 't-o'], vendido: ['Vendido', 't-g'] };
const pill = (map, k) => { const [l, c] = map[k] || [k, 't-n']; return `<span class="pill ${c}">${esc(l)}</span>`; };
const cobroPill = op => op.pagado ? '<span class="pill t-g">Cobrado</span>' : '<span class="pill t-r">Pendiente de cobro</span>';
const actPill = kind => kind === 'rep' ? '<span class="pill t-v">Reparación</span>' : '<span class="pill t-y">Venta de móvil</span>';

/* ---------- Estado ---------- */
const S = {
  rep: [], mov: [], ready: false,
  tab: 'dash', mounted: null,
  dash: { donut: 'mes' },
  repF: { q: '', mes: '', estado: '', pago: '', sort: 'fecha', dir: -1, limit: 100 },
  movF: { q: '', mes: '', estado: '', cobro: '', sort: 'fecha_compra', dir: -1, limit: 100 },
  mesF: { month: curMonth(), act: 'all', sort: 'fecha', dir: -1 },
  totF: { q: '', act: 'all', year: '', sort: 'fecha', dir: -1, limit: 100 },
};
const derived = () => {
  if (!S._d || S._d.rep !== S.rep || S._d.mov !== S.mov) {
    const ops = C.operations(S.rep, S.mov);
    S._d = { rep: S.rep, mov: S.mov, ops, months: C.byMonth(ops), years: C.byYear(ops), inv: C.inventory(S.mov), buys: C.purchasesByMonth(S.mov) };
  }
  return S._d;
};

/* ---------- Avisos ---------- */
function toast(msg, kind = 'ok', ms = 3200) {
  const t = document.createElement('div');
  t.className = 'toast ' + kind;
  t.textContent = msg;
  $('#toasts').append(t);
  setTimeout(() => t.remove(), kind === 'err' ? Math.max(ms, 6000) : ms);
}
function errMsg(e) {
  const m = String(e?.message || e || '');
  if (!navigator.onLine || /Failed to fetch|NetworkError|Load failed|network/i.test(m)) return 'Sin conexión. Revisa internet y vuelve a intentarlo.';
  return 'No se ha podido completar: ' + m;
}

/* ---------- Capas (modales) ---------- */
let layerStack = [];
function openLayer(html, { cls = '', onClose } = {}) {
  const scrim = document.createElement('div');
  scrim.className = 'scrim';
  scrim.innerHTML = `<div class="modal ${cls}" role="dialog" aria-modal="true">${html}</div>`;
  const entry = { scrim, onClose, prevFocus: document.activeElement };
  scrim.addEventListener('mousedown', e => { if (e.target === scrim) entry.downOnScrim = true; });
  scrim.addEventListener('click', e => { if (e.target === scrim && entry.downOnScrim) closeLayer(); entry.downOnScrim = false; });
  scrim.addEventListener('click', e => { if (e.target.closest('[data-close]')) closeLayer(); });
  $('#layer').append(scrim);
  layerStack.push(entry);
  const first = scrim.querySelector('[autofocus]') || scrim.querySelector('input,select,textarea,button:not([data-close])');
  setTimeout(() => { if (!scrim.contains(document.activeElement)) first?.focus(); }, 30);
  return scrim.firstElementChild;
}
function closeLayer() {
  const e = layerStack.pop();
  if (!e) return;
  e.scrim.remove();
  e.onClose?.();
  e.prevFocus?.focus?.();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && layerStack.length && !layerStack.at(-1).busy) closeLayer(); });
function confirmBox({ title, body, ok = 'Confirmar', danger = false, cancel = 'Cancelar' }) {
  return new Promise(resolve => {
    let done = false;
    const m = openLayer(`
      <div class="modal-h"><h2>${esc(title)}</h2><button class="icon-btn sm" data-close aria-label="Cerrar">${ICON.x}</button></div>
      <div class="modal-b">${body}</div>
      <div class="modal-f"><button class="btn" data-close type="button">${esc(cancel)}</button><button class="btn ${danger ? 'danger' : 'primary'}" data-ok type="button">${esc(ok)}</button></div>`,
      { cls: 'narrow', onClose: () => { if (!done) resolve(false); } });
    m.querySelector('[data-ok]').addEventListener('click', () => { done = true; closeLayer(); resolve(true); });
  });
}

/* ---------- Guardado y sincronización en GitHub (cifrado) ----------
   Mismo sistema que CONTROLVINTED. Todos los datos van en un único archivo de la rama «datos» del repositorio,
   cifrado con AES-GCM y una clave derivada (PBKDF2) de la clave de acceso: el repositorio es público pero el
   contenido es ilegible sin esa clave. El token de GitHub que permite escribir va dentro del archivo, también
   cifrado, así los demás dispositivos solo necesitan la clave. Cada registro lleva su fecha de cambio y al
   mezclar gana la más reciente (los borrados también la llevan), así dos dispositivos no se pisan. */
const enc = new TextEncoder(), dec = new TextDecoder();
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), ch => ch.charCodeAt(0));
const utf8b64 = str => b64(enc.encode(str));
const SYNC_CRED = 'almantec-cn.sync', SYNC_CACHE = 'almantec-cn.sync.cache';
const SYNC_APP = 'almantec-control-sync', SYNC_ITER = 310000, SYNC_TOMB_MS = 180 * 86400000;
const TOKEN_URL = 'https://github.com/settings/personal-access-tokens/new';
const COLS = { rep: 'reparaciones', mov: 'moviles' };

const Sync = {
  cfg: null, cred: null, aes: null, docs: {}, sha: null, etag: null, ver: 0, saved: 0, saving: false, again: false, timer: 0,
  lastSave: null, lastPull: null, failed: false, asking: false, connected: false, offline: false,
  config() {
    const c = CFG;
    if (!c || !/^[\w.-]+$/.test(String(c.owner || '')) || !/^[\w.-]+$/.test(String(c.repo || ''))) return null;
    return { owner: c.owner, repo: c.repo, branch: c.branch || 'datos', path: c.path || 'datos.json',
      api: String(c.api || 'https://api.github.com').replace(/\/+$/, ''), poll: Number(c.poll) || 15000 };
  },
  repoPath(p = '') { return `/repos/${this.cfg.owner}/${this.cfg.repo}${p}`; },
  gh(path, { method = 'GET', headers = {}, body, auth = true } = {}) {
    const h = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', ...headers };
    if (auth && this.cred && this.cred.token) h.Authorization = 'Bearer ' + this.cred.token;
    return fetch(this.cfg.api + path, { method, headers: h, body, cache: 'no-store' });
  },
  /* --- cifrado --- */
  async deriveRaw(pass, salt, iter) {
    const base = await crypto.subtle.importKey('raw', enc.encode(pass), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: iter, hash: 'SHA-256' }, base, 256));
  },
  importAes(raw) { return crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']); },
  async seal(obj, key = this.aes) {
    let bytes = enc.encode(JSON.stringify(obj)), z = false;
    if (window.CompressionStream) { bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()); z = true; }
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return { iv: b64(iv), ct: b64(new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes))), z };
  },
  async unseal(box, key = this.aes) {
    let bytes = new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(box.iv) }, key, unb64(box.ct)));
    if (box.z) bytes = new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
    return JSON.parse(dec.decode(bytes));
  },
  /* --- archivo remoto: 'same' si no ha cambiado, 'missing' si no existe, o { sha, file } --- */
  async pull({ force = false, auth = true } = {}) {
    const headers = { Accept: 'application/vnd.github.object+json' };
    if (this.etag && !force) headers['If-None-Match'] = this.etag;
    let r;
    try { r = await this.gh(this.repoPath(`/contents/${encodeURIComponent(this.cfg.path)}?ref=${encodeURIComponent(this.cfg.branch)}`), { headers, auth }); }
    catch { this.setOffline(true); throw { code: 'net' }; }
    this.setOffline(false);
    if (r.status === 304) { this.lastPull = new Date(); return 'same'; }
    if (r.status === 404) return 'missing';
    if (r.status === 401) throw { code: 'token' };
    if (!r.ok) throw { code: 'net', status: r.status };
    const j = await r.json();
    const etag = r.headers.get('ETag');
    this.lastPull = new Date();
    if (j.sha === this.sha && !force) { this.etag = etag; return 'same'; }
    let content = j.encoding === 'base64' && j.content ? j.content : '';
    if (!content) {
      const br = await this.gh(this.repoPath(`/git/blobs/${j.sha}`), { auth });
      if (!br.ok) throw { code: br.status === 401 ? 'token' : 'net', status: br.status };
      content = (await br.json()).content;
    }
    const file = JSON.parse(dec.decode(unb64(content.replace(/\s/g, ''))));
    if (!file || file.app !== SYNC_APP || !file.tok || !file.data) throw { code: 'format' };
    return { sha: j.sha, etag, file };
  },
  async fileBody() {
    const t = Date.now();
    for (const [k, v] of Object.entries(this.docs)) if (v.x && t - v.t > SYNC_TOMB_MS) delete this.docs[k];
    return { app: SYNC_APP, v: 1, salt: this.cred.salt, iter: this.cred.iter, tok: await this.seal(this.cred.token), data: await this.seal({ docs: this.docs }), at: new Date().toISOString() };
  },
  /** Mezcla registro a registro: gana la versión con fecha más reciente. Devuelve true si aquí hay algo más nuevo. */
  async absorb(res) {
    let remote;
    try { remote = (await this.unseal(res.file.data)).docs || {}; }
    catch { throw { code: 'key' }; }
    let changed = false;
    for (const [k, rv] of Object.entries(remote)) {
      const lv = this.docs[k];
      if (!lv || rv.t > lv.t) { this.docs[k] = rv; changed = true; }
    }
    const ahead = Object.entries(this.docs).some(([k, lv]) => !remote[k] || lv.t > remote[k].t);
    this.sha = res.sha; this.etag = res.etag || null;
    this.persist();
    if (changed) onDocsChanged();
    return ahead;
  },
  settle(ahead) { if (ahead) { if (this.saved === this.ver) this.ver++; } else if (!this.saving) this.saved = this.ver; this.persist(); renderStatus(); },
  async push() {
    if (this.saving) { this.again = true; return; }
    if (this.saved === this.ver) return;
    this.saving = true; renderStatus();
    const v0 = this.ver;
    try {
      for (let tries = 0; ; tries++) {
        const body = { message: `Datos cifrados · ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`, branch: this.cfg.branch, content: utf8b64(JSON.stringify(await this.fileBody())) };
        if (this.sha) body.sha = this.sha;
        let r;
        try { r = await this.gh(this.repoPath(`/contents/${encodeURIComponent(this.cfg.path)}`), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); }
        catch { this.setOffline(true); throw { code: 'net' }; }
        this.setOffline(false);
        if (r.ok) {
          const j = await r.json();
          this.sha = j.content.sha; this.etag = null; this.lastSave = new Date();
          if (this.ver === v0) this.saved = v0;
          this.persist(); this.failed = false;
          break;
        }
        // Otro dispositivo guardó antes: se mezcla lo suyo con lo de aquí y se vuelve a intentar.
        if ((r.status === 409 || r.status === 422) && tries < 5) { const res = await this.pull({ force: true }); if (res && res.file) await this.absorb(res); else if (res === 'missing') this.sha = null; continue; }
        if (r.status === 401 || r.status === 403 || r.status === 404) throw { code: 'token' };
        throw { code: 'net', status: r.status };
      }
    } catch (e) {
      if (e && e.code === 'token' && this.connected) this.tokenProblem();
      else if (e && e.code === 'key') this.keyChanged();
      else this.failed = true;
    } finally {
      this.saving = false;
      renderStatus();
      this.waiters.splice(0).forEach(w => w());
      if (this.again || (this.saved !== this.ver && !this.failed)) { this.again = false; this.schedule(); }
    }
  },
  waiters: [],
  /** Sube lo pendiente y espera. true = guardado en GitHub; false = sigue pendiente (sin conexión). */
  async flush(ms = 20000) {
    const end = Date.now() + ms;
    this.failed = false;
    while (this.saved !== this.ver && Date.now() < end) {
      if (!this.saving) { clearTimeout(this.timer); this.push(); }
      await new Promise(res => { this.waiters.push(res); setTimeout(res, 1500); });
      if (this.failed) return false;
    }
    return this.saved === this.ver;
  },
  schedule(ms = 800) { clearTimeout(this.timer); this.timer = setTimeout(() => this.push(), ms); },
  async tick({ force = false } = {}) {
    if (!this.connected || this.saving || this.asking) return;
    if (!force && document.visibilityState !== 'visible') return;
    try {
      const res = await this.pull({ force });
      if (res && res.file) this.settle(await this.absorb(res));
      else if (res === 'missing' && Object.keys(this.docs).length) { this.sha = null; this.ver++; }
      if (this.saved !== this.ver) this.push();
    } catch (e) {
      if (e && e.code === 'token') this.tokenProblem();
      else if (e && e.code === 'key') this.keyChanged();
    }
    renderStatus();
  },
  setOffline(v) { if (this.offline !== v) { this.offline = v; renderStatus(); } },
  persist() {
    try { localStorage.setItem(SYNC_CACHE, JSON.stringify({ owner: this.cfg.owner, repo: this.cfg.repo, docs: this.docs, sha: this.sha, pending: this.saved !== this.ver })); } catch { /* sin espacio */ }
  },
  saveCred() { try { localStorage.setItem(SYNC_CRED, JSON.stringify(this.cred)); } catch { /* nada */ } },
  write(col, id, data) {
    const k = col + '/' + id, prev = this.docs[k];
    const t = Math.max(Date.now(), prev ? prev.t + 1 : 0);
    this.docs[k] = data === null ? { t, x: 1 } : { t, d: JSON.parse(JSON.stringify(data)) };
    this.ver++; this.persist(); this.schedule();
    return t;
  },
  /* --- conexión --- */
  async connect() {
    this.cfg = this.config();
    if (!this.cfg) return 'config';
    if (!(window.crypto && crypto.subtle)) return 'crypto';
    let cred = null;
    try { cred = JSON.parse(localStorage.getItem(SYNC_CRED) || 'null'); } catch { /* nada */ }
    if (cred && cred.owner === this.cfg.owner && cred.repo === this.cfg.repo && cred.key && cred.token) {
      this.cred = cred; this.aes = await this.importAes(unb64(cred.key));
      try {
        const c = JSON.parse(localStorage.getItem(SYNC_CACHE) || 'null');
        if (c && c.owner === cred.owner && c.repo === cred.repo && c.docs) { this.docs = c.docs; this.sha = c.sha || null; if (c.pending) this.ver = 1; }
      } catch { /* nada */ }
      try {
        const res = await this.pull({ force: true });
        if (res && res.file) this.settle(await this.absorb(res));
        else if (res === 'missing') { this.sha = null; if (Object.keys(this.docs).length && this.saved === this.ver) this.ver++; }
      } catch (e) {
        if (e && e.code === 'token') setTimeout(() => this.tokenProblem(), 300);
        else if (e && e.code === 'key') { this.forget(); return this.connect(); }
        else toast('Sin conexión con GitHub: ves los datos guardados en este dispositivo. Se sincronizará al volver la conexión.', 'err');
      }
    } else {
      if (!await this.setup()) return 'cancel';
    }
    this.connected = true;
    setInterval(() => this.tick(), this.cfg.poll);
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') this.tick(); else if (this.saved !== this.ver) this.push(); });
    window.addEventListener('online', () => { this.failed = false; this.tick({ force: true }); });
    window.addEventListener('offline', () => this.setOffline(true));
    window.addEventListener('beforeunload', e => { if (this.saved !== this.ver) { this.push(); e.preventDefault(); e.returnValue = ''; } });
    if (this.saved !== this.ver) this.schedule(300);
    return 'ok';
  },
  forget() {
    try { localStorage.removeItem(SYNC_CRED); localStorage.removeItem(SYNC_CACHE); } catch { /* nada */ }
    this.cred = null; this.aes = null; this.docs = {}; this.sha = null; this.etag = null; this.ver = this.saved = 0;
  },
  /** Primera vez en este dispositivo. */
  async setup() {
    for (;;) {
      let res;
      try { res = await this.pull({ force: true, auth: false }); }
      catch (e) {
        if (e && e.code === 'format') { gate(`<h2>El archivo de datos no es válido</h2><p>El archivo <code>${esc(this.cfg.path)}</code> de la rama <code>${esc(this.cfg.branch)}</code> no es de esta app.</p>`); return false; }
        await this.waitRetry(); continue;
      }
      const ok = res === 'missing' ? await this.createFlow() : await this.joinFlow(res);
      if (ok === 'retry') continue;
      return ok;
    }
  },
  waitRetry() {
    return new Promise(resolve => {
      const box = gate(`<h2>Sin conexión con GitHub</h2><p>No se pudo conectar para cargar los datos. Comprueba la conexión a internet.</p><button class="btn primary" type="button" id="gRetry">Reintentar</button>`);
      $('#gRetry', box).onclick = () => resolve();
    });
  },
  /** Pantalla de conexión; onSubmit devuelve un texto de error o nada si todo fue bien. */
  form(title, body, submit, onSubmit, watch) {
    return new Promise(resolve => {
      const box = gate(`<div><h2>${title}</h2></div><form id="syForm" novalidate style="display:flex;flex-direction:column;gap:14px">${body}
        <div class="alert r" data-syerr hidden><p></p></div>
        <button class="btn primary" type="submit">${submit}</button></form>`, true);
      const form = $('#syForm', box);
      let done = false;
      const iv = watch ? setInterval(async () => {
        if (done) return clearInterval(iv);
        try { if (await watch() && !done) { done = true; clearInterval(iv); resolve(true); } } catch { /* nada */ }
      }, Math.max(this.cfg.poll, 5000)) : 0;
      form.addEventListener('submit', async e => {
        e.preventDefault();
        const btn = form.querySelector('[type="submit"]'), err = form.querySelector('[data-syerr]');
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Comprobando…'; err.hidden = true;
        let msg;
        try { msg = await onSubmit(form); } catch { msg = 'No se pudo conectar con GitHub. Comprueba la conexión e inténtalo de nuevo.'; }
        if (msg) { btn.disabled = false; btn.textContent = submit; err.hidden = false; err.firstElementChild.textContent = msg; return; }
        done = true; clearInterval(iv); resolve(true);
      });
    });
  },
  pwInput(id, label, extra = '') {
    return `<div class="fg"><label for="${id}">${label}</label><input class="field" id="${id}" type="password" spellcheck="false" ${extra}></div>`;
  },
  tokenSteps() {
    return `<details class="fsec"><summary style="cursor:pointer;color:var(--fg)">Cómo crear el token (3 minutos)</summary>
      <ol style="margin:0;padding-left:18px;display:flex;flex-direction:column;gap:6px;color:var(--fg-2)">
        <li>Abre <a href="${TOKEN_URL}" target="_blank" rel="noopener" style="color:var(--blue)">esta página de GitHub</a> con tu cuenta iniciada.</li>
        <li><b>Token name:</b> ${esc(this.cfg.repo)}. <b>Resource owner:</b> ${esc(this.cfg.owner)}. <b>Expiration:</b> la más larga que te deje.</li>
        <li><b>Repository access:</b> «Only select repositories» y elige <b>${esc(this.cfg.repo)}</b>.</li>
        <li><b>Permissions → Repository permissions → Contents:</b> «Read and write».</li>
        <li>Pulsa <b>Generate token</b>, copia el código (empieza por <code>github_pat_</code>) y pégalo aquí.</li>
      </ol></details>`;
  },
  async checkToken(token) {
    const r = await fetch(`${this.cfg.api}${this.repoPath()}`, { headers: { Accept: 'application/vnd.github+json', Authorization: 'Bearer ' + token }, cache: 'no-store' });
    if (r.status === 401) return 'Ese token no es válido o ha caducado.';
    if (r.status === 404) return `Ese token no tiene acceso al repositorio ${this.cfg.repo}. Revisa el paso 3.`;
    if (!r.ok) return 'GitHub no ha aceptado el token. Inténtalo de nuevo en un momento.';
    const j = await r.json();
    if (!j.permissions || !j.permissions.push) return 'El token no puede escribir. Revisa el paso 4: Contents → Read and write.';
    return '';
  },
  async ensureBranch() {
    const b = await this.gh(this.repoPath(`/branches/${encodeURIComponent(this.cfg.branch)}`));
    if (b.ok) return '';
    if (b.status !== 404) return 'No se pudo comprobar el repositorio.';
    const repo = await (await this.gh(this.repoPath())).json();
    const base = await this.gh(this.repoPath(`/git/ref/heads/${encodeURIComponent(repo.default_branch || 'main')}`));
    if (!base.ok) return 'No se pudo preparar el repositorio (¿está vacío?).';
    const r = await this.gh(this.repoPath('/git/refs'), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ref: 'refs/heads/' + this.cfg.branch, sha: (await base.json()).object.sha }) });
    return r.ok ? '' : 'El token no puede crear la rama de datos. Revisa el paso 4.';
  },
  createFlow() {
    return this.form('Activar los datos compartidos', `
      <p style="margin:0;color:var(--fg-2)">Los datos del negocio se guardarán <b>cifrados</b> en tu GitHub y se verán iguales en todos los móviles y ordenadores que conectes. Esto se hace una sola vez.</p>
      <div class="fg"><label for="sy-token">1. Token de GitHub</label><input class="field" style="font-family:var(--f-mono)" id="sy-token" autocomplete="off" spellcheck="false" placeholder="github_pat_…" autofocus><span class="hint">Permite a la web guardar en el repositorio. Se guarda cifrado.</span></div>
      ${this.tokenSteps()}
      ${this.pwInput('sy-pass', '2. Clave de acceso del negocio', 'autocomplete="new-password" placeholder="Mínimo 10 caracteres"')}
      ${this.pwInput('sy-pass2', 'Repite la clave', 'autocomplete="new-password"')}
      <p class="hint muted" style="margin:0;font-size:12.5px">Es la que escribirás en cada dispositivo. Dásela solo a quien quieras autorizar. Si la olvidas, los datos de GitHub no se pueden recuperar (por eso conviene descargar copias).</p>`,
      'Activar', async () => {
        const token = $('#sy-token').value.trim(), p1 = $('#sy-pass').value, p2 = $('#sy-pass2').value;
        if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(token)) return 'Pega el token de GitHub completo (empieza por github_pat_).';
        if (p1.length < 10) return 'La clave de acceso debe tener al menos 10 caracteres.';
        if (p1 !== p2) return 'Las dos claves no coinciden.';
        const bad = await this.checkToken(token); if (bad) return bad;
        const salt = crypto.getRandomValues(new Uint8Array(16));
        const raw = await this.deriveRaw(p1, salt, SYNC_ITER);
        this.cred = { owner: this.cfg.owner, repo: this.cfg.repo, token, key: b64(raw), salt: b64(salt), iter: SYNC_ITER };
        this.aes = await this.importAes(raw);
        const br = await this.ensureBranch(); if (br) { this.cred = null; return br; }
        const exists = await this.pull({ force: true });
        if (exists !== 'missing') { this.cred = null; return 'Otro dispositivo acaba de activarlo. Recarga la página y escribe la clave.'; }
        this.docs = {}; this.ver = 1; this.saved = 0; this.failed = false;
        await this.push();
        if (this.saved !== this.ver) { this.cred = null; this.docs = {}; return 'No se pudo guardar en GitHub. Inténtalo de nuevo.'; }
        this.saveCred();
        return '';
      });
  },
  joinFlow(res) {
    return this.form('Entrar', `
      <p style="margin:0;color:var(--fg-2)">Solo para personas autorizadas de Almantec. Escribe la clave de acceso del negocio. Se pide una vez en cada dispositivo.</p>
      ${this.pwInput('sy-pass', 'Clave de acceso', 'autocomplete="current-password" autofocus')}`,
      'Entrar', async () => {
        const pass = $('#sy-pass').value;
        if (!pass) return 'Escribe la clave de acceso.';
        const f = res.file, salt = unb64(f.salt);
        const raw = await this.deriveRaw(pass, salt, f.iter || SYNC_ITER);
        const key = await this.importAes(raw);
        let token;
        try { token = await this.unseal(f.tok, key); } catch { return 'Clave incorrecta.'; }
        this.cred = { owner: this.cfg.owner, repo: this.cfg.repo, token, key: b64(raw), salt: f.salt, iter: f.iter || SYNC_ITER };
        this.aes = key;
        this.docs = {}; this.sha = null;
        await this.absorb(res);
        this.saved = this.ver = 0;
        this.saveCred(); this.persist();
        return '';
      });
  },
  /** El token ha caducado o se ha retirado: primero mira si otro dispositivo ya puso uno nuevo. */
  async tokenProblem() {
    if (this.asking) return;
    this.asking = true;
    const adopt = async () => {
      const res = await this.pull({ force: true, auth: false });
      if (!res || !res.file) return false;
      const t = await this.unseal(res.file.tok);
      if (!t || t === this.cred.token) return false;
      this.cred.token = t; this.saveCred(); return true;
    };
    try { if (await adopt()) { this.asking = false; this.tick({ force: true }); return; } } catch { /* nada */ }
    const m = openLayer(`
      <div class="modal-h"><h2>Renueva el acceso a GitHub</h2></div>
      <form class="modal-b" novalidate>
        <p style="margin:0;color:var(--fg-2)">El token de GitHub ha caducado o se ha retirado, así que los cambios no se pueden subir. Crea uno nuevo y pégalo aquí. Lo que hayas cambiado sigue guardado en este dispositivo.</p>
        <div class="fg"><label for="sy-token2">Token nuevo de GitHub</label><input class="field" style="font-family:var(--f-mono)" id="sy-token2" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></div>
        ${this.tokenSteps()}
        <div class="form-alert"></div>
      </form>
      <div class="modal-f"><button class="btn primary" type="button" data-save>Guardar token</button></div>`, { cls: 'narrow' });
    const entry = layerStack.at(-1); if (entry) entry.busy = true;
    const iv = setInterval(async () => { try { if (await adopt()) { clearInterval(iv); finish(); } } catch { /* nada */ } }, 15000);
    const finish = () => { if (entry) entry.busy = false; closeLayer(); this.asking = false; this.failed = false; this.tick({ force: true }); };
    m.querySelector('[data-save]').addEventListener('click', async () => {
      const token = m.querySelector('#sy-token2').value.trim();
      const al = m.querySelector('.form-alert');
      if (!/^(github_pat_|ghp_)[A-Za-z0-9_]{20,}$/.test(token)) { al.innerHTML = `<div class="alert r">${ICON.info}<p>Pega el token completo (empieza por github_pat_).</p></div>`; return; }
      const bad = await this.checkToken(token).catch(() => 'No se pudo comprobar. Revisa la conexión.');
      if (bad) { al.innerHTML = `<div class="alert r">${ICON.info}<p>${esc(bad)}</p></div>`; return; }
      this.cred.token = token; this.saveCred(); this.ver++;
      clearInterval(iv); finish();
      toast('Token renovado');
    });
  },
  /** La clave se cambió desde otro dispositivo: hay que volver a entrar. */
  keyChanged() {
    if (this.asking) return;
    this.asking = true;
    const pending = this.saved !== this.ver;
    this.forget();
    gate(`<h2>Ha cambiado la clave de acceso</h2><p>Alguien ha cambiado la clave del negocio. Escribe la nueva para seguir.${pending ? ' Los cambios de este dispositivo que no se habían subido se han perdido; revisa los últimos registros.' : ''}</p><button class="btn primary" type="button" onclick="location.reload()">Continuar</button>`);
  },
  async changeKey(newPass) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const raw = await this.deriveRaw(newPass, salt, SYNC_ITER);
    const old = { ...this.cred }, oldAes = this.aes;
    await this.tick({ force: true });
    this.cred = { ...this.cred, key: b64(raw), salt: b64(salt), iter: SYNC_ITER };
    this.aes = await this.importAes(raw);
    this.ver++;
    const ok = await this.flush();
    if (!ok) { this.cred = old; this.aes = oldAes; this.ver++; this.schedule(); return false; }
    this.saveCred();
    return true;
  },
};

/* ---------- Registros: de los datos sincronizados a las listas de la app ---------- */
const REP_COLS = ['fecha', 'cliente', 'telefono', 'modelo', 'descripcion', 'facturado', 'coste_pieza', 'otros_costes', 'estado', 'estado_pago', 'fecha_pago', 'notas'];
const MOV_COLS = ['fecha_compra', 'fecha_venta', 'marca', 'modelo', 'imei', 'precio_compra', 'costes_adicionales', 'precio_venta', 'estado', 'fecha_cobro', 'notas'];
const listOf = kind => kind === 'rep' ? 'rep' : 'mov';
const money2 = c => Math.round(c) / 100;

// El beneficio no se guarda: siempre se calcula de los importes, así nunca puede quedar desfasado.
function withProfit(kind, d) {
  if (kind === 'rep') return { ...d, beneficio: money2(C.cents(d.facturado) - C.cents(d.coste_pieza) - C.cents(d.otros_costes)) };
  const sold = d.estado === 'vendido' && d.precio_venta != null;
  return { ...d, beneficio: sold ? money2(C.cents(d.precio_venta) - C.cents(d.precio_compra) - C.cents(d.costes_adicionales)) : null };
}
function rebuild() {
  const rep = [], mov = [];
  for (const [k, v] of Object.entries(Sync.docs)) {
    if (v.x || !v.d) continue;
    const i = k.indexOf('/'), col = k.slice(0, i), id = k.slice(i + 1);
    if (col === COLS.rep) rep.push({ ...withProfit('rep', v.d), id, _t: v.t });
    else if (col === COLS.mov) mov.push({ ...withProfit('mov', v.d), id, _t: v.t });
  }
  rep.sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0));
  mov.sort((a, b) => (a.fecha_compra < b.fecha_compra ? 1 : a.fecha_compra > b.fecha_compra ? -1 : 0));
  S.rep = rep; S.mov = mov;
}
const onDocsChanged = debounce(() => { rebuild(); if (S.ready) render(); }, 30);

function renderStatus() {
  const b = $('#syncBadge');
  if (!b) return;
  let cls = '', txt = 'Conectando…';
  const pending = Sync.saved !== Sync.ver;
  if (!Sync.connected) { cls = ''; txt = Sync.cfg ? 'Sin conectar' : 'Conectando…'; }
  else if (Sync.offline || (pending && Sync.failed)) { cls = 'bad'; txt = pending ? 'Sin conexión · cambios sin subir' : 'Sin conexión'; }
  else if (Sync.saving || pending) { cls = 'warn'; txt = 'Guardando en GitHub…'; }
  else { cls = 'ok'; const at = [Sync.lastSave, Sync.lastPull].filter(Boolean).sort((x, y) => y - x)[0]; txt = 'Sincronizado' + (at ? ' · ' + fmtTime(at) : ''); }
  b.className = 'badge ' + cls;
  b.innerHTML = `<span class="dot"></span><span>${esc(txt)}</span>`;
  b.title = 'Datos compartidos y cifrados en GitHub. Pulsa para ver el estado.';
  const off = $('#offlineBar');
  if (S.ready && Sync.connected && (Sync.offline || (pending && Sync.failed))) {
    off.hidden = false;
    off.innerHTML = `${ICON.cloudOff}<p>No hay conexión con GitHub. ${pending ? 'Tus últimos cambios están guardados en este dispositivo y se subirán solos al volver la conexión. Hasta entonces los demás no los ven.' : 'Ves los datos guardados en este dispositivo.'}</p><button class="btn sm" type="button" id="retryBtn">Reintentar</button>`;
    $('#retryBtn').onclick = () => { Sync.failed = false; Sync.tick({ force: true }); };
  } else off.hidden = true;
}

function openStatus() {
  const pending = Sync.saved !== Sync.ver;
  const m = openLayer(`
    <div class="modal-h"><h2>Datos compartidos</h2><button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${ICON.x}</button></div>
    <div class="modal-b">
      <div class="alert ${pending ? 'o' : 'g'}">${ICON.lock}<p>${pending ? 'Hay cambios pendientes de subir a GitHub. Se subirán solos en cuanto haya conexión.' : 'Todo guardado. Los datos están cifrados en GitHub y se ven iguales en todos los dispositivos conectados.'}</p></div>
      <dl class="kv"><dt>Repositorio</dt><dd>${esc(Sync.cfg.owner)}/${esc(Sync.cfg.repo)} · rama ${esc(Sync.cfg.branch)}</dd>
        <dt>Último guardado desde aquí</dt><dd>${Sync.lastSave ? esc(fmtDateTime(Sync.lastSave.toISOString())) : '—'}</dd>
        <dt>Última comprobación</dt><dd>${Sync.lastPull ? esc(fmtDateTime(Sync.lastPull.toISOString())) : '—'}</dd>
        <dt>Registros</dt><dd>${S.rep.length} reparaciones · ${S.mov.length} móviles</dd></dl>
      <p class="muted" style="margin:0;font-size:12.5px">Los cambios de otros dispositivos aparecen solos en unos 15 segundos con la página abierta.</p>
    </div>
    <div class="modal-f"><button class="btn ghost" type="button" data-c="key">Cambiar la clave</button><button class="btn ghost" type="button" data-c="out">Desconectar este dispositivo</button><button class="btn primary" type="button" data-close>Listo</button></div>`, { cls: 'narrow' });
  m.addEventListener('click', async e => {
    if (e.target.closest('[data-c="out"]')) {
      if (Sync.saved !== Sync.ver && !(await Sync.flush(8000))) { toast('Hay cambios sin subir. Espera a tener conexión antes de desconectar.', 'err'); return; }
      Sync.forget(); location.reload();
    }
    if (e.target.closest('[data-c="key"]')) { closeLayer(); openChangeKey(); }
  });
}

function openChangeKey() {
  const m = openLayer(`
    <div class="modal-h"><h2>Cambiar la clave de acceso</h2><button class="icon-btn sm" type="button" data-close aria-label="Cerrar">${ICON.x}</button></div>
    <form class="modal-b" novalidate>
      <p style="margin:0;color:var(--fg-2)">Sirve para quitar el acceso a alguien: los demás dispositivos tendrán que escribir la clave nueva.</p>
      <div class="fg"><label for="nk1">Clave nueva (mínimo 10 caracteres)</label><input class="field" id="nk1" type="password" autocomplete="new-password"></div>
      <div class="fg"><label for="nk2">Repítela</label><input class="field" id="nk2" type="password" autocomplete="new-password"></div>
      <div class="form-alert"></div>
    </form>
    <div class="modal-f"><button class="btn" data-close type="button">Cancelar</button><button class="btn primary" type="button" data-save>Cambiar clave</button></div>`, { cls: 'narrow' });
  m.querySelector('[data-save]').addEventListener('click', async () => {
    const a = m.querySelector('#nk1').value, b = m.querySelector('#nk2').value, al = m.querySelector('.form-alert');
    if (a.length < 10) { al.innerHTML = `<div class="alert r">${ICON.info}<p>Mínimo 10 caracteres.</p></div>`; return; }
    if (a !== b) { al.innerHTML = `<div class="alert r">${ICON.info}<p>No coinciden.</p></div>`; return; }
    const btn = m.querySelector('[data-save]'); btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Cambiando…';
    const ok = await Sync.changeKey(a).catch(() => false);
    if (!ok) { btn.disabled = false; btn.textContent = 'Cambiar clave'; al.innerHTML = `<div class="alert r">${ICON.info}<p>No se pudo guardar en GitHub. Revisa la conexión e inténtalo otra vez.</p></div>`; return; }
    closeLayer(); toast('Clave cambiada. Los demás dispositivos tendrán que escribir la nueva.');
  });
}

/* ---------- Guardar, editar y borrar ---------- */
// Escribe en el dispositivo y espera a que GitHub lo confirme. saved=false: quedó en el dispositivo, se subirá al volver la red.
async function saveRecord(kind, values, { id, newId, prevT }) {
  const col = COLS[kind];
  const rid = id || newId;
  if (id) {
    await Sync.tick({ force: true }); // trae lo último antes de escribir encima
    const cur = Sync.docs[col + '/' + id];
    if (!cur || cur.x) return { ok: false, deleted: true };
    if (cur.t !== prevT) return { ok: false, conflict: true };
  }
  const now = new Date().toISOString();
  const prev = Sync.docs[col + '/' + rid]?.d;
  const data = { ...(prev || {}), ...values, creado_en: prev?.creado_en || now, actualizado_en: now };
  Sync.write(col, rid, data);
  rebuild();
  const saved = await Sync.flush();
  rebuild();
  return { ok: true, row: S[listOf(kind)].find(r => r.id === rid), saved };
}
const savedToast = (saved, okMsg) => saved ? toast(okMsg + ' y subido a GitHub') : toast('Guardado en este dispositivo. Sin conexión con GitHub: se subirá solo en cuanto vuelva la conexión.', 'warn', 7000);

async function deleteRecord(kind, rec) {
  Sync.write(COLS[kind], rec.id, null);
  rebuild(); render();
  savedToast(await Sync.flush(), 'Eliminado');
}

async function askDelete(kind, id) {
  const rec = S[listOf(kind)].find(r => r.id === id);
  if (!rec) return;
  const what = kind === 'rep'
    ? `la reparación de <b>${esc(rec.cliente)}</b> (${esc(rec.modelo)}, ${esc(fmtDate(rec.fecha))}, ${esc(eurN(rec.facturado))})`
    : `el móvil <b>${esc(rec.marca)} ${esc(rec.modelo)}</b> comprado el ${esc(fmtDate(rec.fecha_compra))}`;
  const ok = await confirmBox({
    title: kind === 'rep' ? 'Eliminar reparación' : 'Eliminar móvil',
    body: `<p style="margin:0">Vas a eliminar ${what}. Se borra para todos los dispositivos y las estadísticas se recalculan.</p><div class="alert o">${ICON.info}<p>No se puede deshacer. Si dudas, descarga antes una copia de seguridad (menú Datos).</p></div>`,
    ok: 'Eliminar', danger: true,
  });
  if (!ok) return;
  await deleteRecord(kind, rec);
}

// Marcar como cobrado desde las listas.
async function markPaid(kind, id) {
  const rec = S[listOf(kind)].find(r => r.id === id);
  if (!rec) return;
  const values = kind === 'rep' ? { estado_pago: 'pagado', fecha_pago: todayISO() } : { fecha_cobro: todayISO() };
  const res = await saveRecord(kind, values, { id, prevT: rec._t });
  if (!res.ok) { toast(res.deleted ? 'Ese registro lo acaba de borrar otra persona.' : 'Otra persona acaba de cambiar este registro. Ya ves su versión: vuelve a intentarlo.', 'err'); render(); return; }
  render();
  savedToast(res.saved, 'Marcado como cobrado');
}


/* ---------- Formularios ---------- */
const fgErr = (form, name, msg) => {
  const fg = form.querySelector(`[name="${name}"]`)?.closest('.fg');
  if (!fg) return;
  fg.classList.toggle('bad', !!msg);
  const e = fg.querySelector('.err'); if (e) e.textContent = msg || '';
};
const segHtml = (name, map, val, colors) => `<div class="seg" role="radiogroup">${Object.entries(map).map(([k, [l]], i) =>
  `<input type="radio" id="${name}-${k}" name="${name}" value="${k}" ${val === k ? 'checked' : ''}><label for="${name}-${k}" class="${colors[i] || ''}">${esc(l)}</label>`).join('')}</div>`;
const moneyField = (name, label, val, { opt = false, hint = '' } = {}) => `
  <div class="fg"><label for="f-${name}">${esc(label)}${opt ? ' <span class="opt">(opcional)</span>' : ''}</label>
  <div class="money-in"><input class="field" id="f-${name}" name="${name}" inputmode="decimal" autocomplete="off" placeholder="0,00" value="${esc(moneyInput(val))}"><span>€</span></div>
  ${hint ? `<span class="hint">${esc(hint)}</span>` : ''}<span class="err"></span></div>`;
const textField = (name, label, val, { opt = false, type = 'text', ph = '', list = '', full = false, auto = 'off' } = {}) => `
  <div class="fg${full ? ' full' : ''}"><label for="f-${name}">${esc(label)}${opt ? ' <span class="opt">(opcional)</span>' : ''}</label>
  <input class="field" id="f-${name}" name="${name}" type="${type}" autocomplete="${auto}" ${list ? `list="${list}"` : ''} placeholder="${esc(ph)}" value="${esc(val ?? '')}"><span class="err"></span></div>`;

function formMeta(rec) {
  if (!rec) return '';
  return rec.actualizado_en ? `Última modificación: ${esc(fmtDateTime(rec.actualizado_en))}` : '';
}

async function submitForm({ kind, form, rec, newId, values, dupCheck }) {
  const btn = form.closest('.modal').querySelector('[data-save]');
  if (btn.disabled) return;
  if (!rec && dupCheck) {
    const dup = dupCheck(values);
    if (dup) {
      const go = await confirmBox({ title: 'Posible duplicado', body: `<div class="alert o">${ICON.info}<p>${dup}</p></div><p style="margin:0">¿Quieres guardarlo igualmente?</p>`, ok: 'Guardar igualmente' });
      if (!go) return;
    }
  }
  btn.disabled = true;
  const label = btn.innerHTML;
  btn.innerHTML = '<span class="spin"></span> Guardando…';
  const entry = layerStack.at(-1); if (entry) entry.busy = true;
  try {
    const res = await saveRecord(kind, values, { id: rec?.id, newId, prevT: rec?._t });
    if (!res.ok) {
      if (entry) entry.busy = false;
      render();
      const still = S[listOf(kind)].find(r => r.id === rec.id);
      form.closest('.modal').querySelector('.form-alert').innerHTML = res.conflict && still
        ? `<div class="alert o">${ICON.info}<p>Otra persona ha modificado este registro mientras lo editabas (${esc(fmtDateTime(still.actualizado_en))}). Cierra y vuelve a abrirlo para ver su versión antes de guardar la tuya.</p></div>`
        : `<div class="alert r">${ICON.info}<p>Este registro lo ha eliminado otra persona. No se ha guardado nada.</p></div>`;
      btn.disabled = false; btn.innerHTML = label;
      return;
    }
    if (entry) entry.busy = false;
    closeLayer();
    render();
    savedToast(res.saved, rec ? 'Cambios guardados' : 'Guardado');
  } catch (e) {
    if (entry) entry.busy = false;
    btn.disabled = false; btn.innerHTML = label;
    form.closest('.modal').querySelector('.form-alert').innerHTML = `<div class="alert r">${ICON.info}<p>${esc(errMsg(e))}</p></div>`;
  }
}

function openRepForm(rec) {
  const r = rec || { fecha: todayISO(), estado: 'pendiente', estado_pago: 'pendiente' };
  const newId = uuid();
  const m = openLayer(`
    <div class="modal-h"><h2>${rec ? 'Editar reparación' : 'Nueva reparación'}</h2><button class="icon-btn sm" data-close aria-label="Cerrar">${ICON.x}</button></div>
    <form class="modal-b" novalidate>
      <div class="form-alert"></div>
      <div class="grid2">
        ${textField('fecha', 'Fecha de la reparación', r.fecha, { type: 'date' })}
        <div class="fg"><span class="lbl">Estado de la reparación</span>${segHtml('estado', REP_ESTADO, r.estado, ['o', 'b', 'g'])}</div>
        ${textField('cliente', 'Nombre del cliente', r.cliente, { ph: 'Nombre y apellido', list: 'dl-clientes' })}
        ${textField('telefono', 'Teléfono de contacto', r.telefono, { opt: true, type: 'tel', ph: '600 000 000' })}
        ${textField('modelo', 'Modelo del dispositivo', r.modelo, { ph: 'iPhone 13, Galaxy A54…', list: 'dl-modelos' })}
        ${textField('descripcion', 'Reparación realizada', r.descripcion, { ph: 'Cambio de pantalla, batería…' })}
      </div>
      <div class="fsec">
        <h3>Importes</h3>
        <p class="muted" style="margin:-6px 0 0;font-size:12.5px">Solo cuenta en facturación y beneficio cuando la reparación está finalizada. Hasta entonces es dinero previsto.</p>
        <div class="grid3">
          ${moneyField('facturado', 'Importe facturado', r.facturado)}
          ${moneyField('coste_pieza', 'Coste de la pieza', r.coste_pieza)}
          ${moneyField('otros_costes', 'Otros costes', r.otros_costes, { opt: true })}
        </div>
        <div class="preview" id="pv"></div>
      </div>
      <div class="grid2">
        <div class="fg"><span class="lbl">Estado del pago</span>${segHtml('estado_pago', REP_PAGO, r.estado_pago, ['r', 'g'])}</div>
        <div class="fg" id="fgFechaPago">${textField('fecha_pago', 'Fecha de cobro', r.fecha_pago || todayISO(), { type: 'date' }).replace(/^\s*<div class="fg">|<\/div>\s*$/g, '')}</div>
        <div class="fg full"><label for="f-notas">Notas <span class="opt">(opcional)</span></label><textarea class="field" id="f-notas" name="notas" rows="2">${esc(r.notas || '')}</textarea></div>
      </div>
      <datalist id="dl-clientes">${[...new Set(S.rep.map(x => x.cliente))].slice(0, 300).map(v => `<option value="${esc(v)}">`).join('')}</datalist>
      <datalist id="dl-modelos">${[...new Set([...S.rep.map(x => x.modelo), ...S.mov.map(x => x.modelo)])].slice(0, 300).map(v => `<option value="${esc(v)}">`).join('')}</datalist>
    </form>
    <div class="modal-f"><span class="meta">${formMeta(rec)}</span>${rec ? `<button class="btn ghost" type="button" data-del>${ICON.del}Eliminar</button>` : ''}<button class="btn" data-close type="button">Cancelar</button><button class="btn primary" type="button" data-save>${ICON.check}${rec ? 'Guardar cambios' : 'Guardar reparación'}</button></div>`);
  const form = m.querySelector('form');
  const val = n => form.elements[n]?.value ?? '';
  const preview = () => {
    const f = parseMoney(val('facturado')), p = parseMoney(val('coste_pieza')), o = parseMoney(val('otros_costes'));
    const ok = [f, p, o].every(x => x === null || !isNaN(x));
    const cf = C.cents(f), cc = C.cents(p) + C.cents(o), b = cf - cc;
    m.querySelector('#pv').innerHTML = `<div><span>Facturado</span><b>${ok ? eur(cf) : '—'}</b></div><div><span>Costes</span><b class="c-r">${ok ? eur(cc) : '—'}</b></div><div><span>${form.elements.estado.value === 'finalizada' ? 'Beneficio' : 'Beneficio previsto'}</span><b class="${b < 0 ? 'c-r' : 'c-g'}">${ok ? eur(b) : '—'}</b></div>`;
    m.querySelector('#fgFechaPago').hidden = form.elements.estado_pago.value !== 'pagado';
  };
  form.addEventListener('input', preview);
  form.addEventListener('change', preview);
  preview();
  m.querySelector('[data-del]')?.addEventListener('click', () => { closeLayer(); askDelete('rep', rec.id); });
  const save = () => {
    let bad = false;
    const err = (n, msg) => { fgErr(form, n, msg); if (msg) bad = true; };
    const v = {};
    v.fecha = val('fecha'); err('fecha', validDate(v.fecha) ? '' : 'Pon una fecha válida');
    v.cliente = val('cliente').trim(); err('cliente', v.cliente ? '' : 'Escribe el nombre del cliente');
    v.telefono = val('telefono').trim() || null;
    err('telefono', v.telefono && !/^[+\d][\d\s().-]{5,}$/.test(v.telefono) ? 'Teléfono no válido' : '');
    v.modelo = val('modelo').trim(); err('modelo', v.modelo ? '' : 'Escribe el modelo');
    v.descripcion = val('descripcion').trim();
    const f = parseMoney(val('facturado')), p = parseMoney(val('coste_pieza')), o = parseMoney(val('otros_costes'));
    err('facturado', f === null ? 'Escribe el importe (0 si no se cobra)' : isNaN(f) ? 'Importe no válido (ej.: 59,90)' : '');
    err('coste_pieza', p === null ? 'Escribe el coste (0 si no hubo pieza)' : isNaN(p) ? 'Importe no válido' : '');
    err('otros_costes', o !== null && isNaN(o) ? 'Importe no válido' : '');
    v.facturado = f; v.coste_pieza = p; v.otros_costes = o ?? 0;
    v.estado = form.elements.estado.value || 'pendiente';
    v.estado_pago = form.elements.estado_pago.value || 'pendiente';
    v.fecha_pago = v.estado_pago === 'pagado' ? (val('fecha_pago') || todayISO()) : null;
    if (v.fecha_pago) err('fecha_pago', validDate(v.fecha_pago) ? '' : 'Fecha no válida');
    v.notas = val('notas').trim() || null;
    if (bad) { form.querySelector('.fg.bad .field')?.focus(); return; }
    submitForm({
      kind: 'rep', form, rec, newId, values: v,
      dupCheck: x => {
        const d = S.rep.find(o => o.fecha === x.fecha && norm(o.cliente) === norm(x.cliente) && norm(o.modelo) === norm(x.modelo) && Number(o.facturado) === x.facturado);
        return d ? `Ya hay una reparación de <b>${esc(d.cliente)}</b> (${esc(d.modelo)}) el ${esc(fmtDate(d.fecha))} por ${esc(eurN(d.facturado))}.` : '';
      },
    });
  };
  m.querySelector('[data-save]').addEventListener('click', save);
  form.addEventListener('submit', e => { e.preventDefault(); save(); });
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); save(); } });
}

function openMovForm(rec) {
  const r = rec || { fecha_compra: todayISO(), estado: 'disponible' };
  const newId = uuid();
  const brands = [...new Set(['Apple', 'Samsung', 'Xiaomi', 'Redmi', 'Oppo', 'Motorola', 'Realme', 'Honor', 'Huawei', 'Google', ...S.mov.map(x => x.marca)])];
  const m = openLayer(`
    <div class="modal-h"><h2>${rec ? 'Editar móvil' : 'Nuevo móvil'}</h2><button class="icon-btn sm" data-close aria-label="Cerrar">${ICON.x}</button></div>
    <form class="modal-b" novalidate>
      <div class="form-alert"></div>
      <div class="grid2">
        ${textField('marca', 'Marca', r.marca, { list: 'dl-marcas', ph: 'Apple, Samsung, Xiaomi…' })}
        ${textField('modelo', 'Modelo', r.modelo, { ph: 'iPhone 13 128 GB', list: 'dl-modelos-m' })}
        ${textField('imei', 'IMEI o número de serie', r.imei, { opt: true, ph: '35 000000 000000 0' })}
        <div class="fg"><span class="lbl">Estado</span>${segHtml('estado', MOV_ESTADO, r.estado, ['b', 'o', 'g'])}</div>
      </div>
      <div class="fsec">
        <h3>Compra</h3>
        <div class="grid3">
          ${textField('fecha_compra', 'Fecha de compra', r.fecha_compra, { type: 'date' })}
          ${moneyField('precio_compra', 'Precio de compra', r.precio_compra)}
          ${moneyField('costes_adicionales', 'Costes adicionales', r.costes_adicionales, { opt: true, hint: 'Piezas, envío, limpieza…' })}
        </div>
      </div>
      <div class="fsec" id="secVenta">
        <h3>Venta</h3>
        <div class="grid3">
          ${textField('fecha_venta', 'Fecha de venta', r.fecha_venta || todayISO(), { type: 'date' })}
          ${moneyField('precio_venta', 'Precio de venta', r.precio_venta)}
          <div class="fg"><span class="lbl">Cobro</span>
            <label class="check"><input type="checkbox" name="cobrado" ${r.fecha_cobro || !rec ? 'checked' : ''}> Ya está cobrado</label>
            <input class="field" type="date" name="fecha_cobro" id="f-fecha_cobro" aria-label="Fecha de cobro" value="${esc(r.fecha_cobro || r.fecha_venta || todayISO())}"><span class="err"></span>
          </div>
        </div>
      </div>
      <div class="preview" id="pv"></div>
      <div class="fg full"><label for="f-notas">Notas <span class="opt">(opcional)</span></label><textarea class="field" id="f-notas" name="notas" rows="2">${esc(r.notas || '')}</textarea></div>
      <datalist id="dl-marcas">${brands.map(v => `<option value="${esc(v)}">`).join('')}</datalist>
      <datalist id="dl-modelos-m">${[...new Set(S.mov.map(x => x.modelo))].slice(0, 300).map(v => `<option value="${esc(v)}">`).join('')}</datalist>
    </form>
    <div class="modal-f"><span class="meta">${formMeta(rec)}</span>${rec ? `<button class="btn ghost" type="button" data-del>${ICON.del}Eliminar</button>` : ''}<button class="btn" data-close type="button">Cancelar</button><button class="btn primary" type="button" data-save>${ICON.check}${rec ? 'Guardar cambios' : 'Guardar móvil'}</button></div>`);
  const form = m.querySelector('form');
  const val = n => form.elements[n]?.value ?? '';
  const preview = () => {
    const st = form.elements.estado.value;
    const sold = st === 'vendido';
    m.querySelector('#secVenta').hidden = !sold;
    form.elements.fecha_cobro.hidden = !form.elements.cobrado.checked;
    const pc = parseMoney(val('precio_compra')), ca = parseMoney(val('costes_adicionales')), pv = parseMoney(val('precio_venta'));
    const ok = [pc, ca, pv].every(x => x === null || !isNaN(x));
    const coste = C.cents(pc) + C.cents(ca);
    const b = C.cents(pv) - coste;
    m.querySelector('#pv').innerHTML = `<div><span>Coste total</span><b class="c-r">${ok ? eur(coste) : '—'}</b></div>`
      + (sold ? `<div><span>Precio de venta</span><b>${ok && pv !== null ? eur(C.cents(pv)) : '—'}</b></div><div><span>Beneficio</span><b class="${b < 0 ? 'c-r' : 'c-g'}">${ok && pv !== null ? eur(b) : '—'}</b></div>`
        : `<div style="grid-column:span 2"><span>Beneficio</span><b class="muted" style="font-size:14px;font-family:var(--f-body)">Sin vender: cuenta como inventario, no como beneficio</b></div>`);
  };
  form.addEventListener('input', preview);
  form.addEventListener('change', preview);
  preview();
  m.querySelector('[data-del]')?.addEventListener('click', () => { closeLayer(); askDelete('mov', rec.id); });
  const save = () => {
    let bad = false;
    const err = (n, msg) => { fgErr(form, n, msg); if (msg) bad = true; };
    const v = {};
    v.marca = val('marca').trim(); err('marca', v.marca ? '' : 'Escribe la marca');
    v.modelo = val('modelo').trim(); err('modelo', v.modelo ? '' : 'Escribe el modelo');
    v.imei = val('imei').trim() || null;
    v.estado = form.elements.estado.value || 'disponible';
    v.fecha_compra = val('fecha_compra'); err('fecha_compra', validDate(v.fecha_compra) ? '' : 'Pon una fecha válida');
    const pc = parseMoney(val('precio_compra')), ca = parseMoney(val('costes_adicionales'));
    err('precio_compra', pc === null ? 'Escribe el precio de compra' : isNaN(pc) ? 'Importe no válido (ej.: 120,50)' : '');
    err('costes_adicionales', ca !== null && isNaN(ca) ? 'Importe no válido' : '');
    v.precio_compra = pc; v.costes_adicionales = ca ?? 0;
    if (v.estado === 'vendido') {
      v.fecha_venta = val('fecha_venta');
      err('fecha_venta', !validDate(v.fecha_venta) ? 'Pon la fecha de venta' : (validDate(v.fecha_compra) && v.fecha_venta < v.fecha_compra) ? 'No puede ser anterior a la compra' : '');
      const pv = parseMoney(val('precio_venta'));
      err('precio_venta', pv === null ? 'Escribe el precio de venta' : isNaN(pv) ? 'Importe no válido' : '');
      v.precio_venta = pv;
      v.fecha_cobro = form.elements.cobrado.checked ? (val('fecha_cobro') || v.fecha_venta) : null;
      const fcFg = form.elements.fecha_cobro.closest('.fg');
      const fcBad = v.fecha_cobro && !validDate(v.fecha_cobro);
      fcFg.classList.toggle('bad', !!fcBad); fcFg.querySelector('.err').textContent = fcBad ? 'Fecha no válida' : '';
      if (fcBad) bad = true;
    } else {
      // Sin vender no hay venta ni cobro. Si estaba reservado con un precio acordado, se conserva el precio.
      v.fecha_venta = null; v.fecha_cobro = null;
      const pv = parseMoney(val('precio_venta'));
      v.precio_venta = pv === null || isNaN(pv) ? (rec?.precio_venta ?? null) : pv;
    }
    v.notas = val('notas').trim() || null;
    if (bad) { form.querySelector('.fg.bad .field')?.focus(); return; }
    submitForm({
      kind: 'mov', form, rec, newId, values: v,
      dupCheck: x => {
        const byImei = x.imei && S.mov.find(o => o.imei && norm(o.imei).replace(/\s/g, '') === norm(x.imei).replace(/\s/g, ''));
        if (byImei) return `Ya hay un móvil con ese IMEI/número de serie: <b>${esc(byImei.marca)} ${esc(byImei.modelo)}</b>, comprado el ${esc(fmtDate(byImei.fecha_compra))} (${esc(MOV_ESTADO[byImei.estado]?.[0] || byImei.estado)}).`;
        const d = S.mov.find(o => o.fecha_compra === x.fecha_compra && norm(o.modelo) === norm(x.modelo) && Number(o.precio_compra) === x.precio_compra);
        return d ? `Ya hay un <b>${esc(d.marca)} ${esc(d.modelo)}</b> comprado el ${esc(fmtDate(d.fecha_compra))} por ${esc(eurN(d.precio_compra))}.` : '';
      },
    });
  };
  m.querySelector('[data-save]').addEventListener('click', save);
  form.addEventListener('submit', e => { e.preventDefault(); save(); });
  form.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.tagName === 'INPUT') { e.preventDefault(); save(); } });
}

function openRecord(kind, id) {
  const rec = S[listOf(kind)].find(r => r.id === id);
  if (!rec) { toast('Ese registro ya no existe (lo han borrado).', 'err'); return; }
  kind === 'rep' ? openRepForm(rec) : openMovForm(rec);
}

/* ---------- Gráficos (SVG propio, sin librerías) ---------- */
function niceTicks(min, max, count = 4) {
  if (min === max) { max = min + 100; }
  const span = max - min;
  const raw = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(s => s * mag).find(s => span / s <= count + 0.5) || 10 * mag;
  const lo = Math.floor(min / step) * step, hi = Math.ceil(max / step) * step;
  const ticks = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(Math.round(v));
  return ticks;
}
// Barra con el extremo de datos redondeado (4 px) y la base recta sobre el eje.
function barPath(x, y0, y1, w, r = 4) {
  const h = Math.abs(y1 - y0);
  if (h < 0.5) return '';
  r = Math.min(r, w / 2, h);
  if (y1 < y0) return `M${x},${y0}V${y1 + r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 + r}V${y0}Z`;
  return `M${x},${y0}V${y1 - r}Q${x},${y1} ${x + r},${y1}H${x + w - r}Q${x + w},${y1} ${x + w},${y1 - r}V${y0}Z`;
}
function tipHtml(title, rows) {
  return `<b>${esc(title)}</b>` + rows.map(([l, v, color]) => `<div class="tr"><span>${color ? `<i style="background:${color}"></i>` : ''}${esc(l)}</span><span>${esc(v)}</span></div>`).join('');
}
function attachTips(el, svg, getTip) {
  const tip = document.createElement('div');
  tip.className = 'tip'; tip.hidden = true;
  el.append(tip);
  const show = (hit) => {
    const i = +hit.dataset.i;
    $$('.hit.on', svg).forEach(h => h.classList.remove('on'));
    hit.classList.add('on');
    const { html, x, y } = getTip(i);
    tip.innerHTML = html; tip.hidden = false;
    const w = el.clientWidth, tw = tip.offsetWidth;
    tip.style.left = Math.max(tw / 2, Math.min(w - tw / 2, x)) + 'px';
    tip.style.top = Math.max(y, tip.offsetHeight + 10) + 'px';
    el.dispatchEvent(new CustomEvent('hover-i', { detail: i }));
  };
  svg.addEventListener('pointerover', e => { const h = e.target.closest('.hit'); if (h) show(h); });
  svg.addEventListener('click', e => { const h = e.target.closest('.hit'); if (h) show(h); });
  el.addEventListener('pointerleave', () => { tip.hidden = true; $$('.hit.on', svg).forEach(h => h.classList.remove('on')); el.dispatchEvent(new CustomEvent('hover-i', { detail: -1 })); });
}

function barChart(el, { cats, labels, tipTitles, series, height = 230 }) {
  const W = Math.max(280, el.clientWidth || 600), H = height;
  const pad = { l: 58, r: 6, t: 12, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const all = series.flatMap(s => s.values);
  const ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all));
  const lo = ticks[0], hi = ticks.at(-1);
  const y = v => pad.t + ih - ((v - lo) / (hi - lo)) * ih;
  const band = iw / cats.length;
  const n = series.length, gap = 2;
  const groupW = Math.min(band * 0.74, n * 26 + gap * (n - 1));
  const bw = (groupW - gap * (n - 1)) / n;
  const every = Math.ceil(cats.length * 40 / iw);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><g class="grid">`;
  for (const t of ticks) s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="${t === 0 ? 'zero' : ''}"/><text x="${pad.l - 8}" y="${y(t) + 3.5}" text-anchor="end">${esc(axisEur(t))}</text>`;
  s += '</g>';
  cats.forEach((c, i) => {
    const gx = pad.l + band * i + (band - groupW) / 2;
    series.forEach((se, j) => {
      const v = se.values[i];
      if (v) s += `<path d="${barPath(gx + j * (bw + gap), y(0), y(v), bw)}" fill="${se.color}"/>`;
    });
    if (i % every === 0 || i === cats.length - 1 && cats.length <= 13) s += `<text x="${pad.l + band * i + band / 2}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`;
  });
  cats.forEach((c, i) => { s += `<rect class="hit" data-i="${i}" x="${pad.l + band * i}" y="${pad.t}" width="${band}" height="${ih}" rx="6"/>`; });
  s += '</svg>';
  el.innerHTML = s;
  const svg = el.querySelector('svg');
  attachTips(el, svg, i => {
    const top = Math.min(...series.map(se => y(Math.max(0, se.values[i]))));
    return { html: tipHtml(tipTitles[i], series.map(se => [se.label, eur(se.values[i]), se.color])), x: pad.l + band * i + band / 2, y: top };
  });
}

function lineChart(el, { cats, labels, tipTitles, values, color, label, height = 230, extraTip }) {
  const W = Math.max(280, el.clientWidth || 600), H = height;
  const pad = { l: 58, r: 10, t: 12, b: 26 };
  const iw = W - pad.l - pad.r, ih = H - pad.t - pad.b;
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values));
  const lo = ticks[0], hi = ticks.at(-1);
  const y = v => pad.t + ih - ((v - lo) / (hi - lo)) * ih;
  const step = cats.length > 1 ? iw / (cats.length - 1) : 0;
  const x = i => cats.length > 1 ? pad.l + step * i : pad.l + iw / 2;
  const every = Math.ceil(cats.length * 40 / iw);
  const pts = values.map((v, i) => [x(i), y(v)]);
  let s = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img"><defs><linearGradient id="g-${el.id}" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="${color}" stop-opacity=".28"/><stop offset="1" stop-color="${color}" stop-opacity="0"/></linearGradient></defs><g class="grid">`;
  for (const t of ticks) s += `<line x1="${pad.l}" x2="${W - pad.r}" y1="${y(t)}" y2="${y(t)}" class="${t === 0 ? 'zero' : ''}"/><text x="${pad.l - 8}" y="${y(t) + 3.5}" text-anchor="end">${esc(axisEur(t))}</text>`;
  s += '</g>';
  if (pts.length > 1) {
    const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join('');
    s += `<path d="${line}L${pts.at(-1)[0]},${y(Math.max(lo, 0))}L${pts[0][0]},${y(Math.max(lo, 0))}Z" fill="url(#g-${el.id})"/>`;
    s += `<path d="${line}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`;
  }
  const last = pts.at(-1);
  if (last) s += `<circle cx="${last[0]}" cy="${last[1]}" r="4" fill="${color}" stroke="var(--card)" stroke-width="2"/>`;
  s += `<line class="xh" x1="0" x2="0" y1="${pad.t}" y2="${pad.t + ih}" stroke="var(--line-2)" stroke-dasharray="3 3" visibility="hidden"/><circle class="xd" r="4.5" fill="${color}" stroke="var(--card)" stroke-width="2" visibility="hidden"/>`;
  cats.forEach((c, i) => { if (i % every === 0) s += `<text x="${x(i)}" y="${H - 8}" text-anchor="middle">${esc(labels[i])}</text>`; });
  cats.forEach((c, i) => {
    const hx = cats.length > 1 ? x(i) - step / 2 : pad.l;
    const hw = cats.length > 1 ? step : iw;
    s += `<rect class="hit" data-i="${i}" x="${Math.max(pad.l, hx)}" y="${pad.t}" width="${hw}" height="${ih}" style="fill:transparent"/>`;
  });
  s += '</svg>';
  el.innerHTML = s;
  const svg = el.querySelector('svg');
  const xh = svg.querySelector('.xh'), xd = svg.querySelector('.xd');
  el.addEventListener('hover-i', e => {
    const i = e.detail;
    if (i < 0) { xh.setAttribute('visibility', 'hidden'); xd.setAttribute('visibility', 'hidden'); return; }
    xh.setAttribute('x1', pts[i][0]); xh.setAttribute('x2', pts[i][0]); xh.setAttribute('visibility', 'visible');
    xd.setAttribute('cx', pts[i][0]); xd.setAttribute('cy', pts[i][1]); xd.setAttribute('visibility', 'visible');
  });
  attachTips(el, svg, i => ({ html: tipHtml(tipTitles[i], [[label, eur(values[i]), color], ...(extraTip ? extraTip(i) : [])]), x: pts[i][0], y: pts[i][1] }));
}

function donut(el, parts) {
  const total = parts.reduce((a, p) => a + Math.max(0, p.value), 0);
  if (!total) { el.innerHTML = '<div class="chart-empty">Todavía no hay ingresos en este periodo.</div>'; return; }
  const R = 58, SW = 20, Cx = 75, Cy = 75, L = 2 * Math.PI * R;
  let off = 0, arcs = '';
  const shown = parts.filter(p => p.value > 0);
  for (const p of shown) {
    const len = (p.value / total) * L;
    const g = shown.length > 1 ? 2 : 0;
    arcs += `<circle cx="${Cx}" cy="${Cy}" r="${R}" fill="none" stroke="${p.color}" stroke-width="${SW}" stroke-dasharray="${Math.max(0, len - g)} ${L}" stroke-dashoffset="${-off}" transform="rotate(-90 ${Cx} ${Cy})"><title>${esc(p.label)}: ${esc(eur(p.value))}</title></circle>`;
    off += len;
  }
  el.innerHTML = `<div class="donut-wrap"><svg viewBox="0 0 150 150" role="img" aria-label="Distribución de ingresos"><circle cx="${Cx}" cy="${Cy}" r="${R}" fill="none" stroke="var(--bg-2)" stroke-width="${SW}"/>${arcs}
    <text x="75" y="71" text-anchor="middle" style="fill:var(--muted);font-size:10px">Ingresos</text><text x="75" y="88" text-anchor="middle" style="fill:var(--fg);font-size:14px;font-weight:600;font-family:var(--f-display)">${esc(axisEur(total))}</text></svg>
    <div class="dl">${parts.map(p => `<div class="dl-row"><span class="t"><i style="background:${p.color}"></i>${esc(p.label)}</span><b>${esc(eur(p.value))}</b><span class="p">${total ? Math.round(Math.max(0, p.value) / total * 100) : 0} % de los ingresos${p.sub ? ' · ' + esc(p.sub) : ''}</span></div>`).join('')}</div></div>`;
}

const SER = {
  fact: { label: 'Facturación', color: 'var(--s-fact)' },
  cost: { label: 'Costes', color: 'var(--s-cost)' },
  ben: { label: 'Beneficio', color: 'var(--s-ben)' },
  rep: { label: 'Reparaciones', color: 'var(--s-rep)' },
  mov: { label: 'Móviles', color: 'var(--s-mov)' },
};
const legend = keys => `<div class="legend">${keys.map(k => `<span><i style="background:${SER[k].color}"></i>${SER[k].label}</span>`).join('')}</div>`;

/* ---------- Piezas comunes de la interfaz ---------- */
const kpi = ({ label, value, sub = '', icon = '', tone = '', cls = '' }) =>
  `<div class="kpi ${cls}"><div class="head"><span>${esc(label)}</span>${icon ? `<span class="ico ${tone}">${icon}</span>` : ''}</div><div class="val">${value}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
const thSort = (label, key, st, cls = '') => {
  const on = st.sort === key;
  return `<th class="${cls} ${on ? 'sorted' : ''}" aria-sort="${on ? (st.dir < 0 ? 'descending' : 'ascending') : 'none'}"><button type="button" data-sort="${key}">${esc(label)}<span class="arr">${on && st.dir > 0 ? '▲' : '▼'}</span></button></th>`;
};
const emptyBox = (title, text, actions = '') => `<div class="empty"><div class="badge-i">${ICON.box}</div><h3>${esc(title)}</h3><p>${text}</p>${actions ? `<div class="row" style="justify-content:center">${actions}</div>` : ''}</div>`;
const monthOptions = (keys, sel, allLabel) => `<option value="">${esc(allLabel)}</option>` + keys.map(k => `<option value="${k}" ${k === sel ? 'selected' : ''}>${esc(monthName(k))}</option>`).join('');
function sortRows(rows, key, dir, getters) {
  const g = getters[key] || (r => r[key]);
  return rows.slice().sort((a, b) => {
    const va = g(a), vb = g(b);
    if (va == null && vb == null) return 0;
    if (va == null) return 1;
    if (vb == null) return -1;
    return (va < vb ? -1 : va > vb ? 1 : 0) * dir;
  });
}
function chipsHtml(name, opts, val) {
  return opts.map(([k, l, n, dot]) => `<button type="button" class="chip" data-chip="${name}" data-v="${k}" aria-pressed="${val === k}">${dot ? `<span class="d" style="background:${dot}"></span>` : ''}${esc(l)}${n != null ? `<span class="n">${n}</span>` : ''}</button>`).join('');
}

/* ---------- Pestañas ---------- */
const VIEWS = {};
function showTab(tab) {
  S.tab = tab;
  $$('#mainTabs [data-tab]').forEach(b => { b.setAttribute('aria-selected', b.dataset.tab === tab); b.tabIndex = b.dataset.tab === tab ? 0 : -1; });
  try { localStorage.setItem('almantec-cn-tab', tab); } catch { /* nada */ }
  S.mounted = null;
  render();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function render() {
  if (!S.ready) return;
  const d = derived();
  const pendRep = S.rep.filter(r => r.estado !== 'finalizada').length;
  const tr = $('#tabRepN'); tr.hidden = !pendRep; tr.textContent = pendRep; tr.title = 'Reparaciones sin finalizar';
  const avail = d.inv.disponibles + d.inv.reservados;
  const tm = $('#tabMovN'); tm.hidden = !avail; tm.textContent = avail; tm.title = 'Móviles sin vender';
  tm.style.background = 'var(--blue-bg)'; tm.style.color = 'var(--blue)';
  const v = VIEWS[S.tab];
  const main = $('#main');
  if (S.mounted !== S.tab) {
    main.innerHTML = `<section class="view" id="view-${S.tab}">${v.shell()}</section>`;
    v.bind?.(main.firstElementChild);
    S.mounted = S.tab;
  }
  v.update(main.firstElementChild, d);
}
window.addEventListener('resize', debounce(() => { if (S.ready) render(); }, 200));

/* ---------- DASHBOARD ---------- */
VIEWS.dash = {
  shell: () => `
    <div class="sec-h"><div><h2 id="dTitle"></h2><p>Cifras del mes en curso calculadas con los registros guardados.</p></div></div>
    <div id="dEmpty"></div>
    <section class="kpis" id="dK1"></section>
    <section class="kpis" id="dK2"></section>
    <section class="kpis" id="dK3"></section>
    <div class="charts">
      <div class="panel chart"><div class="chart-h"><h3>Facturación, costes y beneficio</h3><span>Últimos 12 meses</span></div>${legend(['fact', 'cost', 'ben'])}<div class="plot" id="cFCB"></div></div>
      <div class="panel chart"><div class="chart-h"><h3>Ingresos por actividad</h3><div class="seg-switch" id="donutSw"><button type="button" data-v="mes">Este mes</button><button type="button" data-v="total">Todo</button></div></div><div id="cDonut"></div></div>
    </div>
    <div class="charts even">
      <div class="panel chart"><div class="chart-h"><h3>Evolución mensual del beneficio</h3><span>Últimos 12 meses</span></div><div class="plot" id="cBen"></div></div>
      <div class="panel chart"><div class="chart-h"><h3>Beneficio de reparaciones y de móviles</h3><span>Últimos 12 meses</span></div>${legend(['rep', 'mov'])}<div class="plot" id="cAct"></div></div>
    </div>
    <div class="charts even">
      <div class="panel"><div class="toolbar"><div class="chart-h"><h3 style="font-family:var(--f-display);margin:0;font-size:15px">Pendiente de cobrar</h3><span id="pendTot"></span></div></div><div class="table-wrap cardify" id="dPend"></div></div>
      <div class="panel"><div class="toolbar"><div class="chart-h"><h3 style="font-family:var(--f-display);margin:0;font-size:15px">Últimas operaciones</h3><button class="link-btn" data-go="total" type="button">Ver todas</button></div></div><div class="table-wrap cardify" id="dLast"></div></div>
    </div>`,
  bind(root) {
    root.addEventListener('click', e => {
      const sw = e.target.closest('#donutSw button'); if (sw) { S.dash.donut = sw.dataset.v; render(); return; }
      const go = e.target.closest('[data-go]'); if (go) { showTab(go.dataset.go); return; }
      const pay = e.target.closest('[data-pay]'); if (pay) { e.stopPropagation(); markPaid(pay.dataset.kind, pay.dataset.pay); return; }
      const add = e.target.closest('[data-add]'); if (add) { add.dataset.add === 'rep' ? openRepForm() : openMovForm(); return; }
      const row = e.target.closest('tr[data-id]'); if (row) openRecord(row.dataset.kind, row.dataset.id);
    });
  },
  update(root, d) {
    const mk = curMonth();
    const t = d.months.get(mk) || C.emptyTotals();
    const all = C.totals(d.ops);
    $('#dTitle', root).textContent = 'Resumen de ' + monthName(mk);
    const noData = !S.rep.length && !S.mov.length;
    $('#dEmpty', root).innerHTML = noData ? `<div class="panel">${emptyBox('Todavía no hay operaciones', 'Las cifras y los gráficos se calculan solo con lo que registres. Empieza añadiendo una reparación o un móvil: aparecerá al momento en todos los dispositivos.',
      '<button class="btn" data-add="rep" type="button">Añadir reparación</button><button class="btn primary" data-add="mov" type="button">Añadir móvil</button>')}</div>` : '';
    const prevMes = C.forecast(S.rep, r => C.monthOf(r.fecha) === mk);
    const share = t.benef > 0 ? Math.round(Math.max(0, t.repBenef) / (Math.max(0, t.repBenef) + Math.max(0, t.movBenef) || 1) * 100) : 0;
    $('#dK1', root).innerHTML =
      kpi({ label: 'Beneficio neto del mes', value: eur(t.benef), icon: ICON.trend, tone: 'g', cls: 'hero' + (t.benef < 0 ? ' neg' : ''),
        sub: `<div style="flex:1;display:flex;flex-direction:column;gap:7px"><div class="split"><span style="width:${share}%;background:var(--s-rep)"></span><span style="width:${t.benef > 0 ? 100 - share : 0}%;background:var(--s-mov)"></span></div><div class="legend"><span><i style="background:var(--s-rep)"></i>Reparaciones ${esc(eur(t.repBenef))}</span><span><i style="background:var(--s-mov)"></i>Móviles ${esc(eur(t.movBenef))}</span></div></div>` })
      + kpi({ label: 'Facturación del mes', value: eur(t.fact), icon: ICON.euro, tone: 'b', sub: `Cobrado ${esc(eur(t.cobrado))}` })
      + kpi({ label: 'Costes del mes', value: eur(t.costes), icon: ICON.cost, tone: 'r', sub: `Piezas ${esc(eur(t.repPieza))} · compra móviles ${esc(eur(t.movCompra))}` });
    $('#dK2', root).innerHTML =
      kpi({ label: 'Beneficio de reparaciones', value: eur(t.repBenef), icon: ICON.wrench, tone: 'v', sub: `Facturado ${esc(eur(t.repFact))}` })
      + kpi({ label: 'Beneficio de venta de móviles', value: eur(t.movBenef), icon: ICON.phone, tone: 'y', sub: `Ventas ${esc(eur(t.movFact))}` })
      + kpi({ label: 'Reparaciones hechas este mes', value: String(t.repN), icon: ICON.wrench, sub: prevMes.n ? `${prevMes.n} más sin finalizar` : 'Finalizadas' })
      + kpi({ label: 'Móviles vendidos del mes', value: String(t.movN), icon: ICON.phone, sub: t.movN ? `Media ${esc(eur(Math.round(t.movBenef / t.movN)))} de beneficio` : 'Ninguno todavía' });
    const pendRep = S.rep.filter(r => r.estado !== 'finalizada');
    const prev = C.forecast(S.rep);
    $('#dK3', root).innerHTML =
      kpi({ label: 'Dinero pendiente de cobrar', value: eur(all.pendiente), icon: ICON.wallet, tone: 'o', sub: `Reparaciones ${esc(eur(all.repPend))} · móviles ${esc(eur(all.movPend))}` })
      + kpi({ label: 'Reparaciones pendientes', value: String(pendRep.length), icon: ICON.clock, tone: 'o', sub: `${pendRep.filter(r => r.estado === 'en_proceso').length} en proceso · beneficio previsto ${esc(eur(prev.benef))}` })
      + kpi({ label: 'Móviles para vender', value: String(d.inv.disponibles + d.inv.reservados), icon: ICON.box, tone: 'b', sub: `${d.inv.reservados} reservado${d.inv.reservados === 1 ? '' : 's'} · ${esc(eur(d.inv.invertido))} invertidos` })
      + kpi({ label: 'Cobrado este mes', value: eur(t.cobrado), icon: ICON.check, tone: 'g', sub: `De ${esc(eur(t.fact))} facturados` });

    const nMonths = window.innerWidth < 560 ? 6 : 12;
    const months = C.lastMonths(mk, nMonths);
    $$('.chart-h > span', root).forEach(sp => { if (/Últimos/.test(sp.textContent)) sp.textContent = `Últimos ${nMonths} meses`; });
    const get = k => d.months.get(k) || C.emptyTotals();
    const labels = months.map(k => monthShort(k, k.slice(5) === '01' || k === months[0]));
    const titles = months.map(monthName);
    barChart($('#cFCB', root), { cats: months, labels, tipTitles: titles, series: [
      { ...SER.fact, values: months.map(k => get(k).fact) },
      { ...SER.cost, values: months.map(k => get(k).costes) },
      { ...SER.ben, values: months.map(k => get(k).benef) },
    ] });
    lineChart($('#cBen', root), { cats: months, labels, tipTitles: titles, values: months.map(k => get(k).benef), color: 'var(--s-ben)', label: 'Beneficio',
      extraTip: i => [['Operaciones', String(get(months[i]).n)]] });
    barChart($('#cAct', root), { cats: months, labels, tipTitles: titles, series: [
      { ...SER.rep, values: months.map(k => get(k).repBenef) },
      { ...SER.mov, values: months.map(k => get(k).movBenef) },
    ] });
    $$('#donutSw button', root).forEach(b => b.setAttribute('aria-pressed', b.dataset.v === S.dash.donut));
    const dt = S.dash.donut === 'mes' ? t : all;
    donut($('#cDonut', root), [
      { label: 'Reparaciones', color: 'var(--s-rep)', value: dt.repFact, sub: `${dt.repN} reparaci${dt.repN === 1 ? 'ón' : 'ones'}` },
      { label: 'Venta de móviles', color: 'var(--s-mov)', value: dt.movFact, sub: `${dt.movN} vendido${dt.movN === 1 ? '' : 's'}` },
    ]);

    const pend = d.ops.filter(o => o.pendiente > 0).sort((a, b) => a.fecha < b.fecha ? -1 : 1);
    $('#pendTot', root).textContent = pend.length ? `${pend.length} · ${eur(all.pendiente)}` : '';
    $('#dPend', root).innerHTML = pend.length ? `<table><tbody>${pend.slice(0, 8).map(o => `<tr class="click" data-kind="${o.kind}" data-id="${o.id}">
      <td class="c-main"><span class="nm">${esc(o.titulo)}</span><span class="sub2">${esc(o.kind === 'rep' ? o.detalle : 'Venta de móvil')} · ${esc(fmtDate(o.fecha))}</span></td>
      <td class="r" data-label="Pendiente"><span class="amt">${eur(o.pendiente)}</span></td>
      <td class="c-acts"><div class="acts"><button class="btn sm" type="button" data-pay="${o.id}" data-kind="${o.kind}">${ICON.check}Cobrado</button></div></td></tr>`).join('')}</tbody></table>${pend.length > 8 ? `<div class="more muted">y ${pend.length - 8} más en Total general</div>` : ''}`
      : '<div class="empty" style="padding:28px"><p>No hay nada pendiente de cobro.</p></div>';
    const last = [...S.rep.map(r => ({ kind: 'rep', id: r.id, at: r.actualizado_en, t: r.modelo, s: r.cliente, a: C.cents(r.facturado), tag: 'Reparación' })),
      ...S.mov.map(m => ({ kind: 'mov', id: m.id, at: m.actualizado_en, t: `${m.marca} ${m.modelo}`, s: MOV_ESTADO[m.estado]?.[0], a: C.cents(m.estado === 'vendido' ? m.precio_venta : m.precio_compra), tag: m.estado === 'vendido' ? 'Venta' : 'Compra' }))]
      .sort((a, b) => (a.at < b.at ? 1 : -1)).slice(0, 8);
    $('#dLast', root).innerHTML = last.length ? `<table><tbody>${last.map(o => `<tr class="click" data-kind="${o.kind}" data-id="${o.id}">
      <td class="c-main"><span class="nm">${esc(o.t)}</span><span class="sub2">${esc(o.s || '')} · cambiado ${esc(fmtDateTime(o.at))}</span></td>
      <td data-label="Tipo"><span class="pill ${o.kind === 'rep' ? 't-v' : 't-y'}">${esc(o.tag)}</span></td>
      <td class="r" data-label="Importe"><span class="amt">${eur(o.a)}</span></td></tr>`).join('')}</tbody></table>`
      : '<div class="empty" style="padding:28px"><p>Sin operaciones todavía.</p></div>';
  },
};

/* ---------- REPARACIONES ---------- */
const repGet = { fecha: r => r.fecha, facturado: r => Number(r.facturado), beneficio: r => Number(r.beneficio), cliente: r => norm(r.cliente), coste: r => Number(r.coste_pieza) + Number(r.otros_costes) };
function repMatches(r, q) {
  if (!q) return true;
  const hay = norm([r.cliente, r.telefono, r.modelo, r.descripcion, r.notas, fmtDate(r.fecha), r.fecha, REP_ESTADO[r.estado]?.[0], REP_PAGO[r.estado_pago]?.[0], String(r.facturado).replace('.', ',')].join(' '));
  return norm(q).split(/\s+/).every(w => hay.includes(w));
}
VIEWS.rep = {
  shell: () => `
    <div class="sec-h"><div><h2>Reparaciones</h2><p id="rSum"></p></div><button class="btn primary" type="button" data-add>${ICON.wrench}Nueva reparación</button></div>
    <section class="panel">
      <div class="toolbar">
        <div class="row">
          <div class="search">${ICON.search}<label class="sr" for="rq">Buscar</label><input id="rq" class="field" type="search" placeholder="Buscar cliente, teléfono, modelo, reparación o fecha (dd/mm/aaaa)" autocomplete="off" value="${esc(S.repF.q)}"></div>
          <label class="ctl">Mes<select id="rMes" class="field"></select></label>
          <div class="sortbox"><label class="sr" for="rSort">Ordenar por</label><select id="rSort" class="field">
            <option value="fecha">Fecha</option><option value="facturado">Importe facturado</option><option value="beneficio">Beneficio</option><option value="coste">Costes</option><option value="cliente">Cliente</option></select>
            <button class="icon-btn" id="rDir" type="button" aria-label="Cambiar orden"></button></div>
        </div>
        <div class="chips" id="rChips"></div>
        <div class="meta-row"><span id="rCount"></span><button class="link-btn" id="rClear" type="button" hidden>Quitar filtros</button></div>
      </div>
      <div class="table-wrap cardify" id="rList"></div>
    </section>`,
  bind(root) {
    const F = S.repF;
    $('#rq', root).addEventListener('input', debounce(e => { F.q = e.target.value; F.limit = 100; render(); }, 150));
    $('#rMes', root).addEventListener('change', e => { F.mes = e.target.value; F.limit = 100; render(); });
    $('#rSort', root).addEventListener('change', e => { F.sort = e.target.value; render(); });
    $('#rDir', root).addEventListener('click', () => { F.dir *= -1; render(); });
    $('#rClear', root).addEventListener('click', () => { Object.assign(F, { q: '', mes: '', estado: '', pago: '' }); $('#rq', root).value = ''; render(); });
    root.addEventListener('click', e => {
      const ch = e.target.closest('[data-chip]');
      if (ch) { const k = ch.dataset.chip; F[k] = F[k] === ch.dataset.v ? '' : ch.dataset.v; F.limit = 100; render(); return; }
      const so = e.target.closest('[data-sort]'); if (so) { const k = so.dataset.sort; if (F.sort === k) F.dir *= -1; else { F.sort = k; F.dir = -1; } render(); return; }
      if (e.target.closest('[data-add]')) { openRepForm(); return; }
      if (e.target.closest('[data-more]')) { F.limit += 200; render(); return; }
      const del = e.target.closest('[data-del]'); if (del) { e.stopPropagation(); askDelete('rep', del.dataset.del); return; }
      const pay = e.target.closest('[data-pay]'); if (pay) { e.stopPropagation(); markPaid('rep', pay.dataset.pay); return; }
      const row = e.target.closest('tr[data-id]'); if (row) openRecord('rep', row.dataset.id);
    });
  },
  update(root) {
    const F = S.repF;
    const months = [...new Set(S.rep.map(r => C.monthOf(r.fecha)))].sort().reverse();
    $('#rMes', root).innerHTML = monthOptions(months, F.mes, 'Todos los meses');
    $('#rSort', root).value = F.sort;
    $('#rDir', root).innerHTML = F.dir < 0 ? ICON.down : ICON.up;
    $('#rDir', root).title = F.dir < 0 ? 'De mayor a menor' : 'De menor a mayor';
    const base = S.rep.filter(r => (!F.mes || C.monthOf(r.fecha) === F.mes) && repMatches(r, F.q));
    const cnt = (k, v) => base.filter(r => r[k] === v).length;
    $('#rChips', root).innerHTML = chipsHtml('estado', [['pendiente', 'Pendientes', cnt('estado', 'pendiente'), 'var(--orange)'], ['en_proceso', 'En proceso', cnt('estado', 'en_proceso'), 'var(--blue)'], ['finalizada', 'Finalizadas', cnt('estado', 'finalizada'), 'var(--green)']], F.estado)
      + '<span style="width:1px;background:var(--line);flex:none"></span>'
      + chipsHtml('pago', [['pendiente', 'Pago pendiente', cnt('estado_pago', 'pendiente'), 'var(--red)'], ['pagado', 'Pagadas', cnt('estado_pago', 'pagado'), 'var(--green)']], F.pago);
    const rows = sortRows(base.filter(r => (!F.estado || r.estado === F.estado) && (!F.pago || r.estado_pago === F.pago)), F.sort, F.dir, repGet);
    const filtered = F.q || F.mes || F.estado || F.pago;
    $('#rClear', root).hidden = !filtered;
    const tot = C.totals(rows.filter(r => r.estado === 'finalizada').map(C.repOp));
    const prev = C.forecast(rows);
    $('#rCount', root).textContent = `${rows.length} de ${S.rep.length} reparaciones`;
    $('#rSum', root).innerHTML = rows.length ? `${filtered ? 'Según filtros' : 'En total'}, finalizadas: facturado <b class="c-b">${eur(tot.fact)}</b> · costes <b class="c-r">${eur(tot.costes)}</b> · beneficio <b class="c-g">${eur(tot.benef)}</b>${prev.n ? ` · <span class="c-o">${prev.n} sin finalizar, beneficio previsto ${eur(prev.benef)}</span>` : ''}` : 'Registra y controla cada reparación. Solo cuentan en las cifras cuando están finalizadas.';
    if (!S.rep.length) { $('#rList', root).innerHTML = emptyBox('Sin reparaciones', 'Añade la primera con «Nueva reparación». El beneficio se calcula solo: facturado − pieza − otros costes.'); return; }
    if (!rows.length) { $('#rList', root).innerHTML = emptyBox('Nada coincide', 'Prueba con otra búsqueda o quita los filtros.'); return; }
    const shown = rows.slice(0, F.limit);
    $('#rList', root).innerHTML = `<table><thead><tr>${thSort('Fecha', 'fecha', F)}${thSort('Cliente', 'cliente', F)}<th>Dispositivo y reparación</th>${thSort('Facturado', 'facturado', F, 'r')}${thSort('Costes', 'coste', F, 'r')}${thSort('Beneficio', 'beneficio', F, 'r')}<th>Estado</th><th>Pago</th><th class="r"><span class="sr">Acciones</span></th></tr></thead>
      <tbody>${shown.map(r => {
        const o = C.repOp(r);
        return `<tr class="click" data-id="${r.id}">
        <td class="date" data-label="Fecha">${esc(fmtDate(r.fecha))}</td>
        <td class="c-main"><span class="nm">${esc(r.cliente)}</span>${r.telefono ? `<span class="sub2">${esc(r.telefono)}</span>` : ''}</td>
        <td class="c-wide" data-label="Dispositivo"><span class="nm">${esc(r.modelo)}</span>${r.descripcion ? `<span class="sub2">${esc(r.descripcion)}</span>` : ''}</td>
        <td class="r" data-label="Facturado"><span class="amt">${eur(o.fact)}</span></td>
        <td class="r" data-label="Costes"><span class="${amtCls(o.costes)}" title="Pieza ${esc(eur(o.costeBase))} · otros ${esc(eur(o.otros))}">${eur(o.costes)}</span></td>
        <td class="r" data-label="${r.estado === 'finalizada' ? 'Beneficio' : 'Beneficio previsto'}">${r.estado === 'finalizada' ? `<span class="${o.benef < 0 ? 'amt neg' : 'amt pos'}">${eur(o.benef)}</span>` : `<span class="amt zero" title="Aún sin finalizar: no cuenta en las cifras">${eur(o.benef)} prev.</span>`}</td>
        <td data-label="Estado">${pill(REP_ESTADO, r.estado)}</td>
        <td data-label="Pago">${pill(REP_PAGO, r.estado_pago)}</td>
        <td class="c-acts"><div class="acts">${r.estado_pago !== 'pagado' ? `<button class="btn sm ghost" type="button" data-pay="${r.id}" title="Marcar como pagado hoy">${ICON.check}Cobrado</button>` : ''}<button class="icon-btn sm" type="button" aria-label="Editar">${ICON.edit}</button><button class="icon-btn sm del" type="button" data-del="${r.id}" aria-label="Eliminar">${ICON.del}</button></div></td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr><td colspan="3" data-label="">Total finalizadas (${tot.repN})</td><td class="r" data-label="Facturado"><span class="amt">${eur(tot.fact)}</span></td><td class="r" data-label="Costes"><span class="amt">${eur(tot.costes)}</span></td><td class="r" data-label="Beneficio"><span class="amt pos">${eur(tot.benef)}</span></td><td colspan="3" class="blank"></td></tr></tfoot></table>
      ${rows.length > shown.length ? `<div class="more"><button class="btn sm" type="button" data-more>Ver ${Math.min(200, rows.length - shown.length)} más</button></div>` : ''}`;
  },
};

/* ---------- MÓVILES ---------- */
const movGet = {
  fecha_compra: m => m.fecha_compra, fecha_venta: m => m.fecha_venta, precio_compra: m => Number(m.precio_compra),
  precio_venta: m => (m.precio_venta == null ? null : Number(m.precio_venta)), beneficio: m => (m.beneficio == null ? null : Number(m.beneficio)), modelo: m => norm(m.marca + ' ' + m.modelo),
};
function movMatches(m, q) {
  if (!q) return true;
  const hay = norm([m.marca, m.modelo, m.imei, m.notas, fmtDate(m.fecha_compra), fmtDate(m.fecha_venta), m.fecha_compra, m.fecha_venta, MOV_ESTADO[m.estado]?.[0]].join(' '));
  return norm(q).split(/\s+/).every(w => hay.includes(w));
}
VIEWS.mov = {
  shell: () => `
    <div class="sec-h"><div><h2>Móviles</h2><p id="mSum">Compra, inventario y venta de teléfonos.</p></div><button class="btn primary" type="button" data-add>${ICON.phone}Nuevo móvil</button></div>
    <section class="inv" id="mInv"></section>
    <section class="panel">
      <div class="toolbar">
        <div class="row">
          <div class="search">${ICON.search}<label class="sr" for="mq">Buscar</label><input id="mq" class="field" type="search" placeholder="Buscar marca, modelo, IMEI, notas o fecha" autocomplete="off" value="${esc(S.movF.q)}"></div>
          <label class="ctl">Mes (compra o venta)<select id="mMes" class="field"></select></label>
          <div class="sortbox"><label class="sr" for="mSort">Ordenar por</label><select id="mSort" class="field">
            <option value="fecha_compra">Fecha de compra</option><option value="fecha_venta">Fecha de venta</option><option value="precio_compra">Precio de compra</option><option value="precio_venta">Precio de venta</option><option value="beneficio">Beneficio</option><option value="modelo">Modelo</option></select>
            <button class="icon-btn" id="mDir" type="button" aria-label="Cambiar orden"></button></div>
        </div>
        <div class="chips" id="mChips"></div>
        <div class="meta-row"><span id="mCount"></span><button class="link-btn" id="mClear" type="button" hidden>Quitar filtros</button></div>
      </div>
      <div class="table-wrap cardify" id="mList"></div>
    </section>`,
  bind(root) {
    const F = S.movF;
    $('#mq', root).addEventListener('input', debounce(e => { F.q = e.target.value; F.limit = 100; render(); }, 150));
    $('#mMes', root).addEventListener('change', e => { F.mes = e.target.value; F.limit = 100; render(); });
    $('#mSort', root).addEventListener('change', e => { F.sort = e.target.value; render(); });
    $('#mDir', root).addEventListener('click', () => { F.dir *= -1; render(); });
    $('#mClear', root).addEventListener('click', () => { Object.assign(F, { q: '', mes: '', estado: '', cobro: '' }); $('#mq', root).value = ''; render(); });
    root.addEventListener('click', e => {
      const ch = e.target.closest('[data-chip]');
      if (ch) { const k = ch.dataset.chip; F[k] = F[k] === ch.dataset.v ? '' : ch.dataset.v; F.limit = 100; render(); return; }
      const inv = e.target.closest('[data-inv]'); if (inv) { F.estado = F.estado === inv.dataset.inv ? '' : inv.dataset.inv; F.cobro = inv.dataset.inv === 'cobro' ? 'pend' : F.cobro; if (inv.dataset.inv === 'cobro') F.estado = 'vendido'; render(); return; }
      const so = e.target.closest('[data-sort]'); if (so) { const k = so.dataset.sort; if (F.sort === k) F.dir *= -1; else { F.sort = k; F.dir = -1; } render(); return; }
      if (e.target.closest('[data-add]')) { openMovForm(); return; }
      if (e.target.closest('[data-more]')) { F.limit += 200; render(); return; }
      const del = e.target.closest('[data-del]'); if (del) { e.stopPropagation(); askDelete('mov', del.dataset.del); return; }
      const pay = e.target.closest('[data-pay]'); if (pay) { e.stopPropagation(); markPaid('mov', pay.dataset.pay); return; }
      const row = e.target.closest('tr[data-id]'); if (row) openRecord('mov', row.dataset.id);
    });
  },
  update(root, d) {
    const F = S.movF;
    const sold = S.mov.filter(m => m.estado === 'vendido');
    const soldT = C.totals(sold.map(C.movOp).filter(Boolean));
    const pendCobro = sold.filter(m => !m.fecha_cobro);
    $('#mInv', root).innerHTML =
      kpi({ label: 'Disponibles', value: String(d.inv.disponibles), icon: ICON.box, tone: 'b', sub: `${esc(eur(d.inv.invertidoDisp))} invertidos` })
      + kpi({ label: 'Reservados', value: String(d.inv.reservados), icon: ICON.clock, tone: 'o', sub: `${esc(eur(d.inv.invertidoRes))} invertidos` })
      + kpi({ label: 'Vendidos', value: String(sold.length), icon: ICON.trend, tone: 'g', sub: `Beneficio ${esc(eur(soldT.benef))}` })
      + kpi({ label: 'Ventas sin cobrar', value: eur(soldT.pendiente), icon: ICON.wallet, tone: 'r', sub: `${pendCobro.length} móvil${pendCobro.length === 1 ? '' : 'es'}` });
    const months = [...new Set(S.mov.flatMap(m => [C.monthOf(m.fecha_compra), C.monthOf(m.fecha_venta)]).filter(Boolean))].sort().reverse();
    $('#mMes', root).innerHTML = monthOptions(months, F.mes, 'Todos los meses');
    $('#mSort', root).value = F.sort;
    $('#mDir', root).innerHTML = F.dir < 0 ? ICON.down : ICON.up;
    const base = S.mov.filter(m => (!F.mes || C.monthOf(m.fecha_compra) === F.mes || C.monthOf(m.fecha_venta) === F.mes) && movMatches(m, F.q));
    const cnt = v => base.filter(m => m.estado === v).length;
    $('#mChips', root).innerHTML = chipsHtml('estado', [['disponible', 'Disponibles', cnt('disponible'), 'var(--blue)'], ['reservado', 'Reservados', cnt('reservado'), 'var(--orange)'], ['vendido', 'Vendidos', cnt('vendido'), 'var(--green)']], F.estado)
      + '<span style="width:1px;background:var(--line);flex:none"></span>'
      + chipsHtml('cobro', [['pend', 'Venta sin cobrar', base.filter(m => m.estado === 'vendido' && !m.fecha_cobro).length, 'var(--red)'], ['ok', 'Cobrados', base.filter(m => m.estado === 'vendido' && m.fecha_cobro).length, 'var(--green)']], F.cobro);
    const rows = sortRows(base.filter(m => (!F.estado || m.estado === F.estado)
      && (!F.cobro || (m.estado === 'vendido' && (F.cobro === 'pend' ? !m.fecha_cobro : !!m.fecha_cobro)))), F.sort, F.dir, movGet);
    const filtered = F.q || F.mes || F.estado || F.cobro;
    $('#mClear', root).hidden = !filtered;
    $('#mCount', root).textContent = `${rows.length} de ${S.mov.length} móviles`;
    if (!S.mov.length) { $('#mList', root).innerHTML = emptyBox('Sin móviles', 'Añade un móvil al comprarlo: quedará como inventario hasta que lo marques como vendido. Entonces cuenta su beneficio.'); return; }
    if (!rows.length) { $('#mList', root).innerHTML = emptyBox('Nada coincide', 'Prueba con otra búsqueda o quita los filtros.'); return; }
    const shown = rows.slice(0, F.limit);
    const tc = rows.reduce((a, m) => a + C.cents(m.precio_compra) + C.cents(m.costes_adicionales), 0);
    const ts = C.totals(rows.map(C.movOp).filter(Boolean));
    $('#mList', root).innerHTML = `<table><thead><tr>${thSort('Compra', 'fecha_compra', F)}${thSort('Móvil', 'modelo', F)}${thSort('Coste', 'precio_compra', F, 'r')}${thSort('Venta', 'fecha_venta', F)}${thSort('Precio venta', 'precio_venta', F, 'r')}${thSort('Beneficio', 'beneficio', F, 'r')}<th>Estado</th><th>Cobro</th><th class="r"><span class="sr">Acciones</span></th></tr></thead>
      <tbody>${shown.map(m => {
        const coste = C.cents(m.precio_compra) + C.cents(m.costes_adicionales);
        const isSold = m.estado === 'vendido';
        return `<tr class="click" data-id="${m.id}">
        <td class="date" data-label="Compra">${esc(fmtDate(m.fecha_compra))}</td>
        <td class="c-main"><span class="nm">${esc(m.marca)} ${esc(m.modelo)}</span>${m.imei ? `<span class="sub2">${esc(m.imei)}</span>` : ''}</td>
        <td class="r" data-label="Coste"><span class="amt" title="Compra ${esc(eurN(m.precio_compra))} · adicionales ${esc(eurN(m.costes_adicionales))}">${eur(coste)}</span></td>
        <td class="date ${isSold ? '' : 'blank'}" data-label="Venta">${isSold ? esc(fmtDate(m.fecha_venta)) : '—'}</td>
        <td class="r ${m.precio_venta == null ? 'blank' : ''}" data-label="${isSold ? 'Precio venta' : 'Precio acordado'}">${m.precio_venta == null ? '<span class="amt zero">—</span>' : `<span class="amt ${isSold ? '' : 'zero'}">${eurN(m.precio_venta)}</span>`}</td>
        <td class="r" data-label="Beneficio">${isSold ? `<span class="${Number(m.beneficio) < 0 ? 'amt neg' : 'amt pos'}">${eurN(m.beneficio)}</span>` : '<span class="amt zero" title="Sin vender: inventario">Inventario</span>'}</td>
        <td data-label="Estado">${pill(MOV_ESTADO, m.estado)}</td>
        <td data-label="Cobro">${isSold ? (m.fecha_cobro ? `<span class="pill t-g" title="Cobrado el ${esc(fmtDate(m.fecha_cobro))}">Cobrado</span>` : '<span class="pill t-r">Sin cobrar</span>') : '<span class="muted">—</span>'}</td>
        <td class="c-acts"><div class="acts">${isSold && !m.fecha_cobro ? `<button class="btn sm ghost" type="button" data-pay="${m.id}">${ICON.check}Cobrado</button>` : ''}<button class="icon-btn sm" type="button" aria-label="Editar">${ICON.edit}</button><button class="icon-btn sm del" type="button" data-del="${m.id}" aria-label="Eliminar">${ICON.del}</button></div></td></tr>`;
      }).join('')}</tbody>
      <tfoot><tr><td colspan="2" data-label="">Total (${rows.length})</td><td class="r" data-label="Coste"><span class="amt">${eur(tc)}</span></td><td class="blank"></td><td class="r" data-label="Ventas"><span class="amt">${eur(ts.fact)}</span></td><td class="r" data-label="Beneficio"><span class="amt pos">${eur(ts.benef)}</span></td><td colspan="3" class="blank"></td></tr></tfoot></table>
      ${rows.length > shown.length ? `<div class="more"><button class="btn sm" type="button" data-more>Ver ${Math.min(200, rows.length - shown.length)} más</button></div>` : ''}`;
  },
};

/* ---------- Tabla de operaciones (resumen mensual y total) ---------- */
const opGet = { fecha: o => o.fecha, fact: o => o.fact, benef: o => o.benef, costes: o => o.costes };
function opsTable(rows, F, limit) {
  const shown = limit ? rows.slice(0, limit) : rows;
  const t = C.totals(rows);
  return `<table><thead><tr>${thSort('Fecha', 'fecha', F)}<th>Actividad</th><th>Operación</th>${thSort('Facturado', 'fact', F, 'r')}${thSort('Costes', 'costes', F, 'r')}${thSort('Beneficio', 'benef', F, 'r')}<th>Cobro</th></tr></thead>
    <tbody>${shown.map(o => `<tr class="click" data-kind="${o.kind}" data-id="${o.id}">
      <td class="date" data-label="Fecha">${esc(fmtDate(o.fecha))}</td>
      <td data-label="Actividad">${actPill(o.kind)}</td>
      <td class="c-main"><span class="nm">${esc(o.titulo)}</span><span class="sub2">${esc([o.detalle, o.desc].filter(Boolean).join(' · '))}</span></td>
      <td class="r" data-label="Facturado"><span class="amt">${eur(o.fact)}</span></td>
      <td class="r" data-label="Costes"><span class="${amtCls(o.costes)}">${eur(o.costes)}</span></td>
      <td class="r" data-label="Beneficio"><span class="${o.benef < 0 ? 'amt neg' : 'amt pos'}">${eur(o.benef)}</span></td>
      <td data-label="Cobro">${cobroPill(o)}</td></tr>`).join('')}</tbody>
    <tfoot><tr><td colspan="3" data-label="">Total (${rows.length} operaciones)</td><td class="r" data-label="Facturado"><span class="amt">${eur(t.fact)}</span></td><td class="r" data-label="Costes"><span class="amt">${eur(t.costes)}</span></td><td class="r" data-label="Beneficio"><span class="amt pos">${eur(t.benef)}</span></td><td data-label="Pendiente"><span class="amt">${t.pendiente ? eur(t.pendiente) + ' pendiente' : 'Todo cobrado'}</span></td></tr></tfoot></table>
    ${limit && rows.length > shown.length ? `<div class="more"><button class="btn sm" type="button" data-more>Ver ${Math.min(200, rows.length - shown.length)} más</button></div>` : ''}`;
}
const actSwitch = (id, val) => `<div class="seg-switch" id="${id}">${[['all', 'Todo'], ['rep', 'Reparaciones'], ['mov', 'Móviles']].map(([k, l]) => `<button type="button" data-act="${k}" aria-pressed="${val === k}">${l}</button>`).join('')}</div>`;

/* ---------- RESUMEN MENSUAL ---------- */
VIEWS.mes = {
  shell: () => `
    <div class="sec-h"><div><h2 id="msTitle"></h2><p>Solo las operaciones de ese mes. Los meses aparecen solos según las fechas.</p></div>
      <div class="yearbar"><button class="icon-btn" type="button" data-year="-1" aria-label="Año anterior">${ICON.left}</button><b id="msYear"></b><button class="icon-btn" type="button" data-year="1" aria-label="Año siguiente">${ICON.right}</button></div></div>
    <div class="months" id="msMonths" role="group" aria-label="Mes"></div>
    <section class="kpis k5" id="msK"></section>
    <section class="breakdown" id="msB"></section>
    <section class="panel">
      <div class="toolbar"><div class="row" style="justify-content:space-between"><h3 style="font-family:var(--f-display);margin:0;font-size:15px">Operaciones del mes</h3>${actSwitch('msAct', S.mesF.act)}</div></div>
      <div class="table-wrap cardify" id="msList"></div>
    </section>`,
  bind(root) {
    const F = S.mesF;
    root.addEventListener('click', e => {
      const y = e.target.closest('[data-year]'); if (y) { F.month = (+F.month.slice(0, 4) + +y.dataset.year) + F.month.slice(4); render(); return; }
      const mb = e.target.closest('[data-month]'); if (mb) { F.month = mb.dataset.month; render(); return; }
      const a = e.target.closest('#msAct [data-act]'); if (a) { F.act = a.dataset.act; render(); return; }
      const so = e.target.closest('[data-sort]'); if (so) { const k = so.dataset.sort; if (F.sort === k) F.dir *= -1; else { F.sort = k; F.dir = -1; } render(); return; }
      const row = e.target.closest('tr[data-id]'); if (row) openRecord(row.dataset.kind, row.dataset.id);
    });
  },
  update(root, d) {
    const F = S.mesF;
    const year = F.month.slice(0, 4);
    $('#msYear', root).textContent = year;
    $('#msTitle', root).textContent = monthName(F.month);
    $('#msMonths', root).innerHTML = MONTHS.map((n, i) => {
      const k = `${year}-${pad2(i + 1)}`;
      const t = d.months.get(k);
      return `<button type="button" data-month="${k}" aria-pressed="${k === F.month}" class="${t ? '' : 'empty-m'}">${MONTHS_S[i]}<small>${t ? esc(axisEur(t.benef)) : '—'}</small></button>`;
    }).join('');
    const t = d.months.get(F.month) || C.emptyTotals();
    const buys = d.buys.get(F.month) || { n: 0, importe: 0 };
    const prev = C.forecast(S.rep, r => C.monthOf(r.fecha) === F.month);
    $('#msK', root).innerHTML =
      kpi({ label: 'Facturación total', value: eur(t.fact), icon: ICON.euro, tone: 'b', sub: `Cobrado ${esc(eur(t.cobrado))}` })
      + kpi({ label: 'Costes totales', value: eur(t.costes), icon: ICON.cost, tone: 'r' })
      + kpi({ label: 'Beneficio total', value: eur(t.benef), icon: ICON.trend, tone: 'g', cls: t.benef < 0 ? 'neg' : '' })
      + kpi({ label: 'Operaciones', value: String(t.n), icon: ICON.box, sub: `${t.repN} reparaciones · ${t.movN} ventas` })
      + kpi({ label: 'Pendiente de cobrar', value: eur(t.pendiente), icon: ICON.wallet, tone: 'o', sub: 'De las operaciones de este mes' });
    $('#msB', root).innerHTML = `
      <div class="panel bk"><h3><i style="background:var(--s-rep)"></i>Reparaciones</h3><dl class="kv">
        <dt>Facturación</dt><dd>${eur(t.repFact)}</dd><dt>Coste de piezas</dt><dd>${eur(t.repPieza)}</dd><dt>Otros costes</dt><dd>${eur(t.repOtros)}</dd>
        <dt class="tot">Beneficio</dt><dd class="tot ${t.repBenef < 0 ? 'c-r' : 'c-g'}">${eur(t.repBenef)}</dd>
        <dt>Reparaciones</dt><dd>${t.repN}</dd><dt>Cobrado</dt><dd>${eur(t.repCobrado)}</dd><dt>Pendiente de cobro</dt><dd class="${t.repPend ? 'c-o' : ''}">${eur(t.repPend)}</dd></dl>
        ${prev.n ? `<div class="note-line">${ICON.info}<span>Además hay ${prev.n} reparaci${prev.n === 1 ? 'ón' : 'ones'} sin finalizar con fecha de este mes: ${esc(eur(prev.fact))} previstos, ${esc(eur(prev.benef))} de beneficio. No cuentan hasta que se finalicen.</span></div>` : ''}</div>
      <div class="panel bk"><h3><i style="background:var(--s-mov)"></i>Venta de móviles</h3><dl class="kv">
        <dt>Facturación por ventas</dt><dd>${eur(t.movFact)}</dd><dt>Coste de compra de los vendidos</dt><dd>${eur(t.movCompra)}</dd><dt>Otros costes</dt><dd>${eur(t.movOtros)}</dd>
        <dt class="tot">Beneficio</dt><dd class="tot ${t.movBenef < 0 ? 'c-r' : 'c-g'}">${eur(t.movBenef)}</dd>
        <dt>Móviles vendidos</dt><dd>${t.movN}</dd><dt>Cobrado</dt><dd>${eur(t.movCobrado)}</dd><dt>Pendiente de cobro</dt><dd class="${t.movPend ? 'c-o' : ''}">${eur(t.movPend)}</dd></dl>
        <div class="note-line">${ICON.info}<span>Compras de este mes: ${buys.n} móvil${buys.n === 1 ? '' : 'es'} por ${esc(eur(buys.importe))}. Van al inventario y cuentan como coste el mes en que se vendan.</span></div></div>
      <div class="panel bk"><h3><i style="background:var(--s-ben)"></i>Total del mes</h3><dl class="kv">
        <dt>Facturación total</dt><dd>${eur(t.fact)}</dd><dt>Costes totales</dt><dd>${eur(t.costes)}</dd>
        <dt class="tot">Beneficio total</dt><dd class="tot ${t.benef < 0 ? 'c-r' : 'c-g'}">${eur(t.benef)}</dd>
        <dt>Dinero cobrado</dt><dd>${eur(t.cobrado)}</dd><dt>Pendiente de cobrar</dt><dd class="${t.pendiente ? 'c-o' : ''}">${eur(t.pendiente)}</dd><dt>Operaciones</dt><dd>${t.n}</dd></dl></div>`;
    $$('#msAct [data-act]', root).forEach(b => b.setAttribute('aria-pressed', b.dataset.act === F.act));
    const rows = sortRows(d.ops.filter(o => o.mes === F.month && (F.act === 'all' || o.kind === F.act)), F.sort, F.dir, opGet);
    $('#msList', root).innerHTML = rows.length ? opsTable(rows, F) : emptyBox('Sin operaciones este mes', 'No hay reparaciones ni ventas de móviles con fecha de ' + esc(monthName(F.month)) + '.');
  },
};

/* ---------- TOTAL GENERAL ---------- */
VIEWS.total = {
  shell: () => `
    <div class="sec-h"><div><h2>Total general</h2><p>Resultados acumulados de todos los meses y años registrados.</p></div></div>
    <section class="kpis" id="tK1"></section>
    <section class="kpis" id="tK2"></section>
    <div class="charts even">
      <div class="panel chart"><div class="chart-h"><h3>Evolución del negocio</h3><span id="tRange"></span></div>${legend(['fact', 'cost', 'ben'])}<div class="plot" id="cEvo"></div></div>
      <div class="panel chart"><div class="chart-h"><h3>Beneficio acumulado</h3><span>Desde el primer registro</span></div><div class="plot" id="cCum"></div></div>
    </div>
    <section class="panel"><div class="toolbar"><h3 style="font-family:var(--f-display);margin:0;font-size:15px">Desglose anual</h3></div><div class="table-wrap cardify" id="tYears"></div></section>
    <section class="panel"><div class="toolbar"><div class="chart-h"><h3 style="font-family:var(--f-display);margin:0;font-size:15px">Desglose mensual</h3><span>Pulsa un mes para verlo en detalle</span></div></div><div class="table-wrap cardify" id="tMonths"></div></section>
    <section class="panel">
      <div class="toolbar">
        <div class="row" style="justify-content:space-between"><h3 style="font-family:var(--f-display);margin:0;font-size:15px">Todas las operaciones</h3>${actSwitch('tAct', S.totF.act)}</div>
        <div class="row">
          <div class="search">${ICON.search}<label class="sr" for="tq">Buscar</label><input id="tq" class="field" type="search" placeholder="Buscar cliente, modelo, IMEI o fecha" autocomplete="off" value="${esc(S.totF.q)}"></div>
          <label class="ctl">Año<select id="tYear" class="field"></select></label>
          <button class="btn" type="button" id="tCsv">Exportar esta vista (CSV)</button>
        </div>
        <div class="meta-row"><span id="tCount"></span></div>
      </div>
      <div class="table-wrap cardify" id="tList"></div>
    </section>`,
  bind(root) {
    const F = S.totF;
    $('#tq', root).addEventListener('input', debounce(e => { F.q = e.target.value; F.limit = 100; render(); }, 150));
    $('#tYear', root).addEventListener('change', e => { F.year = e.target.value; F.limit = 100; render(); });
    $('#tCsv', root).addEventListener('click', () => exportOpsCsv(VIEWS.total.rows || []));
    root.addEventListener('click', e => {
      const a = e.target.closest('#tAct [data-act]'); if (a) { F.act = a.dataset.act; F.limit = 100; render(); return; }
      const mo = e.target.closest('[data-open-month]'); if (mo) { S.mesF.month = mo.dataset.openMonth; showTab('mes'); return; }
      const so = e.target.closest('#tList [data-sort]'); if (so) { const k = so.dataset.sort; if (F.sort === k) F.dir *= -1; else { F.sort = k; F.dir = -1; } render(); return; }
      if (e.target.closest('[data-more]')) { F.limit += 200; render(); return; }
      const row = e.target.closest('tr[data-id]'); if (row) openRecord(row.dataset.kind, row.dataset.id);
    });
  },
  update(root, d) {
    const F = S.totF;
    const t = C.totals(d.ops);
    $('#tK1', root).innerHTML =
      kpi({ label: 'Beneficio acumulado', value: eur(t.benef), icon: ICON.trend, tone: 'g', cls: 'hero' + (t.benef < 0 ? ' neg' : ''), sub: `Reparaciones ${esc(eur(t.repBenef))} · móviles ${esc(eur(t.movBenef))}` })
      + kpi({ label: 'Facturación acumulada', value: eur(t.fact), icon: ICON.euro, tone: 'b', sub: `Cobrado ${esc(eur(t.cobrado))}` })
      + kpi({ label: 'Costes acumulados', value: eur(t.costes), icon: ICON.cost, tone: 'r' });
    $('#tK2', root).innerHTML =
      kpi({ label: 'Beneficio de reparaciones', value: eur(t.repBenef), icon: ICON.wrench, tone: 'v', sub: `${t.repN} reparaciones en total` })
      + kpi({ label: 'Beneficio de móviles', value: eur(t.movBenef), icon: ICON.phone, tone: 'y', sub: `${t.movN} móviles vendidos en total` })
      + kpi({ label: 'Inventario actual', value: String(d.inv.disponibles + d.inv.reservados), icon: ICON.box, tone: 'b', sub: `${esc(eur(d.inv.invertido))} invertidos sin vender` })
      + kpi({ label: 'Pendiente de cobrar', value: eur(t.pendiente), icon: ICON.wallet, tone: 'o', sub: `Reparaciones ${esc(eur(t.repPend))} · móviles ${esc(eur(t.movPend))}` });
    const keys = [...d.months.keys()].sort();
    const months = keys.length ? C.monthRange(keys[0] < curMonth() ? keys[0] : curMonth(), keys.at(-1) > curMonth() ? keys.at(-1) : curMonth()) : C.lastMonths(curMonth(), 6);
    const get = k => d.months.get(k) || C.emptyTotals();
    const many = months.length > 13;
    const labels = months.map(k => monthShort(k, many || k.slice(5) === '01' || k === months[0]));
    const titles = months.map(monthName);
    $('#tRange', root).textContent = months.length ? `${monthName(months[0])} – ${monthName(months.at(-1))}` : '';
    barChart($('#cEvo', root), { cats: months, labels, tipTitles: titles, series: [
      { ...SER.fact, values: months.map(k => get(k).fact) }, { ...SER.cost, values: months.map(k => get(k).costes) }, { ...SER.ben, values: months.map(k => get(k).benef) }] });
    let acc = 0;
    const cum = months.map(k => (acc += get(k).benef));
    lineChart($('#cCum', root), { cats: months, labels, tipTitles: titles, values: cum, color: 'var(--s-ben)', label: 'Acumulado', extraTip: i => [['Ese mes', eur(get(months[i]).benef)]] });

    const yrs = [...d.years.keys()].sort().reverse();
    const yRow = (label, x, attr = '') => `<tr ${attr}><td class="c-main"><span class="nm">${label}</span></td>
      <td class="r" data-label="Facturación"><span class="amt">${eur(x.fact)}</span></td><td class="r" data-label="Costes"><span class="amt">${eur(x.costes)}</span></td>
      <td class="r" data-label="Beneficio"><span class="${x.benef < 0 ? 'amt neg' : 'amt pos'}">${eur(x.benef)}</span></td>
      <td class="r" data-label="Benef. reparaciones"><span class="amt">${eur(x.repBenef)}</span></td><td class="r" data-label="Benef. móviles"><span class="amt">${eur(x.movBenef)}</span></td>
      <td class="r" data-label="Reparaciones"><span class="amt">${x.repN}</span></td><td class="r" data-label="Móviles vendidos"><span class="amt">${x.movN}</span></td>
      <td class="r" data-label="Pendiente de cobro"><span class="${amtCls(x.pendiente)}">${eur(x.pendiente)}</span></td></tr>`;
    const head = first => `<thead><tr><th>${first}</th><th class="r">Facturación</th><th class="r">Costes</th><th class="r">Beneficio</th><th class="r">Benef. reparaciones</th><th class="r">Benef. móviles</th><th class="r">Reparaciones</th><th class="r">Móviles vendidos</th><th class="r">Pendiente</th></tr></thead>`;
    $('#tYears', root).innerHTML = yrs.length ? `<table>${head('Año')}<tbody>${yrs.map(y => yRow(y, d.years.get(y))).join('')}</tbody>${yrs.length > 1 ? `<tfoot>${yRow('Total', t).replace('<tr >', '<tr>')}</tfoot>` : ''}</table>` : emptyBox('Sin datos todavía', 'Aquí verás cada año cuando haya operaciones.');
    $('#tMonths', root).innerHTML = keys.length ? `<table>${head('Mes')}<tbody>${keys.slice().reverse().map(k => yRow(esc(monthName(k)), d.months.get(k), `class="click" data-open-month="${k}"`)).join('')}</tbody></table>` : emptyBox('Sin datos todavía', 'Los meses aparecen solos según las fechas de las operaciones.');

    $('#tYear', root).innerHTML = `<option value="">Todos</option>` + yrs.map(y => `<option ${y === F.year ? 'selected' : ''}>${y}</option>`).join('');
    $$('#tAct [data-act]', root).forEach(b => b.setAttribute('aria-pressed', b.dataset.act === F.act));
    const q = norm(F.q);
    const rows = sortRows(d.ops.filter(o => (F.act === 'all' || o.kind === F.act) && (!F.year || o.mes.startsWith(F.year))
      && (!q || q.split(/\s+/).every(w => norm([o.titulo, o.detalle, o.desc, fmtDate(o.fecha), o.fecha].join(' ')).includes(w)))), F.sort, F.dir, opGet);
    VIEWS.total.rows = rows;
    $('#tCount', root).textContent = `${rows.length} operaciones`;
    $('#tList', root).innerHTML = rows.length ? opsTable(rows, F, F.limit) : emptyBox('Nada que mostrar', d.ops.length ? 'Prueba con otra búsqueda o filtro.' : 'Aquí aparecerán todas las reparaciones y ventas de móviles.');
  },
};

/* ---------- CSV (se abre bien en Excel en español) ---------- */
function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[;"\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}
const csvNum = n => n == null || n === '' ? '' : Number(n).toFixed(2).replace('.', ',');
function download(name, content, type) {
  const blob = new Blob([content], { type });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}
function saveCsv(name, header, rows) {
  const text = '﻿' + [header, ...rows].map(r => r.map(csvCell).join(';')).join('\r\n');
  download(name, text, 'text/csv;charset=utf-8');
  toast(`Descargado ${name} (${rows.length} filas)`);
}
const stamp = () => todayISO();
function exportRepCsv() {
  saveCsv(`almantec-reparaciones-${stamp()}.csv`,
    ['Fecha', 'Cliente', 'Teléfono', 'Modelo', 'Reparación', 'Facturado', 'Coste pieza', 'Otros costes', 'Beneficio', 'Estado', 'Pago', 'Fecha de pago', 'Notas'],
    S.rep.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1).map(r => [fmtDate(r.fecha), r.cliente, r.telefono, r.modelo, r.descripcion, csvNum(r.facturado), csvNum(r.coste_pieza), csvNum(r.otros_costes), csvNum(r.beneficio), REP_ESTADO[r.estado]?.[0], REP_PAGO[r.estado_pago]?.[0], r.fecha_pago ? fmtDate(r.fecha_pago) : '', r.notas]));
}
function exportMovCsv() {
  saveCsv(`almantec-moviles-${stamp()}.csv`,
    ['Fecha compra', 'Marca', 'Modelo', 'IMEI / serie', 'Precio compra', 'Costes adicionales', 'Estado', 'Fecha venta', 'Precio venta', 'Beneficio', 'Fecha cobro', 'Notas'],
    S.mov.slice().sort((a, b) => a.fecha_compra < b.fecha_compra ? -1 : 1).map(m => [fmtDate(m.fecha_compra), m.marca, m.modelo, m.imei, csvNum(m.precio_compra), csvNum(m.costes_adicionales), MOV_ESTADO[m.estado]?.[0], m.fecha_venta ? fmtDate(m.fecha_venta) : '', csvNum(m.precio_venta), m.estado === 'vendido' ? csvNum(m.beneficio) : '', m.fecha_cobro ? fmtDate(m.fecha_cobro) : '', m.notas]));
}
function exportOpsCsv(rows) {
  rows = rows || derived().ops.slice().sort((a, b) => a.fecha < b.fecha ? -1 : 1);
  saveCsv(`almantec-operaciones-${stamp()}.csv`,
    ['Fecha', 'Actividad', 'Operación', 'Cliente / IMEI', 'Facturado', 'Costes', 'Beneficio', 'Cobrado', 'Pendiente de cobro'],
    rows.map(o => [fmtDate(o.fecha), o.kind === 'rep' ? 'Reparación' : 'Venta de móvil', o.titulo, o.detalle, csvNum(o.fact / 100), csvNum(o.costes / 100), csvNum(o.benef / 100), csvNum(o.cobrado / 100), csvNum(o.pendiente / 100)]));
}

/* ---------- Copias de seguridad ---------- */
const BACKUP_APP = 'almantec-control-negocio';
async function downloadBackup({ silent = false } = {}) {
  await Sync.tick({ force: true });
  const fresh = !Sync.offline;
  if (!fresh && !silent) {
    const go = await confirmBox({ title: 'Sin conexión', body: `<p style="margin:0">No he podido comprobar GitHub ahora. ¿Descargo la copia con los datos de este dispositivo?</p>`, ok: 'Descargar igualmente' });
    if (!go) return false;
  }
  const data = { app: BACKUP_APP, version: 1, exportado: new Date().toISOString(), desde_servidor: fresh, reparaciones: S.rep, moviles: S.mov };
  const now = new Date();
  download(`almantec-copia-${stamp()}-${pad2(now.getHours())}${pad2(now.getMinutes())}.json`, JSON.stringify(data, null, 2), 'application/json');
  if (!silent) toast(`Copia descargada: ${S.rep.length} reparaciones y ${S.mov.length} móviles`);
  return true;
}
const pick = (o, cols) => { const r = {}; for (const c of cols) if (c in o) r[c] = o[c] === '' ? null : o[c]; return r; };
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function checkBackup(obj) {
  const errs = [];
  if (!obj || obj.app !== BACKUP_APP || !Array.isArray(obj.reparaciones) || !Array.isArray(obj.moviles)) return { errs: ['El archivo no es una copia de esta app.'] };
  const num = v => v == null || v === '' || (!isNaN(Number(v)) && Number(v) >= 0);
  const rep = [], mov = [];
  obj.reparaciones.forEach((r, i) => {
    const bad = !UUID_RE.test(r.id || '') || !validDate(r.fecha) || !String(r.cliente || '').trim() || !String(r.modelo || '').trim()
      || ![r.facturado, r.coste_pieza, r.otros_costes].every(num) || !REP_ESTADO[r.estado] || !REP_PAGO[r.estado_pago];
    if (bad) errs.push(`Reparación ${i + 1} (${r.cliente || 'sin nombre'}) tiene datos incompletos o no válidos.`);
    else rep.push({ id: r.id, ...pick(r, REP_COLS), descripcion: r.descripcion || '', otros_costes: r.otros_costes ?? 0, ...(r.creado_en ? { creado_en: r.creado_en } : {}) });
  });
  obj.moviles.forEach((m, i) => {
    const bad = !UUID_RE.test(m.id || '') || !validDate(m.fecha_compra) || !String(m.marca || '').trim() || !String(m.modelo || '').trim()
      || ![m.precio_compra, m.costes_adicionales, m.precio_venta].every(num) || !MOV_ESTADO[m.estado]
      || (m.estado === 'vendido' && (!validDate(m.fecha_venta) || m.precio_venta == null));
    if (bad) errs.push(`Móvil ${i + 1} (${m.marca || ''} ${m.modelo || ''}) tiene datos incompletos o no válidos.`);
    else mov.push({ id: m.id, ...pick(m, MOV_COLS), costes_adicionales: m.costes_adicionales ?? 0, ...(m.creado_en ? { creado_en: m.creado_en } : {}) });
  });
  return { errs, rep, mov };
}
const sameRow = (a, b, cols) => cols.every(c => String(a[c] ?? '') === String(b[c] ?? '') || (Number(a[c]) === Number(b[c]) && a[c] != null && b[c] != null));

async function restoreFlow(file) {
  let obj;
  try { obj = JSON.parse(await file.text()); } catch { toast('Ese archivo no se puede leer como copia (JSON).', 'err'); return; }
  const { errs, rep, mov } = checkBackup(obj);
  if (!rep) { toast(errs[0], 'err'); return; }
  await Sync.tick({ force: true });
  const cmp = (incoming, current, cols) => {
    const byId = new Map(current.map(r => [r.id, r]));
    let nuevos = 0, cambian = 0, iguales = 0;
    for (const r of incoming) { const c = byId.get(r.id); if (!c) nuevos++; else if (sameRow(r, c, cols)) iguales++; else cambian++; }
    const ids = new Set(incoming.map(r => r.id));
    return { nuevos, cambian, iguales, sobran: current.filter(r => !ids.has(r.id)).length };
  };
  const cr = cmp(rep, S.rep, REP_COLS), cm = cmp(mov, S.mov, MOV_COLS);
  const m = openLayer(`
    <div class="modal-h"><h2>Restaurar copia de seguridad</h2><button class="icon-btn sm" data-close aria-label="Cerrar">${ICON.x}</button></div>
    <div class="modal-b">
      <p style="margin:0">Copia del <b>${esc(fmtDateTime(obj.exportado))}</b>${obj.por ? ` hecha por ${esc(obj.por)}` : ''}: <b>${rep.length}</b> reparaciones y <b>${mov.length}</b> móviles.</p>
      ${errs.length ? `<div class="alert o">${ICON.info}<div><p>${errs.length} registro${errs.length === 1 ? '' : 's'} no se pueden importar y se saltarán:</p><ul>${errs.slice(0, 6).map(e => `<li>${esc(e)}</li>`).join('')}${errs.length > 6 ? `<li>y ${errs.length - 6} más</li>` : ''}</ul></div></div>` : ''}
      <dl class="kv"><dt>Reparaciones nuevas</dt><dd>${cr.nuevos}</dd><dt>Reparaciones que cambian</dt><dd>${cr.cambian}</dd><dt>Reparaciones iguales</dt><dd>${cr.iguales}</dd>
      <dt>Móviles nuevos</dt><dd>${cm.nuevos}</dd><dt>Móviles que cambian</dt><dd>${cm.cambian}</dd><dt>Móviles iguales</dt><dd>${cm.iguales}</dd>
      <dt>En los datos actuales y no en la copia</dt><dd>${cr.sobran} reparaciones · ${cm.sobran} móviles</dd></dl>
      <div class="fg"><span class="lbl">Cómo restaurar</span>
        <label class="check"><input type="radio" name="mode" value="merge" checked><span><b>Añadir y actualizar</b> (recomendado). Añade lo nuevo y actualiza lo que cambió. No borra nada.</span></label>
        <label class="check"><input type="radio" name="mode" value="replace"><span><b>Dejar exactamente como la copia.</b> Además borra ${cr.sobran} reparaciones y ${cm.sobran} móviles que no están en la copia. Antes se descarga una copia de lo actual.</span></label>
      </div>
      <div class="form-alert"></div>
    </div>
    <div class="modal-f"><button class="btn" data-close type="button">Cancelar</button><button class="btn primary" type="button" data-go>Restaurar</button></div>`);
  m.querySelector('[data-go]').addEventListener('click', async () => {
    const mode = m.querySelector('input[name="mode"]:checked').value;
    const btn = m.querySelector('[data-go]');
    if (mode === 'replace') {
      const ok = await confirmBox({ title: '¿Seguro?', body: `<p style="margin:0">Se borrarán ${cr.sobran} reparaciones y ${cm.sobran} móviles que no están en la copia, para todos los dispositivos. Antes descargaré una copia de los datos actuales.</p>`, ok: 'Sí, dejarlo como la copia', danger: true });
      if (!ok) return;
    }
    btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Restaurando…';
    const entry = layerStack.at(-1); if (entry) entry.busy = true;
    try {
      if (mode === 'replace' && !(await downloadBackup({ silent: true }))) throw new Error('no se pudo hacer la copia previa');
      const now = new Date().toISOString();
      for (const [kind, rows] of [['rep', rep], ['mov', mov]]) {
        for (const r of rows) {
          const cur = Sync.docs[COLS[kind] + '/' + r.id];
          const { id, ...data } = r;
          if (cur && !cur.x && sameRow(data, cur.d, kind === 'rep' ? REP_COLS : MOV_COLS)) continue;
          Sync.write(COLS[kind], id, { ...data, creado_en: data.creado_en || now, actualizado_en: now });
        }
      }
      if (mode === 'replace') {
        for (const [kind, rows, current] of [['rep', rep, S.rep], ['mov', mov, S.mov]]) {
          const keep = new Set(rows.map(r => r.id));
          current.filter(r => !keep.has(r.id)).forEach(r => Sync.write(COLS[kind], r.id, null));
        }
      }
      rebuild();
      const saved = await Sync.flush(30000);

      // Comprobación: todo lo de la copia está ahora en la base de datos.
      const have = new Set([...S.rep, ...S.mov].map(r => r.id));
      const missing = [...rep, ...mov].filter(r => !have.has(r.id)).length;
      if (entry) entry.busy = false;
      closeLayer();
      render();
      if (missing) toast(`Restaurado, pero faltan ${missing} registros. Vuelve a intentarlo.`, 'err');
      else if (!saved) toast('Copia restaurada en este dispositivo. Sin conexión con GitHub: se subirá sola al volver la conexión.', 'warn', 8000);
      else toast(`Copia restaurada, comprobada y subida a GitHub: ${rep.length} reparaciones y ${mov.length} móviles`);
    } catch (e) {
      if (entry) entry.busy = false;
      btn.disabled = false; btn.textContent = 'Restaurar';
      m.querySelector('.form-alert').innerHTML = `<div class="alert r">${ICON.info}<p>${esc(errMsg(e))}</p></div>`;
    }
  });
}

/* ---------- Pantallas de acceso ---------- */
function gate(html, wide = false) {
  $('#mainTabs').hidden = true; $('#topActions').hidden = true; $('#offlineBar').hidden = true;
  S.ready = false;
  $('#main').innerHTML = `<div class="gate"><div class="box ${wide ? 'wide' : ''}">${html}</div></div>`;
  renderStatus();
  return $('#main .box');
}

function startApp() {
  rebuild();
  S.ready = true;
  $('#mainTabs').hidden = false; $('#topActions').hidden = false;
  let tab = 'dash';
  try { tab = localStorage.getItem('almantec-cn-tab') || 'dash'; } catch { /* nada */ }
  S.tab = VIEWS[tab] ? tab : 'dash';
  $$('#mainTabs [data-tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === S.tab));
  S.mounted = null;
  renderStatus();
  render();
}

/* ---------- Eventos generales ---------- */
function bindChrome() {
  $('#mainTabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (b) showTab(b.dataset.tab); });
  $('#mainTabs').addEventListener('keydown', e => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const tabs = $$('#mainTabs [data-tab]'); const i = tabs.findIndex(t => t.dataset.tab === S.tab);
    const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]; showTab(n.dataset.tab); n.focus();
  });
  $('#btnAddRep').addEventListener('click', () => openRepForm());
  $('#btnAddMov').addEventListener('click', () => openMovForm());
  $('#syncBadge').addEventListener('click', () => { if (S.ready) openStatus(); });
  const menu = $('#dataMenu'), mb = $('#btnData');
  mb.addEventListener('click', e => { e.stopPropagation(); menu.hidden = !menu.hidden; mb.setAttribute('aria-expanded', !menu.hidden); });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('#dataMenu')) { menu.hidden = true; mb.setAttribute('aria-expanded', 'false'); } });
  menu.addEventListener('click', e => {
    const b = e.target.closest('[data-act]'); if (!b) return;
    menu.hidden = true; mb.setAttribute('aria-expanded', 'false');
    ({
      'csv-rep': exportRepCsv, 'csv-mov': exportMovCsv, 'csv-ops': () => exportOpsCsv(),
      backup: () => downloadBackup(), restore: () => $('#fileInput').click(),
      refresh: () => Sync.tick({ force: true }).then(() => toast(Sync.offline ? 'Sin conexión con GitHub' : 'Datos actualizados desde GitHub', Sync.offline ? 'err' : 'ok')),
      status: openStatus,
    })[b.dataset.act]?.();
  });
  $('#fileInput').addEventListener('change', e => { const f = e.target.files[0]; e.target.value = ''; if (f) restoreFlow(f); });
}

/* ---------- Arranque ---------- */
async function boot() {
  bindChrome();
  const r = await Sync.connect();
  if (r === 'config') { gate(`<h2>Falta configurar el repositorio</h2><p>Indica en <code>config.js</code> el usuario u organización y el repositorio de GitHub donde se guardan los datos (pasos en <code>GUIA.md</code>).</p>`, true); return; }
  if (r === 'crypto') { gate(`<h2>Navegador no compatible</h2><p>Este navegador no permite cifrar los datos. Abre la web con Chrome, Safari, Edge o Firefox actualizados.</p>`); return; }
  if (r !== 'ok') return;
  startApp();
}
boot();

// Para las pruebas automáticas.
window.__almantec = { S, Sync, parseMoney, render };
})();
