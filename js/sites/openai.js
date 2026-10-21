// OpenAI Platform (시뮬레이션)
import { registerSite } from '../browser.js';
import { S, emit } from '../state.js';
import { esc, makeOpenAIKey, maskKey, copyText, siteModal, toast, today, randStr } from '../util.js';
import { MODELS } from '../config.js';
import { googleSignIn, accountName } from './accounts.js';

const O = () => S.account.openai;
const ko = (t) => `<span class="oa-ko">${t}</span>`;

function topbar() {
  const n = accountName();
  const o = O();
  return `<header class="oa-top">
    <div class="oa-brand"><span class="oa-knot">◍</span> OpenAI Platform</div>
    ${o.org ? `<div class="oa-org">${esc(o.org)} <span>/</span> Default project ▾</div>` : ''}
    <div class="oa-top-r"><a>Docs</a><a>API reference</a>
      ${o.org ? `<button class="oa-gear" data-act="go" data-url="/settings/organization/general" title="Settings" data-hint="openai-settings">⚙</button>` : ''}
      <span class="oa-av">${esc(n.slice(0, 1))}</span></div>
  </header>`;
}

function dashShell(page, inner) {
  const items = [
    ['/chat', '💬 Chat', 'chat'],
    ['/home', '🏠 Home', 'home'],
  ];
  const dash = [
    ['/usage', 'Usage', 'usage', ''],
    ['/api-keys', 'API keys', 'apikeys', 'openai-nav-apikeys'],
    ['/logs', 'Logs', 'logs', ''],
    ['/storage', 'Storage', 'storage', ''],
  ];
  return `<div class="oa">${topbar()}<div class="oa-body">
    <aside class="oa-side">
      ${items.map((x) => `<a class="oa-nav ${page === x[2] ? 'on' : ''}" data-act="go" data-url="${x[0]}">${x[1]}</a>`).join('')}
      <div class="oa-group">Dashboard</div>
      ${dash.map((x) => `<a class="oa-nav ${page === x[2] ? 'on' : ''}" data-act="go" data-url="${x[0]}" ${x[3] ? `data-hint="${x[3]}"` : ''}>${x[1]}</a>`).join('')}
    </aside><main class="oa-main">${inner}</main></div></div>`;
}

function settingsShell(page, inner) {
  const org = [
    ['/settings/organization/general', 'General', 'general', ''],
    ['/settings/organization/api-keys', 'API keys', 'apikeys', 'openai-nav-apikeys'],
    ['/settings/organization/members', 'Members', 'members', ''],
    ['/settings/organization/projects', 'Projects', 'projects', ''],
    ['/settings/organization/billing/overview', 'Billing', 'billing', 'openai-billing'],
    ['/settings/organization/limits', 'Limits', 'limits', ''],
    ['/settings/organization/usage', 'Usage', 'usage', ''],
  ];
  return `<div class="oa">${topbar()}<div class="oa-body">
    <aside class="oa-side">
      <a class="oa-nav" data-act="go" data-url="/home">← Back to dashboard</a>
      <div class="oa-group">Organization</div>
      ${org.map((x) => `<a class="oa-nav ${page === x[2] ? 'on' : ''}" data-act="go" data-url="${x[0]}" ${x[3] ? `data-hint="${x[3]}"` : ''}>${x[1]}</a>`).join('')}
      <div class="oa-group">Project</div><a class="oa-nav">General</a><a class="oa-nav">Members</a><a class="oa-nav">Limits</a>
    </aside><main class="oa-main">${inner}</main></div></div>`;
}

function landing() {
  return `<div class="oa">${topbar()}<div class="oa-hero">
    <h1>Build with the OpenAI API</h1>
    <p>OpenAI의 AI 모델을 내 앱에 연결해 보세요.</p>
    <div class="oa-row"><button class="oa-btn" data-act="login" data-hint="openai-login">Log in</button><button class="oa-btn ghost" data-act="login">Sign up</button></div>
  </div></div>`;
}

