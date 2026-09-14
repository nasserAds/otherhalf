const fs = require('fs');
const https = require('https');
const path = require('path');
const next = require('next');

const dev = true;
const hostname = process.env.HOST || '0.0.0.0';
const port = Number(process.env.PORT || 3000);
const pfxPath =
  process.env.HTTPS_PFX_FILE ||
  path.resolve(__dirname, '..', 'certificates', 'jadal-local-dev.pfx');
const passphrase = process.env.HTTPS_PFX_PASSPHRASE || 'jadal-dev';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = https.createServer(
    {
      pfx: fs.readFileSync(pfxPath),
      passphrase,
    },
    (req, res) => handle(req, res),
  );

  const upgradeHandler = app.getUpgradeHandler?.();
  if (upgradeHandler) {
    server.on('upgrade', (req, socket, head) => upgradeHandler(req, socket, head));
  }

  server.listen(port, hostname, () => {
    console.log(`OtherHalf frontend ready on https://${hostname}:${port}`);
  });
});
