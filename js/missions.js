// 차시별 실습 단계 정의 (교재 3-5, 3-6, 3-7 흐름)
import { S } from './state.js';
import { PROVIDERS, LESSONS, MODELS } from './config.js';
import { mainScript, mainSheet, execUrl } from './store.js';
import { analyzeFiles } from './analyze.js';
import { SUBJECTS } from './data/subjects.js';
import { esc } from './util.js';

/* ---------------- 상태 확인 도우미 ---------------- */
const P = () => PROVIDERS[S.provider];
const PROP = () => P().keyProp;
const acc = () => (S.provider === 'openai' ? S.account.openai : S.account.google);
export const inc = (name, stepId) => {
  const snap = (S.L.stepSnap && S.L.stepSnap[stepId || curId()]) || {};
  return (S.L.flags[name] || 0) - (snap[name] || 0);
};
let _cur = null;
const curId = () => _cur;
export function setCurrentStepId(id) {
  _cur = id;
}
const activeTab = () => S.L.browser.tabs.find((t) => t.id === S.L.browser.active) || null;
const activeUrl = () => {
  const t = activeTab();
  try {
    return t && !t.url.startsWith('chrome') ? new URL(t.url) : null;
  } catch (e) {
    return null;
  }
};
const onSite = (site) => {
  const t = activeTab();
  return !!t && t.site === site;
};
const sc = () => mainScript();
const liveAn = () => (sc() ? analyzeFiles(sc().files.map((f) => ({ name: f.name, type: f.type, content: f.content }))) : null);
const savedAn = () => (sc() ? analyzeFiles(sc().files.map((f) => ({ name: f.name, type: f.type, content: f.saved }))) : null);
const lastDep = () => (sc() && sc().deployments.length ? sc().deployments[sc().deployments.length - 1] : null);
const depAn = () => {
  const d = lastDep();
  if (!d) return null;
  const v = sc().versions.find((x) => x.n === d.version);
  return v ? analyzeFiles(v.files) : null;
};
const validKey = (val) => acc().keys.find((k) => k.value === val && !k.revoked);
const lessonKey = () => acc().keys.find((k) => k.lesson === S.lesson && !k.revoked);
const vis = (id) => Array.from(document.querySelectorAll(`[data-hint="${id}"]`)).some((e) => e.getClientRects().length > 0);
const expectedApp = () => LESSONS[S.lesson].app;
const appMatches = (an) => {
  if (!an) return false;
  if (S.lesson === '3-7') return an.app === 'helper' || an.app === 'english';
  return an.app === expectedApp();
};

/* ---------------- 공통 안내 문구 ---------------- */
const tipKey = `<div class="tipbox"><b>📌 API Key가 하는 일</b><ul><li>신원 확인</li><li>사용량 체크</li><li>악용 방지</li></ul><b>⚠ API Key 주의사항</b><ul><li>남에게 알려 주지 않기</li><li>코드에 키를 직접 넣지 않기</li></ul></div>`;
const tipUpper = `<div class="tipbox"><b>💡 변수 이름을 대문자로 쓰는 이유</b><ul><li>프로그래머가 지키는 약속이에요.</li><li>바뀌면 안 되는 중요한 값(상수)을 나타내요.</li><li>API 키 같은 보안 정보는 대문자로 쓰는 것이 표준이에요.</li></ul></div>`;

/* ---------------- 단계 모음 ---------------- */
function conceptStep35() {
  return {
    id: 'concept',
    stage: 'API 이해하기',
    title: 'API와 API 키 개념 정리하기',
    html: () => `<p>실습을 시작하기 전에 오늘의 핵심 용어를 정리해요.</p>
      <div class="cards3">
        <div class="ccard"><b>API</b><p>서로 다른 프로그램이나 서비스가 대화할 수 있게 도와주는 <b>약속이자 통로</b>예요. 원하는 정보를 <b>요청</b>하면 서비스가 처리한 결과를 <b>응답</b>으로 보내 줘요.</p></div>
        <div class="ccard"><b>식당으로 비교하면</b><p>손님의 주문은 <b>요청</b>, 음식은 <b>응답</b>, 주문을 주방에 전하고 음식을 가져오는 종업원이 <b>API</b>의 역할이에요.</p></div>
        <div class="ccard"><b>API Key</b><p>도서관 대출증처럼 API를 쓸 때 <b>나를 증명하는 수단</b>이에요. 노출되면 다른 사람이 무단으로 쓸 수 있어요.</p></div>
      </div>${tipKey}`,
    confirm: '개념을 확인했어요',
    done: () => inc('ws:confirm:concept') > 0,
  };
}

function conceptStep36() {
  return {
    id: 'concept',
    stage: 'API 알아보기',
    title: '키가 필요한 API와 필요 없는 API 구분하기',
    html: () => `<table class="gtable"><tr><th colspan="2">키 발급이 필요 없는 API</th></tr>
      <tr><td>Web Speech API</td><td>글자를 음성으로 읽어 주거나(TTS) 음성을 글자로 바꿔요(STT).</td></tr>
      <tr><td>Geolocation API</td><td>GPS로 현재 위치(위도, 경도)를 알려 줘요.</td></tr>
      <tr><td>PokeAPI</td><td>포켓몬의 이미지, 능력치, 속성 데이터를 제공해요.</td></tr>
      <tr><td>Dog / Cat API</td><td>강아지나 고양이 사진을 무작위로 보여 줘요.</td></tr>
      <tr><th colspan="2">키 발급이 필요한 API</th></tr>
      <tr><td>생성형 AI API</td><td>AI가 글, 코드, 이미지를 만들어요. (Gemini, OpenAI)</td></tr>
      <tr><td>OpenWeatherMap</td><td>도시의 실시간 날씨와 예보를 조회해요.</td></tr>
      <tr><td>Kakao / Google Maps</td><td>지도, 길 찾기, 주변 정보 검색을 해요.</td></tr>
      <tr><td>YouTube Data API</td><td>영상 검색, 조회수, 댓글을 가져와요.</td></tr></table>
      <div class="quiz-mini" data-q="speech"><p><b>Q1.</b> 영어 발음을 들려주는 Web Speech API는 키 발급이 필요할까요?</p>
        <button data-qa="speech" data-v="no">필요 없음</button><button data-qa="speech" data-v="yes">필요함</button><span class="qres"></span></div>
      <div class="quiz-mini" data-q="ai"><p><b>Q2.</b> 예문을 만들어 주는 ${esc(P().name)}는 키 발급이 필요할까요?</p>
        <button data-qa="ai" data-v="no">필요 없음</button><button data-qa="ai" data-v="yes">필요함</button><span class="qres"></span></div>`,
    done: () => S.L.worksheet.qspeech === 'no' && S.L.worksheet.qai === 'yes',
  };
}

function thinkSteps() {
  return [
    {
      id: 'think-play',
      stage: '생각 열기',
      title: 'API 없이 만든 영화 퀴즈 풀어 보기',
      html: () => `<p>바이브 코딩으로 만든 이모티콘 영화 퀴즈를 먼저 풀어 봐요. 끝까지 푼 다음 <b>[다시 도전하기]</b>를 눌러 문제가 바뀌는지 살펴보세요.</p>
        <p class="sub">진행: 퀴즈 시작 ${Math.min(2, S.L.flags['sample:call'] || 0)} / 2회</p>`,
      action: { label: '▶ API 없이 만든 퀴즈 열기', run: 'openSample' },
      hint: ['tab-webapp'],
      done: () => (S.L.flags['sample:call'] || 0) >= 2,
    },
    {
      id: 'think-answer',
      stage: '생각 열기',
      title: '물음에 답하기',
      html: () => `<p>퀴즈를 풀어 본 경험을 떠올리며 답을 적어 보세요.</p>`,
      worksheet: [
        { key: 't1', label: '1) 몇 문제가 나오나요?' },
        { key: 't2', label: '2) 출제된 문제는 언제 만들어진 것일까요?' },
        { key: 't3', label: '3) 게임을 다시 시작하면 문제가 새롭게 바뀔까요?' },
        { key: 't4', label: '4) 퀴즈에 도전할 때 문제를 즉석에서 생성해 풀어 볼 수 있을까요?' },
      ],
      confirm: '답을 다 적었어요',
      done: () => inc('ws:confirm:think-answer') > 0,
    },
  ];
}

