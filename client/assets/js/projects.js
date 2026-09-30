/* ============================================================
   projects.js — Projects listing page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initProjects() {
  initProjectFilter('project-search', 'project-grid');

  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const input = document.getElementById('project-search');
      if (input) input.dispatchEvent(new Event('input'));
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjects);
} else {
  initProjects();
}
