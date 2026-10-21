// 시작 화면과 작업 화면
import { S, loadLesson, hasSavedLesson, loadAccount, resetAll, resetAccount, save, emit } from './state.js';
import { LESSONS, PROVIDERS, MODELS } from './config.js';
import { esc, toast, $ } from './util.js';
import { mountBrowser } from './browser.js';
import { mountGuide, allSteps, jumpTo, openReport } from './guide.js';
import './sites/basic.js';
import './sites/drive.js';
import './sites/sheets.js';
import './sites/aistudio.js';
import './sites/openai.js';
import './sites/gemini.js';
import './sites/appsscript.js';
import './sites/webapp.js';

const app = $('#app');
let choice = { lesson: '3-5', provider: 'gemini' };
try {
  const c = JSON.parse(localStorage.getItem('apisim:v1:last') || 'null');
  if (c) choice = c;
} catch (e) {
  /* 무시 */
}

function landing() {
  loadAccount();
  document.body.className = 'is-landing';
  const savedName = (() => {
    try {
      return localStorage.getItem('apisim:v1:name') || '';
    } catch (e) {
      return '';
    }
  })();
  app.innerHTML = `<div class="land">
    <header class="land-h">
      <div class="land-badge">교재 3-5 · 3-6 · 3-7 실습</div>
      <h1>생성형 AI API 웹앱 실습 시뮬레이터</h1>
      <p>API 키 발급부터 Apps Script 웹앱 배포, 오류 해결까지 실제와 같은 화면에서 따라 해 봐요.<br>실제 사이트에 접속하거나 결제하지 않고, 진짜 API 키도 필요 없어요.</p>
    </header>
    <section class="land-sec">
      <h2><span>1</span> 실습할 차시를 고르세요</h2>
      <div class="land-lessons">${Object.values(LESSONS)
        .map(
          (l) => `<button class="lcard ${choice.lesson === l.id ? 'on' : ''}" data-lesson="${l.id}" style="--lc:${l.color}">
          <div class="lcard-n">${l.id}</div><div class="lcard-t">${esc(l.title)}</div><p>${esc(l.desc)}</p>
          <div class="lcard-terms">${l.terms.map((t) => `<span>${esc(t)}</span>`).join('')}</div></button>`
        )
        .join('')}</div>
    </section>
    <section class="land-sec">
      <h2><span>2</span> 웹앱에서 사용할 생성형 AI API를 고르세요</h2>
      <div class="land-provs">${Object.values(PROVIDERS)
        .map(
          (p) => `<button class="pcard ${choice.provider === p.id ? 'on' : ''}" data-prov="${p.id}" style="--pc:${p.color}">
          <div class="pcard-h"><span class="pcard-ico ${p.id}">${p.id === 'gemini' ? '✦' : '◍'}</span><b>${esc(p.name)}</b><small>${esc(p.company)}</small></div>
          <dl><dt>키 발급 사이트</dt><dd>${esc(p.site)}</dd><dt>스크립트 속성 이름</dt><dd><code>${esc(p.keyProp)}</code></dd><dt>키 모양</dt><dd>${esc(p.keyLooks)}</dd><dt>요금</dt><dd>${esc(p.priceNote)}</dd><dt>학생 사용</dt><dd>${esc(p.ageNote)}</dd><dt>사용 모델</dt><dd><code>${esc(MODELS[p.id].current)}</code></dd></dl></button>`
        )
        .join('')}</div>
    </section>
    <section class="land-sec">
      <h2><span>3</span> 이름(별명)을 입력하고 시작하세요</h2>
      <div class="land-start">
        <input id="land-name" maxlength="12" placeholder="예: 김정보" value="${esc(savedName)}">
        <div class="land-btns" id="land-btns"></div>
      </div>
      <p class="land-note">🔒 이 화면은 교육용 시뮬레이션이에요. 실제 비밀번호, 결제 정보, 진짜 API 키는 어디에도 입력하지 마세요. 입력한 내용은 이 브라우저에만 저장됩니다.</p>
    </section>
    <footer class="land-f"><button class="linkbtn" data-act="resetall">모든 실습 기록 지우기</button></footer>
  </div>`;
  const drawBtns = () => {
    const has = hasSavedLesson(choice.lesson, choice.provider);
    $('#land-btns').innerHTML = has
      ? `<button class="bigbtn" data-act="continue">이어서 하기 ▶</button><button class="bigbtn ghost" data-act="fresh">처음부터 다시</button>`
      : `<button class="bigbtn" data-act="fresh">실습 시작하기 ▶</button>`;
  };
  drawBtns();
  app.onclick = (e) => {
    const l = e.target.closest('[data-lesson]');
    const p = e.target.closest('[data-prov]');
    const a = e.target.closest('[data-act]');
    if (l) {
      choice.lesson = l.dataset.lesson;
      app.querySelectorAll('.lcard').forEach((x) => x.classList.toggle('on', x === l));
      drawBtns();
    }
    if (p) {
      choice.provider = p.dataset.prov;
      app.querySelectorAll('.pcard').forEach((x) => x.classList.toggle('on', x === p));
      drawBtns();
    }
    if (!a) return;
    const name = $('#land-name').value.trim();
    try {
      localStorage.setItem('apisim:v1:name', name);
      localStorage.setItem('apisim:v1:last', JSON.stringify(choice));
    } catch (err) {
      /* 무시 */
    }
    if (a.dataset.act === 'continue') start(false, name);
    if (a.dataset.act === 'fresh') start(true, name);
    if (a.dataset.act === 'resetall') {
      if (confirmBox('모든 차시의 실습 기록과 발급한 시뮬레이션 키를 지울까요?', () => {
        resetAll();
        landing();
        toast('모든 기록을 지웠어요.');
      }));
    }
  };
}