function newScriptSteps() {
  const name = LESSONS[S.lesson].scriptName;
  return [
    {
      id: 'open-drive',
      stage: '1. Apps Script 만들기',
      title: '구글 드라이브 접속하기',
      html: () => `<p>주소창에 <code>drive.google.com</code>을 입력하고 <kbd>Enter</kbd>를 누르세요.</p>`,
      hint: ['browser-url'],
      done: () => onSite('drive') || S.L.flags['visit:drive'] > 0,
    },
    {
      id: 'new-script',
      stage: '1. Apps Script 만들기',
      title: '새 Apps Script 만들기',
      html: () => `<p><b>[＋ 신규]</b> → <b>[더보기]</b> → <b>[Google Apps Script]</b> 순서로 눌러 새 프로젝트를 만드세요.</p>`,
      hint: ['drive-appsscript', 'drive-more', 'drive-new', 'tab-drive'],
      done: () => Object.values(S.L.scripts).some((x) => !x.bound),
    },
    {
      id: 'rename-script',
      stage: '1. Apps Script 만들기',
      title: `프로젝트 이름을 '${name}'(으)로 바꾸기`,
      html: () => `<p>왼쪽 위의 <b>제목 없는 프로젝트</b>를 누르고 이름을 <b>${esc(name)}</b>(으)로 바꾼 뒤 <b>[이름 바꾸기]</b>를 누르세요.</p>`,
      hint: ['as-rename-ok', 'as-title', 'tab-appsscript'],
      done: () => sc() && sc().name !== '제목 없는 프로젝트',
    },
  ];
}

function newSheetSteps() {
  const sheetName = () => (S.lesson === '3-7' ? `${subjectName()} AI 학습 도우미` : '영어 공부 AI 도우미');
  return [
    {
      id: 'open-drive',
      stage: '사전 준비',
      title: '구글 드라이브 접속하기',
      html: () => `<p>주소창에 <code>drive.google.com</code>을 입력하고 <kbd>Enter</kbd>를 누르세요.</p>`,
      hint: ['browser-url'],
      done: () => onSite('drive') || S.L.flags['visit:drive'] > 0,
    },
    {
      id: 'new-sheet',
      stage: '사전 준비',
      title: '빈 스프레드시트 만들기',
      html: () => `<p>이번 웹앱은 학습 내역을 스프레드시트에 저장해요. <b>[＋ 신규]</b> → <b>[Google 스프레드시트]</b> → <b>[빈 스프레드시트]</b>를 누르세요.</p>`,
      hint: ['drive-blank-sheet', 'drive-sheets', 'drive-new', 'tab-drive'],
      done: () => !!mainSheet(),
    },
    {
      id: 'rename-sheet',
      stage: '사전 준비',
      title: '스프레드시트 이름 바꾸기',
      html: () => `<p>왼쪽 위 <b>제목 없는 스프레드시트</b>를 눌러 <b>${esc(sheetName())}</b>처럼 알아보기 쉬운 이름으로 바꾸고 <kbd>Enter</kbd>를 누르세요.</p>`,
      hint: ['sheet-title', 'tab-sheets'],
      done: () => mainSheet() && mainSheet().name !== '제목 없는 스프레드시트',
    },
    {
      id: 'sheet-script',
      stage: '사전 준비',
      title: '[확장 프로그램] → [Apps Script] 열기',
      html: () => `<p>스프레드시트 위쪽 메뉴에서 <b>[확장 프로그램]</b> → <b>[Apps Script]</b>를 누르세요. 이 스프레드시트와 연결된 Apps Script가 새 탭에서 열려요.</p>`,
      hint: ['sheet-appsscript', 'sheet-extensions', 'tab-sheets'],
      done: () => Object.values(S.L.scripts).some((x) => x.bound),
    },
    {
      id: 'rename-script',
      stage: '사전 준비',
      title: 'Apps Script 프로젝트 이름 바꾸기',
      html: () => `<p>Apps Script 왼쪽 위 <b>제목 없는 프로젝트</b>를 눌러 스프레드시트와 같은 이름으로 바꾸세요.</p>`,
      hint: ['as-rename-ok', 'as-title', 'tab-appsscript'],
      done: () => sc() && sc().name !== '제목 없는 프로젝트',
    },
  ];
}

function geminiKeySteps(stage) {
  return [
    {
      id: 'as-open',
      stage,
      title: 'AI Studio 접속하기',
      html: () => `<p>새 탭(<b>＋</b>)을 열고 주소창에 <code>aistudio.google.com</code>을 입력하세요.</p><div class="tipbox">AI Studio는 인공지능 제미나이를 자유롭게 테스트해 보고 API 키를 만드는 개발자들의 놀이터예요.</div>`,
      hint: ['browser-url', 'browser-newtab'],
      done: () => S.L.flags['visit:aistudio'] > 0,
    },
    {
      id: 'as-login',
      stage,
      title: '구글 계정으로 로그인하기',
      html: () => `<p><b>[Google AI Studio 시작하기]</b>를 누르고 계정 선택 창에서 내 계정을 고르세요.</p>`,
      hint: ['google-account', 'aistudio-signin', 'tab-aistudio'],
      done: () => S.account.google.aistudioSignedIn,
    },
    {
      id: 'as-terms',
      stage,
      title: '약관을 확인하고 [계속] 누르기',
      html: () => `<p>Google AI Studio 약관 및 개인정보처리방침을 확인한 뒤 <b>필수 항목에 체크</b>하고 <b>[계속]</b>을 누르세요.</p>`,
      hint: () => {
        const c = document.querySelector('[data-hint="aistudio-terms-check"]');
        return c && c.checked ? ['aistudio-terms-ok'] : ['aistudio-terms-check', 'tab-aistudio'];
      },
      done: () => S.account.google.aistudioTerms,
    },
    {
      id: 'as-keypage',
      stage,
      title: 'API 키 페이지로 이동하기',
      html: () => `<p>왼쪽 사이드바 <b>Dashboard</b>의 <b>[API 키]</b> 또는 오른쪽 위 <b>[Get API key]</b> 버튼을 누르세요.</p>`,
      hint: ['aistudio-getkey', 'aistudio-nav-apikey', 'tab-aistudio'],
      done: () => onSite('aistudio') && activeUrl() && activeUrl().pathname.startsWith('/apikey'),
    },
    {
      id: 'as-create',
      stage,
      title: '[API 키 만들기]로 새 키 만들기',
      html: () => `<p>오른쪽 위 <b>[＋ API 키 만들기]</b>를 누르고 <b>키 이름</b>을 지정한 뒤, <b>가져온 프로젝트</b>를 선택하고 <b>[키 만들기]</b>를 누르세요.</p>
        <ul class="sub"><li>프로젝트가 없으면 목록에서 <b>＋ 새 프로젝트 만들기</b>를 먼저 고르세요.</li></ul>
        <div class="tipbox">💡 키 이름을 지정해 두면 나중에 키별로 사용량을 확인할 때 도움이 돼요.<br>💡 가져온 프로젝트가 없는 경우 실제로는 Google Cloud Console에서 먼저 프로젝트를 만들어야 해요.</div>`,
      hint: () => {
        const sel = document.querySelector('[data-hint="aistudio-project"]');
        if (sel && sel.getClientRects().length) {
          if (!sel.value || sel.value === '__new') return sel.value === '__new' ? ['css:#pmake'] : ['aistudio-project'];
          return ['aistudio-make'];
        }
        return ['aistudio-create', 'aistudio-getkey', 'tab-aistudio'];
      },
      done: () => !!lessonKey(),
    },
    {
      id: 'as-copy',
      stage,
      title: '[키 복사]로 API 키 복사하기',
      html: () => `<p><b>API 키 세부정보</b> 창에서 <b>[키 복사]</b>를 누르세요. 창을 닫았다면 목록에서 키 오른쪽의 ⧉ 버튼으로 복사할 수 있어요.</p>${tipKey}`,
      hint: ['aistudio-copy', 'aistudio-rowcopy', 'tab-aistudio'],
      done: () => inc('key:copied') > 0,
    },
  ];
}