function loginPage() {
  return `<div class="oa-auth">
    <div class="oa-brand center"><span class="oa-knot">◍</span> OpenAI</div>
    <h1>Welcome back</h1>${ko('다시 오신 것을 환영합니다')}
    <input class="oa-in" placeholder="Email address" id="oa-email">
    <button class="oa-btn wide" data-act="email">Continue</button>
    <div class="oa-or"><span>OR</span></div>
    <button class="oa-sso" data-act="google" data-hint="openai-google"><b class="g">G</b> Continue with Google</button>
    <button class="oa-sso" data-act="sso"><b>⊞</b> Continue with Microsoft Account</button>
    <button class="oa-sso" data-act="sso"><b></b> Continue with Apple</button>
    <p class="oa-small">시뮬레이션에서는 [Continue with Google]로 학생 계정을 사용해요.</p>
  </div>`;
}

function onboarding() {
  return `<div class="oa-auth wide">
    <div class="oa-brand center"><span class="oa-knot">◍</span> OpenAI Platform</div>
    <h1>Create an organization</h1>${ko('조직 만들기: API 사용량과 결제는 조직 단위로 관리돼요.')}
    <label class="oa-lab">Organization name</label>
    <input class="oa-in" id="oa-org" value="Personal" data-hint="openai-orgname">
    <label class="oa-lab">What best describes you?</label>
    <select class="oa-in"><option>Student / Learning</option><option>Developer</option><option>Researcher</option></select>
    <div class="oa-note">실제 가입 과정에서는 이메일 확인, 휴대전화 인증, 연령 확인, 결제 수단 등록이 필요할 수 있어요. 시뮬레이션에서는 이 과정을 생략합니다.</div>
    <button class="oa-btn wide" data-act="org" data-hint="openai-createorg">Create organization</button>
  </div>`;
}

function homePage() {
  return `<div class="oa-page">
    <h1>Welcome to the OpenAI Platform</h1>${ko('왼쪽 Dashboard 메뉴에서 API 키를 만들고 사용량을 확인할 수 있어요.')}
    <div class="oa-cards">
      <div class="oa-card"><b>Quickstart</b><p>Make your first API request in minutes.</p></div>
      <div class="oa-card"><b>Models</b><p>${MODELS.openai.current}, ${MODELS.openai.valid[1]} and more.</p></div>
      <div class="oa-card"><b>Billing</b><p>API 사용에는 선불 크레딧이 필요해요. Settings → Billing</p></div>
    </div>
  </div>`;
}

function keysPage() {
  const keys = O().keys.filter((k) => !k.revoked);
  return `<div class="oa-page">
    <div class="oa-head"><div><h1>API keys</h1>${ko('비밀 키(secret key)는 처음 만들 때 한 번만 전체 내용을 볼 수 있어요.')}</div>
      <button class="oa-btn" data-act="create" data-hint="openai-create">＋ Create new secret key</button></div>
    <p class="oa-desc">Do not share your API key with others or expose it in the browser or other client-side code. To protect your account's security, OpenAI may automatically disable any API key that has leaked publicly.</p>
    ${
      keys.length
        ? `<table class="oa-table"><thead><tr><th>NAME</th><th>SECRET KEY</th><th>CREATED</th><th>LAST USED</th><th>CREATED BY</th><th>PERMISSIONS</th><th></th></tr></thead><tbody>
      ${keys
        .map(
          (k) => `<tr><td>${esc(k.name)}</td><td><code>${esc(maskKey(k.value))}</code></td><td>${esc(k.date)}</td><td>${k.lastUsed ? 'Today' : 'Never'}</td><td>${esc(accountName())}</td><td>${esc(k.perm)}</td>
        <td><button class="oa-ico" data-act="del" data-id="${k.id}" title="Revoke key">🗑</button></td></tr>`
        )
        .join('')}</tbody></table>`
        : `<div class="oa-empty">No API keys yet. ${ko('아직 만든 키가 없어요.')}</div>`
    }
  </div>`;
}

function billingPage() {
  const o = O();
  return `<div class="oa-page">
    <h1>Billing</h1>${ko('OpenAI API는 선불 크레딧을 충전한 뒤 사용한 만큼 차감되는 방식이에요. ChatGPT 구독과는 따로 결제됩니다.')}
    <div class="oa-tabs"><span class="on">Overview</span><span>Payment methods</span><span>Billing history</span><span>Preferences</span></div>
    <div class="oa-bill">
      <small>Credit balance</small>
      <div class="oa-credit ${o.credits > 0 ? 'ok' : ''}">$${o.credits.toFixed(2)}</div>
      ${o.credits > 0 ? '' : `<p class="oa-warn">크레딧이 $0이면 API를 호출할 때 <code>429 insufficient_quota</code> 오류가 나요.</p>`}
      <div class="oa-row"><button class="oa-btn" data-act="addcredit" data-hint="openai-addcredit">Add to credit balance</button><button class="oa-btn ghost" data-act="paymethod">Add payment details</button></div>
      <p class="oa-small">Auto recharge: Off · Used so far: $${(o.spent || 0).toFixed(4)}</p>
    </div>
  </div>`;
}

