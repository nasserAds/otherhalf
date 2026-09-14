const path = require('path');
const { spawn } = require('child_process');

const certPath = path.resolve(__dirname, '..', '..', 'frontend', 'certificates', 'jadal-local-dev.pfx');
const nestBin = path.resolve(__dirname, '..', 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');

const child = spawn(
  process.execPath,
  [nestBin, 'start', '--watch'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      HTTPS_PFX_FILE: certPath,
      HTTPS_PFX_PASSPHRASE: 'jadal-dev',
    },
  },
);

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 0);
});
