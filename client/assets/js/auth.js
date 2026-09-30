/* ============================================================
   auth.js — Login, Signup & Forgot Password (UI demo)
   Emirates Properties | PrimeSpace
   ============================================================ */

const DEMO_INVITE_CODES = ['ALEX82K', 'VIKAS82K', 'DEMO100'];

function setFieldError(id, message) {
  const el = document.getElementById(id);
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = message;
}

function setAlert(id, message, type = 'error') {
  const el = document.getElementById(id);
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    el.classList.remove('auth-alert-success', 'auth-alert-error');
    return;
  }
  el.hidden = false;
  el.textContent = message;
  el.classList.toggle('auth-alert-success', type === 'success');
  el.classList.toggle('auth-alert-error', type === 'error');
}

function setBusy(btn, busy, label) {
  if (!btn) return;
  btn.disabled = busy;
  if (label) btn.textContent = label;
}

function initPasswordToggles() {
  document.querySelectorAll('[data-toggle-password]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const input = document.getElementById(btn.getAttribute('data-toggle-password'));
      if (!input) return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });
}

/* ── Prefill invitation code from ?ref= ─────────────────────── */
function initInvitePrefill() {
  const input = document.getElementById('signup-invite');
  const hint = document.getElementById('signup-invite-hint');
  if (!input) return;

  const params = new URLSearchParams(window.location.search);
  const ref = (params.get('ref') || '').trim().toUpperCase();
  if (!ref) return;

  const field = document.getElementById('signup-invite-field');
  const toggle = document.getElementById('show-invite');
  if (field) field.hidden = false;
  if (toggle) toggle.hidden = true;
  input.value = ref;
  if (hint) {
    hint.hidden = false;
    hint.textContent = `Invitation code pre-filled from link (${ref}).`;
  }
}

/* ── Login ──────────────────────────────────────────────────── */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const params = new URLSearchParams(window.location.search);
  if (params.get('registered') === '1') {
    setAlert('login-alert', 'Account created. Log in to continue.', 'success');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('login-alert', '');
    setFieldError('login-mobile-error', '');
    setFieldError('login-password-error', '');

    const mobile = document.getElementById('login-mobile').value.trim();
    const password = document.getElementById('login-password').value;
    const remember = document.getElementById('login-remember')?.checked;
    let ok = true;

    if (!mobile) {
      setFieldError('login-mobile-error', 'Enter your mobile number.');
      ok = false;
    }
    if (!password) {
      setFieldError('login-password-error', 'Enter your password.');
      ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById('login-submit-btn');
    setBusy(btn, true, 'Signing in…');

    // UI demo: accept any non-empty credentials and enter workspace
    // TODO: const result = await AuthAPI.login(mobile, password);
    const token = 'demo_token';
    if (remember) {
      localStorage.setItem('ps_token', token);
      localStorage.setItem('ps_user_mobile', mobile);
    } else {
      sessionStorage.setItem('ps_token', token);
      localStorage.setItem('ps_token', token); // Auth helpers still read localStorage
      localStorage.setItem('ps_user_mobile', mobile);
    }

    toast('Signed in.');
    window.location.href = 'dashboard.html';
  });
}

function initInviteToggle() {
  const btn = document.getElementById('show-invite');
  const field = document.getElementById('signup-invite-field');
  if (!btn || !field) return;
  btn.addEventListener('click', () => {
    field.hidden = false;
    btn.hidden = true;
    document.getElementById('signup-invite')?.focus();
  });
}

/* ── Signup ─────────────────────────────────────────────────── */
function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  initInvitePrefill();
  initInviteToggle();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('signup-alert', '');
    ['signup-name', 'signup-mobile', 'signup-password', 'signup-confirm', 'signup-invite'].forEach((id) => {
      setFieldError(`${id}-error`, '');
    });

    const fullName = document.getElementById('signup-name').value.trim();
    const mobile = document.getElementById('signup-mobile').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
    const invitationRaw = document.getElementById('signup-invite').value.trim();
    const invitationCode = invitationRaw ? invitationRaw.toUpperCase() : null;
    let ok = true;

    if (!fullName) {
      setFieldError('signup-name-error', 'Enter your full name.');
      ok = false;
    }
    if (!mobile) {
      setFieldError('signup-mobile-error', 'Enter your mobile number.');
      ok = false;
    }
    if (!password || password.length < 6) {
      setFieldError('signup-password-error', 'Password must be at least 6 characters.');
      ok = false;
    }
    if (password !== confirm) {
      setFieldError('signup-confirm-error', 'Passwords do not match.');
      ok = false;
    }
    if (invitationCode && !DEMO_INVITE_CODES.includes(invitationCode)) {
      setFieldError(
        'signup-invite-error',
        `Invitation code not recognised. Try ${DEMO_INVITE_CODES[0]} or leave it blank.`
      );
      ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById('signup-submit-btn');
    setBusy(btn, true, 'Creating…');
    localStorage.setItem('ps_pending_signup', JSON.stringify({ fullName, mobile, invitationCode }));

    // TODO: await AuthAPI.signup(...) — welcome bonus + referral code on backend
    toast(invitationCode ? `Account created. Invite ${invitationCode} applied.` : 'Account created.');

    window.location.href = 'login.html?registered=1';
  });
}

/* ── Forgot password ────────────────────────────────────────── */
function initForgotForm() {
  const form = document.getElementById('forgot-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setAlert('forgot-alert', '');
    setFieldError('forgot-mobile-error', '');
    const success = document.getElementById('forgot-success');
    if (success) success.hidden = true;

    const mobile = document.getElementById('forgot-mobile').value.trim();
    if (!mobile) {
      setFieldError('forgot-mobile-error', 'Enter your registered mobile number.');
      return;
    }

    const btn = document.getElementById('forgot-submit-btn');
    setBusy(btn, true, 'Sending…');

    // TODO: await AuthAPI.forgotPassword(mobile);
    if (success) success.hidden = false;
    toast('Reset request submitted.');
    setBusy(btn, false, 'Send reset link');
    form.reset();
  });
}

function initAuthPages() {
  initPasswordToggles();
  initLoginForm();
  initSignupForm();
  initForgotForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAuthPages);
} else {
  initAuthPages();
}