function usagePage() {
  const o = O();
  return `<div class="oa-page"><h1>Usage</h1>${ko('API 요청 수와 사용 금액을 확인할 수 있어요.')}
    <div class="oa-cards"><div class="oa-card"><small>Total spend</small><b>$${(o.spent || 0).toFixed(4)}</b></div><div class="oa-card"><small>Total requests</small><b>${o.usage || 0}</b></div><div class="oa-card"><small>Credit remaining</small><b>$${o.credits.toFixed(2)}</b></div></div></div>`;
}

function limitsPage() {
  return `<div class="oa-page"><h1>Limits</h1>${ko('사용 등급(Tier)에 따라 분당 요청 수와 월 사용 한도가 정해져요.')}
    <table class="oa-table"><thead><tr><th>MODEL</th><th>RPM</th><th>TPM</th></tr></thead><tbody>
    ${MODELS.openai.valid.slice(0, 4).map((m) => `<tr><td><code>${m}</code></td><td>500</td><td>200,000</td></tr>`).join('')}</tbody></table>
    <p class="oa-small">시뮬레이션용 예시 값입니다.</p></div>`;
}

function saveKeyModal(el, k, ctx) {
  let copied = false;
  let warned = false;
  const m = siteModal(
    el,
    `<div class="oa-modal">
      <h2>Save your key</h2>
      <p>Please save your secret key in a safe place since <b>you won't be able to view it again</b>. Keep it secure, as anyone with your API key can make requests on your behalf. If you do lose it, you'll need to generate a new one.</p>
      ${ko('이 창을 닫으면 키 전체를 다시 볼 수 없어요. 지금 [Copy]를 눌러 복사하세요.')}
      <div class="oa-keyrow"><input class="oa-in mono" readonly value="${esc(k.value)}"><button class="oa-btn" data-a="copy" data-hint="openai-copy">Copy</button></div>
      <p class="oa-small">Permissions: Read and write API resources</p>
      <p class="oa-warn hidden" id="oa-lost">아직 복사하지 않았어요. 닫으면 이 키를 다시 볼 수 없으니 새 키를 만들어야 해요. 그래도 닫으려면 Done을 한 번 더 누르세요.</p>
      <div class="oa-row end"><button class="oa-btn ghost" data-a="done" data-hint="openai-done">Done</button></div>
    </div>`,
    'sticky oa-wrap'
  );
  m.box.onclick = async (e) => {
    const a = e.target.closest('[data-a]');
    if (!a) return;
    if (a.dataset.a === 'copy') {
      await copyText(k.value);
      copied = true;
      a.textContent = 'Copied!';
      toast('비밀 키를 클립보드에 복사했어요.', 'ok');
      emit('key:copied', { provider: 'openai', id: k.id });
    }
    if (a.dataset.a === 'done') {
      if (!copied && !warned) {
        warned = true;
        m.box.querySelector('#oa-lost').classList.remove('hidden');
        return;
      }
      m.close();
      if (!copied) emit('openai:keyLost');
      ctx.rerender();
    }
  };
}

