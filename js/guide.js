// 왼쪽 실습 안내 패널: 단계 진행, 힌트, 활동지, 보고서
import { S, emit, on, save } from './state.js';
import { esc, toast, copyText, $ } from './util.js';
import { buildMission, setCurrentStepId, inlineFix, subjectName } from './missions.js';
import { LESSONS, PROVIDERS } from './config.js';
import { openTab, activate } from './browser.js';
import { SAMPLE_ID } from './sites/webapp.js';
import { mainScript, execUrl } from './store.js';
import { SUBJECTS } from './data/subjects.js';

let steps = [];
let root = null;
let evalTimer = 0;

export function mountGuide(el) {
  root = el;
  steps = buildMission();
  evaluate(true);
  root.addEventListener('click', onClick);
  root.addEventListener('input', onInput);
  root.addEventListener('change', onInput);
}

function current() {
  return steps[S.L.stepIndex] || null;
}

function snap(step) {
  S.L.stepSnap = S.L.stepSnap || {};
  if (!S.L.stepSnap[step.id]) S.L.stepSnap[step.id] = Object.assign({}, S.L.flags);
}

// 현재 단계가 끝났는지 확인하고 다음 단계로 넘어갑니다.
function evaluate(first = false) {
  let moved = false;
  let guard = 0;
  while (guard++ < 80) {
    const st = current();
    if (!st) break;
    setCurrentStepId(st.id);
    snap(st);
    if (st.active && !st.active()) {
      S.L.done[st.id] = 'skip';
      S.L.stepIndex++;
      continue;
    }
    let ok = false;
    try {
      ok = !!st.done();
    } catch (e) {
      ok = false;
    }
    if (!ok) break;
    S.L.done[st.id] = Date.now();
    if (st.onDone) st.onDone();
    if (!first) toast(`✔ ${esc(st.title)}`, 'ok', 2200);
    S.L.stepIndex++;
    moved = true;
  }
  const st = current();
  if (st) setCurrentStepId(st.id);
  save();
  render();
  if (moved) {
    const card = root && root.querySelector('.g-cur');
    if (card) card.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function scheduleEval() {
  clearTimeout(evalTimer);
  evalTimer = setTimeout(() => evaluate(), 60);
}

// 이벤트를 단계 판정용 이벤트로 바꾸기
on((evt, p) => {
  if (!S.L) return;
  if (evt === 'editor:line' && /\bprompt\b/.test(p.text || '') && /const\s+prompt|prompt\s*=/.test(p.text)) emit('editor:line:prompt');
  if (evt === 'app:feature' && p.feature) emit('app:feature:' + p.feature);
  if (evt === 'app:error') {
    if (!S.L.lastErrorOpen) {
      S.L.stepSnap = S.L.stepSnap || {};
      S.L.stepSnap['fix-inline'] = Object.assign({}, S.L.flags);
    }
    S.L.lastErrorOpen = true;
    S.L.fixKind = S.L.lastError ? S.L.lastError.kind : 'other';
    S.L.fixResolved = false;
  }
  if (evt === 'app:success') {
    S.L.fixResolved = true;
    S.L.lastErrorOpen = false;
  }
  scheduleEval();
});

function stagesHTML() {
  const groups = [];
  steps.forEach((s, i) => {
    let g = groups[groups.length - 1];
    if (!g || g.stage !== s.stage) {
      g = { stage: s.stage, items: [] };
      groups.push(g);
    }
    g.items.push({ s, i });
  });
  const idx = S.L.stepIndex;
  return groups
    .map((g) => {
      const doneAll = g.items.every(({ i }) => i < idx);
      const hasCur = g.items.some(({ i }) => i === idx);
      return `<div class="g-stage ${doneAll ? 'done' : ''} ${hasCur ? 'cur' : ''}">
      <div class="g-stage-h">${doneAll ? '✅' : hasCur ? '▶' : '○'} ${esc(g.stage)}</div>
      ${hasCur || (!doneAll && g.items[0].i < idx) ? `<ol class="g-steps">${g.items
        .map(({ s, i }) => {
          if (S.L.done[s.id] === 'skip') return '';
          if (i < idx) return `<li class="g-done">✔ ${esc(s.title)}</li>`;
          if (i === idx) return stepCard(s, i);
          return `<li class="g-next">${esc(s.title)}</li>`;
        })
        .join('')}</ol>` : ''}
    </div>`;
    })
    .join('');
}

function worksheetHTML(st) {
  if (!st.worksheet) return '';
  const w = S.L.worksheet;
  return `<div class="ws">${st.worksheet
    .map((f) => {
      if (f.type === 'select')
        return `<label class="ws-l">${esc(f.label)}<select class="ws-in" data-ws="${f.key}">${f.options.map(([v, t]) => `<option value="${v}" ${w[f.key] === v ? 'selected' : ''}>${t}</option>`).join('')}</select></label>`;
      const ex = f.example ? f.example(w) : '';
      return `<label class="ws-l">${esc(f.label)}<textarea class="ws-in" data-ws="${f.key}" rows="2">${esc(w[f.key] || '')}</textarea>${ex ? `<button class="ws-ex" data-gact="example" data-k="${f.key}">예시 넣기</button>` : ''}</label>`;
    })
    .join('')}</div>`;
}

function stepCard(st, i) {
  const html = typeof st.html === 'function' ? st.html() : st.html || '';
  return `<li class="g-cur" data-step="${st.id}">
    <div class="g-cur-h"><span class="g-num">${countVisible(i)}</span><b>${esc(st.title)}</b></div>
    <div class="g-body">${html}${worksheetHTML(st)}${st.extra ? st.extra() : ''}</div>
    <div class="g-acts">
      ${st.action ? `<button class="gbtn" data-gact="${st.action.run}">${esc(st.action.label)}</button>` : ''}
      ${st.confirm ? `<button class="gbtn" data-gact="confirm">${esc(st.confirm)}</button>` : ''}
      ${st.hint ? `<button class="gbtn ghost" data-gact="hint">💡 힌트 보기</button>` : ''}
      ${st.skip ? `<button class="gbtn ghost small" data-gact="skip">${esc(st.skip)}</button>` : ''}
    </div>
  </li>`;
}

function countVisible(i) {
  let n = 0;
  for (let k = 0; k <= i; k++) if (S.L.done[steps[k].id] !== 'skip') n++;
  return n;
}

function inlineFixHTML() {
  const st = current();
  if (!S.L.lastError || !st || st.id === 'fix') return '';
  setCurrentStepId('fix-inline');
  const f = inlineFix();
  const html = f.html();
  setCurrentStepId(st.id);
  return `<div class="g-fix"><div class="g-fix-h">⚠ 웹앱에서 오류가 났어요</div>${html}<div class="g-acts"><button class="gbtn ghost" data-gact="fixhint">💡 힌트 보기</button></div></div>`;
}

function render() {
  if (!root) return;
  const L = LESSONS[S.lesson];
  const Pv = PROVIDERS[S.provider];
  const total = steps.filter((s) => S.L.done[s.id] !== 'skip').length;
  const doneN = steps.filter((s, i) => i < S.L.stepIndex && S.L.done[s.id] !== 'skip').length;
  const pct = Math.round((doneN / Math.max(1, total - 1)) * 100);
  const scroll = root.querySelector('.g-scroll');
  const st = scroll ? scroll.scrollTop : 0;
  const ae = document.activeElement && root.contains(document.activeElement) ? document.activeElement : null;
  const focus = ae ? ae.dataset.ws || (ae.id ? '#' + ae.id : null) : null;
  const selPos = ae && ae.selectionStart != null ? [ae.selectionStart, ae.selectionEnd] : null;
  root.innerHTML = `<div class="g">
    <div class="g-head" style="--lc:${L.color}">
      <div class="g-lesson">${esc(L.id)}. ${esc(L.title)}</div>
      <div class="g-meta"><span class="g-prov ${S.provider}">${esc(Pv.name)}</span>${S.lesson === '3-7' && S.L.worksheet.subject ? `<span class="g-prov subj">${esc(subjectName())}</span>` : ''}<span>${doneN} / ${total - 1} 단계</span></div>
      <div class="g-bar"><span style="width:${Math.min(100, pct)}%"></span></div>
    </div>
    <div class="g-scroll">${inlineFixHTML()}${stagesHTML()}</div>
    <div class="g-foot"><button class="gbtn ghost small" data-gact="report">📄 실습 보고서</button><button class="gbtn ghost small" data-gact="clip">📋 클립보드 확인</button></div>
  </div>`;
  const sc2 = root.querySelector('.g-scroll');
  if (sc2) sc2.scrollTop = st;
  if (focus) {
    const el = focus.startsWith('#') ? root.querySelector(focus) : root.querySelector(`[data-ws="${focus}"]`);
    if (el) {
      el.focus();
      if (el.setSelectionRange && selPos) el.setSelectionRange(selPos[0], selPos[1]);
    }
  }
}

function onInput(e) {
  const t = e.target;
  if (t.dataset.ws) {
    S.L.worksheet[t.dataset.ws] = t.value;
    save();
    if (t.tagName === 'SELECT' && e.type === 'change') render();
  }
  if (t.id === 'g-prompt' && S.lesson === '3-7' && current() && current().id === 'gm-prompt') {
    // 가운데 부분만 따로 저장
    const lines = t.value.split('\n');
    if (lines.length >= 3) S.L.worksheet.promptMid = lines.slice(1, -1).join('\n');
    save();
  }
}

/* ---------------- 힌트 ---------------- */
function findTarget(ids) {
  for (const id of ids) {
    let els;
    if (id.startsWith('css:')) els = Array.from(document.querySelectorAll(`.br-view:not([style*="none"]) ${id.slice(4)}, .pop-wrap ${id.slice(4)}`));
    else els = Array.from(document.querySelectorAll(`[data-hint="${id}"]`));
    const el = els.find((x) => {
      if (!x.getClientRects().length) return false;
      const view = x.closest('.br-view');
      if (view && view.style.display === 'none') return false;
      return true;
    });
    if (el) return el;
  }
  return null;
}

export function showHint(hint) {
  const ids = typeof hint === 'function' ? hint() : hint;
  const el = findTarget(ids || []);
  document.querySelectorAll('.hint-glow').forEach((x) => x.classList.remove('hint-glow'));
  document.querySelectorAll('.hint-tag').forEach((x) => x.remove());
  if (!el) {
    toast('먼저 안내에 나온 사이트 탭으로 이동해 보세요. 탭이 없다면 ＋ 버튼으로 새 탭을 열고 주소를 입력하세요.', 'info', 4200);
    const plus = document.querySelector('[data-hint="browser-newtab"]');
    if (plus) glow(plus);
    return;
  }
  glow(el);
}

function glow(el) {
  el.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'smooth' });
  el.classList.add('hint-glow');
  const r = el.getBoundingClientRect();
  const tag = document.createElement('div');
  tag.className = 'hint-tag';
  tag.textContent = '여기를 확인하세요';
  document.body.appendChild(tag);
  const place = () => {
    const rr = el.getBoundingClientRect();
    tag.style.left = Math.max(8, Math.min(window.innerWidth - 150, rr.left + rr.width / 2 - 70)) + 'px';
    tag.style.top = (rr.top > 60 ? rr.top - 36 : rr.bottom + 8) + 'px';
  };
  place();
  setTimeout(place, 350);
  setTimeout(() => {
    el.classList.remove('hint-glow');
    tag.remove();
  }, 4200);
  void r;
}

