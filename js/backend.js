// Code.gs 서버 함수 시뮬레이션 + 생성형 AI API 호출 시뮬레이션
import { S, emit } from './state.js';
import { MODELS, PROVIDERS, RATE_LIMIT } from './config.js';
import { sleep, maskKey, pick, norm, nowTime, uid } from './util.js';
import { MOVIES } from './data/movies.js';
import { WORDS, TRANSLATIONS, GRAMMAR_SAMPLES, INTEREST_TOPICS, TODAY_PICKS } from './data/english.js';
import { SUBJECTS } from './data/subjects.js';

const AI_FUNCS = {
  getQuizQuestions: '퀴즈 문제 10개 만들기',
  getExamples: '단어 뜻과 예문 만들기',
  translateSentence: '한글 문장 번역',
  checkGrammar: '영작 문법 검사',
  getTodayWord: '오늘의 영단어',
  getInterestContent: '관심사 영어 콘텐츠',
  getReviewQuiz: '복습 퀴즈 만들기',
  explainTerm: '개념 설명',
  makeQuiz: '확인 퀴즈 만들기',
  compareConcept: '개념 비교',
  getTodayConcept: '오늘의 개념',
};
export const isAIFunc = (fn) => fn in AI_FUNCS;

class GasError extends Error {}
let curScript = null;