function confirmBox(msg, ok) {
  const w = document.createElement('div');
  w.className = 'rep-wrap';
  w.innerHTML = `<div class="cbox"><p>${esc(msg)}</p><div class="row end"><button class="gbtn ghost" data-c="n">취소</button><button class="gbtn danger" data-c="y">확인</button></div></div>`;
  document.body.appendChild(w);
  w.onclick = (e) => {
    const b = e.target.closest('[data-c]');
    if (e.target === w || b) w.remove();
    if (b && b.dataset.c === 'y') ok();
  };
  return true;
}

function start(fresh, name) {
  loadLesson(choice.lesson, choice.provider, { fresh });
  if (name) S.L.studentName = name;
  save();
  workspace();
}

function workspace() {
  document.body.className = 'is-work';
  const L = LESSONS[S.lesson];
  app.innerHTML = `<div class="ws-app">
    <header class="top">
      <button class="top-home" data-act="home" title="처음 화면">⌂</button>
      <div class="top-t"><b>API 웹앱 실습 시뮬레이터</b><span>${esc(L.id)} ${esc(L.title)}</span></div>
      <div class="top-r">
        <span class="top-sim">교육용 시뮬레이션 화면 · 실제 사이트가 아니에요</span>
        <button class="gbtn ghost small" data-act="toggle" title="안내 패널 접기/펴기">☰ 안내</button>
        <button class="gbtn ghost small" data-act="teacher">⚙ 설정</button>
      </div>
    </header>
    <div class="work">
      <aside class="guide" id="guide"></aside>
      <section class="browser" id="browser"></section>
    </div>
  </div>`;
  mountBrowser($('#browser'));
  mountGuide($('#guide'));
  app.onclick = (e) => {
    const a = e.target.closest('.top [data-act]');
    if (!a) return;
    if (a.dataset.act === 'home') landing();
    if (a.dataset.act === 'toggle') document.body.classList.toggle('guide-closed');
    if (a.dataset.act === 'teacher') teacher();
  };
}

function teacher() {
  const steps = allSteps();
  const w = document.createElement('div');
  w.className = 'rep-wrap';
  w.innerHTML = `<div class="rep small">
    <div class="rep-h"><h2>⚙ 설정 (선생님용)</h2><button class="gbtn ghost" data-t="x">닫기</button></div>
    <div class="rep-b">
      <label class="tset"><input type="checkbox" id="t-debug" ${S.L.settings.debugScenario ? 'checked' : ''}> 처음 만든 코드에 <b>서비스가 끝난 모델</b>을 넣어 오류 해결 과정 체험하기 <small>(3-5 기본 켜짐)</small></label>
      <label class="tset">학생 이름 <input id="t-name" value="${esc(S.L.studentName || '')}" maxlength="12"></label>
      <h3>단계로 이동하기</h3>
      <select id="t-step" class="ws-in">${steps.map((s, i) => `<option value="${i}" ${i === S.L.stepIndex ? 'selected' : ''}>${i + 1}. [${esc(s.stage)}] ${esc(s.title)}</option>`).join('')}</select>
      <p class="sub">앞 단계를 건너뛰면 그 단계에서 만들어야 할 화면(키, 파일 등)은 직접 만들어야 해요.</p>
      <div class="row"><button class="gbtn" data-t="jump">이 단계로 이동</button></div>
      <h3>초기화</h3>
      <div class="row"><button class="gbtn ghost" data-t="resetLesson">이 차시 처음부터</button><button class="gbtn ghost" data-t="resetKeys">발급한 키, 계정 상태 지우기</button></div>
      <h3>도움말</h3>
      <ul class="sub"><li>복사는 실제 클립보드를 사용해요. 붙여 넣을 때는 <kbd>Ctrl</kbd>+<kbd>V</kbd>를 쓰세요.</li><li>진행 상황은 이 브라우저에 자동 저장돼요. 다른 컴퓨터로 옮겨지지는 않아요.</li><li>Gemini 대화는 교재 실습 프롬프트에 맞춰 준비된 답을 보여 줘요. 생성되는 코드는 실제 Apps Script에서도 동작하도록 만든 코드예요.</li></ul>
    </div></div>`;
  document.body.appendChild(w);
  w.onclick = (e) => {
    const b = e.target.closest('[data-t]');
    if (e.target === w || (b && b.dataset.t === 'x')) {
      S.L.settings.debugScenario = w.querySelector('#t-debug').checked;
      S.L.studentName = w.querySelector('#t-name').value.trim();
      save();
      w.remove();
      emit('settings');
      return;
    }
    if (!b) return;
    if (b.dataset.t === 'jump') {
      jumpTo(Number(w.querySelector('#t-step').value));
      w.remove();
    }
    if (b.dataset.t === 'resetLesson') {
      w.remove();
      confirmBox('이 차시의 진행 기록을 지우고 처음부터 시작할까요? (발급한 키는 남아 있어요)', () => start(true, S.L.studentName));
    }
    if (b.dataset.t === 'resetKeys') {
      w.remove();
      confirmBox('AI Studio, OpenAI 로그인 상태와 발급한 시뮬레이션 키를 모두 지울까요?', () => {
        resetAccount();
        start(true, S.L.studentName);
      });
    }
  };
}

window.addEventListener('beforeprint', () => {
  if (!document.querySelector('.rep-wrap')) openReport();
});

landing();
