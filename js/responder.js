// Gemini 채팅의 답변을 만드는 규칙 (시뮬레이션)
import { S } from './state.js';
import { MODELS, PROVIDERS, LESSONS } from './config.js';
import { generateCode } from './codegen.js';
import { SUBJECTS } from './data/subjects.js';

const FEATURES = {
  quiz: ['category'],
  english: ['translate', 'grammar', 'today', 'interest', 'review'],
  helper: ['quiz', 'compare', 'today'],
};
const FEATURE_NAME = {
  category: '영화 카테고리(분야) 선택',
  translate: '한글 문장 → 영어 번역',
  grammar: '영작 문법 체크',
  today: '접속하면 오늘의 학습 내용 보여 주기',
  interest: '관심사 기반 맞춤형 영어 콘텐츠',
  review: '학습 내역 복습 퀴즈와 오답노트',
  quiz: '개념 확인 퀴즈',
  compare: '헷갈리는 개념 비교',
};

const has = (t, re) => re.test(t);

function detectProvider(t) {
  if (has(t, /openai|오픈\s?ai|오픈에이아이|gpt|챗\s?gpt|chatgpt/i)) return 'openai';
  if (has(t, /제미나이|gemini|재미나이/i)) return 'gemini';
  return null;
}

function detectProp(t) {
  const m = t.match(/\b([A-Z][A-Z0-9]*(?:_[A-Z0-9]+)*_KEY)\b/);
  return m ? m[1] : null;
}

export function detectSubject(t) {
  if (has(t, /영어|영단어|english/i)) return 'english';
  if (has(t, /수학|방정식|함수|도형|계산/)) return 'math';
  if (has(t, /과학|물리|화학|생명|지구과학|실험/)) return 'science';
  if (has(t, /사회|역사|지리|경제|정치|법/)) return 'social';
  if (has(t, /국어|문학|맞춤법|품사|비유/)) return 'korean';
  return null;
}

function detectFeatures(t, app) {
  const f = [];
  if (app === 'quiz' && has(t, /카테고리|분야|장르|종류를?\s?(선택|고를|지정)/)) f.push('category');
  if (app === 'english') {
    if (has(t, /번역|한글\s?문장|영어\s?문장으로/)) f.push('translate');
    if (has(t, /문법|영작|오류를?\s?체크|틀린\s?(부분|곳)/)) f.push('grammar');
    if (has(t, /관심|좋아하는\s?주제|맞춤형\s?영어|난이도/)) f.push('interest');
    if (has(t, /복습|오답|틀린\s?문(제|항)|AI\s?퀴즈|퀴즈/i)) f.push('review');
  }
  if (app === 'helper') {
    if (has(t, /퀴즈|ox|문제|확인/i)) f.push('quiz');
    if (has(t, /비교|헷갈|차이/)) f.push('compare');
  }
  if (app !== 'quiz' && has(t, /접속|첫\s?(페이지|화면)|오늘의|알아서|자동으로|물어보지\s?않아도/)) f.push('today');
  return f;
}

function appFromText(t) {
  if (has(t, /이모티콘|영화\s?퀴즈|영화/)) return 'quiz';
  if (S.lesson === '3-7') return 'helper';
  if (has(t, /영어|단어|예문/)) return 'english';
  return null;
}

function isErrorText(t) {
  return has(t, /오류|에러|error|exception|not found|does not exist|\b40[0-4]\b|\b429\b|안\s?돼|안\s?됨|작동하지|실행이 안|실패|문제가 생|고쳐|수정해\s?줘|invalid|quota/i);
}

function errorKindFromText(t) {
  if (has(t, /is not found for API version|does not exist or you do not have access|model_not_found|NOT_FOUND/i)) return 'model_not_found';
  if (has(t, /API key not valid|Incorrect API key|API_KEY_INVALID|invalid_api_key/i)) return 'key_invalid';
  if (has(t, /insufficient permissions|Missing scopes/i)) return 'key_perm';
  if (has(t, /insufficient_quota|check your plan and billing/i) && has(t, /openai/i)) return 'quota';
  if (has(t, /RESOURCE_EXHAUSTED|rate limit|Please retry in/i)) return 'rate_limit';
  if (has(t, /스크립트 속성에 .* 값이 없습니다/)) return 'key_missing';
  if (has(t, /doGet/)) return 'no_doget';
  if (has(t, /HTML 파일을 찾을 수 없|No HTML file/i)) return 'no_html';
  if (has(t, /SyntaxError|구문 오류/i)) return 'syntax';
  if (has(t, /getSheetByName|Cannot read properties of null/i)) return 'no_sheet';
  return null;
}