function openaiKeySteps(stage) {
  return [
    {
      id: 'oa-open',
      stage,
      title: 'OpenAI 플랫폼 접속하기',
      html: () => `<p>새 탭(<b>＋</b>)을 열고 주소창에 <code>platform.openai.com</code>을 입력하세요.</p><div class="tipbox">OpenAI Platform은 ChatGPT와 다른 개발자용 사이트예요. API 키 발급, 사용량, 결제를 이곳에서 관리해요.</div>`,
      hint: ['browser-url', 'browser-newtab'],
      done: () => S.L.flags['visit:openai'] > 0,
    },
    {
      id: 'oa-login',
      stage,
      title: '로그인하기',
      html: () => `<p><b>[Log in]</b> → <b>[Continue with Google]</b>을 누르고 계정 선택 창에서 내 계정을 고르세요.</p>`,
      hint: ['google-account', 'openai-google', 'openai-login', 'tab-openai'],
      done: () => S.account.openai.signedIn,
    },
    {
      id: 'oa-org',
      stage,
      title: '조직(Organization) 만들기',
      html: () => `<p>처음 가입하면 조직을 만들어요. <b>Organization name</b>을 확인하고 <b>[Create organization]</b>을 누르세요.</p><p class="sub">API 사용량과 결제는 조직 단위로 관리돼요.</p>`,
      hint: ['openai-createorg', 'tab-openai'],
      done: () => !!S.account.openai.org,
    },
    {
      id: 'oa-billing',
      stage,
      title: '크레딧 확인하고 충전하기',
      html: () => `<p>OpenAI API는 <b>선불 크레딧</b>이 있어야 호출할 수 있어요. 오른쪽 위 <b>⚙ Settings</b> → <b>[Billing]</b>에서 <b>Credit balance</b>를 확인하고 <b>[Add to credit balance]</b>로 충전하세요.</p>
        <p class="sub">시뮬레이션에서는 결제 정보 없이 가상 크레딧이 추가돼요. 현재 잔액: <b>$${S.account.openai.credits.toFixed(2)}</b></p>`,
      hint: () => {
        if (vis('openai-creditok')) return ['openai-creditok'];
        if (vis('openai-addcredit')) return ['openai-addcredit'];
        return ['openai-billing', 'openai-settings', 'tab-openai'];
      },
      skip: '충전하지 않고 넘어가기 (오류 체험)',
      done: () => S.account.openai.credits > 0,
    },
    {
      id: 'oa-keypage',
      stage,
      title: 'API keys 페이지로 이동하기',
      html: () => `<p>왼쪽 메뉴에서 <b>[API keys]</b>를 누르세요. (Settings 화면이라면 왼쪽 Organization 메뉴에도 있어요.)</p>`,
      hint: ['openai-nav-apikeys', 'tab-openai'],
      done: () => onSite('openai') && activeUrl() && activeUrl().pathname.includes('api-keys'),
    },
    {
      id: 'oa-create',
      stage,
      title: '[Create new secret key]로 새 키 만들기',
      html: () => `<p><b>[＋ Create new secret key]</b>를 누르고 다음처럼 정한 뒤 <b>[Create secret key]</b>를 누르세요.</p>
        <ul class="sub"><li><b>Owned by</b>: You</li><li><b>Name</b>: 알아보기 쉬운 이름 (예: 영화 퀴즈 키)</li><li><b>Project</b>: Default project</li><li><b>Permissions</b>: All</li></ul>`,
      hint: ['openai-make', 'openai-create', 'openai-nav-apikeys', 'tab-openai'],
      done: () => !!lessonKey(),
    },
    {
      id: 'oa-copy',
      stage,
      title: 'Save your key 창에서 [Copy] 후 [Done]',
      html: () => {
        const lost = inc('openai:keyLost') > 0 && inc('key:copied') === 0;
        return `${lost ? '<p class="bad">키를 복사하지 않고 창을 닫았어요. OpenAI 비밀 키는 다시 볼 수 없으니 <b>[Create new secret key]</b>로 새 키를 만들고 이번에는 꼭 <b>[Copy]</b>를 누르세요.</p>' : ''}
        <p><b>Save your key</b> 창에서 <b>[Copy]</b>를 눌러 키를 복사한 뒤 <b>[Done]</b>을 누르세요.</p>
        <p class="bad sub">⚠ 이 창을 닫으면 키 전체를 <b>다시 볼 수 없어요.</b></p>${tipKey}`;
      },
      hint: () => (inc('key:copied') > 0 ? ['openai-done'] : ['openai-copy', 'openai-create', 'tab-openai']),
      done: () => inc('key:copied') > 0 && !document.querySelector('.oa-wrap'),
    },
  ];
}

function keyReuseSteps(stage) {
  if (S.provider === 'gemini')
    return [
      {
        id: 'key-reuse',
        stage,
        title: 'AI Studio에서 API 키 복사하기',
        html: () => `<p>새 탭에서 <code>aistudio.google.com</code>에 접속해 <b>[API 키]</b> 페이지로 가세요. 지난 차시에 발급받은 키의 ⧉ 버튼을 누르거나, <b>[API 키 만들기]</b>로 새 키를 발급받아 <b>복사</b>하세요.</p>`,
        hint: ['aistudio-copy', 'aistudio-rowcopy', 'aistudio-getkey', 'aistudio-nav-apikey', 'tab-aistudio', 'browser-url'],
        done: () => inc('key:copied') > 0,
      },
    ];
  return [
    {
      id: 'key-reuse',
      stage,
      title: 'OpenAI에서 새 비밀 키 만들고 복사하기',
      html: () => `<p>OpenAI 비밀 키는 <b>처음 만들 때 한 번만</b> 전체를 볼 수 있어요. 지난 차시 키를 따로 보관하지 않았다면 <code>platform.openai.com</code> → <b>[API keys]</b> → <b>[Create new secret key]</b>로 새 키를 만들고 <b>[Copy]</b>를 누르세요.</p>
        <p class="sub">크레딧 잔액: <b>$${S.account.openai.credits.toFixed(2)}</b> ${S.account.openai.credits > 0 ? '' : '(Settings → Billing에서 충전이 필요해요)'}</p>`,
      hint: () => (inc('key:copied') > 0 ? ['openai-done'] : ['openai-copy', 'openai-make', 'openai-create', 'openai-nav-apikeys', 'tab-openai', 'browser-url']),
      done: () => inc('key:copied') > 0 && !document.querySelector('.oa-wrap'),
    },
  ];
}

function propSteps(stage) {
  return [
    {
      id: 'sp-open',
      stage,
      title: 'Apps Script [프로젝트 설정] 열기',
      html: () => `<p>Apps Script 탭으로 돌아가 왼쪽 사이드바의 <b>⚙ [프로젝트 설정]</b>을 누르세요.</p>`,
      hint: ['as-settings', 'tab-appsscript'],
      done: () => onSite('appsscript') && activeUrl() && activeUrl().pathname.endsWith('/settings'),
    },
    {
      id: 'sp-add',
      stage,
      title: `스크립트 속성에 ${PROP()} 저장하기`,
      html: () => {
        const s = sc();
        let fb = '';
        if (s && Object.keys(s.props).length) {
          const v = s.props[PROP()];
          if (v === undefined) fb = `<p class="bad">저장된 속성 이름이 <b>${esc(Object.keys(s.props).join(', '))}</b>예요. 이름을 정확히 <b>${PROP()}</b>로 바꿔 주세요. (대문자, 밑줄까지 같아야 해요)</p>`;
          else if (!validKey(v)) fb = `<p class="bad">값이 발급받은 키와 달라요. 키를 다시 복사해 붙여 넣으세요. 앞뒤에 빈칸이 들어가지 않았는지도 확인하세요.</p>`;
        }
        return `${fb}<p>프로젝트 설정 맨 아래 <b>스크립트 속성</b>에서 <b>[스크립트 속성 추가]</b>를 누르고 다음처럼 입력한 뒤 <b>[스크립트 속성 저장]</b>을 누르세요.</p>
        <table class="gtable"><tr><th>속성</th><td><code>${PROP()}</code></td></tr><tr><th>값</th><td>복사한 API 키 붙여 넣기 (<kbd>Ctrl</kbd>+<kbd>V</kbd>)</td></tr></table>${S.lesson !== '3-5' ? tipUpper : ''}`;
      },
      hint: () => {
        const name = document.querySelector('[data-hint="as-propname"]');
        if (name && name.getClientRects().length) {
          if (!name.value.trim()) return ['as-propname'];
          const val = document.querySelector('[data-hint="as-propvalue"]');
          if (val && !val.value.trim()) return ['as-propvalue'];
          return ['as-saveprop'];
        }
        return ['as-addprop', 'as-settings', 'tab-appsscript'];
      },
      done: () => {
        const s = sc();
        return !!(s && s.props[PROP()] && validKey(s.props[PROP()]));
      },
    },
  ];
}

