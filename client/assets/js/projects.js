/* ============================================================
   projects.js — Projects listing page logic
   Emirates Properties | PrimeSpace
   ============================================================ */

async function initProjects() {
  // Wire live search filter
  initProjectFilter('project-search', 'project-grid');

  // TODO: Load projects from ProjectsAPI.getAll() and render dynamically
  // const result = await ProjectsAPI.getAll();
  // if (result.ok && result.data.length) renderProjectGrid(result.data);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initProjects);
} else {
  initProjects();
}
