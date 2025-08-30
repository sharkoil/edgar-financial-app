const http = require('http');
const https = require('https');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

// MIME types
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon'
};

function serveFile(res, filePath) {
  const ext = path.extname(filePath);
  const mimeType = mimeTypes[ext] || 'text/plain';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end('File not found');
      return;
    }
    
    res.writeHead(200, {
      'Content-Type': mimeType,
      'Access-Control-Allow-Origin': '*'
    });
    res.end(data);
  });
}

function proxySecRequest(res, apiPath) {
  const options = {
    hostname: 'data.sec.gov',
    path: apiPath,
    method: 'GET',
    headers: {
      'User-Agent': 'Financial Lookup App (contact@example.com)',
      'Accept': 'application/json'
    }
  };

  const req = https.request(options, (secRes) => {
    let data = '';
    
    secRes.on('data', (chunk) => {
      data += chunk;
    });
    
    secRes.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(data);
    });
  });

  req.on('error', (err) => {
    console.error('SEC API Error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Failed to fetch data from SEC API' }));
  });

  req.end();
}

function proxyAlphaVantageRequest(res, query) {
  const options = {
    hostname: 'www.alphavantage.co',
    path: '/query?' + query,
    method: 'GET',
    headers: {
      'User-Agent': 'Financial Lookup App (contact@example.com)',
      'Accept': 'application/json'
    }
  };

  console.log('Proxying Alpha Vantage API:', options.path);

  const req = https.request(options, (avRes) => {
    let data = '';
    
    avRes.on('data', (chunk) => {
      data += chunk;
    });
    
    avRes.on('end', () => {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end(data);
    });
  });

  req.on('error', (err) => {
    console.error('Alpha Vantage API Error:', err);
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Failed to fetch data from Alpha Vantage API' }));
  });

  req.end();
}

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  // Proxy SEC API requests
  if (pathname.startsWith('/api/sec/')) {
    const apiPath = pathname.replace('/api/sec', '/api/xbrl');
    console.log('Proxying SEC API:', apiPath);
    proxySecRequest(res, apiPath);
    return;
  }

  // Proxy Alpha Vantage API requests
  if (pathname.startsWith('/api/alphavantage/')) {
    const query = parsedUrl.search.substring(1); // Remove the '?' from query string
    proxyAlphaVantageRequest(res, query);
    return;
  }

  // Serve static files
  let filePath = '.' + pathname;
  
  if (pathname === '/') {
    filePath = './index.html';
  }

  // Check if file exists
  if (fs.existsSync(filePath)) {
    serveFile(res, filePath);
  } else {
    res.writeHead(404);
    res.end('File not found');
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Financial Lookup App running at http://localhost:${PORT}`);
  console.log(`📊 SEC API proxy enabled at /api/sec/`);
  console.log(`📈 Alpha Vantage API proxy enabled at /api/alphavantage/`);
});