function textbookPrompt() {
  const p = P();
  const ai = S.provider === 'openai' ? 'OpenAI API' : '제미나이 api';
  if (S.lesson === '3-5')
    return `친구들과 놀 수 있는 영화 퀴즈를 만들고 싶어. 누구나 알 수 있는 영화에 대해 화면 가운데에 크게 이모티콘으로 힌트를 주고 정답을 맞출 수 있게 만들어줘. 문제는 ${ai}를 이용하여 10문제를 만들어 주고, 추가 힌트 없이 맞추면 10점, 추가 힌트를 보고 맞추면 5점씩 점수가 증가하게 해줘. 문제별 제한 시간은 25초로 해주고, 추가 힌트도 볼 수 있게 제공해줘. 10문제가 끝나면 결과를 안내해주고 다시 도전하는 기능도 만들어줘. Google Apps Script를 이용하여 웹앱을 만들 수 있게 index.html과 Code.gs를 생성해줘. 스크립트 속성에 ${p.keyProp}를 저장해두었으니 이걸 이용해.`;
  if (S.lesson === '3-6')
    return `Google Apps Script로 중학교 영어 공부 AI 도우미 웹앱을 만들 수 있도록 Code.gs와 index.html을 만들어줘.\n웹앱은 영어 단어를 입력하면 중학교 수준에 맞는 예문 3가지 추천해주면 좋겠고 학습 내역은 시트에 저장해서 학습 내역을 살펴볼 수 있도록 해줘.\nWeb Speech API로 발음을 들을 수 있게 해주고, 스크립트 속성에 ${p.keyProp}를 미리 저장해두었으니까 이걸 이용해서 사용 가능한 모델을 이용해서 동작하게 해줘.`;
  const w = S.L.worksheet;
  const sj = subjectName();
  const mid = w.promptMid || (SUBJECTS[w.subject] ? SUBJECTS[w.subject].promptExample : englishMid());
  return `Google Apps Script로 중학교 ${sj} 공부 AI 학습 도우미 웹앱을 만들 수 있도록 Code.gs와 index.html을 만들어줘.\n${mid}\n스크립트 속성에 ${p.keyProp}를 미리 저장해두었으니까 이걸 이용해서 사용 가능한 모델을 이용해서 동작하게 해줘.`;
}
const englishMid = () => '웹앱은 영어 단어를 입력하면 중학교 수준에 맞는 예문 3가지 추천해주면 좋겠고 학습 내역은 시트에 저장해서 학습 내역을 살펴볼 수 있도록 해줘.\nWeb Speech API로 발음을 들을 수 있게 해줘.';
export const subjectName = () => {
  const s = S.L.worksheet.subject;
  if (s === 'english') return '영어';
  return SUBJECTS[s] ? SUBJECTS[s].name : '(과목)';
};

function buildSteps(stage) {
  const appWord = { quiz: '퀴즈', english: '영어 도우미', helper: '학습 도우미' };
  return [
    {
      id: 'gm-open',
      stage,
      title: 'Gemini 접속하기',
      html: () => `<p>코드를 만들어 줄 생성형 AI를 열어요. 새 탭에서 <code>gemini.google.com</code>에 접속하세요.</p><p class="sub">Gemini는 이번 실습에서 두 가지 역할을 해요. 지금은 <b>코드를 만들어 주는 역할</b>, 완성된 웹앱 안에서는 ${S.provider === 'openai' ? 'OpenAI API가' : 'Gemini API가'} <b>문제나 설명을 만들어 주는 역할</b>이에요.</p>`,
      hint: ['tab-gemini', 'browser-url', 'browser-newtab'],
      done: () => S.L.flags['visit:gemini'] > 0,
    },
    {
      id: 'gm-prompt',
      stage,
      title: '프롬프트를 입력해 코드 만들기',
      html: () => `<p>설계한 내용을 담은 프롬프트예요. ${S.lesson === '3-7' ? '가운데 부분을 내 설계에 맞게 고친 뒤 ' : ''}<b>[프롬프트 복사]</b>를 누르고 Gemini 입력창에 붙여 넣어 보내세요.</p>
        <textarea class="prompt-box" id="g-prompt" ${S.lesson === '3-7' ? '' : 'readonly'}>${esc(textbookPrompt())}</textarea>
        <div class="row"><button class="gbtn" data-gact="copyPrompt">⧉ 프롬프트 복사</button></div>
        <p class="sub">직접 프롬프트를 바꿔 써도 돼요. 단, 스크립트 속성 이름(${PROP()})을 알려 주지 않으면 AI가 다른 이름을 쓸 수 있어요.</p>`,
      hint: () => {
        const ta = document.querySelector('[data-hint="gemini-input"]');
        if (ta && ta.getClientRects().length && ta.value.trim()) return ['gemini-send'];
        return ['gemini-input', 'tab-gemini'];
      },
      done: () => inc('chat:codeGenerated') > 0,
    },
    {
      id: 'paste-gs',
      stage,
      title: '백엔드 코드를 Code.gs에 붙여 넣기',
      html: () => {
        const an = liveAn();
        let fb = '';
        const code = sc() && sc().files.find((f) => f.name === 'Code');
        if (code && code.content.trim().startsWith('<')) fb = '<p class="bad">Code.gs에 HTML 코드가 들어갔어요. Code.gs에는 <b>Code.gs</b>라고 적힌 코드 블록을 붙여 넣어야 해요.</p>';
        else if (an && an.app && !an.hasDoGet) fb = '<p class="bad">doGet 함수가 보이지 않아요. 코드 전체가 복사되었는지 확인하세요.</p>';
        return `${fb}<ol class="sub"><li>Gemini 답변의 <b>Code.gs</b> 코드 블록에서 <b>[⧉ 코드 복사]</b>를 누르세요.</li><li>Apps Script 탭의 왼쪽 <b>‹› 편집기</b>에서 <b>Code.gs</b>를 열어요.</li><li>코드 입력 칸을 클릭하고 <kbd>Ctrl</kbd>+<kbd>A</kbd>로 기존 내용(<code>function myFunction</code>)을 모두 선택한 뒤 <kbd>Ctrl</kbd>+<kbd>V</kbd>로 붙여 넣으세요.</li></ol>`;
      },
      hint: () => (inc('chat:codeCopied') > 0 ? ['as-code', 'as-rail-editor', 'tab-appsscript'] : ['gemini-copy-gs', 'tab-gemini']),
      done: () => {
        const s = sc();
        if (!s) return false;
        const code = s.files.filter((f) => f.type === 'gs');
        const an = analyzeFiles(code.map((f) => ({ name: f.name, type: 'gs', content: f.content })));
        return appMatches(an) && an.hasDoGet && !code.some((f) => f.content.trim().startsWith('<'));
      },
    },
    {
      id: 'add-html',
      stage,
      title: 'index.html 파일 추가하기',
      html: () => `<p>왼쪽 <b>파일</b> 옆의 <b>＋</b> → <b>[HTML]</b>을 누르고 이름을 <code>index</code>로 입력한 뒤 <kbd>Enter</kbd>를 누르세요.</p><p class="sub">.html은 자동으로 붙어요. 코드의 <code>createHtmlOutputFromFile('index')</code>와 이름이 같아야 해요.</p>`,
      hint: () => (vis('as-newfilename') ? ['as-newfilename'] : ['as-addhtml', 'as-addfile', 'as-rail-editor', 'tab-appsscript']),
      done: () => sc() && sc().files.some((f) => f.type === 'html' && f.name === 'index'),
    },
    {
      id: 'paste-html',
      stage,
      title: '프론트엔드 코드를 index.html에 붙여 넣기',
      html: () => `<ol class="sub"><li>Gemini 답변의 <b>index.html</b> 코드 블록에서 <b>[⧉ 코드 복사]</b>를 누르세요.</li><li>Apps Script의 <b>index.html</b>을 열고 기본 내용을 <kbd>Ctrl</kbd>+<kbd>A</kbd>로 모두 선택한 뒤 <kbd>Ctrl</kbd>+<kbd>V</kbd>로 붙여 넣으세요.</li></ol>
        <table class="gtable"><tr><td>백엔드 파일</td><td>→ Code.gs</td></tr><tr><td>프론트엔드 파일</td><td>→ index.html</td></tr></table>`,
      hint: () => (inc('chat:codeCopied') > 1 || (S.L.flags['chat:codeCopied'] || 0) > 1 ? ['as-code', 'as-file-index', 'tab-appsscript'] : ['gemini-copy-html', 'tab-gemini']),
      done: () => {
        const f = sc() && sc().files.find((x) => x.name === 'index');
        return !!(f && /<html/i.test(f.content) && f.content.includes('google.script.run'));
      },
    },
    {
      id: 'save',
      stage,
      title: '💾 프로젝트 저장하기',
      html: () => {
        const s = sc();
        const err = s && s.saveError ? `<p class="bad">구문 오류 때문에 저장되지 않았어요: ${esc(s.saveError.message)} (${esc(s.saveError.file)})</p>` : '';
        return `${err}<p>편집기 위쪽의 <b>💾 저장</b> 버튼을 누르거나 <kbd>Ctrl</kbd>+<kbd>S</kbd>를 누르세요. 파일 이름 옆의 점(●)이 사라지면 저장된 거예요.</p>`;
      },
      hint: ['as-save', 'tab-appsscript'],
      done: () => {
        const s = sc();
        if (!s || s.files.some((f) => f.content !== f.saved)) return false;
        const an = savedAn();
        return appMatches(an) && an.htmlFound;
      },
    },
    {
      id: 'deploy',
      stage,
      title: '웹앱으로 배포하기',
      html: () => `<p>오른쪽 위 <b>[배포]</b> → <b>[새 배포]</b>를 누르고 다음처럼 설정한 뒤 <b>[배포]</b>를 누르세요.</p>
        <ol class="sub"><li>유형 선택 옆 <b>⚙</b> → <b>[웹 앱]</b></li><li>설명: 예) 첫 번째 배포</li><li>다음 사용자 인증 정보로 실행: <b>나</b></li><li>액세스 권한이 있는 사용자: <b>모든 사용자</b></li></ol>`,
      hint: () => {
        if (vis('as-authorize')) return ['as-authorize'];
        if (vis('as-deploy-btn')) {
          const acc2 = document.querySelector('[data-hint="as-access"]');
          if (!acc2) return vis('as-type-webapp') ? ['as-type-webapp'] : ['as-type'];
          if (acc2.value !== 'ANYONE_ANONYMOUS') return ['as-access'];
          return ['as-deploy-btn'];
        }
        return ['as-newdeploy', 'as-deploy', 'tab-appsscript'];
      },
      done: () => inc('deploy:requested') > 0 || (sc() && sc().deployments.length > 0),
    },
    {
      id: 'authorize',
      stage,
      title: '액세스 승인하기',
      html: () => {
        const d = lastDep();
        const warn = d && d.access !== 'ANYONE_ANONYMOUS' ? `<p class="bad">액세스 권한이 '${d.access === 'MYSELF' ? '나만' : 'Google 계정이 있는 모든 사용자'}'로 배포됐어요. [배포 관리]에서 '모든 사용자'로 바꾸면 친구들도 쓸 수 있어요.</p>` : '';
        return `${warn}<p>웹앱이 외부 서비스(API)${S.lesson !== '3-5' ? '와 스프레드시트' : ''}에 접근하려면 권한 승인이 필요해요.</p>
        <ol class="sub"><li><b>[액세스 승인]</b>을 누르고 계정을 선택해요.</li><li>"Google에서 확인하지 않은 앱" 화면에서 <b>[고급]</b> → <b>(안전하지 않음)으로 이동</b>을 눌러요. 내가 만든 앱이라서 괜찮아요.</li><li>요청하는 권한을 <b>모두 선택</b>하고 <b>[계속]</b>을 눌러요.</li></ol>`;
      },
      hint: () => {
        const all = document.querySelector('[data-hint="auth-selectall"]');
        if (all && all.getClientRects().length) return all.checked ? ['auth-continue'] : ['auth-selectall'];
        return ['auth-unsafe', 'auth-advanced', 'google-account', 'as-authorize', 'as-deploy-btn', 'tab-appsscript'];
      },
      done: () => sc() && sc().deployments.length > 0,
    },
    {
      id: 'open-webapp',
      stage,
      title: '웹 앱 URL로 접속하기',
      html: () => `<p>배포 완료 창의 <b>웹 앱 URL</b>을 누르세요. 새 탭에서 내가 만든 ${appWord[expectedApp()]} 웹앱이 열려요.</p><p class="sub">창을 닫았다면 [배포] → [배포 관리]에서 URL을 다시 볼 수 있어요.</p>`,
      hint: ['as-weburl', 'as-manage', 'as-deploy', 'tab-webapp'],
      done: () => onSite('webapp') || inc('webapp:opened') > 0,
    },
  ];
}

