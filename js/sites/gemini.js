// Gemini 채팅 (코드 생성 도구)
import { registerSite } from '../browser.js';
import { S, emit } from '../state.js';
import { esc, renderMarkdown, copyText, toast, sleep } from '../util.js';
import { highlight } from '../editor.js';
import { respond } from '../responder.js';
import { accountName } from './accounts.js';

let busy = false;

function codeBlock(meta, code, streaming) {
  const [lang, file] = meta.split(/\s+/);
  const label = lang === 'html' ? 'HTML' : 'JavaScript';
  const hint = file === 'Code.gs' ? 'gemini-copy-gs' : file === 'index.html' ? 'gemini-copy-html' : '';
  const body = streaming ? esc(code) : highlight(code, lang === 'html' ? 'html' : 'js');
  return `<div class="gm-code"><div class="gm-code-h"><span>${label}${file ? ` · <b>${esc(file)}</b>` : ''}</span>
    <button class="gm-copy" data-act="copycode" data-file="${esc(file || '')}" ${hint ? `data-hint="${hint}"` : ''}>⧉ 코드 복사</button></div>
    <pre><code>${body}</code></pre></div>`;
}

function renderMsg(m, streaming = false) {
  if (m.role === 'user') return `<div class="gm-msg user"><div class="gm-bubble">${esc(m.text).replace(/\n/g, '<br>')}</div></div>`;
  const codes = [];
  const html = renderMarkdown(m.text, {
    codeBlock: (meta, code) => {
      codes.push(code);
      return codeBlock(meta, code, streaming);
    },
  });
  return `<div class="gm-msg bot"><div class="gm-avatar">✧</div><div class="gm-ans">${html}${streaming ? '<span class="gm-caret"></span>' : `<div class="gm-acts"><span title="좋아요">👍</span><span title="별로예요">👎</span><span title="다시 생성">⟳</span><span title="공유">⇪</span></div>`}</div></div>`;
}

registerSite({
  id: 'gemini',
  match: (u) => u.host === 'gemini.google.com',
  title: () => 'Gemini',
  rerenderOnShow: false,
  render(el, ctx) {
    const n = accountName();
    const msgs = S.L.chat.messages;
    el.innerHTML = `<div class="gm">
      <aside class="gm-side">
        <button class="gm-menu">☰</button>
        <button class="gm-newchat" data-act="newchat">✎ 새 채팅</button>
        <div class="gm-recent"><small>최근</small>${msgs.length ? `<div class="gm-rc on">${esc((msgs[0] && msgs[0].text) || '').slice(0, 18)}...</div>` : ''}</div>
        <div class="gm-side-foot">⚙ 설정 및 도움말</div>
      </aside>
      <section class="gm-main">
        <header class="gm-top"><div class="gm-brand">Gemini <span>3.8 Flash ▾</span></div><span class="gm-av">${esc(n.slice(0, 1))}</span></header>
        <div class="gm-scroll" id="gm-scroll">
          ${msgs.length ? '' : `<div class="gm-hello"><h1><span>안녕하세요, ${esc(n)}님</span></h1><p>무엇을 도와드릴까요?</p></div>`}
          <div class="gm-msgs" id="gm-msgs">${msgs.map((m) => renderMsg(m)).join('')}</div>
        </div>
        <div class="gm-inputwrap">
          <div class="gm-input"><button class="gm-plus" title="파일 추가">＋</button>
            <textarea id="gm-ta" rows="1" placeholder="Gemini에게 물어보기" data-hint="gemini-input"></textarea>
            <button class="gm-send" data-act="send" data-hint="gemini-send" title="보내기">➤</button></div>
          <p class="gm-foot">Gemini는 실수를 할 수 있으므로 다시 한번 확인하세요. (실습용 시뮬레이션 화면)</p>
        </div>
      </section>
    </div>`;
    const ta = el.querySelector('#gm-ta');
    const scroll = el.querySelector('#gm-scroll');
    scroll.scrollTop = scroll.scrollHeight;
    const grow = () => {
      ta.style.height = 'auto';
      ta.style.height = Math.min(220, ta.scrollHeight) + 'px';
    };
    ta.addEventListener('input', grow);
    ta.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        send();
      }
    });
    const send = async () => {
      const text = ta.value.trim();
      if (!text || busy) return;
      busy = true;
      ta.value = '';
      grow();
      const hello = el.querySelector('.gm-hello');
      if (hello) hello.remove();
      const box = el.querySelector('#gm-msgs');
      S.L.chat.messages.push({ role: 'user', text });
      box.insertAdjacentHTML('beforeend', renderMsg({ role: 'user', text }));
      box.insertAdjacentHTML('beforeend', `<div class="gm-msg bot thinking"><div class="gm-avatar spin">✧</div><div class="gm-ans"><span class="gm-think">생각하는 중...</span></div></div>`);
      scroll.scrollTop = scroll.scrollHeight;
      emit('chat:sent', { text });
      const res = respond(text);
      await sleep(900 + Math.random() * 700);
      const thinking = box.querySelector('.thinking');
      if (thinking) thinking.remove();
      // 스트리밍처럼 조금씩 보여 주기
      const full = res.md;
      const holder = document.createElement('div');
      box.appendChild(holder);
      const steps = full.length > 3000 ? 28 : 14;
      for (let i = 1; i <= steps; i++) {
        const part = full.slice(0, Math.floor((full.length * i) / steps));
        const closed = (part.match(/```/g) || []).length % 2 === 1 ? part + '\n```' : part;
        holder.innerHTML = renderMsg({ role: 'ai', text: closed }, true);
        const nearBottom = scroll.scrollHeight - scroll.scrollTop - scroll.clientHeight < 260;
        if (nearBottom || i < 3) scroll.scrollTop = scroll.scrollHeight;
        await sleep(full.length > 3000 ? 70 : 60);
      }
      holder.outerHTML = renderMsg({ role: 'ai', text: full });
      S.L.chat.messages.push({ role: 'ai', text: full });
      if (res.gen) {
        S.L.gen = { app: res.gen.app, provider: res.gen.provider, model: res.gen.model, propName: res.gen.propName, features: res.gen.features, subjectId: res.gen.subjectId, title: res.gen.title };
      }
      busy = false;
      if (res.kind === 'create') {
        emit('chat:createdOnce');
        emit('chat:codeGenerated', { app: res.gen.app });
      }
      if (res.kind === 'feature') emit('chat:featureGenerated', { added: res.added });
      if (res.kind === 'fix') {
        emit('chat:modelFixed');
        emit('chat:fixGenerated');
      }
      if (res.kind === 'fixhelp') emit('chat:fixHelp', { kind: res.errKind });
      if (!res.kind) emit('chat:answered');
    };
    el.onclick = async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'send') send();
      if (a.dataset.act === 'newchat') {
        if (busy) return;
        S.L.chat.messages = [];
        ctx.rerender();
      }
      if (a.dataset.act === 'copycode') {
        const code = a.closest('.gm-code').querySelector('code').textContent;
        await copyText(code);
        a.textContent = '✓ 복사됨';
        setTimeout(() => (a.textContent = '⧉ 코드 복사'), 1800);
        toast(`${a.dataset.file || '코드'}를 클립보드에 복사했어요.`, 'ok');
        emit('chat:codeCopied', { file: a.dataset.file });
      }
    };
  },
});
