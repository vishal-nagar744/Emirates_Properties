/* ============================================================
   project-details.js — Single project detail page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initProjectDetails() {
  // TODO: Read projectId from URL params, load from ProjectsAPI.getById()
  // const params = new URLSearchParams(window.location.search);
  // const id     = params.get('id');
  // if (id) {
  //   const result = await ProjectsAPI.getById(id);
  //   if (result.ok && result.data) renderProjectDetail(result.data);
  // }

  // Submit / continue form
  const submitForm = document.getElementById('project-continue-form');
  if (submitForm) {
    submitForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      // TODO: const result = await ProjectsAPI.submit(projectId);
      // if (result.ok) toast(result.data.message);
      toast('Project submission received — connect ProjectsAPI.submit() when backend is ready.');
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjectDetails);
} else {
  initProjectDetails();
}
