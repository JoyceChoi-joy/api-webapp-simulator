// Google Apps Script 편집기 (시뮬레이션)
import { registerSite, openTab, rerenderSite, activate, renderTab } from '../browser.js';
import { S, emit, on } from '../state.js';
import { esc, toast, siteModal, copyText, makeDeploymentId, today, nowTime } from '../util.js';
import { getScript, execUrl, devUrl, fileLabel, getSheet } from '../store.js';
import { mountEditor } from '../editor.js';
import { analyzeFiles, syntaxCheck, listFunctions } from '../analyze.js';
import { runServer, isAIFunc } from '../backend.js';
import { authorizeScript, accountName, scopeText } from './accounts.js';
import { ACCOUNT } from '../config.js';

const HTML_DEFAULT = `<!DOCTYPE html>
<html>
  <head>
    <base target="_top">
  </head>
  <body>

  </body>
</html>
`;

const savedFiles = (sc) => sc.files.map((f) => ({ name: f.name, type: f.type, content: f.saved }));
export const scriptAnalysis = (sc) => analyzeFiles(savedFiles(sc));
const isDirty = (sc) => sc.files.some((f) => f.content !== f.saved);
const needScopes = (sc) => scriptAnalysis(sc).scopes.filter((s) => !sc.authorized.includes(s));

function viewOf(url) {
  const p = url.pathname;
  if (p.endsWith('/settings')) return 'settings';
  if (p.endsWith('/executions')) return 'executions';
  if (p.endsWith('/triggers')) return 'triggers';
  if (p.endsWith('/overview')) return 'overview';
  return 'editor';
}
const idOf = (url) => (url.pathname.match(/projects\/([^/]+)/) || [])[1];
const base = (sc) => `https://script.google.com/u/0/home/projects/${sc.id}`;

function header(sc) {
  const n = accountName();
  const bound = sc.bound ? getSheet(sc.bound) : null;
  return `<header class="as-top">
    <div class="as-brand"><span class="fav fav-as big">{ }</span> Apps Script</div>
    <button class="as-title" data-act="rename" data-hint="as-title" title="프로젝트 이름 바꾸기">${esc(sc.name)}</button>
    ${bound ? `<span class="as-bound">▦ ${esc(bound.name)}에 연결됨</span>` : ''}
    <div class="as-top-r">
      <div class="as-dep-wrap">
        <button class="as-deploy" data-act="depmenu" data-hint="as-deploy">배포 ▾</button>
        <div class="as-dd hidden" id="as-dd">
          <div class="as-mi" data-act="newdeploy" data-hint="as-newdeploy">새 배포</div>
          <div class="as-mi" data-act="manage" data-hint="as-manage">배포 관리</div>
          <div class="as-mi" data-act="testdeploy">배포 테스트</div>
        </div>
      </div>
      <span class="as-av">${esc(n.slice(0, 1))}</span>
    </div>
  </header>`;
}

function rail(view) {
  const items = [
    ['overview', 'ⓘ', '개요', ''],
    ['editor', '‹›', '편집기', 'as-rail-editor'],
    ['triggers', '⏰', '트리거', ''],
    ['executions', '≡', '실행', ''],
    ['settings', '⚙', '프로젝트 설정', 'as-settings'],
  ];
  return `<nav class="as-rail">${items
    .map((i) => `<button class="as-ri ${view === i[0] ? 'on' : ''}" data-act="view" data-v="${i[0]}" title="${i[2]}" ${i[3] ? `data-hint="${i[3]}"` : ''}><span>${i[1]}</span><small>${i[2]}</small></button>`)
    .join('')}</nav>`;
}

function editorView(sc) {
  const f = sc.files.find((x) => x.name === sc.activeFile) || sc.files[0];
  const fns = listFunctions(sc.files.filter((x) => x.type === 'gs' && !x.content.trim().startsWith('<')).map((x) => x.content).join('\n'));
  if (!sc.runFn || !fns.includes(sc.runFn)) sc.runFn = fns[0] || '';
  return `<div class="as-ed">
    <aside class="as-files">
      <div class="as-fh"><b>파일</b> <span class="as-fh-r"><button class="as-ic" data-act="sortfiles" title="정렬">⇅</button><button class="as-ic" data-act="addfile" data-hint="as-addfile" title="파일 추가">＋</button></span>
        <div class="as-dd hidden" id="as-add"><div class="as-mi" data-act="newgs">스크립트</div><div class="as-mi" data-act="newhtml" data-hint="as-addhtml">HTML</div></div></div>
      ${sc.files
        .map(
          (x) => `<div class="as-file ${x.name === f.name ? 'on' : ''}" data-act="open" data-f="${esc(x.name)}" data-hint="as-file-${esc(x.name)}">
        <span>${x.type === 'gs' ? '📄' : '🌐'} ${esc(fileLabel(x))}</span>${x.content !== x.saved ? '<i class="as-dot" title="저장되지 않음"></i>' : ''}
        <button class="as-ic as-kebab" data-act="filemenu" data-f="${esc(x.name)}" title="더보기">⋮</button></div>`
        )
        .join('')}
      <div id="as-newname" class="hidden as-newname"><input placeholder="파일 이름" data-hint="as-newfilename"><small>Enter 키로 완료</small></div>
      <div class="as-fh mt"><b>라이브러리</b><button class="as-ic">＋</button></div>
      <div class="as-fh"><b>서비스</b><button class="as-ic">＋</button></div>
    </aside>
    <section class="as-code">
      <div class="as-toolbar">
        <button class="as-tb" title="실행취소">↶</button><button class="as-tb" title="다시 실행">↷</button>
        <button class="as-tb ${isDirty(sc) ? 'pulse' : ''}" data-act="save" data-hint="as-save" title="프로젝트 저장 (Ctrl+S)">💾</button>
        <button class="as-tb run" data-act="run" title="선택한 함수 실행">▷ 실행</button>
        <button class="as-tb" data-act="debug">⟳ 디버그</button>
        <select class="as-fn" id="as-fn">${fns.map((n) => `<option ${n === sc.runFn ? 'selected' : ''}>${esc(n)}</option>`).join('') || '<option>함수 없음</option>'}</select>
        <button class="as-tb" data-act="log">실행 로그</button>
        <span class="as-status">${isDirty(sc) ? '저장되지 않은 변경사항' : '저장됨'}</span>
      </div>
      ${sc.saveError ? `<div class="as-err">구문 오류: ${esc(sc.saveError.message)} 줄: ${sc.saveError.line} 파일: ${esc(sc.saveError.file)}</div>` : ''}
      <div class="as-editor" id="as-editor"></div>
      <div class="as-log ${sc.showLog ? '' : 'hidden'}" id="as-log"><div class="as-log-h"><b>실행 로그</b><button class="as-ic" data-act="log">×</button></div><div class="as-log-b">${(sc.log || [])
        .map((l) => `<div class="${l.err ? 'err' : ''}"><span>${l.t}</span><span>${l.lv}</span><span>${esc(l.msg)}</span></div>`)
        .join('')}</div></div>
    </section>
  </div>`;
}

