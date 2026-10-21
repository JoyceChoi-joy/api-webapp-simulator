// 전역 상태와 이벤트 버스
const VERSION = 'v1';
const listeners = new Set();

export const S = { lesson: null, provider: null, account: null, L: null };

function defaultAccount() {
  return {
    google: { aistudioSignedIn: false, aistudioTerms: false, projects: [], keys: [], usage: 0 },
    openai: { signedIn: false, org: '', keys: [], credits: 0, usage: 0, spent: 0 },
  };
}

function defaultLesson(lesson, provider) {
  return {
    lesson,
    provider,
    studentName: '',
    stepIndex: 0,
    done: {}, // 완료한 단계 id
    flags: {}, // 이벤트 기록
    worksheet: {},
    settings: { debugScenario: lesson === '3-5' },
    browser: { tabs: [], active: null, seq: 0 },
    scripts: {}, // Apps Script 프로젝트 모음
    sheets: {}, // 스프레드시트 모음
    mainScript: null,
    mainSheet: null,
    chat: { messages: [] },
    gen: null, // 마지막으로 생성된 코드 정보
    apiLog: [],
    execLog: [],
    lastError: null,
    callTimes: [],
  };
}

const keyFor = (lesson, provider) => `apisim:${VERSION}:lesson:${lesson}:${provider}`;
const ACC_KEY = `apisim:${VERSION}:account`;

function readLS(k) {
  try {
    const v = localStorage.getItem(k);
    return v ? JSON.parse(v) : null;
  } catch (e) {
    return null;
  }
}
function writeLS(k, v) {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch (e) {
    /* 저장 공간을 쓸 수 없는 환경 */
  }
}

export function loadAccount() {
  S.account = Object.assign(defaultAccount(), readLS(ACC_KEY) || {});
  return S.account;
}

export function hasSavedLesson(lesson, provider) {
  const v = readLS(keyFor(lesson, provider));
  return !!(v && v.stepIndex > 0);
}

export function loadLesson(lesson, provider, { fresh = false } = {}) {
  loadAccount();
  S.lesson = lesson;
  S.provider = provider;
  const saved = fresh ? null : readLS(keyFor(lesson, provider));
  S.L = saved ? Object.assign(defaultLesson(lesson, provider), saved) : defaultLesson(lesson, provider);
  return S.L;
}

export function save() {
  if (!S.L) return;
  writeLS(keyFor(S.lesson, S.provider), S.L);
  writeLS(ACC_KEY, S.account);
}

export function resetAccount() {
  S.account = defaultAccount();
  writeLS(ACC_KEY, S.account);
}

export function resetAll() {
  try {
    Object.keys(localStorage)
      .filter((k) => k.startsWith('apisim:'))
      .forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    /* 무시 */
  }
}

// 상태가 바뀌었음을 알리고 저장
export function emit(evt, payload = {}) {
  if (S.L) {
    S.L.flags[evt] = (S.L.flags[evt] || 0) + 1;
  }
  save();
  listeners.forEach((fn) => {
    try {
      fn(evt, payload);
    } catch (e) {
      console.error(e);
    }
  });
}

export function on(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export const flag = (name) => (S.L && S.L.flags[name]) || 0;
