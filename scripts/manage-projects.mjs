import { readFile, writeFile, copyFile, access } from 'node:fs/promises';
import { resolve, dirname, extname } from 'node:path';
import { pathToFileURL } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { randomUUID } from 'node:crypto';
import { root, validateProjects, updatePage, buildProjects } from './project-builder.mjs';

export async function addProject(projectRoot, config, sourceDir = process.cwd()) {
  const dataPath = resolve(projectRoot, 'scripts/projects.json');
  const projects = JSON.parse(await readFile(dataPath, 'utf8'));
  if (projects.some(p => p.id === config.id)) throw new Error(`Duplicate project id: ${config.id}`);
  if (!Array.isArray(config.images) || !config.images.length) throw new Error('Add at least one image.');
  const copies = config.images.map((image, index) => {
    const source = resolve(sourceDir, image.src);
    const extension = extname(source).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].includes(extension)) throw new Error(`Unsupported image: ${image.src}`);
    return { source, src: `assets/${config.id}-${index + 1}${extension}` };
  });
  const project = { ...config, images: config.images.map((image, index) => ({ ...image, src: copies[index].src })) };
  const next = [...projects, project];
  validateProjects(next);
  const pagePath = resolve(projectRoot, 'index.html');
  const output = updatePage(await readFile(pagePath, 'utf8'), next);
  for (const copy of copies) {
    await access(copy.source);
    try { await access(resolve(projectRoot, copy.src)); }
    catch (error) { if (error.code === 'ENOENT') continue; throw error; }
    throw new Error(`Image destination already exists: ${copy.src}`);
  }
  for (const copy of copies) await copyFile(copy.source, resolve(projectRoot, copy.src));
  await writeFile(dataPath, JSON.stringify(next, null, 2) + '\n');
  await writeFile(pagePath, output);
  return project;
}


export async function removeProject(projectRoot, id) {
  const dataPath = resolve(projectRoot, 'scripts/projects.json');
  const projects = JSON.parse(await readFile(dataPath, 'utf8'));
  const project = projects.find(p => p.id === id);
  if (!project) throw new Error(`No project with id: ${id}`);
  const next = projects.filter(p => p.id !== id);
  const pagePath = resolve(projectRoot, 'index.html');
  const output = updatePage(await readFile(pagePath, 'utf8'), next);
  await writeFile(dataPath, JSON.stringify(next, null, 2) + '\n');
  await writeFile(pagePath, output);
  return project;
}

export async function editProject(projectRoot, id, patch, sourceDir = process.cwd()) {
  const dataPath = resolve(projectRoot, 'scripts/projects.json');
  const projects = JSON.parse(await readFile(dataPath, 'utf8'));
  const index = projects.findIndex(p => p.id === id);
  if (index < 0) throw new Error(`No project with id: ${id}`);
  if (patch.id !== undefined && patch.id !== id) throw new Error('The project ID cannot be changed.');
  const updated = { ...projects[index], ...patch, id };
  if (Object.hasOwn(patch, 'details')) delete updated.detailsHtml;
  const copies = [];
  if (patch.images !== undefined) {
    if (!Array.isArray(patch.images)) throw new Error('Images must be an array.');
    updated.images = patch.images.map(image => {
      if (typeof image.src !== 'string') throw new Error('Each image needs a file path.');
      if (image.src.startsWith('assets/')) return { ...image };
      const source = resolve(sourceDir, image.src);
      const extension = extname(source).toLowerCase();
      if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].includes(extension)) throw new Error(`Unsupported image: ${image.src}`);
      const src = `assets/${id}-${randomUUID()}${extension}`;
      copies.push({ source, src });
      return { ...image, src };
    });
  }
  const next = projects.map((project, i) => i === index ? updated : project);
  validateProjects(next);
  const pagePath = resolve(projectRoot, 'index.html');
  const output = updatePage(await readFile(pagePath, 'utf8'), next);
  for (const copy of copies) await access(copy.source);
  const copiedPaths = new Set(copies.map(c => c.src));
  for (const image of updated.images) if (!copiedPaths.has(image.src)) await access(resolve(projectRoot, image.src));
  for (const copy of copies) await copyFile(copy.source, resolve(projectRoot, copy.src));
  await writeFile(dataPath, JSON.stringify(next, null, 2) + '\n');
  await writeFile(pagePath, output);
  return updated;
}

