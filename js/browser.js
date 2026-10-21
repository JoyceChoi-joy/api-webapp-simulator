// 가상 브라우저 (탭, 주소창, 팝업 창)
import { S, emit, save } from './state.js';
import { esc, uid, $ } from './util.js';

const SITES = [];
export function registerSite(site) {
  SITES.push(site);
}

let root = null;
const views = new Map(); // tabId -> element

export function parseUrl(raw) {
  let s = String(raw || '').trim();
  if (!s) return null;
  if (/\s/.test(s) || (!s.includes('.') && !s.startsWith('localhost'))) {
    return new URL('https://www.google.com/search?q=' + encodeURIComponent(s));
  }
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  try {
    return new URL(s);
  } catch (e) {
    return new URL('https://www.google.com/search?q=' + encodeURIComponent(raw));
  }
}

function siteFor(url) {
  return SITES.find((s) => s.match(url)) || SITES.find((s) => s.id === 'notfound');
}

export function tabs() {
  return S.L.browser.tabs;
}
export function activeTab() {
  return tabs().find((t) => t.id === S.L.browser.active) || null;
}
export function findTab(pred) {
  return tabs().find((t) => pred(new URL(t.url), t));
}

export function openTab(url = 'chrome://newtab', { activate = true } = {}) {
  const t = { id: uid('t'), url, title: '새 탭', ui: {}, history: [url], hIndex: 0 };
  tabs().push(t);
  if (activate) S.L.browser.active = t.id;
  renderTab(t);
  renderShell();
  if (activate) showActive();
  save();
  return t;
}

// 이미 열린 같은 사이트 탭이 있으면 그 탭으로 이동
export function focusOrOpen(url, sameSite) {
  const u = parseUrl(url);
  const ex = tabs().find((t) => {
    const tu = safeUrl(t.url);
    return tu && (sameSite ? sameSite(tu) : tu.host === u.host);
  });
  if (ex) {
    S.L.browser.active = ex.id;
    navigate(ex.id, u.href);
    return ex;
  }
  return openTab(u.href);
}

function safeUrl(s) {
  try {
    return new URL(s);
  } catch (e) {
    return null;
  }
}

export function navigate(tabId, url, { push = true } = {}) {
  const t = tabs().find((x) => x.id === tabId);
  if (!t) return;
  const u = url.startsWith('chrome://') ? url : parseUrl(url).href;
  if (push) {
    t.history = t.history.slice(0, t.hIndex + 1);
    t.history.push(u);
    t.hIndex = t.history.length - 1;
  }
  t.url = u;
  t.ui = {};
  renderTab(t);
  renderShell();
  showActive();
  save();
}

export function closeTab(id) {
  const list = tabs();
  const i = list.findIndex((t) => t.id === id);
  if (i < 0) return;
  list.splice(i, 1);
  const v = views.get(id);
  if (v) v.remove();
  views.delete(id);
  if (S.L.browser.active === id) S.L.browser.active = list.length ? list[Math.max(0, i - 1)].id : null;
  if (!list.length) openTab();
  renderShell();
  showActive();
  save();
}

export function activate(id) {
  S.L.browser.active = id;
  const t = activeTab();
  const site = t && siteFor(safeUrl(t.url) || new URL('https://x.invalid'));
  if (site && site.rerenderOnShow) renderTab(t);
  renderShell();
  showActive();
  save();
  emit('browser:activate', { url: t && t.url });
}

function makeCtx(t) {
  const url = t.url.startsWith('chrome://') ? new URL('https://newtab.invalid/') : new URL(t.url);
  return {
    tab: t,
    url,
    go: (u) => navigate(t.id, u),
    replace: (u) => navigate(t.id, u, { push: false }),
    rerender: () => renderTab(t),
    openTab: (u) => openTab(u),
    setTitle: (title) => {
      t.title = title;
      renderShell();
    },
  };
}

export function renderTab(t) {
  let v = views.get(t.id);
  if (!v) {
    v = document.createElement('div');
    v.className = 'br-view';
    v.dataset.tab = t.id;
    $('.br-views', root).appendChild(v);
    views.set(t.id, v);
  }
  const ctx = makeCtx(t);
  const site = t.url.startsWith('chrome://') ? SITES.find((s) => s.id === 'newtab') : siteFor(ctx.url);
  t.site = site.id;
  t.title = site.title ? site.title(ctx) : site.id;
  v.className = 'br-view site-' + site.id;
  v.innerHTML = '';
  site.render(v, ctx);
  if (!site.noVisitEvent) emit('visit:' + site.id, { site: site.id, path: ctx.url.pathname, url: t.url });
}

export function rerenderSite(siteId) {
  tabs().forEach((t) => {
    if (t.site === siteId) renderTab(t);
  });
  renderShell();
}

function showActive() {
  views.forEach((v, id) => (v.style.display = id === S.L.browser.active ? '' : 'none'));
  const t = activeTab();
  const input = $('.br-url', root);
  if (input && t) input.value = t.url.startsWith('chrome://') ? '' : t.url;
}

