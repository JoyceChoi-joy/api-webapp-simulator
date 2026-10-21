// 줄 번호와 색 구분이 있는 간단한 코드 편집기
import { esc } from './util.js';

const JS_RE = /(\/\/[^\n]*|\/\*[\s\S]*?\*\/)|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)|\b(function|const|let|var|return|if|else|for|while|new|throw|true|false|null|undefined|try|catch|typeof|this)\b|\b(\d+(?:\.\d+)?)\b|\b([A-Za-z_$][\w$]*)(?=\s*\()/g;

function hlJS(code) {
  let out = '';
  let last = 0;
  code.replace(JS_RE, (m, com, str, kw, num, fn, idx) => {
    out += esc(code.slice(last, idx));
    if (com) out += `<span class="tk-c">${esc(m)}</span>`;
    else if (str) out += `<span class="tk-s">${esc(m)}</span>`;
    else if (kw) out += `<span class="tk-k">${esc(m)}</span>`;
    else if (num) out += `<span class="tk-n">${esc(m)}</span>`;
    else if (fn) out += `<span class="tk-f">${esc(m)}</span>`;
    else out += esc(m);
    last = idx + m.length;
    return m;
  });
  return out + esc(code.slice(last));
}

const HTML_RE = /(<!--[\s\S]*?-->)|(<\/?[A-Za-z][\w-]*)|("[^"\n]*"|'[^'\n]*')|(\s[\w-:]+)(?==)|(\/?>)/g;
function hlHTML(code) {
  // <script> 안쪽은 자바스크립트로 색을 칠합니다.
  const parts = code.split(/(<script>[\s\S]*?<\/script>)/g);
  return parts
    .map((p) => {
      if (p.startsWith('<script>')) {
        const inner = p.slice(8, -9);
        return `<span class="tk-t">&lt;script</span><span class="tk-t">&gt;</span>${hlJS(inner)}<span class="tk-t">&lt;/script</span><span class="tk-t">&gt;</span>`;
      }
      let out = '';
      let last = 0;
      p.replace(HTML_RE, (m, com, tag, str, attr, close, idx) => {
        out += esc(p.slice(last, idx));
        if (com) out += `<span class="tk-c">${esc(m)}</span>`;
        else if (tag || close) out += `<span class="tk-t">${esc(m)}</span>`;
        else if (str) out += `<span class="tk-s">${esc(m)}</span>`;
        else if (attr) out += `<span class="tk-a">${esc(m)}</span>`;
        last = idx + m.length;
        return m;
      });
      return out + esc(p.slice(last));
    })
    .join('');
}

export function highlight(code, type) {
  return type === 'html' ? hlHTML(code) : hlJS(code);
}

export function mountEditor(el, { value, type, onChange, onSave, onLine, errorLine }) {
  el.innerHTML = `<div class="ed"><div class="ed-gut"></div><div class="ed-area"><pre class="ed-hl" aria-hidden="true"></pre><textarea class="ed-ta" spellcheck="false" wrap="off" autocapitalize="off" autocomplete="off" data-hint="as-code"></textarea></div></div>`;
  const ta = el.querySelector('.ed-ta');
  const pre = el.querySelector('.ed-hl');
  const gut = el.querySelector('.ed-gut');
  const area = el.querySelector('.ed-area');
  ta.value = value;
  let raf = 0;
  const paint = () => {
    const v = ta.value;
    pre.innerHTML = highlight(v, type) + '\n';
    const lines = v.split('\n');
    gut.innerHTML = lines.map((_, i) => `<div class="${errorLine === i + 1 ? 'err' : ''}">${i + 1}</div>`).join('');
    const maxLen = lines.reduce((m, l) => Math.max(m, l.length), 0);
    const w = `calc(${maxLen + 4}ch + 24px)`;
    ta.style.width = w;
    pre.style.width = w;
    ta.style.height = '0px';
    const h = Math.max(ta.scrollHeight, area.clientHeight) + 'px';
    ta.style.height = h;
    pre.style.minHeight = h;
  };
  const schedule = () => {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(paint);
  };
  ta.addEventListener('input', () => {
    onChange && onChange(ta.value);
    schedule();
  });
  ta.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      onSave && onSave();
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const s = ta.selectionStart;
      const en = ta.selectionEnd;
      ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(en);
      ta.selectionStart = ta.selectionEnd = s + 2;
      onChange && onChange(ta.value);
      schedule();
    }
  });
  const lineReport = () => {
    if (!onLine) return;
    const before = ta.value.slice(0, ta.selectionStart);
    const n = before.split('\n').length;
    onLine(n, ta.value.split('\n')[n - 1] || '');
  };
  ta.addEventListener('click', lineReport);
  ta.addEventListener('keyup', (e) => {
    if (e.key.startsWith('Arrow')) lineReport();
  });
  setTimeout(paint, 0);
  window.addEventListener('resize', schedule);
  return {
    ta,
    setValue(v) {
      ta.value = v;
      paint();
    },
    focus() {
      ta.focus();
    },
  };
}