/* 오류가 났을 때만 나타나는 단계 */
function fixStep(stage, id = 'fix') {
  return {
    id,
    stage,
    title: '오류 확인하고 고치기',
    active: () => !!S.L.fixKind,
    kindOverride: true,
    html: () => {
      const k = S.L.fixKind;
      const e = S.L.lastError;
      const msg = e ? `<pre class="errpre">${esc(e.message.slice(0, 400))}${e.message.length > 400 ? '...' : ''}</pre>` : '';
      const ok = (b) => (b ? '✅' : '⬜');
      const dAn = depAn();
      const sAn = savedAn();
      if (k === 'model_not_found') {
        return `<p>웹앱에 오류가 났어요. 오류를 해결하는 과정도 바이브 코딩의 중요한 부분이에요.</p>${msg}
        <ul class="checks"><li>${ok(inc('chat:fixGenerated', id) > 0 || inc('chat:fixHelp', id) > 0)} 웹앱 위 <b>[오류 메시지 복사]</b> → Gemini에 붙여 넣고 원인 물어보기</li>
        <li>${ok(sAn && sAn.modelInfo.ok)} 수정된 Code.gs를 붙여 넣고 💾 저장하기</li>
        <li>${ok(dAn && dAn.modelInfo.ok)} <b>[배포] → [배포 관리]</b> → ✏️ → 버전: <b>새 버전</b> → <b>[배포]</b></li>
        <li>${ok(false)} 웹앱 탭에서 ⟳ 새로고침 후 다시 실행하기</li></ul>
        <div class="tipbox">💡 생성형 AI가 이미 서비스가 끝난 모델 이름을 쓰는 경우가 종종 있어요. 사용 가능한 모델인지 확인하는 과정이 필요해요. 지금 쓸 수 있는 모델 예: <code>${MODELS[S.provider].current}</code></div>`;
      }
      if (k === 'key_missing' || k === 'key_invalid' || k === 'key_perm') {
        return `<p>API 키 문제로 오류가 났어요.</p>${msg}<ul class="checks">
        <li>${ok(inc('chat:fixHelp', id) > 0)} (선택) 오류 메시지를 Gemini에 붙여 넣고 원인 물어보기</li>
        <li>${ok(sc() && sAn && sAn.propName && sc().props[sAn.propName] && validKey(sc().props[sAn.propName]) && (S.provider !== 'openai' || validKey(sc().props[sAn.propName]).perm === 'All'))} [프로젝트 설정] → 스크립트 속성의 <b>이름</b>이 코드의 <code>${esc((sAn && sAn.propName) || PROP())}</code>와 같고, <b>값</b>이 발급받은 키인지 확인하기</li>
        <li>${ok(false)} 웹앱 탭에서 ⟳ 새로고침 후 다시 실행하기</li></ul>
        <p class="sub">스크립트 속성은 실행할 때마다 새로 읽어서 다시 배포하지 않아도 돼요.</p>`;
      }
      if (k === 'quota') {
        return `<p>OpenAI 크레딧이 없어서 429 오류(insufficient_quota)가 났어요.</p>${msg}<ul class="checks">
        <li>${ok(S.account.openai.credits > 0)} OpenAI Platform → ⚙ Settings → <b>Billing</b> → <b>[Add to credit balance]</b></li>
        <li>${ok(false)} 웹앱에서 다시 실행하기</li></ul>`;
      }
      if (k === 'rate_limit') {
        return `<p>짧은 시간에 요청을 너무 많이 보내서 분당 요청 한도를 넘었어요(429).</p>${msg}<p>1분 정도 기다렸다가 다시 시도하세요.</p>`;
      }
      return `<p>웹앱에 오류가 났어요.</p>${msg}<ul class="checks"><li>${ok(inc('chat:fixHelp', id) > 0 || inc('chat:fixGenerated', id) > 0)} 오류 메시지를 복사해 Gemini에게 물어보기</li><li>${ok(false)} 알려 준 방법대로 고치고 저장한 뒤 [배포 관리]에서 새 버전으로 배포하기</li></ul>`;
    },
    hint: () => {
      const k = S.L.fixKind;
      if (k === 'model_not_found') {
        const sAn = savedAn();
        const dAn = depAn();
        if (!(inc('chat:fixGenerated') > 0)) return ['webapp-copyerr', 'gemini-input', 'tab-webapp'];
        if (!(sAn && sAn.modelInfo.ok)) return ['gemini-copy-gs', 'as-code', 'as-save'];
        if (!(dAn && dAn.modelInfo.ok)) {
          if (vis('as-redeploy')) {
            const v = document.querySelector('[data-hint="as-version"]');
            return v && v.value !== 'new' ? ['as-version'] : ['as-redeploy'];
          }
          return ['as-edit', 'as-manage', 'as-deploy', 'tab-appsscript'];
        }
        return ['browser-reload', 'tab-webapp'];
      }
      if (k === 'quota') return ['openai-creditok', 'openai-addcredit', 'openai-billing', 'openai-settings', 'tab-openai'];
      if (k && k.startsWith('key')) return ['as-propvalue', 'as-addprop', 'as-settings', 'tab-appsscript'];
      return ['webapp-copyerr', 'tab-webapp'];
    },
    done: () => !S.L.lastError && !!S.L.fixResolved,
    onDone: () => {
      S.L.fixKind = null;
    },
  };
}
export const inlineFix = () => fixStep('', 'fix-inline');

