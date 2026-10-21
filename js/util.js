// 공통 도우미 함수
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export function uid(prefix = '') {
  return prefix + Math.random().toString(36).slice(2, 10);
}

const ALNUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
export function randStr(n, chars = ALNUM + '_-') {
  let s = '';
  for (let i = 0; i < n; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// 시뮬레이션용 가짜 키 (실제로 동작하지 않는 문자열)
export function makeGeminiKey() {
  return 'AIzaSy' + randStr(33);
}
export function makeOpenAIKey() {
  return 'sk-proj-' + randStr(48) + 'T3BlbkFJ' + randStr(48);
}
export function makeDeploymentId() {
  return 'AKfycb' + randStr(66);
}
export function maskKey(k) {
  if (!k) return '';
  if (k.startsWith('sk-')) return 'sk-...' + k.slice(-4);
  return k.slice(0, 4) + '...' + k.slice(-4);
}

export function today(withTime = false) {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const s = `${d.getFullYear()}. ${d.getMonth() + 1}. ${d.getDate()}.`;
  return withTime ? `${s} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}` : s;
}
export function nowTime() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

// 클립보드 복사 (실제 클립보드 + 실패 시 대체 방식)
let simClipboard = '';
export function getSimClipboard() {
  return simClipboard;
}
export async function copyText(text) {
  simClipboard = text;
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch (e) {
    /* 대체 방식으로 진행 */
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
    return true;
  } catch (e) {
    return false;
  }
}

// 사이트 안에서 띄우는 대화 상자
export function siteModal(container, html, cls = '') {
  const wrap = document.createElement('div');
  wrap.className = 'sm-wrap ' + cls;
  wrap.innerHTML = `<div class="sm-box">${html}</div>`;
  container.appendChild(wrap);
  const close = () => wrap.remove();
  wrap.addEventListener('mousedown', (e) => {
    if (e.target === wrap && !cls.includes('sticky')) close();
  });
  return { box: wrap.querySelector('.sm-box'), close, wrap };
}

// 토스트 알림
export function toast(msg, type = 'info', ms = 2600) {
  let wrap = $('#toast-wrap');
  if (!wrap) {
    wrap = document.createElement('div');
    wrap.id = 'toast-wrap';
    document.body.appendChild(wrap);
  }
  while (wrap.children.length >= 3) wrap.firstElementChild.remove();
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = msg;
  wrap.appendChild(t);
  requestAnimationFrame(() => t.classList.add('show'));
  setTimeout(() => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  }, ms);
}

// 간단한 마크다운 렌더러 (채팅 응답용)
export function renderMarkdown(md, { codeBlock } = {}) {
  const lines = md.split('\n');
  let html = '';
  let i = 0;
  let inList = null;
  const closeList = () => {
    if (inList) {
      html += `</${inList}>`;
      inList = null;
    }
  };
  const inline = (s) =>
    esc(s)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      closeList();
      const meta = line.slice(3).trim();
      const buf = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        buf.push(lines[i]);
        i++;
      }
      i++;
      html += codeBlock ? codeBlock(meta, buf.join('\n')) : `<pre><code>${esc(buf.join('\n'))}</code></pre>`;
      continue;
    }
    if (/^#{1,4}\s/.test(line)) {
      closeList();
      const lv = line.match(/^#+/)[0].length;
      html += `<h${lv + 1}>${inline(line.replace(/^#+\s/, ''))}</h${lv + 1}>`;
    } else if (/^\s*[-*]\s/.test(line)) {
      if (inList !== 'ul') {
        closeList();
        html += '<ul>';
        inList = 'ul';
      }
      html += `<li>${inline(line.replace(/^\s*[-*]\s/, ''))}</li>`;
    } else if (/^\s*\d+\.\s/.test(line)) {
      if (inList !== 'ol') {
        closeList();
        html += '<ol>';
        inList = 'ol';
      }
      html += `<li>${inline(line.replace(/^\s*\d+\.\s/, ''))}</li>`;
    } else if (line.startsWith('> ')) {
      closeList();
      html += `<blockquote>${inline(line.slice(2))}</blockquote>`;
    } else if (line.trim() === '') {
      closeList();
    } else {
      closeList();
      html += `<p>${inline(line)}</p>`;
    }
    i++;
  }
  closeList();
  return html;
}

// 문자열 비교용 정규화
export function norm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[.,!?~'"“”‘’()]/g, '');
}

export function pick(arr, n) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return n == null ? a : a.slice(0, n);
}
