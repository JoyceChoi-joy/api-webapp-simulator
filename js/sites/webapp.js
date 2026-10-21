// 배포된 웹앱 실행 화면 (index.html을 실제로 실행하고 google.script.run을 연결)
import { registerSite } from '../browser.js';
import { S, emit, on } from '../state.js';
import { esc, copyText, toast } from '../util.js';
import { findDeployment, getScript } from '../store.js';
import { analyzeFiles } from '../analyze.js';
import { runServer } from '../backend.js';
import { generateCode } from '../codegen.js';
import { MODELS } from '../config.js';
import { FIXED_QUIZ } from '../data/movies.js';

export const SAMPLE_ID = 'AKfycbSAMPLE_noapi_movie_quiz_v1';
const frames = new Map(); // contentWindow -> 실행 정보

function shim(fns) {
  return `<script>
(function () {
  var FUNCS = ${JSON.stringify(fns)};
  var seq = 0, pending = {};
  window.addEventListener('message', function (e) {
    var d = e.data;
    if (!d || !d.__gasReply) return;
    var p = pending[d.id];
    if (!p) return;
    delete pending[d.id];
    if (d.ok) { if (p.s) p.s(d.result, p.u); }
    else { var err = new Error(d.error); if (p.f) p.f(err, p.u); else console.error(err); }
  });
  function runner(s, f, u) {
    var o = {
      withSuccessHandler: function (fn) { return runner(fn, f, u); },
      withFailureHandler: function (fn) { return runner(s, fn, u); },
      withUserObject: function (x) { return runner(s, f, x); }
    };
    FUNCS.forEach(function (name) {
      o[name] = function () {
        var id = ++seq;
        pending[id] = { s: s, f: f, u: u };
        parent.postMessage({ __gasCall: true, id: id, fn: name, args: JSON.parse(JSON.stringify(Array.prototype.slice.call(arguments))) }, '*');
      };
    });
    return o;
  }
  window.google = { script: { run: runner(null, null, null), host: { close: function () {} } } };
  if (window.speechSynthesis) {
    var sp = speechSynthesis.speak.bind(speechSynthesis);
    speechSynthesis.speak = function (u) { parent.postMessage({ __gasTTS: true, text: u.text }, '*'); return sp(u); };
  }
})();
<\/script>`;
}

function inject(html, fns) {
  const s = shim(fns) + '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css">';
  if (/<head[^>]*>/i.test(html)) return html.replace(/<head[^>]*>/i, (m) => m + s);
  return s + html;
}

function errorPage(title, msg) {
  return `<div class="wa-err"><div class="wa-err-g">Google Apps Script</div><h2>${esc(title)}</h2><p class="mono">${esc(msg)}</p></div>`;
}

function devtools(open) {
  const logs = S.L.apiLog;
  return `<div class="wa-dev ${open ? '' : 'hidden'}">
    <div class="wa-dev-h"><b>🔍 API 통신 보기</b><span class="wa-dev-sub">웹페이지(index.html) → Code.gs → 생성형 AI API 서버로 오가는 요청과 응답이에요. (학습용 화면)</span><button class="wa-dev-x" data-act="devclose">×</button></div>
    <div class="wa-dev-b">
      <div class="wa-dev-list">${
        logs.length
          ? logs
              .map(
                (l, i) => `<div class="wa-dev-item ${i === 0 ? 'on' : ''}" data-act="devsel" data-i="${i}">
          <span class="st ${l.status === 200 ? 'ok' : l.status === 'pending' ? 'wait' : 'bad'}">${l.status === 'pending' ? '...' : l.status === 'not_sent' ? '미전송' : l.status}</span>
          <span><b>${esc(l.fn)}</b><br><small>${esc(l.time)} · ${esc(l.label || '')}</small></span></div>`
              )
              .join('')
          : '<p class="wa-dev-empty">아직 API 요청이 없어요. 웹앱의 버튼을 눌러 보세요.</p>'
      }</div>
      <div class="wa-dev-detail" id="wa-dev-detail">${logs.length ? detail(logs[0]) : ''}</div>
    </div></div>`;
}

