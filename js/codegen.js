// 생성형 AI가 만들어 주는 Code.gs / index.html 코드 생성기
// 여기서 만든 코드는 실제 Google Apps Script에서도 동작하도록 작성했습니다.
// (주의: 이 파일의 바깥 템플릿 문자열 안에서는 백틱을 쓰지 않습니다.)

const BT3 = '\\x60\\x60\\x60';

function aiBlock(provider, model, propName) {
  const head = `// ===== 생성형 AI API 호출 =====
const MODEL = '${model}';

function askAI(prompt) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('${propName}');
  if (!apiKey) {
    throw new Error('스크립트 속성에 ${propName} 값이 없습니다. [프로젝트 설정]에서 API 키를 저장해 주세요.');
  }
`;
  const gemini = `  const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + MODEL + ':generateContent';
  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', temperature: 0.9 }
  };
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-goog-api-key': apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status !== 200) {
    throw new Error('Gemini API 오류 (' + status + '): ' + body);
  }
  const data = JSON.parse(body);
  return data.candidates[0].content.parts[0].text;
}
`;
  const openai = `  const url = 'https://api.openai.com/v1/chat/completions';
  const payload = {
    model: MODEL,
    messages: [
      { role: 'system', content: '너는 중학생을 돕는 친절한 도우미야. 반드시 JSON 형식으로만 답해.' },
      { role: 'user', content: prompt }
    ],
    response_format: { type: 'json_object' }
  };
  const response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { Authorization: 'Bearer ' + apiKey },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
  const status = response.getResponseCode();
  const body = response.getContentText();
  if (status !== 200) {
    throw new Error('OpenAI API 오류 (' + status + '): ' + body);
  }
  const data = JSON.parse(body);
  return data.choices[0].message.content;
}
`;
  const tail = `
// AI 답변(JSON 글자)을 자바스크립트 객체로 바꿉니다.
function askJSON(prompt) {
  let text = askAI(prompt).trim();
  text = text.replace(/^${BT3}(json)?/i, '').replace(/${BT3}$/, '').trim();
  return JSON.parse(text);
}
`;
  return head + (provider === 'openai' ? openai : gemini) + tail;
}

const SHEET_HELPER = `
// 시트가 없으면 새로 만들고 첫 줄에 제목을 넣습니다.
function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
  }
  return sheet;
}
`;

function doGetBlock(title) {
  return `function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('${title}')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
`;
}

/* ------------------------------------------------------------------ */
/* 3-5 이모티콘 영화 퀴즈                                               */
/* ------------------------------------------------------------------ */
function quizGS(o) {
  const cat = o.features.includes('category');
  return `// 이모티콘 영화 퀴즈 - Code.gs (백엔드)
${doGetBlock('이모티콘 영화 퀴즈')}
// [퀴즈 시작하기] 버튼을 누르면 index.html에서 이 함수를 부릅니다.
function getQuizQuestions(${cat ? 'category' : ''}) {
  const prompt = '누구나 알 만한 유명한 영화 10편으로 이모티콘 영화 퀴즈를 만들어 줘.\\n' +
${cat ? "    (category && category !== '전체' ? '영화 분야는 ' + category + '(으)로 정해 줘.\\n' : '') +\n" : ''}    '각 문제는 영화 내용을 나타내는 이모티콘 3~5개, 추가 힌트 한 문장, 정답 영화 제목, 정답을 포함한 보기 4개로 만들어 줘.\\n' +
    '다음 JSON 형식으로만 답해 줘.\\n' +
    '{"questions":[{"emoji":"🦁👑🌅","hint":"어린 사자가 왕이 되는 이야기예요.","answer":"라이온 킹","choices":["라이온 킹","정글북","마다가스카르","쿵푸팬더"]}]}';

  const result = askJSON(prompt);
  return result.questions;
}

${aiBlock(o.provider, o.model, o.propName)}`;
}

const BASE_CSS = `
    * { box-sizing: border-box; }
    body { margin: 0; font-family: 'Pretendard', 'Noto Sans KR', sans-serif; background: #f3f5fb; color: #1f2430; }
    button { font-family: inherit; cursor: pointer; }
    .hidden { display: none !important; }
    .msg { margin-top: 14px; padding: 10px 12px; border-radius: 10px; font-size: 14px; line-height: 1.5; word-break: break-all; }
    .msg.error { background: #fdecea; color: #b3261e; border: 1px solid #f5c2bd; user-select: text; }
    .msg.ok { background: #e8f5e9; color: #1b5e20; }`;

