# 생성형 AI API 웹앱 실습 시뮬레이터

교재 3-5 「이모티콘으로 표현하는 영화 퀴즈」, 3-6 「영어 공부를 도와줘」, 3-7 「AI 학습 도우미 프로젝트」 실습을 실제 API 키 없이 따라 해 보는 웹 시뮬레이터입니다.
학생은 Gemini API 또는 OpenAI API를 골라 키 발급, 스크립트 속성 저장, 코드 생성, 웹앱 배포, 오류 해결, 기능 추가까지 실제 화면과 같은 흐름으로 체험합니다.

## 주요 기능

- **가상 브라우저**: 탭, 주소창, 뒤로 가기, 새로고침, 구글 검색 결과 화면
- **API 키 발급 체험**
  - Google AI Studio: 로그인 → 약관 동의 → API 키 페이지 → 키 이름, 프로젝트 선택 → 키 복사
  - OpenAI Platform: 로그인 → 조직 만들기 → Billing 크레딧 확인 → Create new secret key → Save your key(한 번만 보임)
- **Google 드라이브, 스프레드시트, Apps Script 편집기**: 새 프로젝트 만들기, 확장 프로그램 연결, 파일 추가, 저장(Ctrl+S), 구문 오류 검사, 스크립트 속성, 새 배포, 배포 관리(새 버전), 권한 승인(확인되지 않은 앱 → 고급 → 허용), 실행 기록
- **Gemini 채팅**: 프롬프트에 맞춰 Code.gs와 index.html을 만들어 주고, 오류 메시지를 붙여 넣으면 원인과 수정 코드를 알려 줍니다. 생성되는 코드는 실제 Apps Script에서도 동작하도록 작성했습니다.
- **웹앱 실행**: 학생이 붙여 넣은 index.html을 그대로 실행하고 `google.script.run` 호출을 시뮬레이션 서버로 연결합니다. 코드를 잘못 붙여 넣으면 실제와 같은 오류가 납니다.
- **오류 체험**: 서비스가 끝난 모델(404), 잘못된 키(400/401), 키 권한 부족, 크레딧 없음(429 insufficient_quota), 분당 요청 한도 초과(429), doGet 없음, HTML 파일 없음, 구문 오류
- **API 통신 보기**: index.html → Code.gs → 스크립트 속성 → UrlFetchApp → AI API로 오가는 요청과 응답 JSON을 단계별로 보여 줍니다.
- **실습 안내 패널**: 교재 순서대로 단계가 자동으로 체크되고, [힌트 보기]를 누르면 눌러야 할 곳이 강조됩니다. 활동지(생각 열기, 문제 정의, 설계표)와 실습 보고서(인쇄 가능)를 제공합니다.
- **선생님 설정**: 오류 체험 켜기/끄기, 원하는 단계로 이동, 차시 초기화, 계정과 키 초기화

## 폴더 구성

```
index.html            첫 화면
vercel.json           Vercel 배포 설정
css/app.css           전체 디자인
js/main.js            시작 화면, 작업 화면
js/config.js          모델 이름, API 정보, 차시 정보 (모델을 바꿀 때 이 파일만 고치면 됨)
js/missions.js        차시별 실습 단계와 완료 조건
js/guide.js           왼쪽 안내 패널, 힌트, 활동지, 보고서
js/codegen.js         생성형 AI가 만들어 주는 Code.gs, index.html
js/responder.js       Gemini 채팅 답변 규칙
js/backend.js         Code.gs 서버 함수와 AI API 호출 시뮬레이션
js/analyze.js         학생이 붙여 넣은 코드 분석
js/sites/*.js         가상 사이트 (드라이브, 시트, Apps Script, AI Studio, OpenAI, Gemini, 웹앱)
js/data/*.js          영화 퀴즈, 영단어, 교과 개념 데이터
```

## Vercel 배포 방법

빌드 과정이 없는 정적 사이트라서 폴더를 그대로 올리면 됩니다.

### 방법 1. GitHub 저장소로 배포 (추천)

1. GitHub에 새 저장소를 만들고 이 폴더의 파일을 모두 올립니다.
2. [vercel.com](https://vercel.com)에 로그인한 뒤 **Add New → Project**를 누릅니다.
3. 방금 만든 저장소를 **Import**합니다.
4. Framework Preset은 **Other**, Build Command와 Output Directory는 비워 둔 채 **Deploy**를 누릅니다.
5. 이후에는 저장소에 수정 사항을 올릴 때마다 자동으로 다시 배포됩니다.

### 방법 2. Vercel CLI로 배포

```bash
npm i -g vercel
cd api-sim
vercel          # 처음 한 번: 프로젝트 연결
vercel --prod   # 실제 주소로 배포
```

## 내 컴퓨터에서 미리 보기

ES 모듈을 사용하므로 파일을 더블클릭하면 열리지 않습니다. 간단한 웹 서버로 여세요.

```bash
cd api-sim
python -m http.server 8000
# 브라우저에서 http://localhost:8000
```

## 수업 운영 팁

- 진행 상황은 학생 브라우저의 localStorage에 저장됩니다. 같은 컴퓨터, 같은 브라우저에서 이어서 할 수 있습니다.
- 3-5에서 발급한 시뮬레이션 키와 로그인 상태는 3-6, 3-7에서도 이어집니다. Gemini는 기존 키를 다시 복사할 수 있고, OpenAI는 키를 다시 볼 수 없어 새 키를 만들도록 안내합니다.
- 3-5는 처음 생성한 코드에 서비스가 끝난 모델을 넣어 오류 해결 과정을 체험하게 되어 있습니다. 상단 **⚙ 설정**에서 끌 수 있습니다.
- OpenAI를 고르고 Billing 단계를 건너뛰면 웹앱에서 429 insufficient_quota 오류를 체험합니다.
- Gemini 채팅은 교재 실습 프롬프트에 맞춰 준비된 답을 보여 줍니다. 웹앱 안의 AI 답변(영화 문제, 영단어 예문, 교과 개념 설명)은 `js/data` 폴더의 데이터로 만들어집니다.
- 모델 이름이 바뀌면 `js/config.js`의 `MODELS` 값을 고치세요.

## 안내

이 사이트는 교육용 시뮬레이션입니다. 실제 Google, OpenAI 서비스에 접속하지 않으며 실제 비밀번호, 결제 정보, API 키를 입력받지 않습니다. 화면 속 키와 주소는 모두 무작위로 만든 가짜 값입니다.