function detail(l) {
  const flow = [
    ['🖥', 'index.html', `google.script.run.${l.fn}()`],
    ['📄', 'Code.gs', `${l.fn}() → askAI(prompt)`],
    ['🔑', '스크립트 속성', l.provider === 'gemini' ? 'GEMINI 키 꺼내기' : 'OPENAI 키 꺼내기'],
    ['🌐', 'UrlFetchApp.fetch', l.provider === 'gemini' ? 'generativelanguage.googleapis.com' : 'api.openai.com'],
    ['🤖', l.provider === 'gemini' ? 'Gemini API' : 'OpenAI API', l.model || ''],
  ];
  const sent = l.status !== 'not_sent';
  const ok = l.status === 200;
  return `<div class="wa-flow">${flow
    .map((f, i) => `<div class="wa-node ${!sent && i >= 3 ? 'off' : ''} ${!ok && sent && l.status !== 'pending' && i === 4 ? 'bad' : ''}"><span>${f[0]}</span><b>${esc(f[1])}</b><small>${esc(f[2])}</small></div>${i < flow.length - 1 ? '<i>→</i>' : ''}`)
    .join('')}</div>
    ${l.note ? `<p class="wa-note">${esc(l.note)}</p>` : ''}
    <div class="wa-cols">
      <div><h4>요청 (Request)</h4><pre class="wa-pre"><b>${esc(l.method)}</b> ${esc(l.url)}\n${Object.entries(l.headers)
        .map(([k, v]) => `${esc(k)}: ${esc(v)}`)
        .join('\n')}\n\n${esc(JSON.stringify(l.request, null, 2))}</pre></div>
      <div><h4>응답 (Response) ${l.status === 200 ? '<span class="st ok">200 OK</span>' : l.status === 'pending' ? '<span class="st wait">기다리는 중</span>' : l.status === 'not_sent' ? '<span class="st">보내지 않음</span>' : `<span class="st bad">${l.status}</span>`}</h4><pre class="wa-pre">${l.response ? esc(JSON.stringify(l.response, null, 2)) : l.status === 'pending' ? 'AI가 답을 만드는 중...' : '(응답 없음)'}</pre></div>
    </div>`;
}

function sampleHTML() {
  const o = { app: 'quiz', provider: 'gemini', model: MODELS.gemini.current, propName: 'GEMINI_API_KEY', features: [] };
  return generateCode(o).html.replace('제미나이가 문제를 만드는 중...', '문제를 불러오는 중...').replace('<h1>🎬 이모티콘 영화 퀴즈</h1>', '<h1>🎬 이모티콘 영화 퀴즈</h1><p style="color:#888;font-size:13px">API 없이 미리 만들어 둔 버전</p>').replace('문제는 모두 10개이고', '문제는 미리 만들어 둔 5개이고');
}

registerSite({
  id: 'webapp',
  match: (u) => u.host === 'script.google.com' && u.pathname.startsWith('/macros/'),
  title: (ctx) => {
    const id = ctx.url.pathname.split('/')[3];
    if (id === SAMPLE_ID) return '이모티콘 영화 퀴즈 (API 없는 버전)';
    const found = findDeployment(id);
    const sc = found ? found.sc : getScript(id);
    if (!sc) return 'Google Drive - 파일을 열 수 없음';
    const v = found ? sc.versions.find((x) => x.n === found.dep.version) : null;
    const files = v ? v.files : sc.files.map((f) => ({ name: f.name, type: f.type, content: f.saved }));
    return analyzeFiles(files).title || sc.name;
  },
  render(el, ctx) {
    const parts = ctx.url.pathname.split('/');
    const id = parts[3];
    const mode = parts[4]; // exec 또는 dev
    let html = null;
    let an = null;
    let sc = null;
    let sample = false;
    let errorHtml = null;
    if (id === SAMPLE_ID) {
      sample = true;
      html = sampleHTML();
      an = { fns: ['getQuizQuestions'], sample: true };
    } else {
      let files = null;
      const found = findDeployment(id);
      if (found && mode === 'exec') {
        sc = found.sc;
        const v = sc.versions.find((x) => x.n === found.dep.version);
        files = v.files;
      } else if (mode === 'dev' && getScript(id)) {
        sc = getScript(id);
        files = sc.files.map((f) => ({ name: f.name, type: f.type, content: f.saved }));
      }
      if (!files) {
        errorHtml = `<div class="wa-err"><div class="wa-err-g">Google Drive</div><h2>죄송합니다. 현재 파일을 열 수 없습니다.</h2><p>주소를 확인하고 다시 시도해 보세요.</p></div>`;
      } else {
        an = analyzeFiles(files);
        if (!an.syntax.ok) errorHtml = errorPage('구문 오류', `${an.syntax.message} (${an.syntax.file})`);
        else if (!an.hasDoGet) errorHtml = errorPage('스크립트 함수를 찾을 수 없음: doGet', 'Code.gs에 doGet 함수가 없어요. 백엔드 코드를 Code.gs에 붙여 넣었는지 확인하세요.');
        else if (an.htmlName && !an.htmlFound) errorHtml = errorPage(`예외: 이름이 ${an.htmlName}인 HTML 파일을 찾을 수 없습니다.`, `[파일 ＋] → [HTML]로 '${an.htmlName}' 파일을 만들었는지, 이름이 정확한지 확인하세요.`);
        else html = an.html;
      }
    }
    const lastErr = S.L.lastError;
    el.innerHTML = `<div class="wa">
      <div class="wa-bar">
        <span class="wa-banner">ⓘ 이 애플리케이션은 Google이 아닌 다른 사용자가 만들었습니다. <u>신고</u> · <u>자세히 알아보기</u></span>
        <span class="wa-tools">
          ${sample ? '' : `<button class="wa-btn ${S.L.devOpen ? 'on' : ''}" data-act="devtoggle" data-hint="webapp-devtools">🔍 API 통신 보기</button>`}
        </span>
      </div>
      ${lastErr && !sample ? `<div class="wa-errnote">⚠ 웹앱에 오류가 표시되었어요. 오류 메시지를 복사해 생성형 AI에게 물어볼 수 있어요. <button class="wa-btn" data-act="copyerr" data-hint="webapp-copyerr">오류 메시지 복사</button></div>` : ''}
      <div class="wa-frame-wrap">${errorHtml || '<iframe class="wa-frame" title="웹앱"></iframe>'}</div>
      ${sample ? '' : devtools(S.L.devOpen)}
    </div>`;
    if (html != null && !errorHtml) {
      const fr = el.querySelector('.wa-frame');
      if (an.htmlLooksLikeGs) {
        // HTML 파일에 Code.gs 코드를 붙여 넣은 경우: 코드가 글자로 그대로 보임
        fr.srcdoc = `<pre style="white-space:pre-wrap;font:14px monospace;padding:12px">${esc(html)}</pre>`;
      } else {
        const fns = (an.fns || []).filter((f) => !f.endsWith('_') && f !== 'doGet');
        fr.srcdoc = inject(html, fns);
      }
      frames.set(fr, { an, sc, sample, tabId: ctx.tab.id });
      fr.addEventListener('load', () => {
        frames.set(fr, { an, sc, sample, tabId: ctx.tab.id });
      });
    }
    el.onclick = async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) return;
      const act = a.dataset.act;
      if (act === 'devtoggle' || act === 'devclose') {
        S.L.devOpen = act === 'devtoggle' ? !S.L.devOpen : false;
        el.querySelector('.wa-dev').classList.toggle('hidden', !S.L.devOpen);
        const b = el.querySelector('[data-act="devtoggle"]');
        if (b) b.classList.toggle('on', S.L.devOpen);
        if (S.L.devOpen) emit('devtools:open');
      }
      if (act === 'devsel') {
        el.querySelectorAll('.wa-dev-item').forEach((x) => x.classList.toggle('on', x === a));
        el.querySelector('#wa-dev-detail').innerHTML = detail(S.L.apiLog[Number(a.dataset.i)]);
        emit('devtools:viewed', { i: Number(a.dataset.i) });
      }
      if (act === 'copyerr' && S.L.lastError) {
        await copyText(S.L.lastError.message);
        toast('오류 메시지를 복사했어요. Gemini 대화창에 붙여 넣어 보세요.', 'ok');
        emit('error:copied');
      }
    };
  },
});

