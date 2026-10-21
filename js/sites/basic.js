// 새 탭, 구글 검색, 연결할 수 없는 사이트
import { registerSite } from '../browser.js';
import { S, flag } from '../state.js';
import { esc } from '../util.js';

const RESULTS = [
  { keys: ['aistudio', 'ai studio', '에이아이 스튜디오', 'ai스튜디오', '제미나이 api', '제미나이api', 'gemini api', 'geminiapi', 'api 키', 'api키', '구글 ai'], url: 'https://aistudio.google.com/', title: 'Google AI Studio', desc: 'Gemini 모델을 바로 사용해 보고 API 키를 만들 수 있는 개발자용 도구입니다.' },
  { keys: ['gemini api', '제미나이 api', 'api 키', 'gemini 키'], url: 'https://ai.google.dev/gemini-api/docs/api-key', title: 'Gemini API 키 사용하기 | Google AI for Developers', desc: 'Google AI Studio에서 API 키를 만들고 안전하게 관리하는 방법을 안내합니다.', disabled: true },
  { keys: ['openai', '오픈ai', '오픈에이아이', 'open ai', 'gpt api', 'chatgpt api', 'openai api', 'api key', 'platform'], url: 'https://platform.openai.com/', title: 'OpenAI Platform', desc: 'OpenAI API 키를 만들고 사용량과 결제를 관리하는 개발자 플랫폼입니다.' },
  { keys: ['drive', '드라이브', '구글드라이브', '구글 드라이브', 'google drive'], url: 'https://drive.google.com/drive/my-drive', title: 'Google Drive: 로그인', desc: '파일을 저장하고 어디서나 열 수 있는 클라우드 저장소입니다.' },
  { keys: ['gemini', '제미나이', '재미나이', 'bard'], url: 'https://gemini.google.com/app', title: 'Google Gemini', desc: '질문하고 글을 쓰고 코드를 만드는 데 도움을 받을 수 있는 AI 어시스턴트입니다.' },
  { keys: ['apps script', '앱스 스크립트', '앱스스크립트', 'appsscript', 'gas'], url: 'https://script.google.com/home', title: 'Apps Script - Google', desc: '구글 서비스와 연결되는 코드를 작성하고 웹앱으로 배포할 수 있습니다.' },
  { keys: ['스프레드시트', '구글 시트', 'sheets', '시트'], url: 'https://drive.google.com/drive/my-drive', title: 'Google Sheets: 온라인 스프레드시트', desc: '드라이브에서 새 스프레드시트를 만들 수 있습니다.' },
];

registerSite({
  id: 'newtab',
  match: () => false,
  title: () => '새 탭',
  noVisitEvent: true,
  render(el, ctx) {
    const visited = (s) => flag('visit:' + s) > 0;
    const tiles = [
      { url: 'https://drive.google.com/drive/my-drive', name: '드라이브', cls: 'fav-drive', ico: '▲', show: true },
      { url: 'https://gemini.google.com/app', name: 'Gemini', cls: 'fav-gm', ico: '✧', show: true },
      { url: 'https://aistudio.google.com/', name: 'AI Studio', cls: 'fav-ai', ico: '✦', show: visited('aistudio') },
      { url: 'https://platform.openai.com/', name: 'OpenAI', cls: 'fav-oa', ico: '◍', show: visited('openai') },
    ].filter((t) => t.show);
    el.innerHTML = `<div class="nt">
      <div class="nt-logo">Google</div>
      <div class="nt-search"><span>🔍</span><input class="nt-q" placeholder="Google 검색 또는 URL 입력"></div>
      <div class="nt-tiles">${tiles
        .map((t) => `<button class="nt-tile" data-url="${t.url}"><span class="nt-ico fav ${t.cls}">${t.ico}</span><span>${t.name}</span></button>`)
        .join('')}</div>
      <p class="nt-note">자주 방문한 사이트가 이곳에 나타나요. 주소를 알면 위쪽 주소창에 직접 입력해도 됩니다.</p>
    </div>`;
    el.querySelectorAll('.nt-tile').forEach((b) => (b.onclick = () => ctx.go(b.dataset.url)));
    const q = el.querySelector('.nt-q');
    q.onkeydown = (e) => {
      if (e.key === 'Enter' && q.value.trim()) ctx.go(q.value.trim());
    };
  },
});