function titleFor(app, subjectId) {
  if (app === 'quiz') return '이모티콘 영화 퀴즈';
  if (app === 'english') return S.lesson === '3-7' ? '영어 AI 학습 도우미' : '영어 공부 AI 도우미';
  const sj = SUBJECTS[subjectId] || SUBJECTS.science;
  return `${sj.name} AI 학습 도우미`;
}

function buildGen(base) {
  const o = Object.assign({}, base);
  if (o.app === 'helper') o.subject = SUBJECTS[o.subjectId] || SUBJECTS.science;
  o.title = titleFor(o.app, o.subjectId);
  const code = generateCode(o);
  return Object.assign(o, code, { at: Date.now() });
}

function codeSection(gen, { onlyGs = false, intro = true } = {}) {
  let md = '';
  md += `### 1. 백엔드 파일 (Code.gs)\n`;
  if (intro) md += `Apps Script 편집기에서 \`Code.gs\` 파일의 내용을 **모두 지우고** 아래 코드를 붙여 넣으세요.\n`;
  md += '```javascript Code.gs\n' + gen.gs + '\n```\n';
  if (!onlyGs) {
    md += `### 2. 프론트엔드 파일 (index.html)\n`;
    if (intro) md += `왼쪽 [파일] 옆의 **＋** → **HTML**을 눌러 이름을 \`index\`로 정한 뒤, 기본 내용을 모두 지우고 아래 코드를 붙여 넣으세요.\n`;
    md += '```html index.html\n' + gen.html + '\n```\n';
  }
  return md;
}

function deploySteps(isUpdate) {
  if (isUpdate)
    return `### 반영하는 방법\n1. 바뀐 파일의 내용을 모두 지우고 새 코드를 붙여 넣은 뒤 💾 **저장**합니다.\n2. 오른쪽 위 **[배포] → [배포 관리]**를 누릅니다.\n3. 연필 모양(✏️)을 누르고 **버전**에서 **새 버전**을 선택합니다.\n4. 설명을 적고 **[배포]**를 누른 뒤, 웹앱 탭을 새로고침합니다.\n`;
  return `### 3. 웹앱 배포 방법\n1. 💾 **저장** 버튼(Ctrl+S)을 눌러 두 파일을 저장합니다.\n2. 오른쪽 위 **[배포] → [새 배포]**를 누르고 ⚙ 톱니바퀴에서 **웹 앱**을 선택합니다.\n3. **액세스 권한이 있는 사용자**를 **모든 사용자**로 바꾸고 **[배포]**를 누릅니다.\n4. 권한 승인 창이 나오면 계정을 고르고 **고급 → (안전하지 않음)으로 이동 → 허용**을 차례로 누릅니다.\n5. 만들어진 **웹 앱 URL**을 눌러 실행해 보세요.\n`;
}

function explainSection(gen) {
  const P = PROVIDERS[gen.provider];
  let md = `### 코드 설명\n`;
  md += `- \`doGet()\`: 웹앱 주소로 접속하면 \`index.html\` 화면을 보여 줍니다.\n`;
  md += `- \`askAI(prompt)\`: 스크립트 속성에 저장한 \`${gen.propName}\` 값을 꺼내 ${P.name}에 요청을 보내고 답을 받아 옵니다. API 키를 코드에 직접 쓰지 않아서 안전해요.\n`;
  if (gen.app === 'quiz') md += `- \`getQuizQuestions()\`: AI에게 보낼 요구 사항을 \`prompt\` 변수에 미리 적어 두었어요. [퀴즈 시작하기]를 누를 때마다 새 문제가 만들어집니다.\n`;
  if (gen.app === 'english') md += `- \`getExamples(word)\`: 단어 설명과 예문을 받아 **학습내역** 시트에 한 줄씩 기록합니다.\n- 🔊 버튼은 키 발급이 필요 없는 **Web Speech API**(\`speechSynthesis\`)로 발음을 들려줍니다.\n`;
  if (gen.app === 'helper') md += `- \`explainTerm(term)\`: 개념 설명을 받아 **학습내역** 시트에 기록합니다.\n`;
  md += `- \`google.script.run\`: index.html(화면)에서 Code.gs(서버)의 함수를 부르는 통로예요.\n`;
  return md;
}

