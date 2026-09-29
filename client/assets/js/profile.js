/* ============================================================
   profile.js — Member profile page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initProfile() {
  // TODO: Load profile data from ProfileAPI.get()
  // const result = await ProfileAPI.get();
  // if (result.ok) populateProfileForm(result.data);

  // Edit / save profile
  const editBtn  = document.getElementById('edit-profile-btn');
  const saveBtn  = document.getElementById('save-profile-btn');
  const form     = document.getElementById('profile-form');
  const fields   = form ? form.querySelectorAll('input:not([disabled])') : [];

  if (editBtn && saveBtn && form) {
    editBtn.addEventListener('click', () => {
      fields.forEach((f) => f.removeAttribute('readonly'));
      editBtn.style.display = 'none';
      saveBtn.style.display = '';
      fields[0]?.focus();
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        fullName: document.getElementById('profile-fullname')?.value.trim(),
        mobile:   document.getElementById('profile-mobile')?.value.trim(),
      };

      // TODO: const result = await ProfileAPI.update(payload);
      // if (result.ok) toast('Profile updated successfully.');
      // else toast(result.error || 'Update failed.');
      toast('Profile saved — connect ProfileAPI.update() when backend is ready.');

      fields.forEach((f) => f.setAttribute('readonly', ''));
      editBtn.style.display = '';
      saveBtn.style.display = 'none';
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProfile);
} else {
  initProfile();
}
