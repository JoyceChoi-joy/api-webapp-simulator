// 구글 드라이브
import { registerSite, openTab } from '../browser.js';
import { S, emit } from '../state.js';
import { esc, toast, today } from '../util.js';
import { createScript, createSheet, scriptUrl, sheetUrl } from '../store.js';
import { accountName } from './accounts.js';

const SAMPLE = [
  { name: '수업 자료', type: 'folder', date: '2026. 9. 2.' },
  { name: '동아리 활동', type: 'folder', date: '2026. 8. 28.' },
  { name: '1학기 정보 수행평가 안내', type: 'doc', date: '2026. 3. 14.' },
];

function icon(type) {
  if (type === 'folder') return '<span class="dr-ic dr-folder">📁</span>';
  if (type === 'sheet') return '<span class="dr-ic dr-sheet">▦</span>';
  if (type === 'script') return '<span class="dr-ic dr-script">{ }</span>';
  return '<span class="dr-ic dr-doc">≡</span>';
}

function files() {
  const out = [];
  Object.values(S.L.sheets).forEach((sh) => out.push({ name: sh.name, type: 'sheet', id: sh.id, date: '오늘', t: sh.created }));
  Object.values(S.L.scripts)
    .filter((sc) => !sc.bound)
    .forEach((sc) => out.push({ name: sc.name, type: 'script', id: sc.id, date: '오늘', t: sc.created }));
  out.sort((a, b) => b.t - a.t);
  return out.concat(SAMPLE);
}

