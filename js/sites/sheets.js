// 구글 스프레드시트
import { registerSite, openTab, rerenderSite } from '../browser.js';
import { S, emit, on } from '../state.js';
import { esc, toast } from '../util.js';
import { createScript, scriptUrl, getSheet } from '../store.js';
import { accountName } from './accounts.js';

const COLS = 'ABCDEFGHIJ'.split('');

registerSite({
  id: 'sheets',
  match: (u) => u.host === 'docs.google.com' && u.pathname.startsWith('/spreadsheets'),
  title: (ctx) => {
    const sh = getSheet(ctx.url.pathname.split('/')[3]);
    return (sh ? sh.name : '스프레드시트') + ' - Google Sheets';
  },
  rerenderOnShow: true,
  render(el, ctx) {
    const sh = getSheet(ctx.url.pathname.split('/')[3]);
    if (!sh) {
      el.innerHTML = '<div class="nf"><h2>파일을 찾을 수 없습니다</h2><p>드라이브에서 스프레드시트를 다시 열어 주세요.</p></div>';
      return;
    }
    const rows = sh.tabs[sh.active] || [];
    const n = accountName();
    el.innerHTML = `<div class="sh">
      <div class="sh-top">
        <span class="fav fav-sheets big">▦</span>
        <div class="sh-titlebox">
          <input class="sh-title" value="${esc(sh.name)}" data-hint="sheet-title" title="이름 바꾸기">
          <div class="sh-menus">
            <span>파일</span><span>수정</span><span>보기</span><span>삽입</span><span>서식</span><span>데이터</span><span>도구</span>
            <span class="sh-ext" data-act="ext" data-hint="sheet-extensions">확장 프로그램</span><span>도움말</span>
            <div class="sh-dd hidden" id="sh-dd">
              <div class="sh-mi">🧩 부가기능 <span>›</span></div>
              <div class="sh-mi">⏺ 매크로 <span>›</span></div>
              <div class="sh-mi" data-act="appsscript" data-hint="sheet-appsscript">{ } Apps Script</div>
              <div class="sh-mi">▤ AppSheet <span>›</span></div>
            </div>
          </div>
        </div>
        <div class="sh-right"><button class="sh-share">🔒 공유</button><div class="dr-me">${esc(n.slice(0, 1))}</div></div>
      </div>
      <div class="sh-tool">↶ ↷ 🖨 &nbsp; 100% ▾ &nbsp;|&nbsp; ₩ % .0 .00 123 &nbsp;|&nbsp; 기본값 ▾ &nbsp; 10 &nbsp;|&nbsp; <b>B</b> <i>I</i> <s>S</s> A</div>
      <div class="sh-fx"><span class="sh-cellref">A1</span><span class="sh-fxi">fx</span><span class="sh-fxv">${esc(rows[0] ? rows[0][0] : '')}</span></div>
      <div class="sh-gridwrap"><table class="sh-grid">
        <thead><tr><th class="sh-corner"></th>${COLS.map((c) => `<th>${c}</th>`).join('')}</tr></thead>
        <tbody>${Array.from({ length: Math.max(28, rows.length + 4) })
          .map((_, r) => `<tr><th>${r + 1}</th>${COLS.map((c, ci) => {
            const v = rows[r] ? rows[r][ci] : '';
            return `<td class="${r === 0 && rows.length ? 'hd' : ''}" title="${esc(v ?? '')}">${esc(v ?? '')}</td>`;
          }).join('')}</tr>`)
          .join('')}</tbody></table></div>
      <div class="sh-tabs"><span class="sh-add">＋</span><span class="sh-list">☰</span>${sh.order
        .map((t) => `<span class="sh-tab ${t === sh.active ? 'on' : ''}" data-act="tab" data-t="${esc(t)}">${esc(t)}</span>`)
        .join('')}</div>
    </div>`;
    const title = el.querySelector('.sh-title');
    title.onchange = () => {
      sh.name = title.value.trim() || '제목 없는 스프레드시트';
      ctx.setTitle(sh.name + ' - Google Sheets');
      emit('sheet:renamed', { id: sh.id, name: sh.name });
    };
    title.onkeydown = (e) => e.key === 'Enter' && title.blur();
    const dd = el.querySelector('#sh-dd');
    el.onclick = (e) => {
      const a = e.target.closest('[data-act]');
      if (!a) {
        dd.classList.add('hidden');
        return;
      }
      if (a.dataset.act === 'ext') {
        dd.classList.toggle('hidden');
        emit('sheet:extmenu');
        return;
      }
      if (a.dataset.act === 'appsscript') {
        dd.classList.add('hidden');
        let sc = sh.scriptId ? S.L.scripts[sh.scriptId] : null;
        if (!sc) sc = createScript({ bound: sh.id });
        toast('스프레드시트와 연결된 Apps Script를 새 탭에서 열어요.');
        openTab(scriptUrl(sc));
        return;
      }
      if (a.dataset.act === 'tab') {
        sh.active = a.dataset.t;
        ctx.rerender();
        emit('sheet:tab', { tab: sh.active });
      }
    };
  },
});

on((evt) => {
  if (evt === 'sheet:changed') rerenderSite('sheets');
});
