// 시뮬레이션 설정값 (모델 이름 등은 여기서만 바꾸면 전체에 반영됩니다)
export const MODELS = {
  gemini: {
    current: 'gemini-3.8-flash',
    // 생성형 AI가 예전 학습 내용대로 자주 써 주는, 이미 서비스가 끝난 모델 (오류 체험용)
    retired: 'gemini-2.0-flash',
    valid: [
      'gemini-3.8-flash',
      'gemini-3.7-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.5-flash-lite',
      'gemini-3.1-flash-lite',
      'gemini-3.1-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-pro',
      'gemini-flash-latest',
    ],
  },
  openai: {
    current: 'gpt-6-luna',
    retired: 'gpt-3.5-turbo-0613',
    valid: ['gpt-6-luna', 'gpt-6-astra', 'gpt-6.1-sol', 'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4o', 'gpt-4o-mini'],
  },
};

export const PROVIDERS = {
  gemini: {
    id: 'gemini',
    name: 'Gemini API',
    company: 'Google',
    keyProp: 'GEMINI_API_KEY',
    site: 'aistudio.google.com',
    siteName: 'Google AI Studio',
    keyLooks: 'AIzaSy로 시작하는 39글자',
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent',
    priceNote: '무료 등급 제공 (분당·일일 요청 수 제한)',
    ageNote: '계정 연령 정책에 따라 학생 계정은 사용이 제한될 수 있음',
    color: '#1a73e8',
  },
  openai: {
    id: 'openai',
    name: 'OpenAI API',
    company: 'OpenAI',
    keyProp: 'OPENAI_API_KEY',
    site: 'platform.openai.com',
    siteName: 'OpenAI Platform',
    keyLooks: 'sk-proj-로 시작하는 긴 문자열',
    endpoint: 'https://api.openai.com/v1/chat/completions',
    priceNote: '유료 (선불 크레딧 충전 후 사용량만큼 차감)',
    ageNote: '연령 제한과 결제 수단 등록이 필요해 학생이 직접 발급하기 어려움',
    color: '#10a37f',
  },
};

// 무료 등급 분당 요청 수 (오류 체험용)
export const RATE_LIMIT = { gemini: 10, openai: 60 };

// 시뮬레이션 계정
export const ACCOUNT = {
  email: 'student.ai.lab@gmail.com',
  initial: '학',
};

export const LESSONS = {
  '3-5': {
    id: '3-5',
    title: '이모티콘으로 표현하는 영화 퀴즈',
    short: '영화 퀴즈',
    app: 'quiz',
    scriptName: '이모티콘 영화 퀴즈',
    desc: 'API와 API 키의 개념을 익히고, AI Studio 또는 OpenAI 플랫폼에서 키를 발급받아 스크립트 속성에 저장한 뒤 퀴즈 웹앱을 만들어 배포합니다.',
    terms: ['API', 'API Key', '스크립트 속성'],
    color: '#7c4dff',
  },
  '3-6': {
    id: '3-6',
    title: '영어 공부를 도와줘',
    short: '영어 공부 도우미',
    app: 'english',
    scriptName: '영어 공부 AI 도우미',
    desc: '스프레드시트와 연결된 Apps Script에서 생성형 AI API와 Web Speech API를 함께 쓰는 영어 공부 AI 도우미를 만들고 기능을 더해 갑니다.',
    terms: ['키가 필요한 API', '키가 필요 없는 API', 'Web Speech API'],
    color: '#00897b',
  },
  '3-7': {
    id: '3-7',
    title: 'AI 학습 도우미 프로젝트',
    short: 'AI 학습 도우미',
    app: 'helper',
    scriptName: 'AI 학습 도우미',
    desc: '도움이 필요한 과목과 문제를 스스로 정의하고 설계표와 프롬프트를 작성해 나만의 AI 학습 도우미 에이전트를 완성합니다.',
    terms: ['문제 정의', '설계', '에이전트'],
    color: '#f4511e',
  },
};