const FAV = {
  newtab: '<span class="fav fav-new">◎</span>',
  google: '<span class="fav fav-g">G</span>',
  drive: '<span class="fav fav-drive">▲</span>',
  sheets: '<span class="fav fav-sheets">▦</span>',
  appsscript: '<span class="fav fav-as">{ }</span>',
  aistudio: '<span class="fav fav-ai">✦</span>',
  openai: '<span class="fav fav-oa">◍</span>',
  gemini: '<span class="fav fav-gm">✧</span>',
  webapp: '<span class="fav fav-wa">▣</span>',
  notfound: '<span class="fav">!</span>',
};

export function renderShell() {
  if (!root) return;
  const bar = $('.br-tabs', root);
  bar.innerHTML =
    tabs()
      .map(
        (t) => `<div class="br-tab ${t.id === S.L.browser.active ? 'on' : ''}" data-act="tab" data-id="${t.id}" data-hint="tab-${t.site}" title="${esc(t.title)}">
      ${FAV[t.site] || FAV.notfound}<span class="br-tab-t">${esc(t.title)}</span>
      <button class="br-tab-x" data-act="close" data-id="${t.id}" title="탭 닫기">×</button></div>`
      )
      .join('') + `<button class="br-newtab" data-act="newtab" data-hint="browser-newtab" title="새 탭 (Ctrl+T)">＋</button>`;
  const t = activeTab();
  const input = $('.br-url', root);
  if (t && document.activeElement !== input) input.value = t.url.startsWith('chrome://') ? '' : t.url;
  $('.br-back', root).disabled = !t || t.hIndex <= 0;
  $('.br-fwd', root).disabled = !t || t.hIndex >= t.history.length - 1;
}

export function mountBrowser(el) {
  root = el;
  views.clear();
  root.innerHTML = `
  <div class="br">
    <div class="br-tabs"></div>
    <div class="br-bar">
      <button class="br-nav br-back" data-act="back" title="뒤로">←</button>
      <button class="br-nav br-fwd" data-act="fwd" title="앞으로">→</button>
      <button class="br-nav" data-act="reload" data-hint="browser-reload" title="새로고침">⟳</button>
      <div class="br-urlbox" data-hint="browser-url"><span class="br-lock">🔒</span>
        <input class="br-url" spellcheck="false" autocomplete="off" placeholder="Google에서 검색하거나 URL을 입력하세요"></div>
    </div>
    <div class="br-views"></div>
  </div>`;
  root.addEventListener('click', (e) => {
    const a = e.target.closest('[data-act]');
    if (!a || !root.contains(a)) return;
    const act = a.dataset.act;
    if (!['tab', 'close', 'newtab', 'back', 'fwd', 'reload'].includes(act)) return;
    if (a.closest('.br-view')) return;
    e.stopPropagation();
    if (act === 'tab') activate(a.dataset.id);
    if (act === 'close') closeTab(a.dataset.id);
    if (act === 'newtab') {
      openTab();
      setTimeout(() => $('.br-url', root).focus(), 30);
      emit('browser:newtab');
    }
    const t = activeTab();
    if (!t) return;
    if (act === 'back' && t.hIndex > 0) {
      t.hIndex--;
      navigate(t.id, t.history[t.hIndex], { push: false });
    }
    if (act === 'fwd' && t.hIndex < t.history.length - 1) {
      t.hIndex++;
      navigate(t.id, t.history[t.hIndex], { push: false });
    }
    if (act === 'reload') {
      renderTab(t);
      emit('browser:reload', { url: t.url });
    }
  });
  const input = $('.br-url', root);
  input.addEventListener('focus', () => input.select());
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const t = activeTab();
      if (!input.value.trim()) return;
      navigate(t.id, input.value);
      input.blur();
      emit('browser:typed', { url: activeTab().url });
    }
  });
  if (!tabs().length) {
    openTab();
  } else {
    tabs().forEach((t) => renderTab(t));
    renderShell();
    showActive();
  }
}

/* ---------------- 팝업 창 (계정 선택, 권한 승인 등) ---------------- */
export function openPopup({ url, title, width = 460, render }) {
  const wrap = document.createElement('div');
  wrap.className = 'pop-wrap';
  wrap.innerHTML = `<div class="pop" style="width:${width}px">
    <div class="pop-title"><span>${esc(title || '')}</span><button class="pop-x" title="창 닫기">×</button></div>
    <div class="pop-url">🔒 ${esc(url)}</div>
    <div class="pop-body"></div></div>`;
  (root.querySelector('.br') || document.body).appendChild(wrap);
  const close = () => wrap.remove();
  wrap.querySelector('.pop-x').onclick = () => {
    close();
    emit('popup:closed', { url });
  };
  const body = wrap.querySelector('.pop-body');
  render(body, close, (newUrl) => (wrap.querySelector('.pop-url').textContent = '🔒 ' + newUrl));
  return close;
}

export function browserRoot() {
  return root;
}
