import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const script = resolve(dirname(fileURLToPath(import.meta.url)), 'create-website-qr.py');
let args = process.argv.slice(2);
if (args.length && !args[0].startsWith('--')) {
  if (args.length > 4) throw new Error('Use: npm run qr "URL" "bottom description" [filename-prefix] [output-directory]');
  const [url, description, name, directory] = args;
  args = ['--url', url, ...(description !== undefined ? ['--description', description] : []), ...(name ? ['--name', name] : []), ...(directory ? ['--output-dir', directory] : [])];
}
const candidates = process.env.ALLOY_PYTHON
  ? [[process.env.ALLOY_PYTHON, []]]
  : [['py', ['-3']], ['python', []], ['python3', []], [resolve(homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe'), []]];
const runtime = candidates.find(([command, flags]) => spawnSync(command, [...flags, '-c', 'import qrcode, PIL, zxingcpp'], { windowsHide: true }).status === 0);
if (!runtime) {
  console.error('Install Python and the QR dependencies: python -m pip install -r scripts/qr-requirements.txt\nSet ALLOY_PYTHON to your Python executable if needed.');
  process.exitCode = 1;
} else {
  const [command, flags] = runtime;
  const result = spawnSync(command, [...flags, script, ...args], { stdio: 'inherit', windowsHide: true });
  if (result.error) console.error(result.error.message);
  process.exitCode = result.status ?? 1;
}