function settingsView(sc) {
  const props = Object.entries(sc.props);
  const editing = sc.propEdit;
  return `<div class="as-set">
    <h1>프로젝트 설정</h1>
    <h3>일반 설정</h3>
    <label class="as-chk"><input type="checkbox"> 편집기에 'appsscript.json' 매니페스트 파일 표시</label>
    <label class="as-chk"><input type="checkbox" checked> Chrome V8 런타임 사용 설정</label>
    <h3>시간대</h3><div class="as-box">(GMT+09:00) 한국 표준시 - 서울</div>
    <h3>Google Cloud Platform(GCP) 프로젝트</h3><div class="as-box">Apps Script 프로젝트는 기본 Google Cloud 프로젝트를 사용합니다.</div>
    <h3>ID</h3><div class="as-box mono">스크립트 ID: ${esc(sc.id)}</div>
    <h3 id="as-props-h">스크립트 속성</h3>
    <p class="as-muted">스크립트 속성을 사용하면 프로젝트에서 키-값 쌍을 저장하고 액세스할 수 있습니다. API 키처럼 코드에 직접 쓰면 안 되는 값을 이곳에 저장해요.</p>
    ${
      editing
        ? `<div class="as-props-edit">
        ${sc.propDraft
          .map(
            (r, i) => `<div class="as-prow"><label>속성<input class="as-pin" data-i="${i}" data-k="k" value="${esc(r.k)}" placeholder="속성" data-hint="as-propname"></label>
          <label>값<input class="as-pin mono" data-i="${i}" data-k="v" value="${esc(r.v)}" placeholder="값" data-hint="as-propvalue"></label>
          <button class="as-ic" data-act="delprop" data-i="${i}" title="삭제">🗑</button></div>`
          )
          .join('')}
        <div class="as-perr">${esc(sc.propError || '')}</div>
        <div class="as-row"><button class="as-btn ghost" data-act="addrow">스크립트 속성 추가</button><button class="as-btn ghost" data-act="cancelprop">취소</button><button class="as-btn" data-act="saveprops" data-hint="as-saveprop">스크립트 속성 저장</button></div>
      </div>`
        : `${
            props.length
              ? `<table class="as-ptable"><thead><tr><th>속성</th><th>값</th></tr></thead><tbody>${props
                  .map(([k, v]) => `<tr><td class="mono">${esc(k)}</td><td class="mono">${esc(v)}</td></tr>`)
                  .join('')}</tbody></table>`
              : ''
          }
        <button class="as-btn" data-act="editprops" data-hint="as-addprop">${props.length ? '스크립트 속성 수정' : '스크립트 속성 추가'}</button>`
    }
  </div>`;
}

function execView() {
  const rows = S.L.execLog;
  return `<div class="as-set"><h1>실행</h1><p class="as-muted">웹앱에서 서버 함수가 실행된 기록이에요. 실패한 실행을 보면 어떤 오류가 났는지 알 수 있어요.</p>
    <table class="as-ptable"><thead><tr><th>시작 시간</th><th>함수</th><th>유형</th><th>상태</th><th>시간</th></tr></thead><tbody>
    ${rows.length ? rows.map((r) => `<tr><td>${r.time}</td><td class="mono">${esc(r.fn)}</td><td>${r.type}</td><td class="${r.status === '실패' ? 'bad' : r.status === '완료' ? 'good' : ''}">${r.status}</td><td>${r.ms != null ? (r.ms / 1000).toFixed(2) + '초' : ''}</td></tr>${r.error ? `<tr class="errrow"><td colspan="5">${esc(r.error)}</td></tr>` : ''}`).join('') : '<tr><td colspan="5">아직 실행 기록이 없습니다.</td></tr>'}
    </tbody></table></div>`;
}

