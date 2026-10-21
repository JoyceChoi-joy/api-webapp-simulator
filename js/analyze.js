// 학생이 붙여 넣은 Apps Script 코드를 살펴보고 어떻게 동작할지 판단합니다.
import { MODELS } from './config.js';

export function syntaxCheck(code, fileName = 'Code.gs') {
  const t = code.trim();
  if (t.startsWith('<')) {
    return { ok: false, line: 1, message: "SyntaxError: Unexpected token '<'", file: fileName };
  }
  try {
    // 실행하지 않고 문법만 검사합니다.
    // eslint-disable-next-line no-new-func
    new Function(code);
    return { ok: true };
  } catch (e) {
    if (e instanceof SyntaxError) {
      return { ok: false, line: guessLine(code, e), message: 'SyntaxError: ' + e.message, file: fileName };
    }
    return { ok: true }; // 보안 정책 등으로 검사할 수 없으면 통과
  }
}

function guessLine(code, e) {
  const m = String(e.stack || '').match(/<anonymous>:(\d+)/);
  if (m) return Math.max(1, Number(m[1]) - 2);
  return 1;
}

export function listFunctions(gs) {
  const out = [];
  const re = /function\s+([A-Za-z_$][\w$]*)\s*\(/g;
  let m;
  while ((m = re.exec(gs))) out.push(m[1]);
  return out;
}

// files: [{ name, type: 'gs'|'html', content }]
export function analyzeFiles(files) {
  const gsFiles = files.filter((f) => f.type === 'gs');
  const gs = gsFiles.map((f) => f.content).join('\n');
  const htmlFiles = files.filter((f) => f.type === 'html');
  const fns = listFunctions(gs);
  const htmlName = (gs.match(/createHtmlOutputFromFile\(\s*['"]([^'"]+)['"]/) || [])[1] || null;
  const htmlFile = htmlName ? htmlFiles.find((f) => f.name === htmlName) : null;
  const html = htmlFile ? htmlFile.content : '';

  let provider = null;
  if (/generativelanguage\.googleapis\.com/.test(gs)) provider = 'gemini';
  else if (/api\.openai\.com/.test(gs)) provider = 'openai';

  let model = (gs.match(/const\s+MODEL\s*=\s*['"]([^'"]+)['"]/) || [])[1] || null;
  if (!model) model = (gs.match(/models\/([\w.\-]+):generateContent/) || [])[1] || null;
  if (!model) model = (gs.match(/model\s*:\s*['"]([^'"]+)['"]/) || [])[1] || null;

  const propName = (gs.match(/getProperty\(\s*['"]([^'"]+)['"]\s*\)/) || [])[1] || null;
  const hardKey = /['"](AIza[\w-]{30,}|sk-[\w-]{20,})['"]/.test(gs);

  let app = null;
  if (fns.includes('getQuizQuestions')) app = 'quiz';
  else if (fns.includes('getExamples')) app = 'english';
  else if (fns.includes('explainTerm')) app = 'helper';

  const subjectName = (gs.match(/const\s+SUBJECT\s*=\s*['"]([^'"]+)['"]/) || [])[1] || null;
  const title = (gs.match(/setTitle\(\s*['"]([^'"]+)['"]/) || [])[1] || null;

  const has = (fn) => fns.includes(fn) && html.includes(fn);
  const features = [];
  if (app === 'quiz' && /getQuizQuestions\s*\(\s*category/.test(gs) && html.includes('id="category"')) features.push('category');
  if (has('translateSentence')) features.push('translate');
  if (has('checkGrammar')) features.push('grammar');
  if (has('getTodayWord') || has('getTodayConcept')) features.push('today');
  if (has('getInterestContent')) features.push('interest');
  if (has('getReviewQuiz')) features.push('review');
  if (has('makeQuiz')) features.push('quiz');
  if (has('compareConcept')) features.push('compare');

  const htmlLooksLikeHtml = /<html|<!doctype|<body|<div/i.test(html);
  const htmlLooksLikeGs = /function\s+doGet|HtmlService|PropertiesService/.test(html) && !htmlLooksLikeHtml;

  const scopes = [];
  if (/UrlFetchApp/.test(gs)) scopes.push('external');
  if (/SpreadsheetApp/.test(gs)) scopes.push('sheets');

  const modelInfo = modelStatus(provider, model);

  return {
    gs,
    html,
    fns,
    hasDoGet: fns.includes('doGet'),
    htmlName,
    htmlFound: !!htmlFile,
    htmlLooksLikeGs,
    htmlLooksLikeHtml,
    provider,
    model,
    modelInfo,
    propName,
    hardKey,
    app,
    subjectName,
    title,
    features,
    scopes,
    usesSheet: /SpreadsheetApp/.test(gs),
    syntax: gsFiles.map((f) => syntaxCheck(f.content, f.name + '.gs')).find((r) => !r.ok) || { ok: true },
  };
}

export function modelStatus(provider, model) {
  if (!provider || !model) return { ok: false, reason: 'unknown' };
  const m = MODELS[provider];
  if (m.valid.includes(model)) return { ok: true };
  return { ok: false, reason: 'not_found' };
}
