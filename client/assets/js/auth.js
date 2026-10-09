/* ============================================================
   auth.js — Login, Signup & Forgot Password (UI demo)
   Emirates Properties | PrimeSpace
   ============================================================ */

const API_BASE = window.apiBase ? window.apiBase() : 'http://127.0.0.1:4000';

function setFieldError(id, message) {
  const el = document.getElementById(id);
  const inputId = id.endsWith('-error') ? id.slice(0, -6) : '';
  const input = inputId ? document.getElementById(inputId) : null;
  if (input) {
    input.classList.toggle('is-invalid', Boolean(message));
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }
  if (!el) return;
  if (!message) {
    el.hidden = true;
    el.textContent = '';
    return;
  }
  el.hidden = false;
  el.textContent = message;
}

async function postAuth(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  } catch {
    return { ok: false, data: { message: 'Could not reach the server.' } };
  }
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

/* ── Login ──────────────────────────────────────────────────── */
function saveMemberSession(data) {
  localStorage.setItem('ps_token', data.token);
  sessionStorage.setItem('ps_token', data.token);
  const raw = JSON.stringify(data.user);
  localStorage.setItem('ps_member', raw);
  sessionStorage.setItem('ps_member', raw);
  if (data.user && data.user.mobile) localStorage.setItem('ps_user_mobile', data.user.mobile);
}

function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  const resetNote = document.getElementById('login-reset');
  const params = new URLSearchParams(location.search);
  if (resetNote) {
    if (params.get('reset') === '1') {
      resetNote.hidden = false;
      resetNote.textContent = 'Password updated. Log in with your new password.';
    } else if (params.get('registered') === '1' || params.get('signup') === '1') {
      resetNote.hidden = false;
      resetNote.textContent = 'Account created successfully! Log in with your mobile number and password.';
    }
  }

  const mobileInput = document.getElementById('login-mobile');
  if (mobileInput && params.get('mobile')) {
    mobileInput.value = params.get('mobile');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
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

    const result = await postAuth('/api/auth/login', { mobile, password, remember: Boolean(remember) });
    if (!result.ok) {
      const message = result.data.message || 'Incorrect mobile number or password.';
      setFieldError('login-password-error', message);
      setBusy(btn, false, 'Log in');
      return;
    }

    saveMemberSession(result.data);
    toast('Signed in.');
    window.location.href = 'dashboard.html';
  });
}

/* ── Signup ─────────────────────────────────────────────────── */
function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    ['signup-name', 'signup-mobile', 'signup-password', 'signup-confirm'].forEach((id) => {
      setFieldError(`${id}-error`, '');
    });

    const fullName = document.getElementById('signup-name').value.trim();
    const mobile = document.getElementById('signup-mobile').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirm = document.getElementById('signup-confirm').value;
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
    if (!ok) return;

    const btn = document.getElementById('signup-submit-btn');
    setBusy(btn, true, 'Creating account…');

    const result = await postAuth('/api/auth/signup', {
      fullName,
      mobile,
      password,
    });
    if (!result.ok) {
      const message = result.data.message || 'Could not create the account.';
      if (/password/i.test(message)) setFieldError('signup-password-error', message);
      else if (/name/i.test(message)) setFieldError('signup-name-error', message);
      else setFieldError('signup-mobile-error', message);
      setBusy(btn, false, 'Create account');
      return;
    }

    sessionStorage.setItem('ps_trial_bonus', '1');
    toast('Account created successfully!');
    setBusy(btn, true, 'Redirecting to login…');
    setTimeout(() => {
      window.location.href = `login.html?registered=1&mobile=${encodeURIComponent(mobile)}`;
    }, 800);
  });
}

/* ── Forgot password ────────────────────────────────────────── */
function initForgotForm() {
  const form = document.getElementById('forgot-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setFieldError('forgot-mobile-error', '');
    setFieldError('forgot-password-error', '');
    setFieldError('forgot-confirm-error', '');
    const success = document.getElementById('forgot-success');
    if (success) success.hidden = true;

    const mobile = document.getElementById('forgot-mobile').value.trim();
    const password = document.getElementById('forgot-password').value;
    const confirm = document.getElementById('forgot-confirm').value;
    let ok = true;
    if (!mobile) {
      setFieldError('forgot-mobile-error', 'Enter your registered mobile number.');
      ok = false;
    }
    if (!password || password.length < 6) {
      setFieldError('forgot-password-error', 'Password must be at least 6 characters.');
      ok = false;
    }
    if (password !== confirm) {
      setFieldError('forgot-confirm-error', 'Passwords do not match.');
      ok = false;
    }
    if (!ok) return;

    const btn = document.getElementById('forgot-submit-btn');
    setBusy(btn, true, 'Updating…');

    const result = await postAuth('/api/auth/forgot-password', { mobile, password });
    if (!result.ok) {
      const message = result.data.message || 'Could not update the password.';
      if (/password/i.test(message)) setFieldError('forgot-password-error', message);
      else setFieldError('forgot-mobile-error', message);
      setBusy(btn, false, 'Update password');
      return;
    }

    if (success) {
      success.hidden = false;
      success.textContent = 'Password updated. Taking you to login.';
    }
    window.location.href = 'login.html?reset=1';
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