function overviewView(sc) {
  const an = scriptAnalysis(sc);
  return `<div class="as-set"><h1>${esc(sc.name)}</h1>
    <div class="as-cards"><div class="as-card"><small>파일</small><b>${sc.files.length}</b></div><div class="as-card"><small>배포</small><b>${sc.deployments.length}</b></div><div class="as-card"><small>버전</small><b>${sc.versions.length}</b></div><div class="as-card"><small>사용하는 API</small><b>${an.provider === 'openai' ? 'OpenAI' : an.provider === 'gemini' ? 'Gemini' : '-'}</b></div></div>
    <p class="as-muted">소유자: ${esc(accountName())} (${ACCOUNT.email})</p></div>`;
}

/* ---------------- 저장 / 실행 ---------------- */
function saveProject(sc, ctx) {
  for (const f of sc.files.filter((x) => x.type === 'gs')) {
    const r = syntaxCheck(f.content, fileLabel(f));
    if (!r.ok) {
      sc.saveError = r;
      ctx.rerender();
      toast('구문 오류가 있어 저장하지 못했어요.', 'error');
      emit('script:saveError', { file: fileLabel(f), message: r.message });
      return false;
    }
  }
  sc.saveError = null;
  sc.files.forEach((f) => (f.saved = f.content));
  sc.savedAt = Date.now();
  ctx.rerender();
  toast('프로젝트를 저장했어요.', 'ok');
  emit('script:saved', { id: sc.id });
  return true;
}

function addLog(sc, lv, msg, err) {
  sc.log = sc.log || [];
  sc.log.push({ t: nowTime(), lv, msg, err });
  sc.log = sc.log.slice(-30);
}

async function runFunction(sc, ctx) {
  if (isDirty(sc) && !saveProject(sc, ctx)) return;
  const fn = sc.runFn;
  if (!fn) return toast('실행할 함수가 없어요.');
  const need = needScopes(sc);
  if (need.length) {
    authDialog(ctx.el, sc, need, () => runFunction(sc, ctx));
    return;
  }
  sc.showLog = true;
  addLog(sc, '알림', '실행이 시작됨');
  ctx.rerender();
  const an = scriptAnalysis(sc);
  try {
    if (fn === 'doGet') {
      if (an.htmlName && !an.htmlFound) throw new Error(`Exception: 이름이 ${an.htmlName}인 HTML 파일을 찾을 수 없습니다.`);
    } else if (['getQuizQuestions', 'getTodayWord', 'getTodayConcept', 'getHistory'].includes(fn)) {
      await runServer(an, fn, [], sc);
      if (isAIFunc(fn)) addLog(sc, '정보', `${fn}: API 응답을 받았습니다.`);
    }
    addLog(sc, '알림', '실행이 완료됨');
  } catch (e) {
    addLog(sc, '오류', e.message, true);
  }
  ctx.rerender();
  emit('script:run', { fn });
}

/* ---------------- 권한 / 배포 ---------------- */
function authDialog(el, sc, need, after) {
  const m = siteModal(
    el,
    `<div class="as-modal"><h2>승인 필요</h2>
    <p>이 프로젝트에서 사용자의 데이터에 대한 액세스 권한을 요청합니다.</p>
    <ul class="as-scopes">${need.map((s) => `<li>${esc(scopeText[s].t)}</li>`).join('')}</ul>
    <div class="as-row end"><button class="as-btn ghost" data-a="n">취소</button><button class="as-btn" data-a="y" data-hint="as-authorize">권한 검토</button></div></div>`,
    'sticky'
  );
  m.box.onclick = (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    m.close();
    if (b.dataset.a === 'y')
      authorizeScript({
        projectName: sc.name,
        scopes: need,
        onDone: () => {
          sc.authorized = Array.from(new Set([...sc.authorized, ...need]));
          emit('script:authorized', { id: sc.id });
          after && after();
        },
        onCancel: (why) => {
          toast(why === 'back' ? '권한 승인을 취소했어요. 다시 시도할 때 [고급]을 눌러 진행하세요.' : '권한 승인을 취소했어요.', 'error', 4200);
          emit('script:authCancel');
        },
      });
  };
}

const ACCESS = { MYSELF: '나만', DOMAIN: 'Google 계정이 있는 모든 사용자', ANYONE_ANONYMOUS: '모든 사용자' };

function snapshotVersion(sc, desc) {
  const n = sc.versions.length + 1;
  sc.versions.push({ n, desc: desc || '', files: savedFiles(sc), date: today(), time: nowTime() });
  return n;
}