registerSite({
  id: 'drive',
  match: (u) => u.host === 'drive.google.com',
  title: () => '내 드라이브 - Google Drive',
  rerenderOnShow: true,
  render(el, ctx) {
    const n = accountName();
    el.innerHTML = `<div class="dr">
      <div class="dr-top">
        <div class="dr-brand"><span class="fav fav-drive big">▲</span> 드라이브</div>
        <div class="dr-search">🔍 <input placeholder="드라이브에서 검색"></div>
        <div class="dr-me" title="${esc(n)}">${esc(n.slice(0, 1))}</div>
      </div>
      <div class="dr-body">
        <aside class="dr-side">
          <button class="dr-new" data-act="new" data-hint="drive-new"><span>＋</span> 신규</button>
          <nav>
            <a>🏠 홈</a><a class="on">🗂 내 드라이브</a><a>💻 컴퓨터</a><a>👥 공유 문서함</a><a>🕘 최근 문서함</a><a>⭐ 중요 문서함</a><a>🚫 스팸</a><a>🗑 휴지통</a>
          </nav>
          <div class="dr-quota"><div class="dr-qbar"><span style="width:18%"></span></div>15GB 중 2.7GB 사용</div>
        </aside>
        <main class="dr-main">
          <h2>내 드라이브 ▾</h2>
          <div class="dr-chips"><span>유형 ▾</span><span>사용자 ▾</span><span>수정 날짜 ▾</span></div>
          <table class="dr-list">
            <thead><tr><th>이름</th><th>소유자</th><th>최종 수정 날짜</th><th>파일 크기</th></tr></thead>
            <tbody>${files()
              .map(
                (f) => `<tr class="dr-row" data-act="open" data-type="${f.type}" data-id="${f.id || ''}">
                <td>${icon(f.type)} ${esc(f.name)}</td><td>나</td><td>${esc(f.date)}</td><td>${f.type === 'folder' ? '-' : '1KB'}</td></tr>`
              )
              .join('')}</tbody>
          </table>
          <p class="dr-tip">파일을 두 번 클릭하면 열 수 있어요.</p>
        </main>
      </div>
      <div class="dr-menu hidden" id="dr-menu">
        <div class="dr-mi" data-act="todo">📁 새 폴더</div>
        <div class="dr-sep"></div>
        <div class="dr-mi" data-act="todo">⬆ 파일 업로드</div>
        <div class="dr-mi" data-act="todo">⬆ 폴더 업로드</div>
        <div class="dr-sep"></div>
        <div class="dr-mi sub" data-act="todo">≡ Google 문서 <span>›</span></div>
        <div class="dr-mi sub" data-sub="sheets" data-hint="drive-sheets">▦ Google 스프레드시트 <span>›</span>
          <div class="dr-submenu">
            <div class="dr-mi" data-act="newsheet" data-hint="drive-blank-sheet">빈 스프레드시트</div>
            <div class="dr-mi" data-act="todo">템플릿에서</div>
          </div>
        </div>
        <div class="dr-mi sub" data-act="todo">▭ Google 프레젠테이션 <span>›</span></div>
        <div class="dr-mi" data-act="todo">▶ Google Vids</div>
        <div class="dr-mi sub" data-act="todo">☰ Google 설문지 <span>›</span></div>
        <div class="dr-mi sub" data-sub="more" data-hint="drive-more">더보기 <span>›</span>
          <div class="dr-submenu">
            <div class="dr-mi" data-act="todo">✎ Google 드로잉</div>
            <div class="dr-mi" data-act="todo">📍 Google 내 지도</div>
            <div class="dr-mi" data-act="todo">🌐 Google 사이트 도구</div>
            <div class="dr-mi" data-act="newscript" data-hint="drive-appsscript">{ } Google Apps Script</div>
            <div class="dr-sep"></div>
            <div class="dr-mi" data-act="todo">＋ 연결할 앱 더보기</div>
          </div>
        </div>
      </div>
    </div>`;
    const menu = el.querySelector('#dr-menu');
    el.querySelectorAll('.dr-mi.sub[data-sub]').forEach((m) => {
      m.onmouseenter = () => {
        el.querySelectorAll('.dr-mi.sub').forEach((x) => x.classList.remove('open'));
        m.classList.add('open');
        emit('drive:submenu', { sub: m.dataset.sub });
      };
    });
    el.querySelectorAll('.dr-mi.sub:not([data-sub])').forEach((m) => {
      m.onmouseenter = () => el.querySelectorAll('.dr-mi.sub').forEach((x) => x.classList.remove('open'));
    });
    el.onclick = (e) => {
      const subOpen = e.target.closest('.dr-mi.sub[data-sub]');
      const a = e.target.closest('[data-act]');
      if (subOpen && (!a || !subOpen.contains(a) || a === subOpen)) {
        subOpen.classList.toggle('open');
        return;
      }
      if (!a) {
        if (!e.target.closest('#dr-menu')) menu.classList.add('hidden');
        return;
      }
      const act = a.dataset.act;
      if (act === 'new') {
        menu.classList.toggle('hidden');
        emit('drive:newmenu');
        e.stopPropagation();
        return;
      }
      if (act === 'todo') {
        toast('이번 실습에서는 사용하지 않는 메뉴예요.');
        return;
      }
      if (act === 'newscript') {
        menu.classList.add('hidden');
        const sc = createScript();
        toast('새 Apps Script 프로젝트를 만들었어요. 새 탭에서 열립니다.');
        openTab(scriptUrl(sc));
        return;
      }
      if (act === 'newsheet') {
        menu.classList.add('hidden');
        const sh = createSheet();
        openTab(sheetUrl(sh));
        return;
      }
    };
    el.querySelectorAll('.dr-row').forEach((r) => {
      r.onclick = () => {
        el.querySelectorAll('.dr-row').forEach((x) => x.classList.remove('sel'));
        r.classList.add('sel');
      };
      r.ondblclick = () => {
        const { type, id } = r.dataset;
        if (type === 'script') openTab(scriptUrl(S.L.scripts[id]));
        else if (type === 'sheet') openTab(sheetUrl(S.L.sheets[id]));
        else toast('이번 실습에서는 열지 않아도 되는 파일이에요.');
      };
    });
    void today;
  },
});
