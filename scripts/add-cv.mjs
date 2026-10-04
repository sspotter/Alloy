import { readFile, writeFile, copyFile, mkdir, access } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { root } from './project-builder.mjs';

try {
  const [person, source] = process.argv.slice(2);
  if (!['yousef', 'osama', 'mazen'].includes(person) || !source) throw new Error('Use: npm run cv:add yousef|osama|mazen "path/to/cv.pdf" (or a public https:// CV URL).');
  let href;
  if (source.startsWith('https://')) {
    href = new URL(source).href;
  } else {
    const file = resolve(source);
    if (extname(file).toLowerCase() !== '.pdf') throw new Error('Use a PDF file for a local CV.');
    await access(file);
    await mkdir(resolve(root, 'assets/cvs'), { recursive: true });
    href = `assets/cvs/${person}.pdf`;
    await copyFile(file, resolve(root, href));
  }
  const pagePath = resolve(root, 'index.html');
  const page = await readFile(pagePath, 'utf8');
  const pattern = new RegExp(`<a[^>]*data-cv="${person}"[^>]*>[\\s\\S]*?<\\/a>`);
  if (!pattern.test(page)) throw new Error(`Missing CV link for ${person} in index.html.`);
  const escaped = href.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
  await writeFile(pagePath, page.replace(pattern, `<a class="text-link team-cv" data-cv="${person}" href="${escaped}" target="_blank" rel="noopener noreferrer" aria-label="View ${person.charAt(0).toUpperCase() + person.slice(1)}'s CV">View CV</a>`));
  console.log(`Updated ${person}'s CV. Refresh the page.`);
} catch (error) { console.error(error.message); process.exitCode = 1; }