/* 기능 추가 단계 */
function featureStep({ id, stage, title, feature, prompt, desc, useText, skip }) {
  return {
    id,
    stage,
    title,
    html: () => {
      const sAn = savedAn();
      const dAn = depAn();
      const ok = (b) => (b ? '✅' : '⬜');
      const p = typeof prompt === 'function' ? prompt() : prompt;
      return `${desc ? `<p>${desc}</p>` : ''}
        <textarea class="prompt-box short" id="g-prompt">${esc(p)}</textarea>
        <div class="row"><button class="gbtn" data-gact="copyPrompt">⧉ 프롬프트 복사</button></div>
        <ul class="checks">
          <li>${ok(inc('chat:featureGenerated') > 0 || (sAn && sAn.features.includes(feature())))} Gemini에 프롬프트를 보내 새 코드 받기</li>
          <li>${ok(sAn && sAn.features.includes(feature()))} Code.gs와 index.html을 새 코드로 바꾸고 💾 저장하기</li>
          <li>${ok(dAn && dAn.features.includes(feature()))} [배포 관리] → ✏️ → <b>새 버전</b> → [배포]</li>
          <li>${ok(inc('app:feature:' + feature()) > 0)} 웹앱을 새로고침하고 ${useText}</li>
        </ul>`;
    },
    hint: () => {
      const sAn = savedAn();
      const dAn = depAn();
      const f = feature();
      if (!(inc('chat:featureGenerated') > 0) && !(sAn && sAn.features.includes(f))) {
        const ta = document.querySelector('[data-hint="gemini-input"]');
        if (ta && ta.getClientRects().length && ta.value.trim()) return ['gemini-send'];
        return ['gemini-input', 'tab-gemini'];
      }
      if (!(sAn && sAn.features.includes(f))) return ['gemini-copy-gs', 'as-code', 'as-save', 'tab-appsscript'];
      if (!(dAn && dAn.features.includes(f))) {
        if (vis('as-redeploy')) {
          const v = document.querySelector('[data-hint="as-version"]');
          return v && v.value !== 'new' ? ['as-version'] : ['as-redeploy'];
        }
        return ['as-edit', 'as-manage', 'as-deploy', 'tab-appsscript'];
      }
      return ['browser-reload', 'tab-webapp'];
    },
    skip,
    done: () => inc('app:feature:' + feature()) > 0,
  };
}

function completeStep() {
  return {
    id: 'complete',
    stage: '마무리',
    title: '실습 완료',
    html: () => {
      const d = lastDep();
      return `<div class="done-box"><div class="big">🎉</div><p><b>${esc(LESSONS[S.lesson].title)}</b> 실습을 모두 마쳤어요!</p>
        ${d ? `<p class="sub">내 웹앱 주소<br><code class="url">${esc(execUrl(d))}</code></p>` : ''}
        <p class="sub">[실습 보고서]에서 설계, 프롬프트, 확인 결과를 한눈에 보고 인쇄할 수 있어요.</p>
        <div class="row"><button class="gbtn" data-gact="report">📄 실습 보고서 보기</button></div></div>`;
    },
    done: () => false,
  };
}

/* ---------------- 차시별 조립 ---------------- */
function lesson35() {
  const keySteps = S.provider === 'openai' ? openaiKeySteps('2. API 키 발급받기') : geminiKeySteps('2. API 키 발급받기');
  return [
    conceptStep35(),
    ...thinkSteps(),
    ...newScriptSteps(),
    ...keySteps,
    ...propSteps('3. 스크립트 속성에 API 키 저장하기'),
    {
      id: 'design',
      stage: '4. 생성형 AI로 웹앱 만들기',
      title: '이모티콘 영화 퀴즈 앱 설계 확인하기',
      html: () => `<table class="gtable design">
        <tr><th>목적</th><td>영화를 이모티콘으로 표현해 문제를 내면 영화 제목을 맞히는 퀴즈를 만든다.</td></tr>
        <tr><th>핵심 기능</th><td>${esc(P().name)}를 이용해 누구나 알 수 있는 영화를 이모티콘 힌트로 내고 제목을 맞힐 수 있게 한다.</td></tr>
        <tr><th>입력과 출력</th><td>사용자는 추가 힌트를 선택할 수 있고 정답을 고른다. 프로그램은 정답 여부와 점수를 보여 준다.</td></tr>
        <tr><th>제약 조건</th><td>10문항, 문제별 제한 시간 25초, 힌트 없이 정답 10점, 힌트 보고 정답 5점</td></tr>
        <tr><th>사용할 API</th><td>${esc(P().name)} (스크립트 속성에 <code>${PROP()}</code>로 미리 저장)</td></tr></table>`,
      confirm: '설계를 확인했어요',
      done: () => inc('ws:confirm:design') > 0,
    },
    ...buildSteps('4. 생성형 AI로 웹앱 만들기'),
    {
      id: 'run-quiz',
      stage: '5. 웹앱 확인 및 수정하기',
      title: '퀴즈 시작하기',
      html: () => `<p>웹앱에서 <b>[퀴즈 시작하기]</b>를 누르세요. 버튼을 누르는 순간 ${esc(P().name)}에 요청이 가서 새 문제가 만들어져요.</p>`,
      hint: ['css:.wa-frame', 'tab-webapp'],
      done: () => inc('app:success') > 0 || inc('app:error') > 0,
    },
    fixStep('5. 웹앱 확인 및 수정하기'),
    {
      id: 'play-quiz',
      stage: '5. 웹앱 확인 및 수정하기',
      title: '끝까지 풀고 다시 도전하기',
      html: () => `<p>퀴즈를 끝까지 풀어 보고 <b>[다시 도전하기]</b>를 눌러 보세요. API 없이 만든 퀴즈와 무엇이 다른지 비교해 보세요.</p><p class="sub">문제 생성 ${Math.min(2, S.L.flags['app:quizLoaded'] || 0)} / 2회</p>`,
      hint: ['css:.wa-frame', 'tab-webapp'],
      done: () => (S.L.flags['app:quizLoaded'] || 0) >= 2,
    },
    {
      id: 'find-prompt',
      stage: '6. API가 하는 일 확인하기',
      title: 'Code.gs에서 prompt 찾기',
      html: () => `<p>Apps Script의 <b>Code.gs</b>에서 <code>const prompt = </code>로 시작하는 줄을 찾아 클릭해 보세요.</p><p class="sub">생성형 AI 서비스의 입력창에 요구 사항을 적는 것처럼, 퀴즈 문제를 만들어 달라는 요구 사항을 미리 <code>prompt</code>에 저장해 둔 거예요.</p>`,
      hint: ['as-code', 'as-file-Code', 'as-rail-editor', 'tab-appsscript'],
      done: () => inc('editor:line:prompt') > 0,
    },
    {
      id: 'devtools',
      stage: '6. API가 하는 일 확인하기',
      title: 'API 요청과 응답 살펴보기',
      html: () => `<p>웹앱 위쪽의 <b>[🔍 API 통신 보기]</b>를 켜고 퀴즈를 다시 시작해 보세요. <b>요청</b>에 담긴 prompt와 API 키(가려진 모습), <b>응답</b>으로 돌아온 문제 데이터를 확인하세요.</p>
        <div class="tipbox"><b>더 알아보기</b><br>① 생성형 AI가 서비스가 끝난 모델을 쓰는 경우가 있어 사용 가능한 모델인지 확인이 필요해요.<br>② 무료 등급은 분당 요청 수(RPM), 분당 토큰 수(TPM), 일일 요청 수(RPD) 한도가 있어요. ${S.provider === 'gemini' ? 'AI Studio의 [사용량 및 비율 제한]에서 확인할 수 있어요.' : 'OpenAI는 Settings → Limits에서 확인할 수 있어요.'}</div>`,
      hint: ['webapp-devtools', 'tab-webapp'],
      done: () => (S.L.flags['devtools:open'] || 0) > 0 && S.L.apiLog.some((l) => l.status === 200),
    },
    featureStep({
      id: 'feat-category',
      stage: '7. 무엇을 바꿀까?',
      title: '영화 카테고리를 고를 수 있게 하기',
      feature: () => 'category',
      prompt: '퀴즈에 출제할 영화 카테고리를 지정할 수 있도록 기능을 추가해줘.',
      desc: '아쉬운 점이나 필요한 기능을 보완해 완성도를 높여요. 아래 프롬프트를 Gemini에 보내 기능을 추가해 보세요.',
      useText: '카테고리를 골라 퀴즈 시작하기',
    }),
    completeStep(),
  ];
}