/* ------------------------------------------------------------------ */
export function respond(text) {
  const t = text.trim();
  const L = S.L;
  const prev = L.gen;

  // 1) 오류 해결 요청
  const featureAsk = has(t, /기능을?\s?(추가|넣어|더해|만들어)|추가해|code\.gs와|index\.html을/i);
  if (errorKindFromText(t) || (isErrorText(t) && !featureAsk && prev)) {
    return fixResponse(t);
  }

  // 2) 코드 만들기 / 기능 추가
  const wantsCode = has(t, /code\.gs|index\.html|웹\s?앱|웹앱|앱스\s?스크립트|apps\s?script|만들어|추가해|기능|바꿔/i);
  let app = appFromText(t);
  if (!app && prev && wantsCode) app = prev.app;
  if (!app && wantsCode) app = LESSONS[S.lesson].app;

  if (app && wantsCode) {
    const isNewBuild = has(t, /code\.gs|index\.html/i) || !prev || prev.app !== app;
    let subjectId = prev && prev.app === app ? prev.subjectId : null;
    if (app === 'helper' || (S.lesson === '3-7' && app === 'english')) {
      const sj = detectSubject(t) || (isNewBuild ? null : subjectId) || L.worksheet.subject || null;
      if (!sj) {
        return { md: `좋아요! 어떤 과목의 학습 도우미를 만들까요? 프롬프트에 **과목 이름**(예: 수학, 과학, 사회, 국어, 영어)과 필요한 기능을 함께 적어 주면 그에 맞게 코드를 만들어 드릴게요.` };
      }
      if (sj === 'english') app = 'english';
      else {
        app = 'helper';
        subjectId = sj;
      }
    }
    const feats = detectFeatures(t, app);
    if (!isNewBuild && prev && prev.app === app) return featureResponse(t, prev, feats);
    return createResponse(t, app, subjectId, feats);
  }

  // 3) 개념 질문
  return conceptResponse(t);
}

function createResponse(t, app, subjectId, feats) {
  const L = S.L;
  const provider = detectProvider(t) || S.provider;
  const named = detectProp(t);
  const mentionsProps = has(t, /스크립트\s?속성|script\s?propert/i);
  let propName = named || 'API_KEY';
  const useOld = L.settings.debugScenario && !L.flags['chat:modelFixed'] && !L.flags['chat:createdOnce'];
  const model = useOld ? MODELS[provider].retired : MODELS[provider].current;
  const gen = buildGen({ app, provider, model, propName, features: feats, subjectId });
  const P = PROVIDERS[provider];
  let md = '';
  const what = app === 'quiz' ? '친구들과 즐길 수 있는 **이모티콘 영화 퀴즈**' : app === 'english' ? `중학생을 위한 **${gen.title}**` : `**${gen.title}**`;
  md += `좋아요! ${what} 웹앱을 Google Apps Script로 만들 수 있도록 **Code.gs**(백엔드)와 **index.html**(프론트엔드) 코드를 준비했어요. ${P.name}는 Code.gs에서 \`UrlFetchApp\`으로 호출하고, API 키는 스크립트 속성에서 꺼내 씁니다.\n\n`;
  if (!named) {
    md += mentionsProps
      ? `> ⚠️ 스크립트 속성의 이름을 알려 주지 않아서 \`API_KEY\`라는 이름을 쓰도록 만들었어요. 저장한 속성 이름이 다르면 코드의 \`getProperty('API_KEY')\` 부분을 저장한 이름으로 바꿔 주세요.\n\n`
      : `> ⚠️ API 키를 어디에 저장했는지 알려 주지 않아서 스크립트 속성의 \`API_KEY\`라는 이름으로 키를 꺼내도록 만들었어요. [프로젝트 설정] → [스크립트 속성]에 같은 이름으로 키를 저장해 주세요.\n\n`;
  }
  if (feats.length) md += `요청한 추가 기능(${feats.map((f) => FEATURE_NAME[f]).join(', ')})도 함께 넣었어요.\n\n`;
  md += codeSection(gen);
  md += deploySteps(false);
  md += '\n' + explainSection(gen);
  md += `\n궁금한 점이나 오류가 생기면 오류 메시지를 그대로 붙여 넣어 주세요. 함께 고쳐 볼게요! 😊`;
  return { md, gen, kind: 'create' };
}