async function promptImages(rl, project) {
  const images = project.images.map(image => ({ ...image }));
  while (true) {
    console.log(`\n${project.title} images (first is the main image):`);
    images.forEach((image, index) => console.log(`${index + 1}. ${image.caption || image.alt} — ${image.src}`));
    console.log('1. Add images\n2. Replace all images\n3. Change order / main image\n4. Remove an image\n5. Edit image description / caption\n0. Save');
    const action = await askValid(rl, 'Choose [0]: ', v => !['0', '1', '2', '3', '4', '5'].includes(v) && 'Choose 0–5.', '0');
    if (action === '0') return images;
    if (action === '1' || action === '2') {
      const input = await askValid(rl, 'Image paths (separate with |): ', async value => {
        const paths = value.split('|').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
        if (!paths.length) return 'Enter at least one path.';
        for (const path of paths) {
          if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].includes(extname(path).toLowerCase())) return `Unsupported image: ${path}`;
          try { await access(resolve(path)); } catch { return `Image not found: ${path}`; }
        }
        return '';
      });
      const additions = [];
      for (const src of input.split('|').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean)) {
        const alt = await askValid(rl, `Describe ${src}: `, v => !v && 'A description is required.');
        const caption = (await rl.question(`Caption [${alt}]: `)).trim() || alt;
        additions.push({ src: resolve(src), alt, caption });
      }
      if (action === '2') images.splice(0, images.length, ...additions);
      else images.push(...additions);
      continue;
    }
    if (!images.length) { console.log('Add images first.'); continue; }
    if (action === '3') {
      const order = await askValid(rl, 'New order, all image numbers (e.g. 3,1,2): ', value => {
        const numbers = value.split(',').map(s => Number(s.trim()));
        return numbers.length !== images.length || new Set(numbers).size !== images.length || numbers.some(n => !Number.isInteger(n) || n < 1 || n > images.length) ? 'Include each image number exactly once.' : '';
      });
      const reordered = order.split(',').map(n => images[Number(n.trim()) - 1]);
      images.splice(0, images.length, ...reordered);
      continue;
    }
    const number = Number(await askValid(rl, 'Image number: ', v => !Number.isInteger(Number(v)) || Number(v) < 1 || Number(v) > images.length ? 'Choose an image number from the list.' : '')) - 1;
    if (action === '4') {
      if (images.length === 1 && !project.illustrationHtml) { console.log('Keep at least one image, or replace it.'); continue; }
      images.splice(number, 1);
    } else {
      images[number].alt = (await rl.question(`Description [${images[number].alt}]: `)).trim() || images[number].alt;
      images[number].caption = (await rl.question(`Caption [${images[number].caption || images[number].alt}]: `)).trim() || images[number].caption || images[number].alt;
    }
  }
}