function apiError(provider, kind, extra = {}) {
  const P = provider === 'openai' ? 'OpenAI' : 'Gemini';
  let status;
  let body;
  if (provider === 'gemini') {
    if (kind === 'key_invalid') {
      status = 400;
      body = { error: { code: 400, message: 'API key not valid. Please pass a valid API key.', status: 'INVALID_ARGUMENT', details: [{ '@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason: 'API_KEY_INVALID', domain: 'googleapis.com' }] } };
    } else if (kind === 'model_not_found') {
      status = 404;
      body = { error: { code: 404, message: `models/${extra.model} is not found for API version v1beta, or is not supported for generateContent. Call ListModels to see the list of available models and their supported methods.`, status: 'NOT_FOUND' } };
    } else if (kind === 'rate_limit') {
      status = 429;
      body = { error: { code: 429, message: `You exceeded your current quota, please check your plan and billing details. Quota exceeded for metric: generativelanguage.googleapis.com/generate_content_free_tier_requests, limit: ${RATE_LIMIT.gemini}, model: ${extra.model}. Please retry in 41s.`, status: 'RESOURCE_EXHAUSTED' } };
    }
  } else {
    if (kind === 'key_invalid') {
      status = 401;
      body = { error: { message: `Incorrect API key provided: ${maskKey(extra.key || 'sk-xxxx')}. You can find your API key at https://platform.openai.com/account/api-keys.`, type: 'invalid_request_error', param: null, code: 'invalid_api_key' } };
    } else if (kind === 'model_not_found') {
      status = 404;
      body = { error: { message: `The model \`${extra.model}\` does not exist or you do not have access to it.`, type: 'invalid_request_error', param: null, code: 'model_not_found' } };
    } else if (kind === 'key_perm') {
      status = 401;
      body = { error: { message: "You have insufficient permissions for this operation. Missing scopes: model.request. Check that you have the correct role in your organization (Reader, Writer, Owner) and project (Member, Owner), and if you're using a restricted API key, that it has the necessary scopes.", type: 'invalid_request_error', param: null, code: null } };
    } else if (kind === 'quota') {
      status = 429;
      body = { error: { message: 'You exceeded your current quota, please check your plan and billing details. For more information on this error, read the docs: https://platform.openai.com/docs/guides/error-codes/api-errors.', type: 'insufficient_quota', param: null, code: 'insufficient_quota' } };
    } else if (kind === 'rate_limit') {
      status = 429;
      body = { error: { message: 'Rate limit reached for requests. Please try again in 20s.', type: 'requests', param: null, code: 'rate_limit_exceeded' } };
    }
  }
  const text = JSON.stringify(body, null, 2);
  const err = new GasError(`${P} API 오류 (${status}): ${text}`);
  err.kind = kind;
  err.status = status;
  err.body = text;
  return err;
}

// 생성형 AI API 호출 흉내
async function aiCall(an, fn, promptText) {
  const L = S.L;
  const provider = an.provider;
  if (!provider) throw new GasError('ReferenceError: askAI is not defined');
  const propName = an.propName;
  const key = propName ? (curScript.props || {})[propName] : null;
  const P = PROVIDERS[provider];
  const entry = {
    id: uid('c'),
    time: nowTime(),
    fn,
    label: AI_FUNCS[fn],
    provider,
    model: an.model,
    method: 'POST',
    url: provider === 'gemini' ? `https://generativelanguage.googleapis.com/v1beta/models/${an.model}:generateContent` : 'https://api.openai.com/v1/chat/completions',
    headers: provider === 'gemini' ? { 'Content-Type': 'application/json', 'x-goog-api-key': key ? maskKey(key) : '(없음)' } : { 'Content-Type': 'application/json', Authorization: 'Bearer ' + (key ? maskKey(key) : '(없음)') },
    request:
      provider === 'gemini'
        ? { contents: [{ parts: [{ text: promptText }] }], generationConfig: { responseMimeType: 'application/json', temperature: 0.9 } }
        : { model: an.model, messages: [{ role: 'system', content: '너는 중학생을 돕는 친절한 도우미야. 반드시 JSON 형식으로만 답해.' }, { role: 'user', content: promptText }], response_format: { type: 'json_object' } },
    status: 'pending',
    response: null,
  };

  if (!key) {
    // 코드에서 바로 예외가 나므로 API까지 가지 않음
    const e = new GasError(`스크립트 속성에 ${propName || 'API 키'} 값이 없습니다. [프로젝트 설정]에서 API 키를 저장해 주세요.`);
    e.kind = 'key_missing';
    entry.status = 'not_sent';
    entry.note = 'API 키가 없어서 요청을 보내지 못했어요.';
    pushLog(entry);
    throw e;
  }

  pushLog(entry);
  const started = performance.now();
  await sleep(700 + Math.random() * 1300);

  const acc = provider === 'gemini' ? S.account.google : S.account.openai;
  const valid = acc.keys.find((k) => k.value === key && !k.revoked);
  let err = null;
  if (!valid) err = apiError(provider, 'key_invalid', { key });
  else if (provider === 'openai' && valid.perm && valid.perm !== 'All') err = apiError(provider, 'key_perm');
  else if (!an.modelInfo.ok) err = apiError(provider, 'model_not_found', { model: an.model });
  else if (provider === 'openai' && S.account.openai.credits <= 0) err = apiError(provider, 'quota');
  else {
    const now = Date.now();
    L.callTimes = (L.callTimes || []).filter((t) => now - t < 60000);
    if (L.callTimes.length >= RATE_LIMIT[provider]) err = apiError(provider, 'rate_limit', { model: an.model });
  }
  entry.ms = Math.round(performance.now() - started);
  if (err) {
    entry.status = err.status;
    entry.response = JSON.parse(err.body);
    if (valid) valid.lastUsed = Date.now();
    updateLog(entry);
    throw err;
  }
  L.callTimes.push(Date.now());
  valid.lastUsed = Date.now();
  valid.uses = (valid.uses || 0) + 1;
  acc.usage = (acc.usage || 0) + 1;
  if (provider === 'openai') {
    const cost = 0.0007 + Math.random() * 0.0006;
    S.account.openai.credits = Math.max(0, +(S.account.openai.credits - cost).toFixed(4));
    S.account.openai.spent = +((S.account.openai.spent || 0) + cost).toFixed(4);
  }
  entry.status = 200;
  return entry;
}

function finishLog(entry, result) {
  if (!entry) return;
  const text = JSON.stringify(result);
  entry.response =
    entry.provider === 'gemini'
      ? { candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 180 + Math.floor(Math.random() * 60), candidatesTokenCount: Math.floor(text.length / 2.4), totalTokenCount: 0 }, modelVersion: entry.model }
      : { id: 'chatcmpl-' + uid(), object: 'chat.completion', model: entry.model, choices: [{ index: 0, message: { role: 'assistant', content: text }, finish_reason: 'stop' }], usage: { prompt_tokens: 190 + Math.floor(Math.random() * 60), completion_tokens: Math.floor(text.length / 2.4) } };
  if (entry.provider === 'gemini') entry.response.usageMetadata.totalTokenCount = entry.response.usageMetadata.promptTokenCount + entry.response.usageMetadata.candidatesTokenCount;
  updateLog(entry);
}

function pushLog(entry) {
  S.L.apiLog.unshift(entry);
  S.L.apiLog = S.L.apiLog.slice(0, 30);
  emit('api:log', { entry });
}
function updateLog(entry) {
  const i = S.L.apiLog.findIndex((e) => e.id === entry.id);
  if (i >= 0) S.L.apiLog[i] = entry;
  emit('api:log', { entry });
}

/* ---------------- 시트 ---------------- */
function sheetRows(name, headers) {
  const sh = curScript && curScript.bound ? S.L.sheets[curScript.bound] : null;
  if (!sh) {
    const e = new GasError("TypeError: Cannot read properties of null (reading 'getSheetByName')");
    e.kind = 'no_sheet';
    throw e;
  }
  if (!sh.tabs[name]) {
    sh.tabs[name] = [headers.slice()];
    sh.order = sh.order || Object.keys(sh.tabs);
    if (!sh.order.includes(name)) sh.order.push(name);
  }
  return sh.tabs[name];
}
function stamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

/* ---------------- 데이터 찾기 ---------------- */
function findWord(input) {
  const w = String(input || '').trim().toLowerCase();
  let hit = WORDS.find((x) => x.word === w);
  if (!hit) hit = WORDS.find((x) => x.word === w.replace(/(es|s|ed|ing)$/, ''));
  if (!hit && /[가-힣]/.test(w)) hit = WORDS.find((x) => norm(x.meaning).includes(norm(w)));
  if (!hit) hit = WORDS.find((x) => lev(x.word, w) <= 1 && w.length > 3);
  return hit || null;
}
function lev(a, b) {
  const m = a.length;
  const n = b.length;
  const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 1; j <= n; j++) d[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[m][n];
}
function subjectOf(an) {
  const name = an.subjectName || '';
  return Object.values(SUBJECTS).find((s) => s.name === name) || SUBJECTS.science;
}
function findItem(sj, term) {
  const t = norm(term);
  if (!t) return null;
  return (
    sj.items.find((it) => norm(it.term) === t || (it.keys || []).some((k) => norm(k) === t)) ||
    sj.items.find((it) => norm(it.term).includes(t) || t.includes(norm(it.term)) || (it.keys || []).some((k) => t.includes(norm(k)) || norm(k).includes(t))) ||
    null
  );
}
const dayIndex = (n) => Math.floor(Date.now() / 86400000) % n;

function grammarRules(sentence) {
  let s = sentence.trim();
  const issues = [];
  const fix = (re, to, reason) => {
    const m = s.match(re);
    if (m) {
      const right = typeof to === 'function' ? to(m) : to;
      issues.push({ wrong: m[0], right, reason });
      s = s.replace(m[0], right);
    }
  };
  const third = { go: 'goes', do: 'does', have: 'has', watch: 'watches', study: 'studies', like: 'likes', play: 'plays', want: 'wants', eat: 'eats', read: 'reads', live: 'lives', walk: 'walks', make: 'makes', love: 'loves', need: 'needs', get: 'gets' };
  fix(/\b(He|She|It|My (?:mom|dad|friend|brother|sister|teacher))\s+(go|do|have|watch|study|like|play|want|eat|read|live|walk|make|love|need|get)\b/i, (m) => `${m[1]} ${third[m[2].toLowerCase()]}`, '주어가 3인칭 단수이고 현재 시제이므로 동사 모양을 바꿔야 해요.');
  const past = { went: 'go', ate: 'eat', saw: 'see', did: 'do', came: 'come', had: 'have', made: 'make', took: 'take', bought: 'buy', played: 'play', watched: 'watch' };
  fix(/\b(didn't|did not|doesn't|don't|does not|do not)\s+(went|ate|saw|did|came|had|made|took|bought|played|watched)\b/i, (m) => `${m[1]} ${past[m[2].toLowerCase()]}`, 'do, does, did 뒤에는 동사원형을 써요.');
  fix(/\b(can|will|should|must|may)\s+(\w+?)(es|s|ed)\b/i, (m) => `${m[1]} ${m[2]}`, '조동사 뒤에는 동사원형을 써요.');
  fix(/\bI am agree\b/i, 'I agree', 'agree는 동사이므로 am 없이 씁니다.');
  fix(/\ba ([aeiou]\w*)/i, (m) => `an ${m[1]}`, '모음 소리로 시작하는 단어 앞에는 a 대신 an을 써요.');
  fix(/\ban ([bcdfgjklmnpqrstvwxyz]\w*)/i, (m) => `a ${m[1]}`, '자음 소리로 시작하는 단어 앞에는 an 대신 a를 써요.');
  fix(/\binformations\b/i, 'information', 'information은 셀 수 없는 명사라서 -s를 붙이지 않아요.');
  fix(/(^|\s)i(\s|')/, (m) => `${m[1]}I${m[2]}`, '나를 뜻하는 I는 항상 대문자로 써요.');
  if (/^[a-z]/.test(s)) {
    issues.push({ wrong: s[0], right: s[0].toUpperCase(), reason: '문장의 첫 글자는 대문자로 써요.' });
    s = s[0].toUpperCase() + s.slice(1);
  }
  if (!/[.!?]$/.test(s)) {
    issues.push({ wrong: '(문장 끝)', right: '.', reason: '문장 끝에는 마침표나 물음표를 붙여요.' });
    s += '.';
  }
  return { corrected: s, issues };
}

/* ---------------- 서버 함수 ---------------- */
const SERVER = {
  async getQuizQuestions(an, [category]) {
    const prompt = '누구나 알 만한 유명한 영화 10편으로 이모티콘 영화 퀴즈를 만들어 줘.\n' + (category && category !== '전체' ? `영화 분야는 ${category}(으)로 정해 줘.\n` : '') + '각 문제는 영화 내용을 나타내는 이모티콘 3~5개, 추가 힌트 한 문장, 정답 영화 제목, 정답을 포함한 보기 4개로 만들어 줘.\n다음 JSON 형식으로만 답해 줘. ...';
    const entry = await aiCall(an, 'getQuizQuestions', prompt);
    let pool = MOVIES;
    if (category && category !== '전체') pool = MOVIES.filter((m) => m.category === category);
    const chosen = pick(pool, 10);
    const questions = chosen.map((m) => {
      const same = MOVIES.filter((x) => x.title !== m.title && x.category === m.category);
      const others = pick(same.length >= 3 ? same : MOVIES.filter((x) => x.title !== m.title), 3).map((x) => x.title);
      return { emoji: m.emoji, hint: m.hint, answer: m.title, choices: pick([m.title, ...others]) };
    });
    finishLog(entry, { questions });
    emit('app:quizLoaded', { category });
    if (category && category !== '전체') emit('app:feature', { feature: 'category' });
    return questions;
  },

  async getExamples(an, [word]) {
    const prompt = `영어 단어 "${word}"를 중학생에게 설명해 줘.\n뜻, 발음 기호, 품사, 중학교 수준 예문 3개와 한국어 해석, 기억하기 쉬운 팁을 다음 JSON 형식으로만 답해 줘. ...`;
    const entry = await aiCall(an, 'getExamples', prompt);
    const hit = findWord(word);
    let data;
    if (hit) {
      data = { word: hit.word, meaning: hit.meaning, pronunciation: hit.ipa, pos: hit.pos, examples: hit.examples, tip: hit.tip };
    } else {
      const w = String(word).trim();
      const sample = pick(WORDS, 5).map((x) => x.word).join(', ');
      data = {
        word: w,
        meaning: '(시뮬레이션 데이터에 없는 단어예요)',
        pronunciation: '',
        pos: '안내',
        examples: [
          { en: `I want to learn the word "${w}" today.`, ko: `나는 오늘 "${w}"라는 단어를 배우고 싶어.` },
          { en: `Can you use "${w}" in a sentence?`, ko: `"${w}"를 넣어 문장을 만들 수 있니?` },
          { en: `My teacher will explain "${w}" in class.`, ko: `선생님께서 수업 시간에 "${w}"를 설명해 주실 거야.` },
        ],
        tip: `이 시뮬레이션은 중학교 필수 단어 ${WORDS.length}개를 준비해 두었어요. 예: ${sample}`,
      };
    }
    const rows = sheetRows('학습내역', ['날짜', '단어', '뜻', '예문1', '예문2', '예문3']);
    rows.push([stamp(), data.word, data.meaning, data.examples[0].en, data.examples[1].en, data.examples[2].en]);
    finishLog(entry, data);
    emit('app:examples', { word: data.word, found: !!hit });
    emit('sheet:changed');
    return data;
  },

  async getHistory(an) {
    const headers = an.app === 'helper' ? ['날짜', '개념', '단원', '설명'] : ['날짜', '단어', '뜻', '예문1', '예문2', '예문3'];
    const rows = sheetRows('학습내역', headers);
    const headerless = rows.slice(1);
    const isHelper = rows[0] && rows[0][1] === '개념';
    emit('app:history');
    return headerless
      .slice()
      .reverse()
      .map((r) => (isHelper ? { date: r[0], term: r[1], unit: r[2], explain: r[3] } : { date: r[0], word: r[1], meaning: r[2], examples: [r[3], r[4], r[5]] }));
  },

  async translateSentence(an, [ko]) {
    const entry = await aiCall(an, 'translateSentence', `다음 한글 문장을 영어로 번역해 줘: "${ko}"\n중학교 수준의 쉬운 번역(basic)과 원어민이 실제로 쓰는 자연스러운 표현(natural), 두 표현의 차이 설명(note)을 다음 JSON 형식으로만 답해 줘. ...`);
    const t = norm(ko);
    let best = null;
    let bestScore = 0;
    TRANSLATIONS.forEach((x) => {
      let sc = 0;
      if (norm(x.ko) === t) sc = 100;
      (x.keys || []).forEach((k) => {
        if (t.includes(norm(k))) sc += 10;
      });
      const a = new Set(norm(x.ko));
      const overlap = [...new Set(t)].filter((c) => a.has(c)).length / Math.max(1, new Set(t).size);
      sc += overlap * 10;
      if (sc > bestScore) {
        bestScore = sc;
        best = x;
      }
    });
    let data;
    if (best && bestScore >= 17) data = { basic: best.basic, natural: best.natural, note: best.note };
    else {
      const ex = pick(TRANSLATIONS, 3).map((x) => x.ko);
      data = { basic: '(시뮬레이션) 준비된 문장과 비슷하게 입력해 보세요.', natural: 'Try one of the sample sentences below.', note: '예시 문장: ' + ex.join(' / ') };
    }
    finishLog(entry, data);
    emit('app:feature', { feature: 'translate' });
    return data;
  },

  async checkGrammar(an, [sentence]) {
    const entry = await aiCall(an, 'checkGrammar', `중학생이 쓴 영어 문장을 검사해 줘: "${sentence}"\n틀린 부분(wrong), 고친 표현(right), 이유(reason)를 쉬운 한국어로 알려 주고 ... JSON 형식으로만 답해 줘.`);
    const t = norm(sentence);
    const sample = GRAMMAR_SAMPLES.find((g) => norm(g.input) === t);
    let data;
    if (sample) data = { corrected: sample.corrected, issues: sample.issues, praise: sample.praise };
    else {
      const r = grammarRules(sentence);
      data = { corrected: r.corrected, issues: r.issues, praise: r.issues.length ? '끝까지 영어로 문장을 써 본 점이 좋아요.' : '자주 틀리는 문법 오류는 보이지 않아요. 잘 썼어요!' };
    }
    finishLog(entry, data);
    emit('app:feature', { feature: 'grammar' });
    return data;
  },

  async getTodayWord(an) {
    const entry = await aiCall(an, 'getTodayWord', `중학생이 꼭 기억해야 하는 영어 단어 하나를 골라 오늘의 단어로 알려 줘. 오늘 날짜는 ${new Date().toDateString()}이야. ...`);
    const w = findWord(TODAY_PICKS[dayIndex(TODAY_PICKS.length)]) || WORDS[0];
    const data = { word: w.word, meaning: w.meaning, pronunciation: w.ipa, example: w.examples[0], explain: w.tip };
    finishLog(entry, data);
    emit('app:feature', { feature: 'today' });
    return data;
  },

  async getInterestContent(an, [topic, level]) {
    const entry = await aiCall(an, 'getInterestContent', `중학생이 좋아하는 주제 "${topic}"에 대해 ${level} 난이도의 짧은 영어 글을 써 줘. ...`);
    const t = norm(topic);
    const tp = INTEREST_TOPICS.find((x) => norm(x.topic) === t || (x.keys || []).some((k) => t.includes(norm(k)) || norm(k).includes(t)));
    let data;
    if (tp) {
      const lv = tp.levels[level] || tp.levels['보통'];
      let question = null;
      if (lv.question) {
        const correct = lv.question.choices[lv.question.answer];
        const choices = pick(lv.question.choices);
        question = { q: lv.question.q, choices, answer: choices.indexOf(correct) };
      }
      data = { title: lv.title, passage: lv.passage, ko: lv.ko, vocab: lv.vocab, question };
    } else {
      data = {
        title: 'Choose a topic',
        passage: 'In this simulation, you can try these topics: ' + INTEREST_TOPICS.map((x) => x.topic).join(', ') + '.',
        ko: '시뮬레이션에서는 ' + INTEREST_TOPICS.map((x) => x.topic).join(', ') + ' 주제를 체험할 수 있어요.',
        vocab: [],
        question: null,
      };
    }
    finishLog(entry, data);
    emit('app:feature', { feature: 'interest' });
    return data;
  },

  async getReviewQuiz(an) {
    const rows = sheetRows('학습내역', ['날짜', '단어', '뜻', '예문1', '예문2', '예문3']).slice(1);
    const seen = new Set();
    const words = rows
      .slice()
      .reverse()
      .filter((r) => {
        if (seen.has(r[1]) || !findWord(r[1])) return false;
        seen.add(r[1]);
        return true;
      })
      .slice(0, 10);
    if (!words.length) throw new GasError('먼저 단어를 학습해 주세요.');
    const entry = await aiCall(an, 'getReviewQuiz', '다음 단어로 중학생용 복습 퀴즈를 만들어 줘: ' + words.map((r) => `${r[1]}(${r[2]})`).join(', ') + ' ...');
    const questions = words.map((r) => {
      const others = pick(WORDS.filter((x) => x.word !== r[1]), 3).map((x) => x.word);
      return { question: `'${r[2]}'을(를) 뜻하는 영어 단어는 무엇일까요?`, choices: pick([r[1], ...others]), answer: r[1], word: r[1] };
    });
    finishLog(entry, { questions });
    emit('app:feature', { feature: 'review' });
    return questions;
  },

  async saveWrong(an, [item]) {
    const rows = sheetRows('오답노트', ['날짜', '단어', '문제', '내가 고른 답', '정답']);
    rows.push([stamp(), item.word, item.question, item.mine, item.answer]);
    emit('sheet:changed');
    return true;
  },

  async explainTerm(an, [term]) {
    const sj = subjectOf(an);
    const entry = await aiCall(an, 'explainTerm', `중학교 ${sj.name} 개념 "${term}"을(를) 중학생 눈높이로 설명해 줘.\n쉬운 설명(explain), 생활 속 예시(example), 함께 알아 두면 좋은 개념 2~3개(related)를 다음 JSON 형식으로만 답해 줘. ...`);
    const it = findItem(sj, term);
    let data;
    if (it) data = { term: it.term, unit: it.unit, explain: it.explain, example: it.example, related: it.related };
    else
      data = {
        term: String(term),
        unit: '안내',
        explain: `이 시뮬레이션에는 ${sj.name} 개념 ${sj.items.length}개가 준비되어 있어요. 아래 개념을 눌러 보세요.`,
        example: '실제 API를 연결하면 어떤 개념이든 설명을 만들어 줍니다.',
        related: pick(sj.items, 4).map((x) => x.term),
      };
    const rows = sheetRows('학습내역', ['날짜', '개념', '단원', '설명']);
    rows.push([stamp(), data.term, data.unit, data.explain]);
    finishLog(entry, data);
    emit('app:examples', { term: data.term, found: !!it });
    emit('sheet:changed');
    return data;
  },

  async makeQuiz(an, [term]) {
    const sj = subjectOf(an);
    const entry = await aiCall(an, 'makeQuiz', `중학교 ${sj.name} 개념 "${term}"을(를) 확인하는 퀴즈 2문제를 만들어 줘. ...`);
    const it = findItem(sj, term) || pick(sj.items, 1)[0];
    const questions = it.quiz.map((q) => ({ q: q.q, type: q.type, choices: q.choices, answer: q.answer, why: q.why }));
    finishLog(entry, { questions });
    emit('app:feature', { feature: 'quiz' });
    return questions;
  },

  async compareConcept(an, [term]) {
    const sj = subjectOf(an);
    const entry = await aiCall(an, 'compareConcept', `중학교 ${sj.name} 개념 "${term}"과(와) 학생들이 가장 헷갈려하는 개념 하나를 골라 비교해 줘. ...`);
    const it = findItem(sj, term) || pick(sj.items, 1)[0];
    const data = { a: it.term, b: it.compare.with, point: it.compare.point };
    finishLog(entry, data);
    emit('app:feature', { feature: 'compare' });
    return data;
  },

  async getTodayConcept(an) {
    const sj = subjectOf(an);
    const entry = await aiCall(an, 'getTodayConcept', `중학교 ${sj.name}에서 꼭 알아야 하는 개념 하나를 골라 오늘의 개념으로 소개해 줘. ...`);
    const it = sj.items[dayIndex(sj.items.length)];
    const data = { term: it.term, explain: it.explain, example: it.example };
    finishLog(entry, data);
    emit('app:feature', { feature: 'today' });
    return data;
  },
};

// 웹앱(index.html)에서 google.script.run 으로 부른 함수를 처리합니다.
export async function runServer(an, fn, args, script) {
  curScript = script;
  const t0 = performance.now();
  const exec = { id: uid('x'), time: nowTime(), fn, type: '웹 앱', status: '실행 중' };
  S.L.execLog.unshift(exec);
  S.L.execLog = S.L.execLog.slice(0, 40);
  try {
    let result;
    if (SERVER[fn]) result = await SERVER[fn](an, args || []);
    else result = null; // 학생이 직접 만든 함수는 빈 값을 돌려줌
    exec.status = '완료';
    exec.ms = Math.round(performance.now() - t0);
    if (isAIFunc(fn)) {
      S.L.lastError = null;
      emit('app:success', { fn });
    } else emit('app:call', { fn });
    return result;
  } catch (e) {
    exec.status = '실패';
    exec.ms = Math.round(performance.now() - t0);
    exec.error = e.message;
    S.L.lastError = { kind: e.kind || 'other', message: e.message, fn, model: an.model, provider: an.provider, propName: an.propName, at: Date.now() };
    emit('app:error', { kind: e.kind, fn });
    throw e;
  }
}

export function currentModelFor(provider) {
  return MODELS[provider].current;
}