function featureResponse(t, prev, feats) {
  const avail = FEATURES[prev.app];
  const add = feats.filter((f) => avail.includes(f) && !prev.features.includes(f));
  const already = feats.filter((f) => prev.features.includes(f));
  if (!add.length) {
    if (already.length)
      return { md: `요청한 기능(${already.map((f) => FEATURE_NAME[f]).join(', ')})은 이미 코드에 들어 있어요. 웹앱에서 보이지 않는다면 새 코드를 붙여 넣고 저장한 뒤 **[배포 관리] → 새 버전**으로 다시 배포했는지 확인해 보세요.` };
    const list = avail.filter((f) => !prev.features.includes(f)).map((f) => `- ${FEATURE_NAME[f]}`).join('\n');
    return {
      md: `좋은 아이디어예요! 다만 이 시뮬레이션에서는 미리 준비된 기능만 실제로 동작해요. 지금 웹앱에 더할 수 있는 기능은 다음과 같아요.\n\n${list || '- (모든 기능을 이미 추가했어요!)'}\n\n원하는 기능을 프롬프트로 구체적으로 요청해 보세요. 예: "한글 문장을 입력하면 영어 문장으로 번역해 주는 기능을 추가해 줘."`,
    };
  }
  const gen = buildGen({ app: prev.app, provider: prev.provider, model: prev.model, propName: prev.propName, features: prev.features.concat(add), subjectId: prev.subjectId });
  let md = `좋아요! **${add.map((f) => FEATURE_NAME[f]).join(', ')}** 기능을 추가했어요. 기존 기능은 그대로 두고 새 기능을 더한 **전체 코드**예요. 두 파일 모두 바뀌었으니 각각 전체를 바꿔 붙여 넣으세요.\n\n`;
  if (add.includes('today')) md += `> 💡 이 기능은 사용자가 버튼을 누르지 않아도 웹앱에 **접속하는 순간 자동으로** AI에게 요청을 보내요. 스스로 알아서 도움을 주는 에이전트의 모습에 한 걸음 가까워졌어요.\n\n`;
  md += codeSection(gen);
  md += deploySteps(true);
  return { md, gen, kind: 'feature', added: add };
}