function quizHTML(o) {
  const cat = o.features.includes('category');
  const who = o.provider === 'openai' ? 'AI가' : '제미나이가';
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title>이모티콘 영화 퀴즈</title>
  <style>${BASE_CSS}
    .card { max-width: 560px; margin: 32px auto; background: #fff; border-radius: 20px; padding: 32px 28px; box-shadow: 0 10px 30px rgba(40, 50, 90, .12); text-align: center; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .rule { text-align: left; background: #f6f3ff; border-radius: 12px; padding: 14px 18px 14px 34px; line-height: 1.8; font-size: 15px; }
    .main-btn { margin-top: 16px; padding: 14px 28px; font-size: 17px; font-weight: 700; border: none; border-radius: 12px; background: #6c47ff; color: #fff; }
    .main-btn:disabled { background: #b9a9ff; }
    select { margin-top: 12px; padding: 10px 12px; font-size: 15px; border-radius: 10px; border: 1px solid #ccc; font-family: inherit; }
    .top { display: flex; justify-content: space-between; font-weight: 700; color: #555; }
    .timer { height: 10px; background: #eee; border-radius: 6px; margin: 14px 0 4px; overflow: hidden; }
    #bar { height: 100%; width: 100%; background: linear-gradient(90deg, #ff7a59, #ffb259); transition: width 1s linear; }
    #sec { font-size: 13px; color: #888; text-align: right; }
    .emoji { font-size: 72px; margin: 22px 0 10px; letter-spacing: 6px; }
    .hint-btn { border: 1px dashed #6c47ff; background: #fff; color: #6c47ff; padding: 8px 14px; border-radius: 10px; font-size: 14px; }
    .hint { background: #fff8e1; border-radius: 10px; padding: 10px; margin: 12px 0 0; }
    .choices { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 18px; }
    .choices button { padding: 14px 10px; font-size: 16px; border-radius: 12px; border: 2px solid #e2e2ef; background: #fafaff; }
    .choices button:hover { border-color: #6c47ff; }
    .choices button.correct { background: #e8f5e9; border-color: #43a047; }
    .choices button.wrong { background: #fdecea; border-color: #e53935; }
    .feedback { min-height: 24px; font-weight: 700; margin-top: 14px; }
    .big { font-size: 56px; font-weight: 800; color: #6c47ff; }
    #review { text-align: left; line-height: 1.9; font-size: 15px; }
  </style>
</head>
<body>
  <div class="card" id="start">
    <h1>🎬 이모티콘 영화 퀴즈</h1>
    <p>화면 가운데 이모티콘을 보고 영화 제목을 맞혀 보세요!</p>
    <ul class="rule">
      <li>문제는 모두 10개이고 문제마다 제한 시간은 25초예요.</li>
      <li>추가 힌트 없이 맞히면 10점, 힌트를 보고 맞히면 5점이에요.</li>
    </ul>
${cat ? `    <select id="category">
      <option value="전체">전체 분야</option>
      <option>애니메이션</option>
      <option>한국 영화</option>
      <option>히어로·액션</option>
      <option>판타지·모험</option>
      <option>명작·가족</option>
    </select><br>
` : ''}    <button class="main-btn" id="startBtn" onclick="startQuiz()">퀴즈 시작하기</button>
    <div id="msg"></div>
  </div>

  <div class="card hidden" id="quiz">
    <div class="top"><span id="qnum">1 / 10</span><span id="score">점수 0</span></div>
    <div class="timer"><div id="bar"></div></div>
    <div id="sec">25초</div>
    <div class="emoji" id="emoji"></div>
    <button class="hint-btn" id="hintBtn" onclick="showHint()">💡 추가 힌트 보기</button>
    <p class="hint hidden" id="hint"></p>
    <div class="choices" id="choices"></div>
    <p class="feedback" id="feedback"></p>
  </div>

  <div class="card hidden" id="result">
    <h2>퀴즈 결과</h2>
    <div class="big" id="final">0점</div>
    <p id="summary"></p>
    <ol id="review"></ol>
    <button class="main-btn" onclick="restart()">다시 도전하기</button>
  </div>

<script>
  var questions = [];
  var current = 0;
  var score = 0;
  var correctCount = 0;
  var usedHint = false;
  var timer = null;
  var left = 25;
  var records = [];

  function show(id) {
    ['start', 'quiz', 'result'].forEach(function (s) {
      document.getElementById(s).classList.toggle('hidden', s !== id);
    });
  }

  function showMsg(text, isError) {
    var box = document.getElementById('msg');
    box.className = text ? 'msg ' + (isError ? 'error' : 'ok') : '';
    box.textContent = text;
  }

  function startQuiz() {
    var btn = document.getElementById('startBtn');
    btn.disabled = true;
    btn.textContent = '${who} 문제를 만드는 중...';
    showMsg('');
${cat ? "    var category = document.getElementById('category').value;\n" : ''}    google.script.run
      .withSuccessHandler(function (list) {
        btn.disabled = false;
        btn.textContent = '퀴즈 시작하기';
        questions = list;
        current = 0; score = 0; correctCount = 0; records = [];
        show('quiz');
        renderQuestion();
      })
      .withFailureHandler(function (err) {
        btn.disabled = false;
        btn.textContent = '퀴즈 시작하기';
        showMsg('문제를 불러오지 못했어요. ' + err.message, true);
      })
      .getQuizQuestions(${cat ? 'category' : ''});
  }

  function renderQuestion() {
    var q = questions[current];
    usedHint = false;
    document.getElementById('qnum').textContent = (current + 1) + ' / ' + questions.length;
    document.getElementById('score').textContent = '점수 ' + score;
    document.getElementById('emoji').textContent = q.emoji;
    document.getElementById('hint').classList.add('hidden');
    document.getElementById('hint').textContent = q.hint;
    document.getElementById('hintBtn').disabled = false;
    document.getElementById('feedback').textContent = '';
    var box = document.getElementById('choices');
    box.innerHTML = '';
    q.choices.forEach(function (c) {
      var b = document.createElement('button');
      b.textContent = c;
      b.onclick = function () { choose(c, b); };
      box.appendChild(b);
    });
    startTimer();
  }

  function startTimer() {
    clearInterval(timer);
    left = 25;
    updateTimer();
    timer = setInterval(function () {
      left--;
      updateTimer();
      if (left <= 0) {
        clearInterval(timer);
        finishQuestion(null);
      }
    }, 1000);
  }

  function updateTimer() {
    document.getElementById('bar').style.width = (left / 25 * 100) + '%';
    document.getElementById('sec').textContent = left + '초';
  }

  function showHint() {
    usedHint = true;
    document.getElementById('hint').classList.remove('hidden');
    document.getElementById('hintBtn').disabled = true;
  }

  function choose(choice, btn) {
    clearInterval(timer);
    finishQuestion(choice, btn);
  }

  function finishQuestion(choice, btn) {
    var q = questions[current];
    var buttons = document.querySelectorAll('#choices button');
    buttons.forEach(function (b) {
      b.disabled = true;
      if (b.textContent === q.answer) b.classList.add('correct');
    });
    var fb = document.getElementById('feedback');
    var ok = choice === q.answer;
    if (ok) {
      var point = usedHint ? 5 : 10;
      score += point;
      correctCount++;
      fb.textContent = '정답이에요! +' + point + '점';
      fb.style.color = '#2e7d32';
    } else {
      if (btn) btn.classList.add('wrong');
      fb.textContent = (choice ? '아쉬워요. ' : '시간 초과! ') + '정답은 ' + q.answer + '입니다.';
      fb.style.color = '#c62828';
    }
    records.push({ emoji: q.emoji, answer: q.answer, ok: ok });
    document.getElementById('score').textContent = '점수 ' + score;
    setTimeout(function () {
      current++;
      if (current < questions.length) renderQuestion();
      else showResult();
    }, 1400);
  }

  function showResult() {
    show('result');
    document.getElementById('final').textContent = score + '점';
    document.getElementById('summary').textContent = questions.length + '문제 중 ' + correctCount + '문제를 맞혔어요.';
    document.getElementById('review').innerHTML = records.map(function (r) {
      return '<li>' + r.emoji + ' ' + r.answer + ' ' + (r.ok ? '⭕' : '❌') + '</li>';
    }).join('');
  }

  function restart() {
    show('start');
    startQuiz();
  }
</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* 3-6 영어 공부 AI 도우미 (3-7 영어 과목에도 사용)                      */
/* ------------------------------------------------------------------ */
function englishGS(o) {
  const f = o.features;
  let s = `// ${o.title} - Code.gs (백엔드)
const SHEET_NAME = '학습내역';

${doGetBlock(o.title)}${SHEET_HELPER}
// 영어 단어를 받아 뜻과 중학교 수준 예문 3개를 만들고 시트에 기록합니다.
function getExamples(word) {
  const prompt = '영어 단어 "' + word + '"를 중학생에게 설명해 줘.\\n' +
    '뜻, 발음 기호, 품사, 중학교 수준 예문 3개와 한국어 해석, 기억하기 쉬운 팁을 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"word":"","meaning":"","pronunciation":"","pos":"","examples":[{"en":"","ko":""}],"tip":""}';
  const data = askJSON(prompt);

  const sheet = getSheet_(SHEET_NAME, ['날짜', '단어', '뜻', '예문1', '예문2', '예문3']);
  sheet.appendRow([new Date(), data.word, data.meaning,
    data.examples[0].en, data.examples[1].en, data.examples[2].en]);
  return data;
}

// 시트에 저장된 학습 내역을 최근 순서로 돌려줍니다.
function getHistory() {
  const sheet = getSheet_(SHEET_NAME, ['날짜', '단어', '뜻', '예문1', '예문2', '예문3']);
  const values = sheet.getDataRange().getValues().slice(1);
  return values.reverse().map(function (r) {
    return {
      date: Utilities.formatDate(new Date(r[0]), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'),
      word: r[1], meaning: r[2], examples: [r[3], r[4], r[5]]
    };
  });
}
`;
  if (f.includes('translate'))
    s += `
// [추가 기능] 한글 문장을 중학교 수준 영어와 원어민 표현으로 번역합니다.
function translateSentence(korean) {
  const prompt = '다음 한글 문장을 영어로 번역해 줘: "' + korean + '"\\n' +
    '중학교 수준의 쉬운 번역(basic)과 원어민이 실제로 쓰는 자연스러운 표현(natural), 두 표현의 차이 설명(note)을 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"basic":"","natural":"","note":""}';
  return askJSON(prompt);
}
`;
  if (f.includes('grammar'))
    s += `
// [추가 기능] 영작한 문장의 단어와 문법 오류를 찾아 고칠 방법을 알려 줍니다.
function checkGrammar(sentence) {
  const prompt = '중학생이 쓴 영어 문장을 검사해 줘: "' + sentence + '"\\n' +
    '틀린 부분(wrong), 고친 표현(right), 이유(reason)를 쉬운 한국어로 알려 주고, 고친 전체 문장(corrected)과 잘한 점(praise)도 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"corrected":"","issues":[{"wrong":"","right":"","reason":""}],"praise":""}';
  return askJSON(prompt);
}
`;
  if (f.includes('today'))
    s += `
// [추가 기능] 웹앱에 접속하면 자동으로 오늘의 필수 영단어를 알려 줍니다.
function getTodayWord() {
  const prompt = '중학생이 꼭 기억해야 하는 영어 단어 하나를 골라 오늘의 단어로 알려 줘. 오늘 날짜는 ' + new Date().toDateString() + '이야.\\n' +
    '다음 JSON 형식으로만 답해 줘.\\n' +
    '{"word":"","meaning":"","pronunciation":"","example":{"en":"","ko":""},"explain":""}';
  return askJSON(prompt);
}
`;
  if (f.includes('interest'))
    s += `
// [추가 기능] 관심 주제와 난이도에 맞는 영어 글과 핵심 단어장을 만듭니다.
function getInterestContent(topic, level) {
  const prompt = '중학생이 좋아하는 주제 "' + topic + '"에 대해 ' + level + ' 난이도의 짧은 영어 글을 써 줘.\\n' +
    '중학교 수준을 벗어나지 않게 쓰고, 한국어 해석, 핵심 단어 5개, 내용 확인 문제 1개를 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"title":"","passage":"","ko":"","vocab":[{"word":"","meaning":""}],"question":{"q":"","choices":["","",""],"answer":0}}';
  return askJSON(prompt);
}
`;
  if (f.includes('review'))
    s += `
// [추가 기능] 학습 내역의 단어로 복습 퀴즈를 만듭니다.
function getReviewQuiz() {
  const words = getHistory().slice(0, 10).map(function (h) { return h.word + '(' + h.meaning + ')'; });
  if (words.length === 0) throw new Error('먼저 단어를 학습해 주세요.');
  const prompt = '다음 단어로 중학생용 복습 퀴즈를 만들어 줘: ' + words.join(', ') + '\\n' +
    '문제마다 뜻을 보고 알맞은 영어 단어를 고르는 4지선다로 만들고 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"questions":[{"question":"","choices":["","","",""],"answer":"","word":""}]}';
  return askJSON(prompt).questions;
}

// [추가 기능] 틀린 문제를 오답노트 시트에 저장합니다.
function saveWrong(item) {
  const sheet = getSheet_('오답노트', ['날짜', '단어', '문제', '내가 고른 답', '정답']);
  sheet.appendRow([new Date(), item.word, item.question, item.mine, item.answer]);
  return true;
}
`;
  return s + '\n' + aiBlock(o.provider, o.model, o.propName);
}

function englishHTML(o) {
  const f = o.features;
  const tabs = [['word', '📖 단어 예문'], ['history', '🗂 학습 내역']];
  if (f.includes('translate')) tabs.push(['translate', '🔁 한영 번역']);
  if (f.includes('grammar')) tabs.push(['grammar', '✍️ 문법 체크']);
  if (f.includes('interest')) tabs.push(['interest', '🎯 관심사 콘텐츠']);
  if (f.includes('review')) tabs.push(['review', '🧩 복습 퀴즈']);
  const who = o.provider === 'openai' ? 'AI가' : '제미나이가';
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title>${o.title}</title>
  <style>${BASE_CSS}
    header { background: linear-gradient(120deg, #00897b, #26a69a); color: #fff; padding: 22px 24px 18px; }
    header h1 { margin: 0; font-size: 24px; }
    header p { margin: 6px 0 0; opacity: .9; font-size: 14px; }
    nav { display: flex; gap: 6px; flex-wrap: wrap; padding: 12px 20px 0; max-width: 820px; margin: 0 auto; }
    nav button { border: none; background: #e0f2f1; color: #00695c; padding: 9px 14px; border-radius: 999px; font-size: 14px; font-weight: 600; }
    nav button.active { background: #00897b; color: #fff; }
    main { max-width: 820px; margin: 0 auto; padding: 16px 20px 40px; }
    .panel { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 18px rgba(0, 0, 0, .06); }
    .row { display: flex; gap: 8px; }
    input[type=text], textarea, select { flex: 1; padding: 12px 14px; font-size: 16px; border: 1px solid #cfd8dc; border-radius: 10px; font-family: inherit; }
    textarea { width: 100%; min-height: 80px; resize: vertical; }
    .btn { padding: 12px 18px; border: none; border-radius: 10px; background: #00897b; color: #fff; font-weight: 700; font-size: 15px; white-space: nowrap; }
    .btn:disabled { background: #80cbc4; }
    .speak { border: none; background: #e0f2f1; border-radius: 50%; width: 34px; height: 34px; font-size: 16px; flex: none; }
    .word-head { display: flex; align-items: center; gap: 10px; margin-top: 18px; }
    .word-head h2 { margin: 0; font-size: 30px; }
    .pron { color: #607d8b; }
    .badge { background: #fff3e0; color: #e65100; border-radius: 6px; padding: 2px 8px; font-size: 13px; }
    .ex { display: flex; gap: 10px; align-items: flex-start; padding: 12px; border-radius: 12px; background: #f7fafa; margin-top: 10px; }
    .ex .en { font-size: 17px; font-weight: 600; }
    .ex .ko { color: #607d8b; font-size: 14px; margin-top: 3px; }
    .tip { margin-top: 12px; background: #fffde7; border-radius: 10px; padding: 10px 12px; font-size: 14px; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #eceff1; padding: 9px 6px; text-align: left; vertical-align: top; }
    th { background: #f5f7f8; }
    .today { background: linear-gradient(120deg, #fff8e1, #ffecb3); border-radius: 16px; padding: 16px 18px; margin-bottom: 14px; }
    .today h3 { margin: 0 0 6px; font-size: 15px; color: #e65100; }
    .result-box { margin-top: 14px; padding: 14px; border-radius: 12px; background: #f7fafa; line-height: 1.7; }
    .issue { border-left: 4px solid #ef5350; padding: 6px 10px; margin: 8px 0; background: #fff; }
    .vocab { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
    .vocab span { background: #e0f2f1; border-radius: 8px; padding: 4px 10px; font-size: 14px; }
    .q-choices button { display: block; width: 100%; text-align: left; margin-top: 8px; padding: 11px 14px; border-radius: 10px; border: 1px solid #cfd8dc; background: #fff; font-size: 15px; }
    .q-choices button.correct { background: #e8f5e9; border-color: #43a047; }
    .q-choices button.wrong { background: #fdecea; border-color: #e53935; }
    .loading { color: #00897b; font-weight: 600; margin-top: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>📚 ${o.title}</h1>
    <p>모르는 단어를 입력하면 ${who} 중학교 수준 예문을 찾아 줘요. 🔊 버튼을 누르면 발음을 들을 수 있어요.</p>
  </header>
  <nav id="tabs">
${tabs.map((t, i) => `    <button data-tab="${t[0]}"${i === 0 ? ' class="active"' : ''} onclick="openTab('${t[0]}')">${t[1]}</button>`).join('\n')}
  </nav>
  <main>
${f.includes('today') ? `    <div class="today" id="todayBox">
      <h3>☀️ 오늘의 필수 영단어</h3>
      <div id="todayContent" class="loading">오늘의 단어를 가져오는 중...</div>
    </div>
` : ''}    <section class="panel" id="tab-word">
      <div class="row">
        <input type="text" id="wordInput" placeholder="영어 단어를 입력하세요 (예: borrow)" onkeydown="if(event.key==='Enter') searchWord()">
        <button class="btn" id="wordBtn" onclick="searchWord()">예문 찾기</button>
      </div>
      <div id="wordResult"></div>
    </section>

    <section class="panel hidden" id="tab-history">
      <h3 style="margin-top:0">🗂 나의 학습 내역</h3>
      <div id="historyList" class="loading">불러오는 중...</div>
    </section>
${f.includes('translate') ? `
    <section class="panel hidden" id="tab-translate">
      <h3 style="margin-top:0">🔁 한글 문장을 영어로</h3>
      <textarea id="koInput" placeholder="영어로 표현하고 싶은 한글 문장을 입력하세요"></textarea>
      <button class="btn" style="margin-top:8px" onclick="translateKo()">번역하기</button>
      <div id="translateResult"></div>
    </section>
` : ''}${f.includes('grammar') ? `
    <section class="panel hidden" id="tab-grammar">
      <h3 style="margin-top:0">✍️ 영작 문법 체크</h3>
      <textarea id="enInput" placeholder="영어로 문장을 써 보세요 (예: He go to school every day.)"></textarea>
      <button class="btn" style="margin-top:8px" onclick="checkSentence()">검사하기</button>
      <div id="grammarResult"></div>
    </section>
` : ''}${f.includes('interest') ? `
    <section class="panel hidden" id="tab-interest">
      <h3 style="margin-top:0">🎯 관심사 기반 영어 콘텐츠</h3>
      <div class="row">
        <input type="text" id="topicInput" placeholder="좋아하는 주제 (예: 우주, 축구, K-pop)">
        <select id="levelSelect" style="flex:none"><option>쉬움</option><option selected>보통</option><option>어려움</option></select>
        <button class="btn" onclick="makeContent()">만들기</button>
      </div>
      <div id="interestResult"></div>
    </section>
` : ''}${f.includes('review') ? `
    <section class="panel hidden" id="tab-review">
      <h3 style="margin-top:0">🧩 학습 내역 복습 퀴즈</h3>
      <button class="btn" onclick="startReview()">복습 퀴즈 만들기</button>
      <div id="reviewResult"></div>
    </section>
` : ''}    <div id="msg"></div>
  </main>

<script>
  function el(id) { return document.getElementById(id); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function showMsg(text, isError) {
    var box = el('msg');
    box.className = text ? 'msg ' + (isError ? 'error' : 'ok') : '';
    box.textContent = text;
  }
  function fail(err) { showMsg('오류가 발생했어요. ' + err.message, true); }

  // Web Speech API: 키 발급 없이 브라우저에 들어 있는 음성 기능
  function speak(text) {
    var u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    u.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  }
  function speakBtn(text) {
    return '<button class="speak" title="듣기" onclick="speak(this.dataset.t)" data-t="' + escapeHtml(text) + '">🔊</button>';
  }

  function openTab(name) {
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    document.querySelectorAll('section.panel').forEach(function (s) { s.classList.toggle('hidden', s.id !== 'tab-' + name); });
    showMsg('');
    if (name === 'history') loadHistory();
  }

  function searchWord() {
    var word = el('wordInput').value.trim();
    if (!word) return;
    var btn = el('wordBtn');
    btn.disabled = true;
    el('wordResult').innerHTML = '<p class="loading">${who} 예문을 만드는 중...</p>';
    showMsg('');
    google.script.run
      .withSuccessHandler(function (d) {
        btn.disabled = false;
        var html = '<div class="word-head"><h2>' + escapeHtml(d.word) + '</h2>' + speakBtn(d.word) +
          '<span class="pron">' + escapeHtml(d.pronunciation) + '</span><span class="badge">' + escapeHtml(d.pos) + '</span></div>' +
          '<p style="font-size:18px;margin:6px 0 4px"><b>' + escapeHtml(d.meaning) + '</b></p>';
        d.examples.forEach(function (ex, i) {
          html += '<div class="ex">' + speakBtn(ex.en) + '<div><div class="en">' + (i + 1) + '. ' + escapeHtml(ex.en) + '</div><div class="ko">' + escapeHtml(ex.ko) + '</div></div></div>';
        });
        if (d.tip) html += '<div class="tip">💡 ' + escapeHtml(d.tip) + '</div>';
        el('wordResult').innerHTML = html;
      })
      .withFailureHandler(function (err) { btn.disabled = false; el('wordResult').innerHTML = ''; fail(err); })
      .getExamples(word);
  }

  function loadHistory() {
    el('historyList').innerHTML = '<p class="loading">불러오는 중...</p>';
    google.script.run
      .withSuccessHandler(function (list) {
        if (!list.length) { el('historyList').innerHTML = '<p>아직 학습한 단어가 없어요.</p>'; return; }
        el('historyList').innerHTML = '<table><tr><th>날짜</th><th>단어</th><th>뜻</th><th>예문</th></tr>' +
          list.map(function (h) {
            return '<tr><td>' + escapeHtml(h.date) + '</td><td><b>' + escapeHtml(h.word) + '</b> ' + speakBtn(h.word) + '</td><td>' + escapeHtml(h.meaning) + '</td><td>' + escapeHtml(h.examples[0]) + '</td></tr>';
          }).join('') + '</table>';
      })
      .withFailureHandler(fail)
      .getHistory();
  }
${f.includes('translate') ? `
  function translateKo() {
    var text = el('koInput').value.trim();
    if (!text) return;
    el('translateResult').innerHTML = '<p class="loading">번역하는 중...</p>';
    google.script.run
      .withSuccessHandler(function (d) {
        el('translateResult').innerHTML = '<div class="result-box">' +
          '<div>📘 <b>중학교 수준</b> ' + speakBtn(d.basic) + '<br>' + escapeHtml(d.basic) + '</div><br>' +
          '<div>🌎 <b>원어민 표현</b> ' + speakBtn(d.natural) + '<br>' + escapeHtml(d.natural) + '</div>' +
          '<div class="tip">💡 ' + escapeHtml(d.note) + '</div></div>';
      })
      .withFailureHandler(function (err) { el('translateResult').innerHTML = ''; fail(err); })
      .translateSentence(text);
  }
` : ''}${f.includes('grammar') ? `
  function checkSentence() {
    var text = el('enInput').value.trim();
    if (!text) return;
    el('grammarResult').innerHTML = '<p class="loading">문장을 검사하는 중...</p>';
    google.script.run
      .withSuccessHandler(function (d) {
        var html = '<div class="result-box">';
        if (!d.issues.length) html += '<p>🎉 고칠 부분이 없어요!</p>';
        d.issues.forEach(function (it) {
          html += '<div class="issue"><s>' + escapeHtml(it.wrong) + '</s> → <b>' + escapeHtml(it.right) + '</b><br><small>' + escapeHtml(it.reason) + '</small></div>';
        });
        html += '<p>✅ 고친 문장: <b>' + escapeHtml(d.corrected) + '</b> ' + speakBtn(d.corrected) + '</p>';
        if (d.praise) html += '<div class="tip">👍 ' + escapeHtml(d.praise) + '</div>';
        el('grammarResult').innerHTML = html + '</div>';
      })
      .withFailureHandler(function (err) { el('grammarResult').innerHTML = ''; fail(err); })
      .checkGrammar(text);
  }
` : ''}${f.includes('interest') ? `
  function makeContent() {
    var topic = el('topicInput').value.trim();
    if (!topic) return;
    el('interestResult').innerHTML = '<p class="loading">맞춤형 콘텐츠를 만드는 중...</p>';
    google.script.run
      .withSuccessHandler(function (d) {
        var html = '<div class="result-box"><h3 style="margin:0">' + escapeHtml(d.title) + ' ' + speakBtn(d.passage) + '</h3>' +
          '<p style="font-size:16px">' + escapeHtml(d.passage) + '</p><p style="color:#607d8b">' + escapeHtml(d.ko) + '</p>' +
          '<b>핵심 단어장</b><div class="vocab">' + d.vocab.map(function (v) { return '<span>' + escapeHtml(v.word) + ' : ' + escapeHtml(v.meaning) + '</span>'; }).join('') + '</div>';
        if (d.question) {
          html += '<p><b>Q.</b> ' + escapeHtml(d.question.q) + '</p><div class="q-choices">' +
            d.question.choices.map(function (c, i) { return '<button onclick="this.className=(' + i + '===' + d.question.answer + ')?\\'correct\\':\\'wrong\\'">' + escapeHtml(c) + '</button>'; }).join('') + '</div>';
        }
        el('interestResult').innerHTML = html + '</div>';
      })
      .withFailureHandler(function (err) { el('interestResult').innerHTML = ''; fail(err); })
      .getInterestContent(topic, el('levelSelect').value);
  }
` : ''}${f.includes('review') ? `
  var reviewList = [];
  var reviewIndex = 0;
  var reviewScore = 0;
  function startReview() {
    el('reviewResult').innerHTML = '<p class="loading">학습 내역으로 퀴즈를 만드는 중...</p>';
    google.script.run
      .withSuccessHandler(function (list) { reviewList = list; reviewIndex = 0; reviewScore = 0; showReview(); })
      .withFailureHandler(function (err) { el('reviewResult').innerHTML = ''; fail(err); })
      .getReviewQuiz();
  }
  function showReview() {
    if (reviewIndex >= reviewList.length) {
      el('reviewResult').innerHTML = '<div class="result-box"><h3>' + reviewList.length + '문제 중 ' + reviewScore + '문제 정답!</h3><p>틀린 문제는 오답노트 시트에 저장했어요.</p></div>';
      return;
    }
    var q = reviewList[reviewIndex];
    el('reviewResult').innerHTML = '<div class="result-box"><p>' + (reviewIndex + 1) + ' / ' + reviewList.length + '</p><p><b>' + escapeHtml(q.question) + '</b></p><div class="q-choices">' +
      q.choices.map(function (c) { return '<button onclick="answerReview(this)">' + escapeHtml(c) + '</button>'; }).join('') + '</div></div>';
  }
  function answerReview(btn) {
    var q = reviewList[reviewIndex];
    var ok = btn.textContent === q.answer;
    btn.className = ok ? 'correct' : 'wrong';
    if (ok) reviewScore++;
    else google.script.run.saveWrong({ word: q.word, question: q.question, mine: btn.textContent, answer: q.answer });
    setTimeout(function () { reviewIndex++; showReview(); }, 900);
  }
` : ''}${f.includes('today') ? `
  // 접속하자마자 자동으로 오늘의 단어를 가져옵니다.
  google.script.run
    .withSuccessHandler(function (d) {
      el('todayContent').className = '';
      el('todayContent').innerHTML = '<b style="font-size:22px">' + escapeHtml(d.word) + '</b> ' + speakBtn(d.word) + ' <span class="pron">' + escapeHtml(d.pronunciation) + '</span> ' + escapeHtml(d.meaning) +
        '<div style="margin-top:6px">' + speakBtn(d.example.en) + ' ' + escapeHtml(d.example.en) + '<br><small>' + escapeHtml(d.example.ko) + '</small></div><div class="tip">💡 ' + escapeHtml(d.explain) + '</div>';
    })
    .withFailureHandler(function (err) { el('todayContent').textContent = '오늘의 단어를 가져오지 못했어요. ' + err.message; })
    .getTodayWord();
` : ''}</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
/* 3-7 교과 AI 학습 도우미 (수학, 과학, 사회, 국어)                       */
/* ------------------------------------------------------------------ */
function helperGS(o) {
  const f = o.features;
  const sj = o.subject;
  let s = `// ${o.title} - Code.gs (백엔드)
const SUBJECT = '${sj.name}';
const SHEET_NAME = '학습내역';

${doGetBlock(o.title)}${SHEET_HELPER}
// 궁금한 개념을 받아 중학생 눈높이 설명과 예시를 만들고 시트에 기록합니다.
function explainTerm(term) {
  const prompt = '중학교 ' + SUBJECT + ' 개념 "' + term + '"을(를) 중학생 눈높이로 설명해 줘.\\n' +
    '쉬운 설명(explain), 생활 속 예시(example), 함께 알아 두면 좋은 개념 2~3개(related)를 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"term":"","unit":"","explain":"","example":"","related":[""]}';
  const data = askJSON(prompt);

  const sheet = getSheet_(SHEET_NAME, ['날짜', '개념', '단원', '설명']);
  sheet.appendRow([new Date(), data.term, data.unit, data.explain]);
  return data;
}

// 시트에 저장된 학습 내역을 최근 순서로 돌려줍니다.
function getHistory() {
  const sheet = getSheet_(SHEET_NAME, ['날짜', '개념', '단원', '설명']);
  const values = sheet.getDataRange().getValues().slice(1);
  return values.reverse().map(function (r) {
    return { date: Utilities.formatDate(new Date(r[0]), 'Asia/Seoul', 'yyyy-MM-dd HH:mm'), term: r[1], unit: r[2], explain: r[3] };
  });
}
`;
  if (f.includes('quiz'))
    s += `
// [추가 기능] 개념을 확인하는 퀴즈 2문제를 만듭니다.
function makeQuiz(term) {
  const prompt = '중학교 ' + SUBJECT + ' 개념 "' + term + '"을(를) 확인하는 퀴즈 2문제를 만들어 줘.\\n' +
    'OX 문제(type:"ox", answer:"O" 또는 "X")와 4지선다 문제(type:"mc", answer: 정답 보기 번호 0~3)를 하나씩 만들고 해설(why)을 붙여 다음 JSON 형식으로만 답해 줘.\\n' +
    '{"questions":[{"q":"","type":"ox","answer":"O","why":""},{"q":"","type":"mc","choices":["","","",""],"answer":0,"why":""}]}';
  return askJSON(prompt).questions;
}
`;
  if (f.includes('compare'))
    s += `
// [추가 기능] 헷갈리기 쉬운 개념과 비교해 차이점을 알려 줍니다.
function compareConcept(term) {
  const prompt = '중학교 ' + SUBJECT + ' 개념 "' + term + '"과(와) 학생들이 가장 헷갈려하는 개념 하나를 골라 비교해 줘.\\n' +
    '다음 JSON 형식으로만 답해 줘.\\n' +
    '{"a":"","b":"","point":""}';
  return askJSON(prompt);
}
`;
  if (f.includes('today'))
    s += `
// [추가 기능] 웹앱에 접속하면 자동으로 오늘의 개념을 알려 줍니다.
function getTodayConcept() {
  const prompt = '중학교 ' + SUBJECT + '에서 꼭 알아야 하는 개념 하나를 골라 오늘의 개념으로 소개해 줘. 오늘 날짜는 ' + new Date().toDateString() + '이야.\\n' +
    '다음 JSON 형식으로만 답해 줘.\\n' +
    '{"term":"","explain":"","example":""}';
  return askJSON(prompt);
}
`;
  return s + '\n' + aiBlock(o.provider, o.model, o.propName);
}

function helperHTML(o) {
  const f = o.features;
  const sj = o.subject;
  const color = sj.color || '#f4511e';
  const tabs = [['explain', '💡 개념 설명'], ['history', '🗂 학습 내역']];
  if (f.includes('quiz')) tabs.push(['quiz', '✅ 확인 퀴즈']);
  if (f.includes('compare')) tabs.push(['compare', '⚖️ 개념 비교']);
  const who = o.provider === 'openai' ? 'AI가' : '제미나이가';
  return `<!DOCTYPE html>
<html>
<head>
  <base target="_top">
  <meta charset="UTF-8">
  <title>${o.title}</title>
  <style>${BASE_CSS}
    :root { --main: ${color}; }
    header { background: var(--main); color: #fff; padding: 22px 24px 18px; }
    header h1 { margin: 0; font-size: 24px; }
    header p { margin: 6px 0 0; opacity: .92; font-size: 14px; }
    nav { display: flex; gap: 6px; flex-wrap: wrap; padding: 12px 20px 0; max-width: 820px; margin: 0 auto; }
    nav button { border: 1px solid var(--main); background: #fff; color: var(--main); padding: 9px 14px; border-radius: 999px; font-size: 14px; font-weight: 600; }
    nav button.active { background: var(--main); color: #fff; }
    main { max-width: 820px; margin: 0 auto; padding: 16px 20px 40px; }
    .panel { background: #fff; border-radius: 16px; padding: 20px; box-shadow: 0 4px 18px rgba(0, 0, 0, .06); }
    .row { display: flex; gap: 8px; }
    input[type=text] { flex: 1; padding: 12px 14px; font-size: 16px; border: 1px solid #cfd8dc; border-radius: 10px; font-family: inherit; }
    .btn { padding: 12px 18px; border: none; border-radius: 10px; background: var(--main); color: #fff; font-weight: 700; font-size: 15px; white-space: nowrap; }
    .btn:disabled { opacity: .5; }
    .result-box { margin-top: 14px; padding: 16px; border-radius: 12px; background: #fafafa; line-height: 1.75; }
    .result-box h2 { margin: 0 0 4px; }
    .unit { display: inline-block; font-size: 13px; background: #eceff1; border-radius: 6px; padding: 2px 8px; color: #455a64; }
    .example { background: #fffde7; border-radius: 10px; padding: 10px 12px; margin-top: 10px; }
    .related span { display: inline-block; margin: 6px 6px 0 0; padding: 4px 10px; border-radius: 8px; background: #eef2ff; font-size: 14px; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; font-size: 14px; }
    th, td { border-bottom: 1px solid #eceff1; padding: 9px 6px; text-align: left; vertical-align: top; }
    th { background: #f5f7f8; }
    .q { margin-top: 14px; padding: 14px; border: 1px solid #e0e0e0; border-radius: 12px; }
    .q button { margin: 8px 8px 0 0; padding: 10px 16px; border-radius: 10px; border: 1px solid #cfd8dc; background: #fff; font-size: 15px; }
    .q button.correct { background: #e8f5e9; border-color: #43a047; }
    .q button.wrong { background: #fdecea; border-color: #e53935; }
    .why { margin-top: 8px; color: #455a64; font-size: 14px; }
    .vs { display: grid; grid-template-columns: 1fr auto 1fr; gap: 10px; align-items: center; text-align: center; font-size: 20px; font-weight: 800; }
    .vs div { background: #fff; border: 2px solid var(--main); border-radius: 12px; padding: 14px; }
    .today { background: #fff; border-left: 6px solid var(--main); border-radius: 12px; padding: 14px 18px; margin-bottom: 14px; box-shadow: 0 4px 18px rgba(0, 0, 0, .05); }
    .today h3 { margin: 0 0 6px; font-size: 15px; color: var(--main); }
    .loading { color: var(--main); font-weight: 600; margin-top: 12px; }
  </style>
</head>
<body>
  <header>
    <h1>${sj.emoji} ${o.title}</h1>
    <p>궁금한 ${sj.name} 개념을 입력하면 ${who} 중학생 눈높이로 설명해 줘요.</p>
  </header>
  <nav>
${tabs.map((t, i) => `    <button data-tab="${t[0]}"${i === 0 ? ' class="active"' : ''} onclick="openTab('${t[0]}')">${t[1]}</button>`).join('\n')}
  </nav>
  <main>
${f.includes('today') ? `    <div class="today">
      <h3>☀️ 오늘의 ${sj.name} 개념</h3>
      <div id="todayContent" class="loading">오늘의 개념을 가져오는 중...</div>
    </div>
` : ''}    <section class="panel" id="tab-explain">
      <div class="row">
        <input type="text" id="termInput" placeholder="${sj.placeholder}" onkeydown="if(event.key==='Enter') explain()">
        <button class="btn" id="explainBtn" onclick="explain()">설명 듣기</button>
      </div>
      <div id="explainResult"></div>
    </section>

    <section class="panel hidden" id="tab-history">
      <h3 style="margin-top:0">🗂 나의 학습 내역</h3>
      <div id="historyList"></div>
    </section>
${f.includes('quiz') ? `
    <section class="panel hidden" id="tab-quiz">
      <div class="row">
        <input type="text" id="quizInput" placeholder="퀴즈로 확인할 개념을 입력하세요">
        <button class="btn" onclick="quiz()">퀴즈 만들기</button>
      </div>
      <div id="quizResult"></div>
    </section>
` : ''}${f.includes('compare') ? `
    <section class="panel hidden" id="tab-compare">
      <div class="row">
        <input type="text" id="compareInput" placeholder="헷갈리는 개념을 입력하세요">
        <button class="btn" onclick="compare()">비교하기</button>
      </div>
      <div id="compareResult"></div>
    </section>
` : ''}    <div id="msg"></div>
  </main>

<script>
  function el(id) { return document.getElementById(id); }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function showMsg(text, isError) {
    var box = el('msg');
    box.className = text ? 'msg ' + (isError ? 'error' : 'ok') : '';
    box.textContent = text;
  }
  function fail(err) { showMsg('오류가 발생했어요. ' + err.message, true); }

  function openTab(name) {
    document.querySelectorAll('nav button').forEach(function (b) { b.classList.toggle('active', b.dataset.tab === name); });
    document.querySelectorAll('section.panel').forEach(function (s) { s.classList.toggle('hidden', s.id !== 'tab-' + name); });
    showMsg('');
    if (name === 'history') loadHistory();
  }

  function explain(termArg) {
    var term = termArg || el('termInput').value.trim();
    if (!term) return;
    el('termInput').value = term;
    el('explainBtn').disabled = true;
    el('explainResult').innerHTML = '<p class="loading">${who} 설명을 준비하는 중...</p>';
    showMsg('');
    google.script.run
      .withSuccessHandler(function (d) {
        el('explainBtn').disabled = false;
        el('explainResult').innerHTML = '<div class="result-box"><h2>' + escapeHtml(d.term) + '</h2><span class="unit">' + escapeHtml(d.unit) + '</span>' +
          '<p>' + escapeHtml(d.explain) + '</p><div class="example">🌱 ' + escapeHtml(d.example) + '</div>' +
          '<div class="related">함께 알아 두기: ' + d.related.map(function (r) { return '<span onclick="explain(this.textContent)">' + escapeHtml(r) + '</span>'; }).join('') + '</div></div>';
      })
      .withFailureHandler(function (err) { el('explainBtn').disabled = false; el('explainResult').innerHTML = ''; fail(err); })
      .explainTerm(term);
  }

  function loadHistory() {
    el('historyList').innerHTML = '<p class="loading">불러오는 중...</p>';
    google.script.run
      .withSuccessHandler(function (list) {
        if (!list.length) { el('historyList').innerHTML = '<p>아직 학습한 개념이 없어요.</p>'; return; }
        el('historyList').innerHTML = '<table><tr><th>날짜</th><th>개념</th><th>설명</th></tr>' +
          list.map(function (h) { return '<tr><td>' + escapeHtml(h.date) + '</td><td><b>' + escapeHtml(h.term) + '</b></td><td>' + escapeHtml(h.explain) + '</td></tr>'; }).join('') + '</table>';
      })
      .withFailureHandler(fail)
      .getHistory();
  }
${f.includes('quiz') ? `
  function quiz() {
    var term = el('quizInput').value.trim();
    if (!term) return;
    el('quizResult').innerHTML = '<p class="loading">퀴즈를 만드는 중...</p>';
    google.script.run
      .withSuccessHandler(function (list) {
        el('quizResult').innerHTML = list.map(function (q, n) {
          var opts = q.type === 'ox' ? ['O', 'X'] : q.choices;
          return '<div class="q"><b>Q' + (n + 1) + '.</b> ' + escapeHtml(q.q) + '<br>' +
            opts.map(function (c, i) {
              var ok = q.type === 'ox' ? c === q.answer : i === q.answer;
              return '<button onclick="mark(this,' + ok + ')">' + escapeHtml(c) + '</button>';
            }).join('') + '<div class="why hidden">해설: ' + escapeHtml(q.why) + '</div></div>';
        }).join('');
      })
      .withFailureHandler(function (err) { el('quizResult').innerHTML = ''; fail(err); })
      .makeQuiz(term);
  }
  function mark(btn, ok) {
    btn.className = ok ? 'correct' : 'wrong';
    btn.parentNode.querySelector('.why').classList.remove('hidden');
  }
` : ''}${f.includes('compare') ? `
  function compare() {
    var term = el('compareInput').value.trim();
    if (!term) return;
    el('compareResult').innerHTML = '<p class="loading">비교하는 중...</p>';
    google.script.run
      .withSuccessHandler(function (d) {
        el('compareResult').innerHTML = '<div class="result-box"><div class="vs"><div>' + escapeHtml(d.a) + '</div><span>VS</span><div>' + escapeHtml(d.b) + '</div></div><p>' + escapeHtml(d.point) + '</p></div>';
      })
      .withFailureHandler(function (err) { el('compareResult').innerHTML = ''; fail(err); })
      .compareConcept(term);
  }
` : ''}${f.includes('today') ? `
  // 접속하자마자 자동으로 오늘의 개념을 가져옵니다.
  google.script.run
    .withSuccessHandler(function (d) {
      el('todayContent').className = '';
      el('todayContent').innerHTML = '<b style="font-size:20px">' + escapeHtml(d.term) + '</b><p style="margin:6px 0">' + escapeHtml(d.explain) + '</p><small>🌱 ' + escapeHtml(d.example) + '</small>';
    })
    .withFailureHandler(function (err) { el('todayContent').textContent = '오늘의 개념을 가져오지 못했어요. ' + err.message; })
    .getTodayConcept();
` : ''}</script>
</body>
</html>`;
}

/* ------------------------------------------------------------------ */
export function generateCode(o) {
  // o: { app, provider, model, propName, features, subject, title }
  const opt = Object.assign({ features: [] }, o);
  if (opt.app === 'quiz') return { gs: quizGS(opt), html: quizHTML(opt) };
  if (opt.app === 'english') return { gs: englishGS(opt), html: englishHTML(opt) };
  return { gs: helperGS(opt), html: helperHTML(opt) };
}

export const DEFAULT_GS = `function myFunction() {

}
`;