function successView(m, sc, dep, updated) {
  const url = execUrl(dep);
  m.box.innerHTML = `<div class="as-modal wide">
    <h2>${updated ? '배포 수정' : '새 배포'}</h2>
    <p class="as-ok">✔ 배포를 ${updated ? '업데이트' : '생성'}했습니다.${updated ? ` 버전 ${dep.version}이(가) 적용되었어요.` : ''}</p>
    <label class="as-lab">버전 ${dep.version} (${esc(dep.date)})</label>
    <label class="as-lab">배포 ID</label>
    <div class="as-copyrow"><code>${esc(dep.id)}</code><button class="as-btn ghost" data-a="cpid">복사</button></div>
    <label class="as-lab">웹 앱</label>
    <div class="as-copyrow"><a class="as-link" data-a="open" data-hint="as-weburl">${esc(url)}</a><button class="as-btn ghost" data-a="cpurl">복사</button></div>
    ${updated ? '<p class="as-muted small">새 버전을 배포해도 웹 앱 URL은 그대로예요. 열려 있는 웹앱 탭은 새로고침하면 바뀐 코드가 반영돼요.</p>' : '<p class="as-muted small">URL을 누르면 새 탭에서 웹앱이 열려요.</p>'}
    <div class="as-row end"><button class="as-btn" data-a="done">완료</button></div></div>`;
  m.box.onclick = async (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    if (b.dataset.a === 'cpid') {
      await copyText(dep.id);
      toast('배포 ID를 복사했어요.');
    }
    if (b.dataset.a === 'cpurl') {
      await copyText(url);
      toast('웹 앱 URL을 복사했어요.');
      emit('webapp:urlCopied');
    }
    if (b.dataset.a === 'open') {
      m.close();
      openWebapp(dep);
    }
    if (b.dataset.a === 'done') m.close();
  };
}

export function openWebapp(dep) {
  const url = execUrl(dep);
  const ex = S.L.browser.tabs.find((t) => t.url === url);
  if (ex) {
    activate(ex.id);
    renderTab(ex);
  } else openTab(url);
  emit('webapp:opened', { id: dep.id });
}

function newDeployDialog(el, sc, ctx) {
  if (!sc.files.some((f) => f.saved.trim())) return;
  const st = { type: null, desc: '', exec: 'USER_DEPLOYING', access: 'MYSELF' };
  const m = siteModal(el, '', 'sticky as-deploywrap');
  const draw = () => {
    m.box.innerHTML = `<div class="as-modal wide as-newdep">
      <h2>새 배포</h2>
      <div class="as-dep-grid">
        <div class="as-dep-l"><b>유형 선택</b> <button class="as-ic gear" data-a="type" data-hint="as-type" title="배포 유형 사용 설정">⚙</button>
          <div class="as-dd ${st.typeOpen ? '' : 'hidden'}" id="as-types">
            <div class="as-mi" data-a="t" data-v="webapp" data-hint="as-type-webapp">🌐 웹 앱</div>
            <div class="as-mi" data-a="t" data-v="api">⚙ API 실행 파일</div>
            <div class="as-mi" data-a="t" data-v="addon">🧩 부가기능</div>
            <div class="as-mi" data-a="t" data-v="lib">📚 라이브러리</div>
          </div>
          ${st.type === 'webapp' ? '<div class="as-typechip">🌐 웹 앱</div>' : '<p class="as-muted small">⚙ 버튼을 눌러 배포 유형을 선택하세요.</p>'}
        </div>
        <div class="as-dep-r">
          ${
            st.type === 'webapp'
              ? `<b>구성</b>
            <label class="as-lab">설명</label><input class="as-in" id="d-desc" value="${esc(st.desc)}" placeholder="새 설명 (예: 첫 번째 배포)">
            <label class="as-lab">웹 앱</label>
            <label class="as-lab sub">다음 사용자 인증 정보로 실행</label>
            <select class="as-in" id="d-exec"><option value="USER_DEPLOYING" ${st.exec === 'USER_DEPLOYING' ? 'selected' : ''}>나(${ACCOUNT.email})</option><option value="USER_ACCESSING" ${st.exec === 'USER_ACCESSING' ? 'selected' : ''}>웹 앱에 액세스하는 사용자</option></select>
            <p class="as-muted small">웹 앱이 내 계정 권한으로 실행됩니다.</p>
            <label class="as-lab sub">액세스 권한이 있는 사용자</label>
            <select class="as-in" id="d-access" data-hint="as-access">${Object.entries(ACCESS)
              .map(([k, v]) => `<option value="${k}" ${st.access === k ? 'selected' : ''}>${v}</option>`)
              .join('')}</select>
            ${st.access !== 'ANYONE_ANONYMOUS' ? '<p class="as-muted small">친구들도 웹앱을 쓰려면 [모든 사용자]를 선택해요.</p>' : ''}`
              : `<p class="as-muted">배포 유형을 선택하면 구성 항목이 나타나요.</p>`
          }
        </div>
      </div>
      ${isDirty(sc) ? '<p class="as-warn">저장하지 않은 변경사항이 있어요. 배포에는 마지막으로 저장한 코드가 사용됩니다.</p>' : ''}
      <div class="as-row end"><button class="as-btn ghost" data-a="cancel">취소</button><button class="as-btn" data-a="deploy" ${st.type === 'webapp' ? '' : 'disabled'} data-hint="as-deploy-btn">배포</button></div>
    </div>`;
    const desc = m.box.querySelector('#d-desc');
    if (desc) desc.oninput = () => (st.desc = desc.value);
    const ex = m.box.querySelector('#d-exec');
    if (ex) ex.onchange = () => (st.exec = ex.value);
    const ac = m.box.querySelector('#d-access');
    if (ac)
      ac.onchange = () => {
        st.access = ac.value;
        emit('deploy:access', { access: st.access });
        draw();
      };
  };
  draw();
  emit('deploy:dialog');
  const doDeploy = () => {
    m.box.innerHTML = `<div class="as-modal"><div class="as-spin"></div><p>배포를 생성하는 중...</p></div>`;
    setTimeout(() => {
      const n = snapshotVersion(sc, st.desc);
      const dep = { id: makeDeploymentId(), desc: st.desc, version: n, access: st.access, exec: st.exec, date: today(), created: Date.now() };
      sc.deployments.push(dep);
      emit('deploy:created', { id: dep.id, access: dep.access, version: n });
      successView(m, sc, dep, false);
    }, 1200);
  };
  m.box.onclick = (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    if (a === 'type') {
      st.typeOpen = !st.typeOpen;
      draw();
    }
    if (a === 't') {
      st.typeOpen = false;
      if (b.dataset.v !== 'webapp') {
        toast('이번 실습에서는 [웹 앱]을 선택해요.');
        draw();
        return;
      }
      st.type = 'webapp';
      emit('deploy:type', { type: 'webapp' });
      draw();
    }
    if (a === 'cancel') m.close();
    if (a === 'deploy') {
      emit('deploy:requested', { access: st.access });
      const need = needScopes(sc);
      if (need.length) {
        m.box.innerHTML = `<div class="as-modal wide"><h2>새 배포</h2>
          <p>웹 앱에서 사용자 데이터에 액세스하려면 먼저 권한을 부여해야 합니다.</p>
          <ul class="as-scopes">${need.map((s) => `<li>${esc(scopeText[s].t)}</li>`).join('')}</ul>
          <div class="as-row end"><button class="as-btn ghost" data-a="cancel">취소</button><button class="as-btn" data-a="auth" data-hint="as-authorize">액세스 승인</button></div></div>`;
        return;
      }
      doDeploy();
    }
    if (a === 'auth') {
      authorizeScript({
        projectName: sc.name,
        scopes: needScopes(sc),
        onDone: () => {
          sc.authorized = Array.from(new Set([...sc.authorized, ...needScopes(sc)]));
          emit('script:authorized', { id: sc.id });
          doDeploy();
        },
        onCancel: (why) => {
          toast(why === 'back' ? '권한을 승인하지 않아 배포가 멈췄어요. [액세스 승인]을 다시 누르고 [고급]에서 진행하세요.' : '권한 승인을 취소했어요.', 'error', 4500);
          emit('script:authCancel');
        },
      });
    }
  };
}

