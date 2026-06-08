const PUBLIC = process.env.PUBLIC_URL || '';
const APPS_BASE = `${PUBLIC}/apps/`;

const loadedTemplatePaths = new Set();

function rewriteTemplateHtml(html) {
  return html.replace(/src="vendor\//g, `src="${APPS_BASE}vendor/`);
}

/**
 * Fetch and inject a template HTML bundle into #app-templates.
 * @param {string} path — path under PUBLIC_URL (e.g. /apps/templates/mail.html)
 */
export async function loadTemplateBundle(path) {
  if (loadedTemplatePaths.has(path)) return;
  const full = path.startsWith('http') ? path : `${PUBLIC}${path}`;
  const res = await fetch(full);
  if (!res.ok) throw new Error(`Failed to load templates: ${full}`);
  let html = await res.text();
  html = rewriteTemplateHtml(html);
  const host = document.getElementById('app-templates') || document.body;
  host.insertAdjacentHTML('beforeend', html);
  loadedTemplatePaths.add(path);
}

/** @param {string} templateId */
export function isTemplateLoaded(templateId) {
  return !!document.getElementById(templateId);
}