async function promptEdit(project, imagesOnly) {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const patch = {};
    if (!imagesOnly) {
      console.log('Press Enter to keep each current value.');
      for (const key of ['title', 'value', 'description', 'status', 'visualLabel', 'detailsTitle']) {
        const value = (await rl.question(`${key} [${project[key] || ''}]: `)).trim();
        if (value) patch[key] = value;
      }
      patch.category = await askValid(rl, `Category [${project.category}]: `, v => !['ai', 'tools', 'ml'].includes(v) && 'Choose ai, tools or ml.', project.category);
      const tags = (await rl.question(`Tags [${project.tags.join(', ')}] (use - to clear): `)).trim();
      if (tags) patch.tags = tags === '-' ? [] : tags.split(',').map(s => s.trim()).filter(Boolean);
      const details = (await rl.question('Expanded details (Enter keeps current; new text replaces current details): ')).trim();
      if (details) {
        patch.details = details;
        if (!(project.actions || []).some(a => a.details)) patch.actions = [...(project.actions || []), { label: 'Explore the project', details: true }];
      }
      const link = await askValid(rl, 'Project URL (Enter keeps links; - removes external links): ', v => v !== '-' && !validProjectUrl(v) && 'Use https:// or http://, Enter to keep, or - to remove.');
      if (link) patch.actions = [...(patch.actions || project.actions || []).filter(a => a.details), ...(link === '-' ? [] : [{ label: 'Visit project', href: link }])];
      const featured = await askValid(rl, `Featured card [${project.featured ? 'yes' : 'no'}]: `, v => !['yes', 'no'].includes(v) && 'Choose yes or no.', project.featured ? 'yes' : 'no');
      patch.featured = featured === 'yes';
    }
    patch.images = await promptImages(rl, project);
    return patch;
  } finally { rl.close(); }
}

export function validProjectUrl(value) {
  if (!value) return true;
  try { return ['http:', 'https:'].includes(new URL(value).protocol); }
  catch { return false; }
}

async function askValid(rl, question, validate, fallback = '') {
  while (true) {
    const value = (await rl.question(question)).trim() || fallback;
    const error = await validate(value);
    if (!error) return value;
    console.log(error);
  }
}

async function promptProject() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    const existing = JSON.parse(await readFile(resolve(root, 'scripts/projects.json'), 'utf8'));
    const required = v => !v && 'This field is required.';
    const title = await askValid(rl, 'Project name: ', required);
    const suggested = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = await askValid(rl, `ID [${suggested}]: `, v => !/^[a-z0-9][a-z0-9-]*$/.test(v) ? 'Use lowercase letters, numbers or hyphens (123 is allowed).' : existing.some(p => p.id === v) ? 'That ID already exists. Choose another.' : '', suggested);
    const category = await askValid(rl, 'Category (ai / tools / ml): ', v => !['ai', 'tools', 'ml'].includes(v) && 'Choose ai, tools or ml.');
    const value = await askValid(rl, 'One-line value proposition: ', required);
    const description = await askValid(rl, 'Description: ', required);
    const status = (await rl.question('Status [Working prototype]: ')).trim() || 'Working prototype';
    const tags = (await rl.question('Capability tags (comma-separated): ')).split(',').map(t => t.trim()).filter(Boolean);
    const imageInput = await askValid(rl, 'Image paths (separate with |, first is the main image): ', async value => {
      const paths = value.split('|').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
      if (!paths.length) return 'Add at least one image path.';
      for (const path of paths) {
        if (!['.png', '.jpg', '.jpeg', '.webp', '.gif', '.avif'].includes(extname(path).toLowerCase())) return `Unsupported image format: ${path}`;
        try { await access(resolve(path)); } catch { return `Image not found: ${path}. Enter the paths again.`; }
      }
      return '';
    });
    const paths = imageInput.split('|').map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean);
    const images = [];
    for (const src of paths) {
      const alt = await askValid(rl, `Describe ${src}: `, required);
      images.push({ src, alt, caption: alt });
    }
    const details = (await rl.question('Expanded project details (optional): ')).trim();
    const href = await askValid(rl, 'Project / source URL (optional; Enter to skip): ', v => !validProjectUrl(v) && 'Enter a full https:// or http:// URL, or press Enter to skip.');
    const actions = [];
    if (details) actions.push({ label: 'Explore the project', details: true });
    if (href) actions.push({ label: 'Visit project', href });
    return { id, title, category, value, description, status, tags, images, details, actions };
  } finally { rl.close(); }
}