function fixResponse(t) {
  const L = S.L;
  const prev = L.gen;
  const kind = errorKindFromText(t) || (L.lastError && L.lastError.kind) || null;
  const P = prev ? PROVIDERS[prev.provider] : PROVIDERS[S.provider];
  if (kind === 'model_not_found' && prev) {
    const gen = buildGen({ app: prev.app, provider: prev.provider, model: MODELS[prev.provider].current, propName: prev.propName, features: prev.features, subjectId: prev.subjectId });
    let md = `오류 메시지를 보니 원인을 알겠어요. 🔍\n\n**원인:** 코드에서 사용한 모델 \`${esc(prev.model)}\`은(는) 서비스가 끝나서 더 이상 사용할 수 없는 모델이에요. 그래서 ${P.name} 서버가 "모델을 찾을 수 없다"는 **404 오류**를 돌려보냈어요. 생성형 AI는 학습한 시점의 정보로 코드를 만들기 때문에 이런 일이 종종 생겨요.\n\n**해결:** 지금 사용할 수 있는 모델 \`${gen.model}\`로 바꾼 Code.gs 전체 코드예요. **index.html은 바꾸지 않아도 돼요.**\n\n`;
    md += codeSection(gen, { onlyGs: true });
    md += deploySteps(true);
    md += `\n> 💡 Code.gs 맨 위의 \`const MODEL = '${gen.model}';\` 한 줄만 직접 고쳐도 같은 결과예요.`;
    return { md, gen, kind: 'fix', fixed: 'model' };
  }
  const tips = {
    key_invalid: `**원인:** ${P.name} 서버가 API 키가 올바르지 않다고 응답했어요(${prev && prev.provider === 'openai' ? '401' : '400'} 오류).\n\n**확인할 것**\n1. Apps Script **[프로젝트 설정] → [스크립트 속성]**에 저장한 값이 발급받은 키와 **정확히 같은지** 확인하세요. 앞뒤에 빈칸이 들어가거나 일부만 복사되지 않았나요?\n2. ${P.siteName}에서 키를 삭제(폐기)하지 않았는지 확인하세요.\n3. 키를 다시 복사해 스크립트 속성 값을 고친 뒤 **[스크립트 속성 저장]**을 누르세요.\n\n스크립트 속성은 코드가 실행될 때마다 새로 읽기 때문에 **다시 배포하지 않아도** 웹앱을 새로고침하면 바로 반영돼요.`,
    key_perm: `**원인:** API 키에 모델을 호출할 권한이 없어요. 키를 만들 때 Permissions를 **Restricted** 또는 **Read only**로 선택한 것 같아요.\n\n**해결:** OpenAI Platform의 **API keys**에서 **Permissions: All**로 새 키를 만들고, 스크립트 속성 값을 새 키로 바꿔 저장하세요.`,
    key_missing: `**원인:** 코드가 스크립트 속성에서 \`${prev ? prev.propName : 'API 키'}\`라는 이름의 값을 찾지 못했어요.\n\n**확인할 것**\n1. **[프로젝트 설정] → [스크립트 속성]**에 속성이 저장되어 있나요?\n2. 속성 **이름**이 코드의 \`getProperty('${prev ? prev.propName : '...'}')\` 안의 이름과 **대소문자까지 똑같은지** 확인하세요.\n3. 이름이 다르면 둘 중 하나를 고쳐 맞추세요. 코드를 고쳤다면 저장 후 **[배포 관리] → 새 버전**으로 다시 배포해야 해요.`,
    quota: `**원인:** OpenAI 계정의 **크레딧 잔액이 부족**해서 생긴 429 오류(insufficient_quota)예요. OpenAI API는 선불 크레딧을 충전해야 쓸 수 있어요.\n\n**해결:** OpenAI Platform → ⚙ Settings → **Billing**에서 크레딧을 충전한 뒤 웹앱을 다시 실행해 보세요. 코드는 고치지 않아도 돼요.`,
    rate_limit: `**원인:** 짧은 시간에 요청을 너무 많이 보내서 **분당 요청 한도**를 넘었어요(429 오류). 무료 등급은 1분에 보낼 수 있는 요청 수가 정해져 있어요.\n\n**해결:** 1분 정도 기다렸다가 다시 시도하세요. 버튼을 여러 번 연달아 누르지 않도록 주의해요.`,
    no_doget: `**원인:** 웹앱을 열 때 실행되는 \`doGet\` 함수를 찾지 못했어요. Code.gs에 백엔드 코드가 아닌 다른 내용이 들어 있거나, 저장 후 새 버전으로 배포하지 않은 것 같아요.\n\n**해결:** Code.gs에 백엔드 코드 전체를 붙여 넣고 저장한 뒤 **[배포 관리] → 새 버전**으로 다시 배포하세요.`,
    no_html: `**원인:** \`createHtmlOutputFromFile('index')\`가 찾는 **index** HTML 파일이 없어요.\n\n**해결:** [파일 ＋] → [HTML]로 이름이 정확히 \`index\`인 파일을 만들고 프론트엔드 코드를 붙여 넣은 뒤 저장하고 새 버전으로 배포하세요.`,
    syntax: `**원인:** 코드에 문법 오류가 있어요. 대부분 **HTML 코드를 Code.gs에 붙여 넣었거나**, 코드 일부만 복사했을 때 생겨요.\n\n**해결:** Code.gs에는 \`function doGet()\`으로 시작하는 백엔드 코드를, index.html에는 \`<!DOCTYPE html>\`로 시작하는 코드를 넣었는지 확인하세요. 코드 블록의 [코드 복사] 버튼으로 전체를 복사하면 실수를 줄일 수 있어요.`,
    no_sheet: `**원인:** 코드가 스프레드시트를 쓰는데 이 Apps Script는 스프레드시트와 연결되어 있지 않아요.\n\n**해결:** 스프레드시트를 만든 뒤 **[확장 프로그램] → [Apps Script]**로 연결된 프로젝트를 만들어 그곳에 코드를 넣으세요.`,
  };
  if (kind && tips[kind]) return { md: `오류 메시지를 확인했어요. 🔍\n\n${tips[kind]}`, kind: 'fixhelp', errKind: kind };
  return {
    md: `어떤 문제가 생겼는지 조금 더 알려 주세요. 웹앱 화면에 나온 **오류 메시지 전체**를 복사해서 붙여 넣어 주면 원인을 정확히 찾을 수 있어요.\n\n오류가 나지 않았는데 동작이 이상하다면 다음을 확인해 보세요.\n1. 두 파일을 모두 💾 저장했나요?\n2. 코드를 고친 뒤 **[배포 관리] → 새 버전**으로 다시 배포했나요?\n3. 웹앱 탭을 새로고침했나요?`,
  };
}

