/* ============================================================
   auth.js — Login, Signup & Forgot Password page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

/* ── Login form ─────────────────────────────────────────────── */
function initLoginForm() {
  const form = document.getElementById('login-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobile   = document.getElementById('login-mobile').value.trim();
    const password = document.getElementById('login-password').value;

    if (!mobile || !password) {
      toast('Please enter your UAE mobile number and password.');
      return;
    }

    // TODO: const result = await AuthAPI.login(mobile, password);
    // if (result.ok) { Auth.setToken(result.data.token); window.location = 'dashboard.html'; }
    // else toast(result.error || 'Login failed. Please try again.');
    toast('Login submitted — connect AuthAPI.login() when backend is ready.');
  });
}

/* ── Signup form ────────────────────────────────────────────── */
function initSignupForm() {
  const form = document.getElementById('signup-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fullName       = document.getElementById('signup-name').value.trim();
    const mobile         = document.getElementById('signup-mobile').value.trim();
    const password       = document.getElementById('signup-password').value;
    const confirm        = document.getElementById('signup-confirm').value;
    const invitationCode = document.getElementById('signup-invite').value.trim() || null;

    if (!fullName || !mobile || !password) {
      toast('Please fill in all required fields.');
      return;
    }
    if (password !== confirm) {
      toast('Passwords do not match.');
      return;
    }

    // TODO: const result = await AuthAPI.signup(fullName, mobile, password, invitationCode);
    // if (result.ok) window.location = 'login.html';
    // else toast(result.error || 'Registration failed. Please try again.');
    toast('Account registered — connect AuthAPI.signup() when backend is ready.');
  });
}

/* ── Forgot password form ───────────────────────────────────── */
function initForgotForm() {
  const form = document.getElementById('forgot-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mobile = document.getElementById('forgot-mobile').value.trim();

    if (!mobile) {
      toast('Please enter your registered UAE mobile number.');
      return;
    }

    // TODO: const result = await AuthAPI.forgotPassword(mobile);
    // if (result.ok) toast('Reset instructions sent to your mobile.');
    // else toast(result.error || 'Request failed. Please try again.');
    toast('Reset request submitted — connect AuthAPI.forgotPassword() when backend is ready.');
  });
}

/* ── Auto-init whichever auth page is loaded ────────────────── */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initLoginForm();
    initSignupForm();
    initForgotForm();
  });
} else {
  initLoginForm();
  initSignupForm();
  initForgotForm();
}