async function chooseAction() {
  const rl = createInterface({ input: stdin, output: stdout });
  try {
    console.log('1. Add project\n2. Remove project\n3. List projects\n4. Rebuild website\n5. Edit project\n6. Manage project images');
    const choice = await askValid(rl, 'Choose an action [1]: ', v => !['1', '2', '3', '4', '5', '6'].includes(v) && 'Choose 1–6.', '1');
    const args = [{ '1': 'add', '2': 'remove', '3': 'list', '4': 'build', '5': 'edit', '6': 'images' }[choice]];
    if (['2', '5', '6'].includes(choice)) {
      const projects = JSON.parse(await readFile(resolve(root, 'scripts/projects.json'), 'utf8'));
      if (!projects.length) { console.log('No projects available.'); return []; }
      projects.forEach(p => console.log(`${p.id}: ${p.title}`));
      args.push(await askValid(rl, 'Project ID: ', v => !projects.some(p => p.id === v) && 'Choose an ID from the list.'));
      if (choice === '2' && (await rl.question('Remove this project from the website? (yes/no): ')).trim().toLowerCase() !== 'yes') { console.log('Removal cancelled.'); return []; }
    }
    return args;
  } finally { rl.close(); }
}

export async function runProjectManager(args = process.argv.slice(2)) {
  try {
    if (args.includes('--help')) {
      console.log('npm run projects — Add / Edit / Images / Remove / List / Rebuild menu\nnpm run projects add — interactive addition\nnpm run projects add path/to/project.json — import JSON\nnpm run projects edit project-id — edit details and images\nnpm run projects edit project-id patch.json — apply a JSON patch\nnpm run projects images project-id — manage screenshots\nnpm run projects remove project-id — remove and rebuild\nnpm run projects list — list IDs\nnpm run projects build — rebuild cards\nImages in JSON resolve relative to that file.');
      return;
    }
    if (!args.length) args = await chooseAction();
    if (!args.length) return;
    const [command, ...rest] = args;
    if (command === 'edit' || command === 'images') {
      if (rest.length < 1 || rest.length > 2 || (command === 'images' && rest.length !== 1)) throw new Error('Use: npm run projects edit project-id [patch.json], or npm run projects images project-id');
      const projects = JSON.parse(await readFile(resolve(root, 'scripts/projects.json'), 'utf8'));
      const current = projects.find(p => p.id === rest[0]);
      if (!current) throw new Error(`No project with id: ${rest[0]}`);
      const file = rest[1] && resolve(rest[1]);
      const patch = file ? JSON.parse(await readFile(file, 'utf8')) : await promptEdit(current, command === 'images');
      const project = await editProject(root, current.id, patch, file ? dirname(file) : process.cwd());
      console.log(`Updated ${project.title} (${project.images.length} images) and rebuilt the website. Refresh the page.`);
      return;
    }
    if (command === 'list') {
      const projects = JSON.parse(await readFile(resolve(root, 'scripts/projects.json'), 'utf8'));
      projects.forEach(p => console.log(`${p.id}: ${p.title} (${p.images.length} images)`));
      return;
    }
    if (command === 'build') { console.log(`Rebuilt ${await buildProjects()} projects. Refresh the page.`); return; }
    if (command === 'remove') {
      if (rest.length !== 1) throw new Error('Use: npm run projects remove project-id');
      const project = await removeProject(root, rest[0]);
      console.log(`Removed ${project.title} and rebuilt the website. Image files are retained. Refresh the page.`);
      return;
    }
    if (command !== 'add') throw new Error('Choose add, edit, images, remove, list or build.');
    if (rest.length && !(rest.length === 1 && !rest[0].startsWith('--')) && !(rest[0] === '--file' && rest.length === 2)) throw new Error('Use add with a JSON file path, or without a file for interactive setup.');
    const file = rest.length ? resolve(rest.length === 1 ? rest[0] : rest[1]) : undefined;
    const config = file ? JSON.parse(await readFile(file, 'utf8')) : await promptProject();
    const project = await addProject(root, config, file ? dirname(file) : process.cwd());
    console.log(`Added ${project.title} with ${project.images.length} image(s) and rebuilt the website. Refresh the page to see it.`);
  } catch (error) { console.error(`Project command failed: ${error.message}`); process.exitCode = 1; }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await runProjectManager();