function conceptResponse(t) {
  if (has(t, /api\s?키|api\s?key/i) && has(t, /뭐|무엇|왜|필요|이유/))
    return { md: `**API 키**는 API 서비스를 쓸 때 "내가 허락받은 사용자"임을 증명하는 신분증 같은 문자열이에요.\n\n- **신원 확인:** 누가 요청했는지 알 수 있어요.\n- **사용량 체크:** 키마다 얼마나 썼는지 기록해요.\n- **악용 방지:** 허락받지 않은 사람의 사용을 막아요.\n\n그래서 키는 다른 사람에게 알려 주지 말고, 코드에 직접 쓰지 말고, **스크립트 속성** 같은 안전한 곳에 저장해야 해요.` };
  if (has(t, /api/i) && has(t, /뭐|무엇|란/))
    return { md: `**API**(Application Programming Interface)는 서로 다른 프로그램이 대화할 수 있게 해 주는 **약속이자 통로**예요. 식당에서 손님(웹앱)의 주문(요청)을 주방(AI 서버)에 전하고 음식(응답)을 가져다주는 종업원의 역할과 같아요.` };
  if (has(t, /스크립트\s?속성/))
    return { md: `**스크립트 속성**은 Apps Script 프로젝트에 이름과 값을 짝지어 저장하는 곳이에요. [프로젝트 설정] 아래쪽에서 추가할 수 있고, 코드에서는 \`PropertiesService.getScriptProperties().getProperty('이름')\`으로 값을 꺼내요. 코드를 공유해도 키는 드러나지 않아 안전해요.` };
  if (has(t, /대문자/))
    return { md: `\`GEMINI_API_KEY\`처럼 이름을 모두 대문자로 쓰는 것은 프로그래머들의 약속이에요. 바뀌면 안 되는 중요한 값(상수)이나 비밀번호, API 키 같은 보안 정보는 대문자와 밑줄(_)로 쓰는 것이 표준이에요.` };
  return {
    md: `안녕하세요! 저는 지금 웹앱 만들기를 도와드리고 있어요. 다음과 같이 요청해 보세요.\n\n- 만들고 싶은 웹앱의 **목적과 기능**을 설명하고 \`Code.gs\`와 \`index.html\`을 만들어 달라고 하기\n- 웹앱에서 오류가 나면 **오류 메시지를 그대로 붙여 넣기**\n- 기능을 더하고 싶으면 "~하는 기능을 추가해 줘"라고 요청하기\n\n> 이 화면은 실습용 시뮬레이션이라 교재 실습과 관련된 요청에 맞춰 답해요.`,
  };
}

function esc(s) {
  return String(s);
}
