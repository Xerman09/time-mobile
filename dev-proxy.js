const http = require('http');
const https = require('https');
const url = require('url');

const PORT = 8089;
const TARGET_HOST = 'time.usintellix.com';

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, Cookie, X-Session-ID');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url);
  const targetPath = parsedUrl.path;

  let cookie = req.headers['cookie'] || '';
  const xSession = req.headers['x-session-id'];
  if (xSession) {
    cookie = `PHPSESSID=${xSession}`;
  }

  const outgoingHeaders = {
    ...req.headers,
    host: TARGET_HOST,
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    accept: 'application/json, text/plain, */*',
  };

  if (cookie) {
    outgoingHeaders['cookie'] = cookie;
  }
  delete outgoingHeaders['x-session-id'];

  const options = {
    hostname: TARGET_HOST,
    port: 443,
    path: targetPath,
    method: req.method,
    headers: outgoingHeaders,
  };

  const proxyReq = https.request(options, (proxyRes) => {
    const headers = { ...proxyRes.headers };
    delete headers['access-control-allow-origin'];
    delete headers['access-control-allow-credentials'];

    res.writeHead(proxyRes.statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Proxy error: ' + err.message }));
  });

  req.pipe(proxyReq);
});

server.listen(PORT, () => {
  console.log(`Local Web API Proxy listening on http://localhost:${PORT}`);
});