function lesson36() {
  const keys = S.L.keyMode === 'reuse' ? keyReuseSteps('사전 준비') : S.provider === 'openai' ? openaiKeySteps('사전 준비: API 키 발급') : geminiKeySteps('사전 준비: API 키 발급');
  return [
    conceptStep36(),
    {
      id: 'design',
      stage: '1. 어떻게 만들까?',
      title: '영어 공부 AI 도우미 설계 확인하기',
      html: () => `<table class="gtable design">
        <tr><th>목적</th><td>혼자 영어 공부를 힘들어하는 중학교 친구들을 위해 영어 공부를 도와주는 똑똑한 AI 도우미를 만든다.</td></tr>
        <tr><th>핵심 기능</th><td>영어 단어를 입력하면 중학교 수준에 맞는 예문을 찾아 준다. 학습 내역이 시트에 저장되고 살펴볼 수 있다.</td></tr>
        <tr><th>입력과 출력</th><td>영어 단어를 입력하면 예문이 나온다. 학습 내역이 한눈에 보인다.</td></tr>
        <tr><th>제약 조건</th><td>단어와 예문을 원할 때 들을 수 있다. 예문은 중학교 수준 3문장이다.</td></tr>
        <tr><th>사용할 API</th><td>${esc(P().name)} (키 발급 필요), Web Speech API (키 발급 필요 없음)</td></tr></table>`,
      confirm: '설계를 확인했어요',
      done: () => inc('ws:confirm:design') > 0,
    },
    ...newSheetSteps().map((s) => Object.assign(s, { stage: '2. 사전 준비' })),
    ...keys.map((s) => Object.assign(s, { stage: '2. 사전 준비' })),
    ...propSteps('2. 사전 준비'),
    ...buildSteps('3. API 활용 웹앱 제작'),
    ...checkSteps('4. 실행하고 확인하기', true, 'example'),
    featureStep({
      id: 'feat-translate',
      stage: '5. 기능을 추가해 볼까?',
      title: '추가 기능 1) 한글 문장을 영어로 번역하기',
      feature: () => 'translate',
      prompt: '영어로 표현하고 싶은 한글 문장을 넣으면 중학교 수준에 맞게 영어 문장으로 번역해주고, 실제로 원어민이 사용하는 자연스러운 문장도 제시해주는 기능을 추가해줘.',
      useText: '[한영 번역] 탭에서 한글 문장 번역해 보기',
    }),
    featureStep({
      id: 'feat-grammar',
      stage: '5. 기능을 추가해 볼까?',
      title: '추가 기능 2) 영작 문법 오류 체크하기',
      feature: () => 'grammar',
      prompt: '영어로 문장을 작성한 후 제출하면 단어나 문법 등의 오류를 체크하여 어떻게 고치면 좋을지 추천해주는 기능을 추가해줘.',
      useText: '[문법 체크] 탭에서 문장 검사해 보기 (예: He go to school every day.)',
    }),
    featureStep({
      id: 'feat-today',
      stage: '6. 나만의 도우미로 발전시키기',
      title: '접속만 해도 영어 공부에 도움 주기',
      feature: () => 'today',
      prompt: '웹앱 첫페이지에 접속하면 중학교 수준에 꼭 기억해야 하는 단어 또는 문장이 나타나고 필요한 설명이 제시되도록 기능을 추가해줘.',
      desc: '내가 물어보지 않아도 웹앱에 접속하면 알아서 도움을 주도록 만들어 봐요.',
      useText: '오늘의 필수 영단어가 자동으로 나타나는지 확인하기',
    }),
    featureStep({
      id: 'feat-review',
      stage: '6. 나만의 도우미로 발전시키기',
      title: '나만의 기능: 복습 퀴즈와 오답노트',
      feature: () => 'review',
      prompt: '학습 내역을 활용하여 AI 퀴즈를 만들어서 게임처럼 즐기면서 복습할 수 있게 하고, 퀴즈에서 틀린 문항은 시트에 저장하는 기능을 추가해줘.',
      desc: '영어 공부에 도움이 되는 나만의 기능을 요청해 보세요. 시뮬레이션에서는 복습 퀴즈 기능을 체험할 수 있어요.',
      useText: '[복습 퀴즈] 탭에서 퀴즈 풀어 보기',
      skip: '이 기능은 건너뛰기',
    }),
    featureStep({
      id: 'feat-interest',
      stage: '7. 도전: 관심사 기반 영어 콘텐츠',
      title: '관심 주제로 맞춤형 영어 콘텐츠 만들기',
      feature: () => 'interest',
      prompt: '좋아하는 주제와 난이도를 선택하면 AI가 중학교 수준을 벗어나지 않는 맞춤형 영어 콘텐츠와 핵심 단어장을 정리하여 제공해주는 기능을 추가해줘.',
      desc: '교재에서는 새 웹앱으로 만들지만, 시뮬레이션에서는 지금 만든 도우미에 기능으로 더해 체험해요.',
      useText: '[관심사 콘텐츠] 탭에서 주제(예: 우주)와 난이도를 골라 만들기',
      skip: '도전 과제 건너뛰기',
    }),
    completeStep(),
  ];
}

function checkSteps(stage, english, prefix) {
  const out = [
    {
      id: `${prefix}-main`,
      stage,
      title: english ? '영어 단어를 입력해 예문 3문장 확인하기' : '개념을 입력해 설명 확인하기',
      html: () => `<p>웹앱에서 ${english ? '영어 단어(예: borrow, environment)를 입력하고 [예문 찾기]' : '궁금한 개념을 입력하고 [설명 듣기]'}를 누르세요.</p>
        <table class="gtable"><tr><th>기능</th><th>동작 여부</th></tr>
        <tr><td>${english ? '영어 단어를 입력하면 예문 3문장이 제시된다.' : '개념을 입력하면 설명과 예시가 제시된다.'}</td><td>${inc('app:examples') > 0 ? '☑' : '□'}</td></tr>
        ${english ? `<tr><td>스피커 버튼을 누르면 소리로 들을 수 있다.</td><td>${(S.L.flags['app:tts'] || 0) > 0 ? '☑' : '□'}</td></tr>` : ''}
        <tr><td>학습 내역을 누르면 기록이 보인다.</td><td>${(S.L.flags['app:history'] || 0) > 0 ? '☑' : '□'}</td></tr></table>`,
      hint: ['css:.wa-frame', 'tab-webapp'],
      done: () => inc('app:examples') > 0,
    },
  ];
  if (english)
    out.push({
      id: `${prefix}-tts`,
      stage,
      title: '🔊 버튼으로 발음 듣기',
      html: () => `<p>단어나 예문 옆의 <b>🔊</b> 버튼을 눌러 발음을 들어 보세요. 키 발급이 필요 없는 <b>Web Speech API</b>가 동작해요.</p><p class="sub">소리가 나지 않으면 컴퓨터 음량을 확인하세요.</p>`,
      hint: ['css:.wa-frame', 'tab-webapp'],
      done: () => (S.L.flags['app:tts'] || 0) > 0,
    });
  out.push(
    {
      id: `${prefix}-history`,
      stage,
      title: '[학습 내역]에서 기록 확인하기',
      html: () => `<p>웹앱의 <b>[🗂 학습 내역]</b> 탭을 눌러 학습한 기록이 보이는지 확인하세요.</p>`,
      hint: ['css:.wa-frame', 'tab-webapp'],
      done: () => (S.L.flags['app:history'] || 0) > 0,
    },
    {
      id: `${prefix}-sheet`,
      stage,
      title: '스프레드시트에 저장됐는지 확인하기',
      html: () => `<p>스프레드시트 탭으로 가서 아래쪽의 <b>학습내역</b> 시트 탭을 눌러 보세요. 웹앱에서 학습한 기록이 한 줄씩 저장되어 있어요.</p>`,
      hint: () => (onSite('sheets') ? ['css:.sh-tab:not(.on)'] : ['tab-sheets']),
      done: () => {
        const sh = mainSheet();
        return onSite('sheets') && sh && sh.active === '학습내역';
      },
    }
  );
  return out;
}