function manageDialog(el, sc, ctx) {
  const deps = sc.deployments;
  const m = siteModal(el, '', 'sticky as-deploywrap');
  if (!deps.length) {
    m.box.innerHTML = `<div class="as-modal"><h2>배포 관리</h2><p>아직 배포가 없어요. [배포] → [새 배포]로 먼저 배포하세요.</p><div class="as-row end"><button class="as-btn" data-a="x">닫기</button></div></div>`;
    m.box.onclick = (e) => e.target.closest('[data-a]') && m.close();
    return;
  }
  const st = { sel: deps[deps.length - 1].id, editing: false, ver: 'new', desc: '' };
  const draw = () => {
    const dep = deps.find((d) => d.id === st.sel);
    m.box.innerHTML = `<div class="as-modal wide as-manage">
      <h2>배포 관리</h2>
      <div class="as-dep-grid">
        <div class="as-dep-l"><b>활성</b>${deps
          .map((d) => `<div class="as-depitem ${d.id === st.sel ? 'on' : ''}" data-a="sel" data-id="${d.id}">🌐 ${esc(d.desc || '제목 없음')}<br><small>버전 ${d.version} · ${esc(d.date)}</small></div>`)
          .join('')}</div>
        <div class="as-dep-r">
          <div class="as-row between"><b>배포 구성</b>${st.editing ? '' : `<button class="as-ic pen" data-a="edit" title="배포 수정" data-hint="as-edit">✏️</button>`}</div>
          ${
            st.editing
              ? `<label class="as-lab">버전</label>
            <select class="as-in" id="m-ver" data-hint="as-version"><option value="new" ${st.ver === 'new' ? 'selected' : ''}>새 버전</option>${sc.versions
              .slice()
              .reverse()
              .map((v) => `<option value="${v.n}" ${String(st.ver) === String(v.n) ? 'selected' : ''}>버전 ${v.n} (${esc(v.date)} ${v.time})${v.desc ? ' - ' + esc(v.desc) : ''}</option>`)
              .join('')}</select>
            <label class="as-lab">설명</label><input class="as-in" id="m-desc" value="${esc(st.desc)}" placeholder="이번에 바뀐 내용 (예: 모델 이름 수정)">
            <label class="as-lab">액세스 권한이 있는 사용자</label>
            <select class="as-in" id="m-access">${Object.entries(ACCESS).map(([k, v]) => `<option value="${k}" ${(st.access || dep.access) === k ? 'selected' : ''}>${v}</option>`).join('')}</select>
            ${isDirty(sc) ? '<p class="as-warn">저장하지 않은 변경사항이 있어요. 먼저 💾 저장하세요.</p>' : ''}`
              : `<label class="as-lab">버전</label><div class="as-box">버전 ${dep.version}</div>
            <label class="as-lab">배포 ID</label><div class="as-box mono small">${esc(dep.id)}</div>
            <label class="as-lab">웹 앱 URL</label><div class="as-box mono small"><a class="as-link" data-a="open">${esc(execUrl(dep))}</a></div>
            <label class="as-lab">액세스 권한이 있는 사용자</label><div class="as-box">${ACCESS[dep.access]}</div>`
          }
        </div>
      </div>
      <div class="as-row end">${st.editing ? `<button class="as-btn ghost" data-a="canceledit">취소</button><button class="as-btn" data-a="redeploy" data-hint="as-redeploy">배포</button>` : `<button class="as-btn" data-a="x">완료</button>`}</div>
    </div>`;
    const v = m.box.querySelector('#m-ver');
    if (v) v.onchange = () => (st.ver = v.value);
    const d = m.box.querySelector('#m-desc');
    if (d) d.oninput = () => (st.desc = d.value);
    const ma = m.box.querySelector('#m-access');
    if (ma) ma.onchange = () => (st.access = ma.value);
  };
  draw();
  emit('deploy:manage');
  m.box.onclick = (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    const a = b.dataset.a;
    const dep = deps.find((x) => x.id === st.sel);
    if (a === 'x') m.close();
    if (a === 'sel') {
      st.sel = b.dataset.id;
      st.editing = false;
      draw();
    }
    if (a === 'edit') {
      st.editing = true;
      st.ver = 'new';
      st.access = dep.access;
      emit('deploy:edit');
      draw();
    }
    if (a === 'canceledit') {
      st.editing = false;
      draw();
    }
    if (a === 'open') {
      m.close();
      openWebapp(dep);
    }
    if (a === 'redeploy') {
      const go = () => {
        m.box.innerHTML = `<div class="as-modal"><div class="as-spin"></div><p>배포를 업데이트하는 중...</p></div>`;
        setTimeout(() => {
          if (st.ver === 'new') dep.version = snapshotVersion(sc, st.desc);
          else dep.version = Number(st.ver);
          dep.desc = st.desc || dep.desc;
          if (st.access) dep.access = st.access;
          dep.date = today();
          emit('deploy:updated', { id: dep.id, version: dep.version, newVersion: st.ver === 'new' });
          successView(m, sc, dep, true);
        }, 1000);
      };
      const need = needScopes(sc);
      if (need.length) {
        authorizeScript({
          projectName: sc.name,
          scopes: need,
          onDone: () => {
            sc.authorized = Array.from(new Set([...sc.authorized, ...need]));
            emit('script:authorized', { id: sc.id });
            go();
          },
          onCancel: () => toast('새 권한을 승인해야 배포할 수 있어요.', 'error'),
        });
      } else go();
    }
  };
}

