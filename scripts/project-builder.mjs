import { readFile, writeFile, access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const escape = (text = '') => String(text).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const arrow = '<svg class="arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg>';

export function validateProjects(projects) {
  if (!Array.isArray(projects)) throw new Error('Projects must be an array.');
  const ids = new Set();
  for (const p of projects) {
    if (!/^[a-z0-9][a-z0-9-]*$/.test(p.id)) throw new Error('Project id must contain lowercase letters, numbers or hyphens.');
    if (ids.has(p.id)) throw new Error(`Duplicate project id: ${p.id}`);
    ids.add(p.id);
    for (const key of ['title', 'value', 'description']) {
      if (typeof p[key] !== 'string' || !p[key].trim()) throw new Error(`${p.id}: ${key} is required.`);
    }
    if (!['ai', 'tools', 'ml'].includes(p.category)) throw new Error(`${p.id}: category must be ai, tools or ml.`);
    if (!Array.isArray(p.tags) || p.tags.some(t => typeof t !== 'string')) throw new Error(`${p.id}: tags must be an array of strings.`);
    if (!Array.isArray(p.images)) throw new Error(`${p.id}: images must be an array.`);
    for (const image of p.images) {
      if (!/^assets\/[a-zA-Z0-9_./ -]+\.(png|jpe?g|webp|gif|avif)$/i.test(image.src) || image.src.split('/').includes('..')) throw new Error(`${p.id}: image must be a local assets/ image.`);
      if (typeof image.alt !== 'string' || !image.alt.trim()) throw new Error(`${p.id}: each image needs descriptive alt text.`);
    }
    if (!p.images.length && !p.illustrationHtml) throw new Error(`${p.id}: add at least one image.`);
    if (p.actions !== undefined && !Array.isArray(p.actions)) throw new Error(`${p.id}: actions must be an array.`);
    for (const action of p.actions || []) {
      if (!action.label?.trim()) throw new Error(`${p.id}: action label is required.`);
      if (action.details && !p.details && !p.detailsHtml) throw new Error(`${p.id}: add details for the expand action.`);
      if (!action.details) {
        let url;
        try { url = new URL(action.href); } catch { throw new Error(`${p.id}: invalid action URL.`); }
        if (!['https:', 'http:'].includes(url.protocol)) throw new Error(`${p.id}: action URL must use https or http.`);
      }
    }
  }
}

function renderGallery(p) {
  if (!p.images.length) return `<div class="project-visual nest-visual">${p.illustrationHtml}</div>`;
  const slides = p.images.map((image, index) => `<figure data-gallery-slide${index ? ' hidden' : ''}><a href="${escape(image.src)}" data-image-popup aria-label="Enlarge ${escape(p.title)} image ${index + 1}"><img src="${escape(image.src)}" alt="${escape(image.alt)}" loading="lazy"></a><figcaption>${escape(image.caption || image.alt)}</figcaption></figure>`).join('');
  const controls = p.images.length > 1 ? `<div class="gallery-controls" hidden><button type="button" data-gallery-step="-1" aria-label="Previous ${escape(p.title)} image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg></button><span class="gallery-count" aria-live="polite">1 / ${p.images.length}</span><button type="button" data-gallery-step="1" aria-label="Next ${escape(p.title)} image"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 6 6 6-6 6"/></svg></button></div>` : '';
  return `<div class="project-visual project-media" data-gallery aria-label="${escape(p.title)} screenshots"><div class="visual-label"><span>${escape(p.title)}</span><span>${escape(p.visualLabel || 'Project screenshots')}</span></div>${p.visualIntroHtml || ''}${slides}${controls}</div>`;
}

export function renderProjects(projects) {
  validateProjects(projects);
  return projects.map(p => {
    const details = p.detailsHtml || (p.details ? `<p>${escape(p.details)}</p>` : '');
    const actions = (p.actions || (details ? [{ label: 'Explore the project', details: true }] : [])).map(a => a.details
      ? `<button class="text-link" type="button" data-expand="${p.id}" aria-expanded="false" aria-controls="${p.id}-details">${escape(a.label)} ${arrow}</button>`
      : `<a class="text-link" href="${escape(a.href)}" target="_blank" rel="noopener noreferrer">${escape(a.label)} ${arrow}</a>`).join('');
    return `<article class="project${p.featured ? ' featured' : ''}" data-category="${p.category}">${renderGallery(p)}<div class="project-content"><div class="project-title"><h3>${escape(p.title)}</h3><span class="status ${p.statusTone === 'experimental' ? 'experimental' : p.statusTone === 'positive' ? '' : 'neutral'}">${escape(p.status || 'Project')}</span></div><h4>${escape(p.value)}</h4><p>${escape(p.description)}</p><ul class="tags" aria-label="Capabilities">${p.tags.map(tag => `<li>${escape(tag)}</li>`).join('')}</ul><div class="project-actions">${actions}</div></div>${details ? `<div class="project-details" id="${p.id}-details" hidden><h4>${escape(p.detailsTitle || p.title)}</h4>${details}</div>` : ''}</article>`;
  }).join('\n');
}

export function updatePage(page, projects) {
  if (!page.includes('<!-- PROJECTS:START -->') || !page.includes('<!-- PROJECTS:END -->')) throw new Error('Project markers are missing from index.html.');
  return page.replace(/<!-- PROJECTS:START -->[\s\S]*?<!-- PROJECTS:END -->/, `<!-- PROJECTS:START -->\n${renderProjects(projects)}\n<!-- PROJECTS:END -->`)
    .replace(/(<span data-project-total>)[^<]*(<\/span>)/g, `$1${projects.length}$2`)
    .replace(/(<span class="work-count"[^>]*>)[^<]*(<\/span>)/, `$1Showing ${projects.length} project${projects.length === 1 ? '' : 's'}$2`);
}

export async function buildProjects(projectRoot = root) {
  const projects = JSON.parse(await readFile(resolve(projectRoot, 'scripts/projects.json'), 'utf8'));
  const page = await readFile(resolve(projectRoot, 'index.html'), 'utf8');
  const output = updatePage(page, projects);
  for (const p of projects) for (const image of p.images) await access(resolve(projectRoot, image.src));
  await writeFile(resolve(projectRoot, 'index.html'), output);
  return projects.length;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try { console.log(`Built ${await buildProjects()} project cards.`); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