// 웹앱 iframe과 서버 함수 연결
window.addEventListener('message', async (e) => {
  const d = e.data;
  if (!d || !(d.__gasCall || d.__gasTTS)) return;
  let info = null;
  let frameEl = null;
  frames.forEach((v, fr) => {
    if (fr.contentWindow === e.source) {
      info = v;
      frameEl = fr;
    }
  });
  if (!info) return;
  if (d.__gasTTS) {
    emit('app:tts', { text: d.text });
    return;
  }
  const reply = (msg) => {
    try {
      e.source.postMessage(Object.assign({ __gasReply: true, id: d.id }, msg), '*');
    } catch (err) {
      /* 창이 닫힘 */
    }
  };
  if (info.sample) {
    emit('sample:call');
    setTimeout(() => reply({ ok: true, result: FIXED_QUIZ.map((q) => ({ emoji: q.emoji, hint: q.hint, answer: q.title, choices: q.choices })) }), 400);
    return;
  }
  try {
    const result = await runServer(info.an, d.fn, d.args, info.sc);
    reply({ ok: true, result });
  } catch (err) {
    reply({ ok: false, error: err.message });
  }
  refreshChrome(frameEl);
});

// 오류 안내 줄과 API 통신 창만 새로 그리기 (iframe은 그대로)
function refreshChrome(frameEl) {
  if (!frameEl) return;
  const view = frameEl.closest('.br-view');
  if (!view) return;
  const wa = view.querySelector('.wa');
  const note = wa.querySelector('.wa-errnote');
  if (S.L.lastError && !note) {
    wa.querySelector('.wa-bar').insertAdjacentHTML('afterend', `<div class="wa-errnote">⚠ 웹앱에 오류가 표시되었어요. 오류 메시지를 복사해 생성형 AI에게 물어볼 수 있어요. <button class="wa-btn" data-act="copyerr" data-hint="webapp-copyerr">오류 메시지 복사</button></div>`);
  } else if (!S.L.lastError && note) note.remove();
}

on((evt) => {
  if (evt !== 'api:log') return;
  document.querySelectorAll('.wa-dev').forEach((dev) => {
    const open = !dev.classList.contains('hidden');
    const tmp = document.createElement('div');
    tmp.innerHTML = devtools(open);
    dev.replaceWith(tmp.firstElementChild);
  });
});