function testDialog(el, sc) {
  const url = devUrl(sc);
  const m = siteModal(
    el,
    `<div class="as-modal wide"><h2>배포 테스트</h2><p class="as-muted">테스트 배포는 마지막으로 <b>저장한</b> 코드로 바로 실행돼요. 친구에게 공유하는 주소는 [새 배포]로 만든 /exec 주소를 써야 해요.</p>
    <label class="as-lab">웹 앱 URL</label><div class="as-copyrow"><a class="as-link" data-a="open">${esc(url)}</a></div>
    <div class="as-row end"><button class="as-btn" data-a="x">완료</button></div></div>`
  );
  m.box.onclick = (e) => {
    const b = e.target.closest('[data-a]');
    if (!b) return;
    m.close();
    if (b.dataset.a === 'open') {
      const needs = needScopes(sc);
      if (needs.length) {
        authDialog(el, sc, needs, () => openTab(url));
        return;
      }
      openTab(url);
    }
  };
}

/* ---------------- 사이트 등록 ---------------- */
registerSite({
  id: 'appsscript',
  match: (u) => u.host === 'script.google.com' && !u.pathname.startsWith('/macros/'),
  title: (ctx) => {
    const sc = getScript(idOf(ctx.url));
    return sc ? `${sc.name} - 프로젝트 편집기 - Apps Script` : 'Apps Script';
  },
  rerenderOnShow: true,
  render(el, ctx) {
    ctx.el = el;
    const sc = getScript(idOf(ctx.url));
    if (!sc) {
      const list = Object.values(S.L.scripts);
      el.innerHTML = `<div class="as"><header class="as-top"><div class="as-brand"><span class="fav fav-as big">{ }</span> Apps Script</div></header>
        <div class="as-set"><h1>내 프로젝트</h1>${list.length ? `<table class="as-ptable"><tbody>${list.map((s) => `<tr data-id="${s.id}" class="as-prj"><td>{ } ${esc(s.name)}</td><td>${s.bound ? '스프레드시트에 연결됨' : '독립형'}</td></tr>`).join('')}</tbody></table>` : '<p class="as-muted">프로젝트가 없어요. 드라이브에서 [신규] → [더보기] → [Google Apps Script]로 만들 수 있어요.</p>'}</div></div>`;
      el.querySelectorAll('.as-prj').forEach((r) => (r.onclick = () => ctx.go(`https://script.google.com/u/0/home/projects/${r.dataset.id}/edit`)));
      return;
    }
    const view = viewOf(ctx.url);
    let inner = '';
    if (view === 'editor') inner = editorView(sc);
    else if (view === 'settings') inner = settingsView(sc);
    else if (view === 'executions') inner = execView();
    else if (view === 'overview') inner = overviewView(sc);
    else inner = `<div class="as-set"><h1>트리거</h1><p class="as-muted">설정된 트리거가 없습니다. (이번 실습에서는 사용하지 않아요.)</p></div>`;
    el.innerHTML = `<div class="as">${header(sc)}<div class="as-main">${rail(view)}<div class="as-content">${inner}</div></div></div>`;

    if (view === 'editor') {
      const f = sc.files.find((x) => x.name === sc.activeFile) || sc.files[0];
      const errLine = sc.saveError && sc.saveError.file === fileLabel(f) ? sc.saveError.line : null;
      mountEditor(el.querySelector('#as-editor'), {
        value: f.content,
        type: f.type,
        errorLine: errLine,
        onChange: (v) => {
          const wasDirty = f.content !== f.saved;
          f.content = v;
          const nowDirty = f.content !== f.saved;
          if (wasDirty !== nowDirty) {
            const st = el.querySelector('.as-status');
            if (st) st.textContent = nowDirty ? '저장되지 않은 변경사항' : '저장됨';
            const fileEl = el.querySelector(`.as-file[data-f="${CSS.escape(f.name)}"] span`);
            if (fileEl && nowDirty && !fileEl.parentNode.querySelector('.as-dot')) fileEl.insertAdjacentHTML('afterend', '<i class="as-dot" title="저장되지 않음"></i>');
            if (!nowDirty) el.querySelectorAll(`.as-file[data-f="${CSS.escape(f.name)}"] .as-dot`).forEach((d) => d.remove());
          }
          clearTimeout(sc._t);
          sc._t = setTimeout(() => emit('script:edited', { file: f.name }), 250);
        },
        onSave: () => saveProject(sc, ctx),
        onLine: (n, text) => emit('editor:line', { file: f.name, n, text }),
      });
      const sel = el.querySelector('#as-fn');
      if (sel) sel.onchange = () => (sc.runFn = sel.value);
    }
    if (view === 'settings' && sc.propEdit) {
      el.querySelectorAll('.as-pin').forEach((inp) => {
        inp.oninput = () => {
          sc.propDraft[Number(inp.dataset.i)][inp.dataset.k] = inp.value;
        };
      });
    }

    el.onclick = (e) => {
      const a = e.target.closest('[data-act]');
      const dd = el.querySelector('#as-dd');
      const add = el.querySelector('#as-add');
      if (!a || a.closest('.sm-wrap')) {
        if (!e.target.closest('.sm-wrap')) {
          dd && dd.classList.add('hidden');
          add && add.classList.add('hidden');
          el.querySelectorAll('.as-fmenu').forEach((x) => x.remove());
        }
        return;
      }
      const act = a.dataset.act;
      if (act !== 'depmenu') dd && dd.classList.add('hidden');
      if (act !== 'addfile') add && add.classList.add('hidden');
      switch (act) {
        case 'view':
          ctx.go(base(sc) + '/' + (a.dataset.v === 'editor' ? 'edit' : a.dataset.v));
          emit('script:view', { view: a.dataset.v });
          break;
        case 'rename': {
          const m = siteModal(
            el,
            `<div class="as-modal"><h2>프로젝트 이름 바꾸기</h2><label class="as-lab">프로젝트 제목</label><input class="as-in" id="rn" value="${esc(sc.name)}" data-hint="as-rename-input">
            <div class="as-row end"><button class="as-btn ghost" data-a="n">취소</button><button class="as-btn" data-a="y" data-hint="as-rename-ok">이름 바꾸기</button></div></div>`
          );
          const inp = m.box.querySelector('#rn');
          setTimeout(() => inp.select(), 30);
          const ok = () => {
            sc.name = inp.value.trim() || sc.name;
            m.close();
            ctx.rerender();
            rerenderSite('drive');
            emit('script:renamed', { name: sc.name });
          };
          inp.onkeydown = (ev) => ev.key === 'Enter' && ok();
          m.box.onclick = (ev) => {
            const b = ev.target.closest('[data-a]');
            if (!b) return;
            if (b.dataset.a === 'y') ok();
            else m.close();
          };
          break;
        }
        case 'depmenu':
          dd.classList.toggle('hidden');
          emit('deploy:menu');
          break;
        case 'newdeploy':
          newDeployDialog(el, sc, ctx);
          break;
        case 'manage':
          manageDialog(el, sc, ctx);
          break;
        case 'testdeploy':
          testDialog(el, sc);
          break;
        case 'addfile':
          add.classList.toggle('hidden');
          break;
        case 'newgs':
        case 'newhtml': {
          add.classList.add('hidden');
          const box = el.querySelector('#as-newname');
          box.classList.remove('hidden');
          box.dataset.type = act === 'newgs' ? 'gs' : 'html';
          const inp = box.querySelector('input');
          inp.value = '';
          inp.placeholder = act === 'newgs' ? '스크립트 파일 이름' : 'HTML 파일 이름 (예: index)';
          inp.focus();
          emit('script:newfilePrompt', { type: box.dataset.type });
          inp.onkeydown = (ev) => {
            if (ev.key === 'Escape') box.classList.add('hidden');
            if (ev.key !== 'Enter') return;
            let name = inp.value.trim() || '제목 없음';
            name = name.replace(/\.(html|gs)$/i, '');
            if (sc.files.some((x) => x.name === name)) {
              toast('같은 이름의 파일이 이미 있어요.', 'error');
              return;
            }
            const type = box.dataset.type;
            const content = type === 'html' ? HTML_DEFAULT : `function myFunction${sc.files.length}() {\n  \n}\n`;
            sc.files.push({ name, type, content, saved: content });
            sc.activeFile = name;
            ctx.rerender();
            emit('script:fileAdded', { name, type });
          };
          inp.onblur = () => setTimeout(() => box.classList.add('hidden'), 200);
          break;
        }
        case 'open':
          if (e.target.closest('.as-kebab')) break;
          sc.activeFile = a.dataset.f;
          ctx.rerender();
          emit('script:openFile', { file: a.dataset.f });
          break;
        case 'filemenu': {
          e.stopPropagation();
          el.querySelectorAll('.as-fmenu').forEach((x) => x.remove());
          const name = a.dataset.f;
          a.parentNode.insertAdjacentHTML('beforeend', `<div class="as-dd as-fmenu"><div class="as-mi" data-act="fren" data-f="${esc(name)}">이름 바꾸기</div><div class="as-mi" data-act="fdel" data-f="${esc(name)}">삭제</div></div>`);
          break;
        }
        case 'fren': {
          const fl = sc.files.find((x) => x.name === a.dataset.f);
          const m = siteModal(el, `<div class="as-modal"><h2>파일 이름 바꾸기</h2><input class="as-in" id="fn" value="${esc(fl.name)}"><div class="as-row end"><button class="as-btn ghost" data-a="n">취소</button><button class="as-btn" data-a="y">확인</button></div></div>`);
          m.box.onclick = (ev) => {
            const b = ev.target.closest('[data-a]');
            if (!b) return;
            if (b.dataset.a === 'y') {
              const nn = m.box.querySelector('#fn').value.trim().replace(/\.(html|gs)$/i, '');
              if (nn) {
                if (sc.activeFile === fl.name) sc.activeFile = nn;
                fl.name = nn;
                emit('script:fileRenamed', { name: nn });
              }
            }
            m.close();
            ctx.rerender();
          };
          break;
        }
        case 'fdel': {
          if (sc.files.length === 1) {
            toast('마지막 파일은 삭제할 수 없어요.');
            break;
          }
          const m = siteModal(el, `<div class="as-modal"><h2>파일 삭제</h2><p>'${esc(a.dataset.f)}' 파일을 완전히 삭제할까요?</p><div class="as-row end"><button class="as-btn ghost" data-a="n">취소</button><button class="as-btn danger" data-a="y">삭제</button></div></div>`);
          m.box.onclick = (ev) => {
            const b = ev.target.closest('[data-a]');
            if (!b) return;
            if (b.dataset.a === 'y') {
              sc.files = sc.files.filter((x) => x.name !== a.dataset.f);
              sc.activeFile = sc.files[0].name;
              emit('script:fileDeleted');
            }
            m.close();
            ctx.rerender();
          };
          break;
        }
        case 'save':
          saveProject(sc, ctx);
          break;
        case 'run':
        case 'debug':
          runFunction(sc, ctx);
          break;
        case 'log':
          sc.showLog = !sc.showLog;
          ctx.rerender();
          break;
        case 'sortfiles':
          sc.files.sort((x, y) => x.name.localeCompare(y.name));
          ctx.rerender();
          break;
        case 'editprops':
          sc.propEdit = true;
          sc.propError = '';
          sc.propDraft = Object.entries(sc.props).map(([k, v]) => ({ k, v }));
          if (!sc.propDraft.length) sc.propDraft.push({ k: '', v: '' });
          ctx.rerender();
          emit('props:editing');
          break;
        case 'addrow':
          sc.propDraft.push({ k: '', v: '' });
          ctx.rerender();
          break;
        case 'delprop':
          sc.propDraft.splice(Number(a.dataset.i), 1);
          ctx.rerender();
          break;
        case 'cancelprop':
          sc.propEdit = false;
          ctx.rerender();
          break;
        case 'saveprops': {
          const rows = sc.propDraft.filter((r) => r.k.trim() || r.v.trim());
          const names = rows.map((r) => r.k.trim());
          if (rows.some((r) => !r.k.trim())) {
            sc.propError = '속성 이름을 입력해 주세요.';
            ctx.rerender();
            break;
          }
          if (new Set(names).size !== names.length) {
            sc.propError = '같은 이름의 속성이 두 개 있어요.';
            ctx.rerender();
            break;
          }
          if (rows.some((r) => !r.v)) {
            sc.propError = '값을 입력해 주세요. 발급받은 API 키를 붙여 넣으세요.';
            ctx.rerender();
            break;
          }
          sc.props = {};
          rows.forEach((r) => (sc.props[r.k.trim()] = r.v));
          sc.propEdit = false;
          ctx.rerender();
          toast('스크립트 속성을 저장했어요.', 'ok');
          emit('props:saved', { names });
          break;
        }
        default:
          break;
      }
    };
  },
});

// 전역 단축키: Apps Script 탭에서 Ctrl+S
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && !e.defaultPrevented) {
    const t = S.L && S.L.browser.tabs.find((x) => x.id === S.L.browser.active);
    if (t && t.site === 'appsscript') {
      e.preventDefault();
      const btn = document.querySelector(`.br-view[data-tab="${t.id}"] [data-act="save"]`);
      if (btn) btn.click();
    }
  }
});

on((evt) => {
  if (evt === 'api:log' || evt === 'app:error' || evt === 'app:success') {
    // 실행 화면이 열려 있으면 새로 고침
    S.L.browser.tabs.forEach((t) => {
      if (t.site === 'appsscript' && t.url.endsWith('/executions') && t.id !== S.L.browser.active) {
        /* 다음에 탭을 열 때 갱신 */
      }
    });
  }
});
