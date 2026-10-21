// 구글 계정 선택과 Apps Script 권한 승인 팝업
import { openPopup } from '../browser.js';
import { S } from '../state.js';
import { ACCOUNT } from '../config.js';
import { esc } from '../util.js';

export function accountName() {
  return (S.L && S.L.studentName) || '학생';
}

function chooserHTML(service) {
  const n = accountName();
  return `<div class="ga">
    <div class="ga-g">Google</div>
    <h2>계정 선택</h2>
    <p class="ga-sub"><b>${esc(service)}</b>(으)로 이동</p>
    <button class="ga-acc" data-act="pick" data-hint="google-account"><span class="ga-av">${esc(n.slice(0, 1))}</span>
      <span><b>${esc(n)}</b><br><small>${ACCOUNT.email}</small></span></button>
    <button class="ga-acc ga-other" data-act="other"><span class="ga-av ga-av-o">👤</span><span>다른 계정 사용</span></button>
    <p class="ga-foot">계속 진행하기 위해 Google에서 내 이름, 이메일 주소, 언어 환경설정, 프로필 사진을 ${esc(service)}와(과) 공유합니다.</p>
    <p class="ga-sim">시뮬레이션 계정입니다. 비밀번호는 입력하지 않아요.</p>
  </div>`;
}

export function googleSignIn(service, onDone) {
  openPopup({
    url: 'accounts.google.com/v3/signin/accountchooser',
    title: 'Google 계정으로 로그인',
    render(body, close) {
      body.innerHTML = chooserHTML(service);
      body.onclick = (e) => {
        const a = e.target.closest('[data-act]');
        if (!a) return;
        if (a.dataset.act === 'other') {
          a.insertAdjacentHTML('afterend', '<p class="ga-warn">시뮬레이션에서는 위의 학생 계정만 사용할 수 있어요.</p>');
          return;
        }
        if (a.dataset.act === 'pick') {
          body.innerHTML = `<div class="ga ga-center"><div class="ga-spin"></div><p>로그인 중...</p></div>`;
          setTimeout(() => {
            close();
            onDone && onDone();
          }, 700);
        }
      };
    },
  });
}

const SCOPE_TEXT = {
  external: { t: '외부 서비스에 연결', u: 'https://www.googleapis.com/auth/script.external_request' },
  sheets: { t: '이 애플리케이션이 설치된 Google Sheets 스프레드시트 보기 및 관리', u: 'https://www.googleapis.com/auth/spreadsheets.currentonly' },
  sheetsAll: { t: 'Google Drive의 모든 스프레드시트 보기, 수정, 생성, 삭제', u: 'https://www.googleapis.com/auth/spreadsheets' },
};

// Apps Script 권한 승인 흐름
export function authorizeScript({ projectName, scopes, onDone, onCancel }) {
  openPopup({
    url: 'accounts.google.com/o/oauth2/v2/auth',
    title: 'Google 계정으로 로그인',
    width: 500,
    render(body, close, setUrl) {
      const step1 = () => {
        body.innerHTML = chooserHTML(projectName);
        body.onclick = (e) => {
          const a = e.target.closest('[data-act]');
          if (!a) return;
          if (a.dataset.act === 'other') {
            a.insertAdjacentHTML('afterend', '<p class="ga-warn">시뮬레이션에서는 위의 학생 계정만 사용할 수 있어요.</p>');
            return;
          }
          step2();
        };
      };
      const step2 = () => {
        setUrl('accounts.google.com/signin/oauth/warning');
        body.innerHTML = `<div class="ga ga-warnpage">
          <div class="ga-g">Google</div>
          <div class="ga-tri">⚠</div>
          <h2>Google에서 확인하지 않은 앱</h2>
          <p>이 앱은 Google에서 확인하지 않았습니다. 개발자(${ACCOUNT.email})를 알고 신뢰하는 경우에만 계속하세요.</p>
          <p class="ga-hintline">내가 만든 프로젝트라면 [고급]을 눌러 계속 진행할 수 있어요.</p>
          <div class="ga-adv hidden" id="ga-adv">
            <p>Google에서 아직 앱을 검토하지 않았으므로 앱의 진위를 확인할 수 없습니다. 확인되지 않은 앱은 개인 정보를 위협할 수 있습니다.</p>
            <a class="ga-unsafe" data-act="unsafe" data-hint="auth-unsafe">${esc(projectName)}(으)로 이동(안전하지 않음)</a>
          </div>
          <div class="ga-row"><a class="ga-link" data-act="adv" data-hint="auth-advanced">고급</a>
            <button class="ga-btn" data-act="back">안전한 페이지로 돌아가기</button></div>
        </div>`;
        body.onclick = (e) => {
          const a = e.target.closest('[data-act]');
          if (!a) return;
          if (a.dataset.act === 'adv') body.querySelector('#ga-adv').classList.remove('hidden');
          if (a.dataset.act === 'back') {
            close();
            onCancel && onCancel('back');
          }
          if (a.dataset.act === 'unsafe') step3();
        };
      };
      const step3 = () => {
        setUrl('accounts.google.com/signin/oauth/id');
        const list = scopes.map((s) => SCOPE_TEXT[s]).filter(Boolean);
        body.innerHTML = `<div class="ga ga-consent">
          <div class="ga-g">Google</div>
          <h2>${esc(projectName)}에서 Google 계정에 대한 추가 액세스를 요청합니다</h2>
          <p class="ga-email">${ACCOUNT.email}</p>
          <p><b>${esc(projectName)}에서 액세스할 수 있는 항목을 선택하세요.</b></p>
          <label class="ga-all"><input type="checkbox" id="ga-allbox" data-hint="auth-selectall"> 모두 선택</label>
          ${list.map((s, i) => `<label class="ga-scope"><input type="checkbox" class="ga-sc" data-i="${i}"> <span>${esc(s.t)}<br><small>${s.u}</small></span></label>`).join('')}
          <p class="ga-small">${esc(projectName)}을(를) 신뢰할 수 있는지 확인하세요. 이 앱과 민감한 정보를 공유하게 될 수도 있습니다.</p>
          <p class="ga-need hidden">웹앱이 제대로 동작하려면 모든 권한을 선택해야 해요.</p>
          <div class="ga-row end"><button class="ga-btn ghost" data-act="cancel">취소</button><button class="ga-btn" data-act="ok" data-hint="auth-continue">계속</button></div>
        </div>`;
        const all = body.querySelector('#ga-allbox');
        const boxes = Array.from(body.querySelectorAll('.ga-sc'));
        all.onchange = () => boxes.forEach((b) => (b.checked = all.checked));
        boxes.forEach((b) => (b.onchange = () => (all.checked = boxes.every((x) => x.checked))));
        body.onclick = (e) => {
          const a = e.target.closest('[data-act]');
          if (!a) return;
          if (a.dataset.act === 'cancel') {
            close();
            onCancel && onCancel('cancel');
          }
          if (a.dataset.act === 'ok') {
            if (!boxes.every((b) => b.checked)) {
              body.querySelector('.ga-need').classList.remove('hidden');
              return;
            }
            body.innerHTML = `<div class="ga ga-center"><div class="ga-spin"></div><p>권한을 승인하는 중...</p></div>`;
            setTimeout(() => {
              close();
              onDone && onDone();
            }, 800);
          }
        };
      };
      step1();
    },
  });
}

export const scopeText = SCOPE_TEXT;
