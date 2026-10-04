import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { renderProjects, updatePage, validateProjects } from './project-builder.mjs';
import { addProject } from './add-project.mjs';
import { removeProject, validProjectUrl } from './manage-projects.mjs';

const sample = () => ({ id: 'example', title: 'Example <tool>', category: 'tools',
  value: 'Read & build', description: 'A useful workspace.', tags: ['Desktop'],
  images: [{ src: 'assets/a.png', alt: 'First view' }, { src: 'assets/b.png', alt: 'Second view' }],
  actions: [{ label: 'View source', href: 'https://example.com' }] });

test('renders escaped copy and independent multiple-image controls', () => {
  const html = renderProjects([sample()]);
  assert.match(html, /Example &lt;tool&gt;/);
  assert.match(html, /Read &amp; build/);
  assert.match(html, /data-gallery-step="1"/);
  assert.match(html, /Second view/);
  assert.match(html, /1 \/ 2/);
});

test('rejects duplicate IDs, invalid categories and unsafe action URLs', () => {
  assert.throws(() => validateProjects([sample(), sample()]), /Duplicate/);
  assert.throws(() => validateProjects([{ ...sample(), category: 'unknown' }]), /category/);
  assert.throws(() => validateProjects([{ ...sample(), actions: [{ label: 'Open', href: 'javascript:alert(1)' }] }]), /URL/);
});

test('regenerates only marked cards and updates counts', () => {
  const page = '<header>Keep me</header><!-- PROJECTS:START -->old<!-- PROJECTS:END --><span data-project-total>0</span><span class="work-count">old</span>';
  const result = updatePage(page, [sample()]);
  assert.match(result, /<header>Keep me<\/header>/);
  assert.match(result, /data-project-total>1</);
  assert.match(result, /Showing 1 project</);
  assert.throws(() => updatePage('No markers', [sample()]), /markers/);
});

test('adds a project, copies images, rebuilds page and refuses duplicates', async () => {
  const root = await mkdtemp(join(tmpdir(), 'alloy-project-test-'));
  try {
    await mkdir(join(root, 'scripts')); await mkdir(join(root, 'assets'));
    await writeFile(join(root, 'scripts/projects.json'), '[]');
    await writeFile(join(root, 'index.html'), '<!-- PROJECTS:START --><!-- PROJECTS:END --><span data-project-total>0</span>');
    await writeFile(join(root, 'source.png'), 'image fixture');
    const config = { ...sample(), id: '123', images: [{ src: 'source.png', alt: 'A preview' }] };
    await addProject(root, config, root);
    const data = JSON.parse(await readFile(join(root, 'scripts/projects.json'), 'utf8'));
    assert.equal(data.length, 1);
    assert.equal(await readFile(join(root, data[0].images[0].src), 'utf8'), 'image fixture');
    assert.match(await readFile(join(root, 'index.html'), 'utf8'), /Example &lt;tool&gt;/);
    await assert.rejects(addProject(root, config, root), /Duplicate/);
    await assert.rejects(addProject(root, { ...config, id: 'missing', images: [{ src: 'absent.png', alt: 'Missing' }] }, root), /ENOENT/);
    assert.equal(JSON.parse(await readFile(join(root, 'scripts/projects.json'), 'utf8')).length, 1);
    for (const script of ['project-builder.mjs', 'add-project.mjs', 'manage-projects.mjs']) {
      await copyFile(new URL(script, import.meta.url), join(root, 'scripts', script));
    }
    await writeFile(join(root, 'import.json'), JSON.stringify({ ...config, id: 'cli-project' }));
    const output = execFileSync(process.execPath, [join(root, 'scripts/add-project.mjs'), '--file', join(root, 'import.json')], { encoding: 'utf8' });
    assert.match(output, /Added Example/);
    assert.equal(JSON.parse(await readFile(join(root, 'scripts/projects.json'), 'utf8')).length, 2);
    await removeProject(root, 'cli-project');
    assert.equal(JSON.parse(await readFile(join(root, 'scripts/projects.json'), 'utf8')).length, 1);
    assert.doesNotMatch(await readFile(join(root, 'index.html'), 'utf8'), /cli-project/);
    assert.equal(await readFile(join(root, 'assets/cli-project-1.png'), 'utf8'), 'image fixture');
    await assert.rejects(removeProject(root, 'absent'), /No project/);
  } finally { await rm(root, { recursive: true, force: true }); }
});

test('numeric IDs work, optional URLs can be omitted, and images use popups', () => {
  validateProjects([{ ...sample(), id: '123' }]);
  assert.equal(validProjectUrl('yeyey'), false);
  assert.equal(validProjectUrl(''), true);
  assert.equal(validProjectUrl('https://example.com'), true);
  const html = renderProjects([sample()]);
  assert.match(html, /data-image-popup/);
  assert.doesNotMatch(html, /href="assets\/a.png" target=/);
});
