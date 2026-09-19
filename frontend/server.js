const http = require('http');
const next = require('next');

const args = process.argv.slice(2);
function argumentValue(flag, fallback) {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
}

const dev = true;
const hostname = process.env.HOST || argumentValue('-H', '0.0.0.0');
const port = Number(process.env.PORT || argumentValue('-p', '5000'));
const backendHost = '127.0.0.1';
const backendPort = 4000;
const backendPrefix = '/api/backend';

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const upgradeHandler = app.getUpgradeHandler();

function backendPath(requestUrl) {
  const path = requestUrl.slice(backendPrefix.length);
  return path || '/';
}

function proxyHttpRequest(req, res) {
  const headers = { ...req.headers, host: `${backendHost}:${backendPort}` };
  delete headers.origin;
  delete headers.referer;

  const proxy = http.request(
    {
      hostname: backendHost,
      port: backendPort,
      method: req.method,
      path: backendPath(req.url || '/'),
      headers,
    },
    (proxyResponse) => {
      res.writeHead(proxyResponse.statusCode || 502, proxyResponse.headers);
      proxyResponse.pipe(res);
    },
  );

  proxy.on('error', (error) => {
    if (!res.headersSent) res.writeHead(502, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ message: `Backend proxy error: ${error.message}` }));
  });
  req.pipe(proxy);
}

app.prepare().then(() => {
  const server = http.createServer((req, res) => {
    if ((req.url || '').startsWith(backendPrefix)) {
      proxyHttpRequest(req, res);
      return;
    }
    handle(req, res);
  });

  server.on('upgrade', (req, socket, head) => {
    if ((req.url || '').startsWith(`${backendPrefix}/socket.io`)) {
      socket.destroy();
      return;
    }
    upgradeHandler(req, socket, head);
  });

  server.listen(port, hostname, () => {
    console.log(`OtherHalf frontend ready on http://${hostname}:${port}`);
  });
});