/* ---------------- 버튼 처리 ---------------- */
async function onClick(e) {
  const qa = e.target.closest('[data-qa]');
  if (qa) {
    const q = qa.dataset.qa;
    const v = qa.dataset.v;
    S.L.worksheet['q' + q] = v;
    const right = (q === 'speech' && v === 'no') || (q === 'ai' && v === 'yes');
    const box = qa.closest('.quiz-mini');
    box.querySelector('.qres').textContent = right ? '⭕ 정답!' : '❌ 다시 생각해 보세요';
    box.querySelectorAll('button').forEach((b) => b.classList.toggle('sel', b === qa));
    emit('ws:quiz');
    return;
  }
  const a = e.target.closest('[data-gact]');
  if (!a) return;
  const act = a.dataset.gact;
  const st = current();
  if (act === 'hint' && st) showHint(st.hint);
  if (act === 'fixhint') {
    setCurrentStepId('fix-inline');
    const f = inlineFix();
    showHint(f.hint);
    setCurrentStepId(st && st.id);
  }
  if (act === 'confirm' && st) {
    if (st.worksheet) {
      const missing = st.worksheet.filter((f) => !String(S.L.worksheet[f.key] || '').trim());
      if (missing.length && st.id !== 'think-answer') {
        toast(`'${esc(missing[0].label)}' 칸을 채워 주세요.`, 'error');
        return;
      }
    }
    emit('ws:confirm:' + st.id);
  }
  if (act === 'skip' && st) {
    S.L.done[st.id] = 'skip';
    S.L.stepIndex++;
    save();
    evaluate();
  }
  if (act === 'example') {
    const f = st.worksheet.find((x) => x.key === a.dataset.k);
    const v = f.example(S.L.worksheet);
    if (!v) {
      toast('먼저 과목을 선택해 주세요.');
      return;
    }
    S.L.worksheet[f.key] = v;
    save();
    render();
  }
  if (act === 'copyPrompt') {
    const ta = root.querySelector('#g-prompt');
    await copyText(ta.value);
    a.textContent = '✓ 복사됨';
    toast('프롬프트를 복사했어요. Gemini 입력창에 붙여 넣으세요. (Ctrl+V)', 'ok');
    emit('guide:promptCopied');
  }
  if (act === 'openSample') {
    const url = `https://script.google.com/macros/s/${SAMPLE_ID}/exec`;
    const ex = S.L.browser.tabs.find((t) => t.url === url);
    if (ex) activate(ex.id);
    else openTab(url);
  }
  if (act === 'report') openReport();
  if (act === 'clip') {
    let txt = '';
    try {
      txt = await navigator.clipboard.readText();
    } catch (err) {
      txt = null;
    }
    toast(txt == null ? '브라우저가 클립보드 읽기를 허용하지 않았어요.' : txt ? `클립보드: ${esc(txt.slice(0, 60))}${txt.length > 60 ? '...' : ''}` : '클립보드가 비어 있어요.', 'info', 3600);
  }
}

