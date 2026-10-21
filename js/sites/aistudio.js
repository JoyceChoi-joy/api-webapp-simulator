// Google AI Studio (시뮬레이션)
import { registerSite } from '../browser.js';
import { S, emit } from '../state.js';
import { esc, makeGeminiKey, maskKey, copyText, siteModal, toast, today, randStr } from '../util.js';
import { MODELS, RATE_LIMIT } from '../config.js';
import { googleSignIn, accountName } from './accounts.js';

const G = () => S.account.google;

function shell(ctx, page, inner) {
  const n = accountName();
  const nav = [
    ['/prompts/new_chat', '💬', '플레이그라운드', 'chat'],
    ['/build', '🛠', '빌드', 'build'],
  ];
  const dash = [
    ['/apikey', 'API 키', 'apikey', 'aistudio-nav-apikey'],
    ['/projects', '프로젝트', 'projects', ''],
    ['/usage', '사용량 및 비율 제한', 'usage', ''],
  ];
  return `<div class="ai">
    <header class="ai-top">
      <div class="ai-brand"><span class="ai-spark">✦</span> Google AI Studio</div>
      <div class="ai-top-r">
        <button class="ai-getkey" data-act="go" data-url="/apikey" data-hint="aistudio-getkey">🔑 Get API key</button>
        <span class="ai-av" title="${esc(n)}">${esc(n.slice(0, 1))}</span>
      </div>
    </header>
    <div class="ai-body">
      <aside class="ai-side">
        ${nav.map((x) => `<a class="ai-nav ${page === x[3] ? 'on' : ''}" data-act="go" data-url="${x[0]}">${x[1]} ${x[2]}</a>`).join('')}
        <div class="ai-group" data-hint="aistudio-dashboard">📊 Dashboard</div>
        ${dash.map((x) => `<a class="ai-nav sub ${page === x[2] ? 'on' : ''}" data-act="go" data-url="${x[0]}" ${x[3] ? `data-hint="${x[3]}"` : ''}>${x[1]}</a>`).join('')}
        <a class="ai-nav" data-act="doc">📘 문서</a>
        <div class="ai-side-foot">이 화면은 실습용 시뮬레이션입니다.</div>
      </aside>
      <main class="ai-main">${inner}</main>
    </div>
  </div>`;
}

function landing() {
  return `<div class="ai ai-land">
    <header class="ai-top"><div class="ai-brand"><span class="ai-spark">✦</span> Google AI Studio</div>
      <div class="ai-top-r"><button class="ai-btn ghost" data-act="signin">로그인</button></div></header>
    <div class="ai-hero">
      <h1>Gemini로 아이디어를<br>가장 빠르게 만들어 보세요</h1>
      <p>Google AI Studio는 제미나이 모델을 자유롭게 테스트해 보고 API 키를 만들 수 있는 개발자 도구입니다.</p>
      <button class="ai-btn big" data-act="signin" data-hint="aistudio-signin">Google AI Studio 시작하기</button>
    </div>
  </div>`;
}

function termsModal(el, onOk) {
  const m = siteModal(
    el,
    `<div class="ai-terms">
      <h2>Google AI Studio에 오신 것을 환영합니다</h2>
      <p>시작하기 전에 아래 내용을 확인해 주세요.</p>
      <label><input type="checkbox" id="t1" data-hint="aistudio-terms-check"> <span><u>Google API 서비스 약관</u> 및 <u>Gemini API 추가 서비스 약관</u>에 동의하며 <u>Google 개인정보처리방침</u>을 읽었음을 확인합니다. <b>(필수)</b></span></label>
      <label><input type="checkbox" id="t2"> <span>새로운 기능, 연구 참여 기회, 맞춤 소식을 이메일로 받습니다. (선택)</span></label>
      <div class="ai-terms-note">무료 등급에서 입력한 내용은 서비스 개선에 활용될 수 있으니 개인 정보를 입력하지 마세요.</div>
      <div class="ai-row end"><button class="ai-btn" id="tok" disabled data-hint="aistudio-terms-ok">계속</button></div>
    </div>`,
    'sticky ai-modal'
  );
  const c = m.box.querySelector('#t1');
  const b = m.box.querySelector('#tok');
  c.onchange = () => (b.disabled = !c.checked);
  b.onclick = () => {
    m.close();
    onOk();
  };
}