registerSite({
  id: 'google',
  match: (u) => /(^|\.)google\.com$/.test(u.host) && (u.host === 'www.google.com' || u.host === 'google.com'),
  title: (ctx) => (ctx.url.pathname === '/search' ? `${ctx.url.searchParams.get('q')} - Google 검색` : 'Google'),
  render(el, ctx) {
    const q = ctx.url.searchParams.get('q') || '';
    if (ctx.url.pathname !== '/search') {
      el.innerHTML = `<div class="nt"><div class="nt-logo">Google</div><div class="nt-search"><span>🔍</span><input class="nt-q" placeholder="Google 검색 또는 URL 입력"></div></div>`;
      const inp = el.querySelector('.nt-q');
      inp.onkeydown = (e) => e.key === 'Enter' && inp.value.trim() && ctx.go(inp.value.trim());
      return;
    }
    const lq = q.toLowerCase();
    let hits = RESULTS.filter((r) => r.keys.some((k) => lq.includes(k) || k.includes(lq)));
    if (!hits.length) hits = [];
    el.innerHTML = `<div class="gs">
      <div class="gs-top"><span class="gs-logo">Google</span><div class="gs-box"><input value="${esc(q)}"><span>🔍</span></div></div>
      <div class="gs-tabs"><span class="on">전체</span><span>이미지</span><span>동영상</span><span>뉴스</span></div>
      <div class="gs-res">
        ${hits.length ? `<p class="gs-count">검색결과 약 ${(hits.length * 1830000).toLocaleString()}개 (0.31초)</p>` : `<p class="gs-count">'${esc(q)}'에 대한 시뮬레이션 검색 결과가 없습니다. 주소창에 사이트 주소를 직접 입력해 보세요.</p>`}
        ${hits
          .map(
            (r) => `<div class="gs-item"><div class="gs-site">${esc(new URL(r.url).host)}</div>
          <a class="gs-link ${r.disabled ? 'disabled' : ''}" data-url="${r.url}">${esc(r.title)}</a><p>${esc(r.desc)}</p></div>`
          )
          .join('')}
      </div></div>`;
    el.querySelectorAll('.gs-link').forEach((a) => {
      a.onclick = () => {
        if (a.classList.contains('disabled')) {
          a.insertAdjacentHTML('afterend', '<p class="gs-warn">이 시뮬레이션에서는 문서 사이트를 열 수 없어요.</p>');
          a.classList.remove('disabled');
          a.onclick = null;
          return;
        }
        ctx.go(a.dataset.url);
      };
    });
    const inp = el.querySelector('.gs-box input');
    inp.onkeydown = (e) => e.key === 'Enter' && inp.value.trim() && ctx.go(inp.value.trim());
  },
});

registerSite({
  id: 'notfound',
  match: () => false,
  title: (ctx) => ctx.url.host,
  render(el, ctx) {
    el.innerHTML = `<div class="nf"><div class="nf-ico">🦖</div><h2>사이트에 연결할 수 없음</h2>
      <p><b>${esc(ctx.url.host)}</b>에 연결하지 못했어요. 이 시뮬레이션에서 열 수 있는 사이트만 지원합니다.</p>
      <ul><li>주소를 다시 확인해 보세요. 예: <code>aistudio.google.com</code>, <code>platform.openai.com</code>, <code>drive.google.com</code>, <code>gemini.google.com</code></li></ul></div>`;
  },
});

export const _ = S;