function createModal(el, ctx) {
  const m = siteModal(
    el,
    `<div class="oa-modal">
      <h2>Create new secret key</h2>
      <label class="oa-lab">Owned by</label>
      <div class="oa-seg" data-g="owner"><button class="on" data-v="You">You</button><button data-v="Service account">Service account</button></div>
      <p class="oa-small" id="oa-ownnote">This API key is tied to your user and can make requests against the selected project.</p>
      <label class="oa-lab">Name <span class="oa-opt">Optional</span></label>
      <input class="oa-in" id="oa-kname" placeholder="My Test Key" data-hint="openai-keyname">
      <label class="oa-lab">Project</label>
      <select class="oa-in" id="oa-proj"><option>Default project</option></select>
      <label class="oa-lab">Permissions</label>
      <div class="oa-seg" data-g="perm"><button class="on" data-v="All">All</button><button data-v="Restricted">Restricted</button><button data-v="Read only">Read only</button></div>
      <p class="oa-small" id="oa-permnote">${ko('웹앱에서 답변을 받으려면 All(모든 권한)을 선택하세요.')}</p>
      <div class="oa-row end"><button class="oa-btn ghost" data-a="cancel">Cancel</button><button class="oa-btn" data-a="make" data-hint="openai-make">Create secret key</button></div>
    </div>`,
    'oa-wrap'
  );
  const val = { owner: 'You', perm: 'All' };
  m.box.onclick = (e) => {
    const seg = e.target.closest('.oa-seg button');
    if (seg) {
      const g = seg.parentNode.dataset.g;
      seg.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === seg));
      val[g] = seg.dataset.v;
      if (g === 'owner') m.box.querySelector('#oa-ownnote').textContent = val.owner === 'You' ? 'This API key is tied to your user and can make requests against the selected project.' : 'A new bot member (service account) will be added to the project. 실습에서는 You를 권장해요.';
      return;
    }
    const a = e.target.closest('[data-a]');
    if (!a) return;
    if (a.dataset.a === 'cancel') m.close();
    if (a.dataset.a === 'make') {
      a.disabled = true;
      a.textContent = 'Creating...';
      setTimeout(() => {
        const name = m.box.querySelector('#oa-kname').value.trim() || 'Secret key';
        const k = { id: 'k' + randStr(8), name, value: makeOpenAIKey(), project: 'Default project', owner: val.owner, perm: val.perm === 'All' ? 'All' : val.perm, date: today(), created: Date.now(), revoked: false, lesson: S.lesson };
        O().keys.push(k);
        m.close();
        emit('key:created', { provider: 'openai', id: k.id, perm: k.perm });
        saveKeyModal(el, k, ctx);
      }, 900);
    }
  };
}

function creditModal(el, ctx) {
  const m = siteModal(
    el,
    `<div class="oa-modal">
      <h2>Add to credit balance</h2>
      ${ko('실제 서비스에서는 결제 카드를 등록해야 크레딧을 충전할 수 있어요. 이 시뮬레이션은 결제 정보를 받지 않고 가상 크레딧만 더합니다.')}
      <label class="oa-lab">Amount to add</label>
      <div class="oa-seg" data-g="amt"><button data-v="5" class="on">$5</button><button data-v="10">$10</button><button data-v="20">$20</button></div>
      <p class="oa-small">최소 충전 금액은 $5예요. 사용한 만큼 잔액에서 차감됩니다.</p>
      <div class="oa-row end"><button class="oa-btn ghost" data-a="cancel">Cancel</button><button class="oa-btn" data-a="ok" data-hint="openai-creditok">가상 크레딧 추가 (시뮬레이션)</button></div>
    </div>`,
    'oa-wrap'
  );
  let amt = 5;
  m.box.onclick = (e) => {
    const seg = e.target.closest('.oa-seg button');
    if (seg) {
      seg.parentNode.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b === seg));
      amt = Number(seg.dataset.v);
      return;
    }
    const a = e.target.closest('[data-a]');
    if (!a) return;
    if (a.dataset.a === 'cancel') m.close();
    if (a.dataset.a === 'ok') {
      O().credits = +(O().credits + amt).toFixed(4);
      m.close();
      toast(`가상 크레딧 $${amt}를 추가했어요.`, 'ok');
      emit('openai:credit', { amt });
      ctx.rerender();
    }
  };
}