function apikeyPage() {
  const keys = G().keys.filter((k) => !k.revoked);
  return `<div class="ai-page">
    <div class="ai-head"><div><h1>API 키</h1><p class="ai-muted">Gemini API를 호출할 때 사용하는 키를 만들고 관리합니다.</p></div>
      <button class="ai-btn" data-act="create" data-hint="aistudio-create">＋ API 키 만들기</button></div>
    <div class="ai-banner">🔒 API 키는 비밀번호와 같아요. 다른 사람에게 알려 주거나 코드에 직접 넣지 마세요.</div>
    ${
      keys.length
        ? `<table class="ai-table"><thead><tr><th>키</th><th>프로젝트</th><th>생성일</th><th>키 유형</th><th>할당량 등급</th><th></th></tr></thead><tbody>
      ${keys
        .map(
          (k) => `<tr data-act="detail" data-id="${k.id}" class="ai-krow">
        <td><b>${esc(k.name)}</b><br><code>...${esc(k.value.slice(-4))}</code></td><td>${esc(k.project)}</td><td>${esc(k.date)}</td>
        <td><span class="ai-chip">인증 키</span></td><td><span class="ai-chip free">무료 등급</span></td>
        <td class="ai-ops"><button class="ai-ico" data-act="copy" data-id="${k.id}" title="키 복사" data-hint="aistudio-rowcopy">⧉</button><button class="ai-ico" data-act="del" data-id="${k.id}" title="키 삭제">🗑</button></td></tr>`
        )
        .join('')}</tbody></table>`
        : `<div class="ai-empty"><div class="ai-empty-ico">🔑</div><h3>아직 API 키가 없습니다</h3><p>[API 키 만들기]를 눌러 첫 번째 키를 만들어 보세요.</p></div>`
    }
  </div>`;
}

function projectsPage() {
  const ps = G().projects;
  return `<div class="ai-page">
    <div class="ai-head"><div><h1>프로젝트</h1><p class="ai-muted">API 키는 Google Cloud 프로젝트에 연결됩니다. 사용량과 결제도 프로젝트 단위로 관리해요.</p></div>
      <div><button class="ai-btn ghost" data-act="import">프로젝트 가져오기</button> <button class="ai-btn" data-act="newproj">＋ 새 프로젝트 만들기</button></div></div>
    ${
      ps.length
        ? `<table class="ai-table"><thead><tr><th>프로젝트 이름</th><th>프로젝트 ID</th><th>결제 등급</th></tr></thead><tbody>
      ${ps.map((p) => `<tr><td><b>${esc(p.name)}</b></td><td><code>${esc(p.pid)}</code></td><td><span class="ai-chip free">무료 등급</span></td></tr>`).join('')}</tbody></table>`
        : `<div class="ai-empty"><h3>가져온 프로젝트가 없습니다</h3><p>새 프로젝트를 만들거나 Google Cloud Console의 프로젝트를 가져오세요.</p></div>`
    }
  </div>`;
}

function usagePage() {
  const used = G().usage || 0;
  const rows = [
    ['gemini-3.8-flash', '10', '250,000', '250'],
    ['gemini-3.6-flash', '10', '250,000', '250'],
    ['gemini-3.5-flash-lite', '15', '250,000', '1,000'],
    ['gemini-3.1-pro', '5', '125,000', '50'],
  ];
  return `<div class="ai-page">
    <h1>사용량 및 비율 제한</h1>
    <p class="ai-muted">무료 등급은 모델마다 분당 요청 수(RPM), 분당 토큰 수(TPM), 일일 요청 수(RPD)가 정해져 있어요. 한도를 넘으면 429 오류가 납니다.</p>
    <div class="ai-cards"><div class="ai-card"><small>오늘 보낸 요청</small><b>${used}</b></div><div class="ai-card"><small>현재 등급</small><b>무료 등급</b></div><div class="ai-card"><small>분당 요청 한도 (Flash)</small><b>${RATE_LIMIT.gemini}</b></div></div>
    <table class="ai-table"><thead><tr><th>모델</th><th>RPM</th><th>TPM</th><th>RPD</th></tr></thead><tbody>
    ${rows.map((r) => `<tr><td><code>${r[0]}</code></td><td>${r[1]}</td><td>${r[2]}</td><td>${r[3]}</td></tr>`).join('')}</tbody></table>
    <p class="ai-muted small">시뮬레이션용 예시 값입니다. 실제 한도는 AI Studio의 사용량 화면에서 확인하세요.</p>
  </div>`;
}

function playground() {
  return `<div class="ai-page ai-play">
    <div class="ai-model">모델: <b>${MODELS.gemini.current}</b> ▾</div>
    <h1 class="ai-hi">무엇을 만들어 볼까요?</h1>
    <div class="ai-prompt"><textarea placeholder="여기에 프롬프트를 입력하세요" id="ai-p"></textarea><button class="ai-btn" data-act="run">실행 ▶</button></div>
    <div id="ai-out"></div>
    <p class="ai-muted small">이 실습의 목표는 웹앱에서 쓸 API 키를 만드는 것이에요. 오른쪽 위 [Get API key]를 눌러 보세요.</p>
  </div>`;
}