function lesson37() {
  const keys = S.L.keyMode === 'reuse' ? keyReuseSteps('4. 사전 준비') : S.provider === 'openai' ? openaiKeySteps('4. 사전 준비') : geminiKeySteps('4. 사전 준비');
  const isEng = () => S.L.worksheet.subject === 'english';
  const sj = () => SUBJECTS[S.L.worksheet.subject];
  const featPrompt = (slot) => () => {
    const w = S.L.worksheet;
    const id = w['feat' + slot];
    if (isEng()) {
      return slot === 1
        ? '영어로 표현하고 싶은 한글 문장을 넣으면 중학교 수준에 맞게 영어 문장으로 번역해주고, 실제로 원어민이 사용하는 자연스러운 문장도 제시해주는 기능을 추가해줘.'
        : '영어로 문장을 작성한 후 제출하면 단어나 문법 등의 오류를 체크하여 어떻게 고치면 좋을지 추천해주는 기능을 추가해줘.';
    }
    const s = sj();
    const f = s && s.features.find((x) => x.id === (id || (slot === 1 ? 'quiz' : 'compare')));
    return f ? f.prompt : '';
  };
  const featId = (slot) => () => (isEng() ? (slot === 1 ? 'translate' : 'grammar') : slot === 1 ? 'quiz' : 'compare');
  return [
    {
      id: 'define',
      stage: '1~2. 문제 상황과 정의',
      title: '도움이 필요한 과목과 문제 정의하기',
      html: () => `<p>학교생활을 되돌아보며 교과 공부를 할 때 도움을 받고 싶었던 경험을 떠올려 보세요.</p>`,
      worksheet: [
        { key: 'subject', label: '과목', type: 'select', options: [['', '과목 선택'], ['english', '영어'], ['math', '수학'], ['science', '과학'], ['social', '사회'], ['korean', '국어']] },
        { key: 'need', label: '도움이 필요한 내용', example: (w) => (w.subject === 'english' ? '단어 스펠링과 뜻 암기 및 영작의 어려움' : SUBJECTS[w.subject] ? `${SUBJECTS[w.subject].name} 개념이 어렵고 비슷한 개념이 헷갈림` : '') },
        { key: 'difficulty', label: '1) 누가, 어떤 상황에서, 어떤 어려움을 겪고 있는가?', example: (w) => (w.subject === 'english' ? '단어를 어떻게 읽어야 하는지 모르고, 문장 속에서 다양한 뜻을 가진 단어가 많아 문장의 의미를 해석하는 것을 어려워하는 친구들이 많음.' : SUBJECTS[w.subject] ? SUBJECTS[w.subject].example.difficulty : '') },
        { key: 'solution', label: '2) 어떤 웹앱이 만들어지면 위의 문제를 개선할 수 있을까?', example: (w) => (w.subject === 'english' ? '교과서 지문 속 모르는 단어를 입력하면 단어를 어떻게 읽는지 알려 주고, 중학교 수준의 다양한 예문을 제시해 뜻 이해를 돕는다.' : SUBJECTS[w.subject] ? SUBJECTS[w.subject].example.solution : '') },
      ],
      confirm: '문제를 정의했어요',
      done: () => inc('ws:confirm:define') > 0 && !!S.L.worksheet.subject,
    },
    {
      id: 'design7',
      stage: '3. 어떻게 만들까?',
      title: 'AI 학습 도우미 에이전트 설계하기',
      html: () => `<p>정의한 문제를 해결할 웹앱을 설계해요. 예시 넣기 버튼으로 시작한 뒤 내 생각대로 고쳐도 좋아요.</p>`,
      worksheet: [
        { key: 'purpose', label: '목적', example: (w) => (w.subject === 'english' ? '혼자 영어 공부를 힘들어하는 친구들을 위해 영어 공부를 도와주는 AI 학습 도우미를 만든다.' : SUBJECTS[w.subject] ? SUBJECTS[w.subject].design.purpose : '') },
        { key: 'core', label: '핵심 기능', example: (w) => (w.subject === 'english' ? '영어 단어를 입력하면 중학교 수준에 맞는 예문을 찾아 준다. 학습 내역이 시트에 저장되고 살펴볼 수 있다.' : SUBJECTS[w.subject] ? SUBJECTS[w.subject].design.core : '') },
        { key: 'io', label: '입력과 출력', example: (w) => (w.subject === 'english' ? '영어 단어를 입력하면 예문이 나온다. 학습 내역이 한눈에 보인다.' : SUBJECTS[w.subject] ? SUBJECTS[w.subject].design.io : '') },
        { key: 'constraint', label: '제약 조건', example: (w) => (w.subject === 'english' ? '단어와 예문을 원할 때 들을 수 있다. 예문은 중학교 수준 3문장이다.' : SUBJECTS[w.subject] ? SUBJECTS[w.subject].design.constraint : '') },
      ],
      extra: () => `<p class="sub">사용할 API: <b>${esc(P().name)}</b> (키 발급 필요)${isEng() ? ', Web Speech API (키 발급 필요 없음)' : ''}</p>`,
      confirm: '설계를 마쳤어요',
      done: () => inc('ws:confirm:design7') > 0,
    },
    ...newSheetSteps().map((s) => Object.assign(s, { stage: '4. 사전 준비' })),
    ...keys.map((s) => Object.assign(s, { stage: '4. 사전 준비' })),
    ...propSteps('4. 사전 준비'),
    ...buildSteps('5. API 활용 웹앱 제작').map((s) => {
      if (s.id === 'gm-prompt') {
        const orig = s.html;
        s.html = () => {
          const w = S.L.worksheet;
          if (!w.promptMid) w.promptMid = isEng() ? englishMid() : sj() ? sj().promptExample : '';
          return orig();
        };
      }
      return s;
    }),
    {
      id: 'check7',
      stage: '6. 실행하고 확인해 볼까?',
      title: '내 학습 도우미가 잘 동작하는지 확인하기',
      html: () => `<p>웹앱에 접속해 핵심 기능이 잘 동작하는지 체크하세요.</p>
        <table class="gtable"><tr><th>기능</th><th>동작 여부</th></tr>
        <tr><td>${isEng() ? '영어 단어를 입력하면 예문 3문장이 제시된다.' : `${esc(subjectName())} 개념을 입력하면 설명과 예시가 제시된다.`}</td><td>${inc('app:examples') > 0 ? '☑' : '□'}</td></tr>
        ${isEng() ? `<tr><td>스피커 버튼을 누르면 소리로 들을 수 있다.</td><td>${(S.L.flags['app:tts'] || 0) > 0 ? '☑' : '□'}</td></tr>` : ''}
        <tr><td>학습 내역을 누르면 기록이 보인다.</td><td>${(S.L.flags['app:history'] || 0) > 0 ? '☑' : '□'}</td></tr></table>
        <p class="sub">예시 개념: ${esc(sj() ? sj().items.slice(0, 5).map((x) => x.term).join(', ') : 'borrow, environment, festival')}</p>`,
      hint: ['css:.wa-frame', 'tab-webapp'],
      done: () => inc('app:examples') > 0 && (S.L.flags['app:history'] || 0) > 0 && (!isEng() || (S.L.flags['app:tts'] || 0) > 0),
    },
    {
      id: 'check7-sheet',
      stage: '6. 실행하고 확인해 볼까?',
      title: '스프레드시트에 저장됐는지 확인하기',
      html: () => `<p>스프레드시트 탭에서 아래쪽 <b>학습내역</b> 시트를 눌러 기록을 확인하세요.</p>`,
      hint: () => (onSite('sheets') ? ['css:.sh-tab:not(.on)'] : ['tab-sheets']),
      done: () => onSite('sheets') && mainSheet() && mainSheet().active === '학습내역',
    },
    {
      id: 'pickfeat',
      stage: '7. 기능을 추가해 볼까?',
      title: '추가할 기능 고르기',
      html: () => {
        if (isEng()) return '<p>영어 학습 도우미에는 <b>한영 번역</b>과 <b>문법 체크</b> 기능을 차례로 추가해 봐요.</p>';
        const s = sj();
        return `<p>내 ${esc(s ? s.name : '')} 학습 도우미에 더할 기능을 생각해 보세요. 시뮬레이션에서는 다음 기능을 체험할 수 있어요.</p><ul class="sub">${s ? s.features.map((f) => `<li><b>${esc(f.label)}</b>: ${esc(f.prompt)}</li>`).join('') : ''}</ul>`;
      },
      worksheet: [{ key: 'myidea', label: '내가 더하고 싶은 기능 아이디어', example: () => '틀린 문제를 모아서 다시 풀 수 있게 하기' }],
      confirm: '기능을 정했어요',
      done: () => inc('ws:confirm:pickfeat') > 0,
    },
    featureStep({ id: 'feat7-1', stage: '7. 기능을 추가해 볼까?', title: '첫 번째 기능 추가하기', feature: featId(1), prompt: featPrompt(1), useText: '새 기능 탭에서 사용해 보기' }),
    featureStep({ id: 'feat7-2', stage: '7. 기능을 추가해 볼까?', title: '두 번째 기능 추가하기', feature: featId(2), prompt: featPrompt(2), useText: '새 기능 탭에서 사용해 보기' }),
    featureStep({
      id: 'feat7-today',
      stage: '8. 알아서 도움을 주는 도우미',
      title: '접속하면 알아서 도움 주기',
      feature: () => 'today',
      prompt: () => (isEng() ? '웹앱 첫페이지에 접속하면 중학교 수준에 꼭 기억해야 하는 단어 또는 문장이 나타나고 필요한 설명이 제시되도록 기능을 추가해줘.' : sj() ? sj().features.find((f) => f.id === 'today').prompt : ''),
      desc: '내가 물어보지 않아도 웹앱에 접속하면 해당 교과 학습에 알아서 도움을 주도록 발전시켜 봐요.',
      useText: '오늘의 학습 내용이 자동으로 나타나는지 확인하기',
    }),
    completeStep(),
  ];
}

export function buildMission() {
  if (S.L.keyMode == null) {
    const hasKey = acc().keys.some((k) => !k.revoked);
    const ready = S.provider === 'openai' ? S.account.openai.signedIn && S.account.openai.org : S.account.google.aistudioSignedIn && S.account.google.aistudioTerms;
    S.L.keyMode = S.lesson !== '3-5' && hasKey && ready ? 'reuse' : 'full';
  }
  if (S.lesson === '3-5') return lesson35();
  if (S.lesson === '3-6') return lesson36();
  return lesson37();
}

export { textbookPrompt };