registerSite({
  id: 'openai',
  match: (u) => u.host === 'platform.openai.com',
  title: (ctx) => {
    const p = ctx.url.pathname;
    if (p.includes('api-keys')) return 'API keys - OpenAI API';
    if (p.includes('billing')) return 'Billing - OpenAI API';
    if (p.startsWith('/login')) return 'Log in - OpenAI';
    return 'OpenAI Platform';
  },
  rerenderOnShow: true,
  render(el, ctx) {
    const o = O();
    let p = ctx.url.pathname;
    if (!o.signedIn) {
      el.innerHTML = p.startsWith('/login') ? `<div class="oa">${loginPage()}</div>` : landing();
    } else if (!o.org) {
      el.innerHTML = `<div class="oa">${onboarding()}</div>`;
    } else {
      if (p === '/' || p.startsWith('/login') || p.startsWith('/onboarding')) p = '/home';
      if (p.startsWith('/settings')) {
        let page = 'general';
        let inner = `<div class="oa-page"><h1>General</h1><label class="oa-lab">Organization name</label><input class="oa-in" value="${esc(o.org)}" readonly><p class="oa-small">Organization ID: org-${randStr(24)}</p></div>`;
        if (p.includes('api-keys')) {
          page = 'apikeys';
          inner = keysPage();
        } else if (p.includes('billing')) {
          page = 'billing';
          inner = billingPage();
        } else if (p.includes('limits')) {
          page = 'limits';
          inner = limitsPage();
        } else if (p.includes('usage')) {
          page = 'usage';
          inner = usagePage();
        } else if (!p.includes('general')) {
          page = p.split('/').pop();
          inner = `<div class="oa-page"><h1>${esc(page[0].toUpperCase() + page.slice(1))}</h1><p class="oa-small">이번 실습에서는 사용하지 않는 메뉴예요.</p></div>`;
        }
        el.innerHTML = settingsShell(page, inner);
      } else {
        let page = 'home';
        let inner = homePage();
        if (p.startsWith('/api-keys')) {
          page = 'apikeys';
          inner = keysPage();
        } else if (p.startsWith('/usage')) {
          page = 'usage';
          inner = usagePage();
        } else if (p.startsWith('/chat')) {
          page = 'chat';
          inner = `<div class="oa-page"><h1>Playground</h1><p class="oa-small">플레이그라운드에서 모델을 시험해 볼 수 있어요. 이번 실습에서는 API 키 만들기가 목표예요.</p></div>`;
        } else if (!p.startsWith('/home')) {
          page = p.slice(1);
          inner = `<div class="oa-page"><h1>${esc(p.slice(1))}</h1><p class="oa-small">이번 실습에서는 사용하지 않는 메뉴예요.</p></div>`;
        }
        el.innerHTML = dashShell(page, inner);
      }
    }
    el.onclick = (e) => {
      const a = e.target.closest('[data-act]');
      if (!a || a.closest('.sm-wrap')) return;
      const act = a.dataset.act;
      if (act === 'go') return ctx.go('https://platform.openai.com' + a.dataset.url);
      if (act === 'login') return ctx.go('https://platform.openai.com/login');
      if (act === 'email' || act === 'sso') return toast('시뮬레이션에서는 [Continue with Google]을 눌러 주세요.');
      if (act === 'google') {
        googleSignIn('OpenAI', () => {
          o.signedIn = true;
          emit('openai:signin');
          ctx.go('https://platform.openai.com/onboarding');
        });
        return;
      }
      if (act === 'org') {
        o.org = el.querySelector('#oa-org').value.trim() || 'Personal';
        emit('openai:org');
        ctx.go('https://platform.openai.com/home');
        return;
      }
      if (act === 'create') return createModal(el, ctx);
      if (act === 'addcredit') return creditModal(el, ctx);
      if (act === 'paymethod') return toast('시뮬레이션에서는 결제 정보를 입력하지 않아요. [Add to credit balance]를 눌러 가상 크레딧을 추가해 보세요.');
      if (act === 'del') {
        const k = o.keys.find((x) => x.id === a.dataset.id);
        const m = siteModal(
          el,
          `<div class="oa-modal"><h2>Revoke secret key</h2><p>This API key will immediately be disabled. API requests made using this key will be rejected.</p>${ko(`'${esc(k.name)}' 키를 폐기하면 이 키를 쓰는 웹앱은 401 오류가 나요.`)}
          <div class="oa-row end"><button class="oa-btn ghost" data-a="n">Cancel</button><button class="oa-btn danger" data-a="y">Revoke key</button></div></div>`,
          'oa-wrap'
        );
        m.box.onclick = (ev) => {
          const b = ev.target.closest('[data-a]');
          if (!b) return;
          if (b.dataset.a === 'y') {
            k.revoked = true;
            emit('key:deleted', { provider: 'openai' });
            ctx.rerender();
          }
          m.close();
        };
      }
    };
  },
});