function keyDetail(el, k, fresh) {
  const m = siteModal(
    el,
    `<div class="ai-kd">
      <h2>API 키 세부정보</h2>
      <dl><dt>이름</dt><dd>${esc(k.name)}</dd><dt>프로젝트</dt><dd>${esc(k.project)}</dd><dt>생성일</dt><dd>${esc(k.date)}</dd></dl>
      <div class="ai-keybox"><code>${esc(k.value)}</code></div>
      <p class="ai-muted small">${fresh ? '키가 만들어졌어요. ' : ''}이 키로 Gemini API를 호출할 수 있어요. 키가 노출되면 다른 사람이 내 할당량을 쓸 수 있으니 안전하게 보관하세요.</p>
      <div class="ai-row end"><button class="ai-btn ghost" data-act="x">닫기</button><button class="ai-btn" data-act="cp" data-hint="aistudio-copy">⧉ 키 복사</button></div>
    </div>`,
    'ai-modal'
  );
  m.box.onclick = async (e) => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    if (a.dataset.act === 'x') m.close();
    if (a.dataset.act === 'cp') {
      await copyText(k.value);
      a.textContent = '✓ 복사됨';
      toast('API 키를 클립보드에 복사했어요.', 'ok');
      emit('key:copied', { provider: 'gemini', id: k.id });
    }
  };
}

