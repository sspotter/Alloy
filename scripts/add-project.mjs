import { runProjectManager } from './manage-projects.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
export { addProject } from './manage-projects.mjs';
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) await runProjectManager(['add', ...process.argv.slice(2)]);