/* ---------------- 실습 보고서 ---------------- */
export function openReport() {
  const L = LESSONS[S.lesson];
  const w = S.L.worksheet;
  const sc = mainScript();
  const dep = sc && sc.deployments.length ? sc.deployments[sc.deployments.length - 1] : null;
  const prompts = S.L.chat.messages.filter((m) => m.role === 'user').map((m) => m.text);
  const doneSteps = steps.filter((s, i) => i < S.L.stepIndex && S.L.done[s.id] !== 'skip');
  const labels = { t1: '몇 문제가 나오나요?', t2: '문제는 언제 만들어졌을까요?', t3: '다시 시작하면 문제가 바뀔까요?', t4: '즉석에서 문제를 생성할 수 있을까요?', need: '도움이 필요한 내용', difficulty: '누가, 어떤 상황에서, 어떤 어려움?', solution: '어떤 웹앱이 문제를 개선할까?', purpose: '목적', core: '핵심 기능', io: '입력과 출력', constraint: '제약 조건', myidea: '추가하고 싶은 기능' };
  const wsRows = Object.entries(labels)
    .filter(([k]) => w[k])
    .map(([k, t]) => `<tr><th>${esc(t)}</th><td>${esc(w[k])}</td></tr>`)
    .join('');
  const wrap = document.createElement('div');
  wrap.className = 'rep-wrap';
  wrap.innerHTML = `<div class="rep">
    <div class="rep-h"><h2>실습 보고서</h2><div><button class="gbtn" data-r="print">🖨 인쇄</button> <button class="gbtn ghost" data-r="x">닫기</button></div></div>
    <div class="rep-b" id="rep-print">
      <h1>${esc(L.id)}. ${esc(L.title)}</h1>
      <p class="rep-meta">이름: ${esc(S.L.studentName || '')} · 사용 API: ${esc(PROVIDERS[S.provider].name)}${S.lesson === '3-7' && w.subject ? ` · 과목: ${esc(subjectName())}` : ''} · 진행: ${doneSteps.length} / ${steps.filter((s) => S.L.done[s.id] !== 'skip').length - 1} 단계</p>
      ${wsRows ? `<h3>활동지</h3><table class="rep-t">${wsRows}</table>` : ''}
      <h3>내가 보낸 프롬프트</h3>${prompts.length ? `<ol>${prompts.map((p) => `<li><pre>${esc(p)}</pre></li>`).join('')}</ol>` : '<p>아직 없어요.</p>'}
      <h3>웹앱</h3>${dep ? `<p>프로젝트: ${esc(sc.name)} · 배포 버전 ${dep.version}<br><code>${esc(execUrl(dep))}</code></p>` : '<p>아직 배포하지 않았어요.</p>'}
      <h3>API 호출 기록</h3><p>성공 ${S.L.apiLog.filter((l) => l.status === 200).length}회 · 실패 ${S.L.apiLog.filter((l) => typeof l.status === 'number' && l.status !== 200).length}회</p>
      <h3>완료한 단계</h3><ol class="rep-steps">${doneSteps.map((s) => `<li>${esc(s.title)}</li>`).join('')}</ol>
      <p class="rep-foot">이 보고서는 교육용 시뮬레이션에서 만든 기록입니다. 실제 API 키와 주소는 포함되어 있지 않습니다.</p>
    </div></div>`;
  document.body.appendChild(wrap);
  wrap.onclick = (e) => {
    const b = e.target.closest('[data-r]');
    if (e.target === wrap || (b && b.dataset.r === 'x')) wrap.remove();
    if (b && b.dataset.r === 'print') {
      document.body.classList.add('printing');
      window.print();
      setTimeout(() => document.body.classList.remove('printing'), 500);
    }
  };
}

export function allSteps() {
  return steps;
}
export function jumpTo(i) {
  S.L.stepIndex = Math.max(0, Math.min(steps.length - 1, i));
  for (let k = 0; k < S.L.stepIndex; k++) if (!S.L.done[steps[k].id]) S.L.done[steps[k].id] = 'skip';
  save();
  evaluate();
}
export const _q = $;
export const _s = SUBJECTS;