function createKeyModal(el, ctx) {
  const ps = G().projects;
  const m = siteModal(
    el,
    `<div class="ai-ck">
      <h2>새 키 만들기</h2>
      <label class="ai-lab">키 이름 지정</label>
      <input class="ai-in" id="kname" placeholder="예: 영화 퀴즈 키" value="" data-hint="aistudio-keyname">
      <p class="ai-muted small">💡 키 이름을 지정해 두면 나중에 키별로 사용량을 확인할 때 도움이 돼요.</p>
      <label class="ai-lab">가져온 프로젝트 선택</label>
      <select class="ai-in" id="kproj" data-hint="aistudio-project">
        <option value="">프로젝트 선택</option>
        ${ps.map((p) => `<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('')}
        <option value="__new">＋ 새 프로젝트 만들기</option>
      </select>
      <div id="newproj" class="hidden"><input class="ai-in" id="pname" value="Gemini Project" placeholder="새 프로젝트 이름"><button class="ai-btn ghost" id="pmake">프로젝트 만들기</button></div>
      ${ps.length ? '' : '<p class="ai-warn small">가져온 프로젝트가 없어요. [＋ 새 프로젝트 만들기]로 프로젝트를 먼저 만드세요. (실제로는 Google Cloud Console에서 만든 프로젝트를 가져올 수도 있어요.)</p>'}
      <div class="ai-row end"><button class="ai-btn ghost" data-act="cancel">취소</button><button class="ai-btn" id="kmake" disabled data-hint="aistudio-make">키 만들기</button></div>
    </div>`,
    'ai-modal'
  );
  const b = m.box;
  const sel = b.querySelector('#kproj');
  const mk = b.querySelector('#kmake');
  const refresh = () => (mk.disabled = !sel.value || sel.value === '__new');
  sel.onchange = () => {
    b.querySelector('#newproj').classList.toggle('hidden', sel.value !== '__new');
    refresh();
  };
  b.querySelector('#pmake').onclick = () => {
    const name = b.querySelector('#pname').value.trim() || 'Gemini Project';
    const btn = b.querySelector('#pmake');
    btn.disabled = true;
    btn.textContent = '프로젝트 만드는 중...';
    setTimeout(() => {
      const p = { name, pid: 'gen-lang-client-0' + randStr(9, '0123456789') };
      G().projects.push(p);
      sel.insertAdjacentHTML('afterbegin', '');
      const opt = document.createElement('option');
      opt.value = name;
      opt.textContent = name;
      sel.insertBefore(opt, sel.querySelector('option[value="__new"]'));
      sel.value = name;
      b.querySelector('#newproj').classList.add('hidden');
      const w = b.querySelector('.ai-warn');
      if (w) w.remove();
      refresh();
      emit('aistudio:project', { name });
      toast(`프로젝트 '${esc(name)}'를 만들었어요.`, 'ok');
    }, 900);
  };
  b.onclick = (e) => {
    const a = e.target.closest('[data-act]');
    if (a && a.dataset.act === 'cancel') m.close();
  };
  mk.onclick = () => {
    mk.disabled = true;
    mk.textContent = '키 만드는 중...';
    setTimeout(() => {
      const name = b.querySelector('#kname').value.trim() || 'Gemini API Key';
      const k = { id: 'k' + randStr(8), name, value: makeGeminiKey(), project: sel.value, date: today(), created: Date.now(), revoked: false, lesson: S.lesson };
      G().keys.push(k);
      m.close();
      emit('key:created', { provider: 'gemini', id: k.id });
      ctx.rerender();
      keyDetail(ctx.el, k, true);
    }, 1100);
  };
}

registerSite({
  id: 'aistudio',
  match: (u) => u.host === 'aistudio.google.com',
  title: (ctx) => {
    const p = ctx.url.pathname;
    if (p.startsWith('/apikey')) return 'API 키 | Google AI Studio';
    if (p.startsWith('/projects')) return '프로젝트 | Google AI Studio';
    if (p.startsWith('/usage')) return '사용량 | Google AI Studio';
    return 'Google AI Studio';
  },
  rerenderOnShow: true,
  render(el, ctx) {
    ctx.el = el;
    const g = G();
    if (!g.aistudioSignedIn) {
      el.innerHTML = landing();
      el.onclick = (e) => {
        const a = e.target.closest('[data-act="signin"]');
        if (!a) return;
        googleSignIn('Google AI Studio', () => {
          g.aistudioSignedIn = true;
          emit('aistudio:signin');
          ctx.rerender();
        });
      };
      return;
    }
    let p = ctx.url.pathname;
    if (p === '/' || p === '') p = '/prompts/new_chat';
    let page = 'chat';
    let inner = playground();
    if (p.startsWith('/apikey')) {
      page = 'apikey';
      inner = apikeyPage();
    } else if (p.startsWith('/projects')) {
      page = 'projects';
      inner = projectsPage();
    } else if (p.startsWith('/usage')) {
      page = 'usage';
      inner = usagePage();
    } else if (p.startsWith('/build')) {
      page = 'build';
      inner = `<div class="ai-page"><h1>빌드</h1><p class="ai-muted">프롬프트로 앱을 만드는 기능이에요. 이번 실습에서는 Apps Script로 웹앱을 만들기 때문에 사용하지 않아요.</p></div>`;
    }
    el.innerHTML = shell(ctx, page, inner);
    if (!g.aistudioTerms) {
      termsModal(el, () => {
        g.aistudioTerms = true;
        emit('aistudio:terms');
      });
    }
    el.onclick = async (e) => {
      const a = e.target.closest('[data-act]');
      if (!a || a.closest('.sm-wrap')) return;
      const act = a.dataset.act;
      if (act === 'go') {
        ctx.go('https://aistudio.google.com' + a.dataset.url);
        return;
      }
      if (act === 'doc') return toast('시뮬레이션에서는 문서 페이지를 열 수 없어요.');
      if (act === 'create') return createKeyModal(el, ctx);
      if (act === 'newproj' || act === 'import') {
        if (act === 'import') return toast('가져올 수 있는 Google Cloud 프로젝트가 없어요. 새 프로젝트를 만들어 보세요.');
        const name = 'Gemini Project ' + (g.projects.length + 1);
        g.projects.push({ name, pid: 'gen-lang-client-0' + randStr(9, '0123456789') });
        emit('aistudio:project', { name });
        ctx.rerender();
        return;
      }
      if (act === 'copy') {
        e.stopPropagation();
        const k = g.keys.find((x) => x.id === a.dataset.id);
        await copyText(k.value);
        toast('API 키를 클립보드에 복사했어요.', 'ok');
        emit('key:copied', { provider: 'gemini', id: k.id });
        return;
      }
      if (act === 'del') {
        e.stopPropagation();
        const k = g.keys.find((x) => x.id === a.dataset.id);
        const m = siteModal(
          el,
          `<div class="ai-ck"><h2>API 키를 삭제할까요?</h2><p>'${esc(k.name)}' 키를 삭제하면 이 키를 쓰는 웹앱은 더 이상 Gemini API를 호출할 수 없어요.</p>
          <div class="ai-row end"><button class="ai-btn ghost" data-a="n">취소</button><button class="ai-btn danger" data-a="y">삭제</button></div></div>`,
          'ai-modal'
        );
        m.box.onclick = (ev) => {
          const b = ev.target.closest('[data-a]');
          if (!b) return;
          if (b.dataset.a === 'y') {
            k.revoked = true;
            emit('key:deleted', { provider: 'gemini' });
            ctx.rerender();
          }
          m.close();
        };
        return;
      }
      if (act === 'detail') {
        const k = g.keys.find((x) => x.id === a.dataset.id);
        keyDetail(el, k, false);
        return;
      }
      if (act === 'run') {
        const v = el.querySelector('#ai-p').value.trim();
        if (!v) return;
        el.querySelector('#ai-out').innerHTML = `<div class="ai-ans"><b>${MODELS.gemini.current}</b><p>플레이그라운드에서는 이렇게 직접 대화할 수 있어요. 웹앱이 같은 일을 하려면 API 키가 필요합니다. (시뮬레이션 응답)</p></div>`;
      }
    };
    void maskKey;
  },
});
