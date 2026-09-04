/**
 * Local Development Server for Portfolio (HTML + Node.js API)
 * Runs natively on Node without needing Vercel CLI.
 * Usage: npm run dev  OR  node dev-server.js
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

// 1. Load .env file into process.env
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
            const [key, ...valParts] = trimmed.split('=');
            const keyName = key.trim();
            const val = valParts.join('=').trim();
            if (keyName && !process.env[keyName]) {
                process.env[keyName] = val;
            }
        }
    });
}

// Ensure RESEND_API_KEY is loaded from .env
if (!process.env.RESEND_API_KEY) {
    console.warn('[Notice] RESEND_API_KEY not found in environment or .env file.');
}

const PORT = process.env.PORT || 3000;
const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
    // Parse URL path (strip query params)
    const urlParts = req.url.split('?');
    const pathname = urlParts[0];

    // Enable CORS for local testing
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 2. Handle /api/contact endpoint (Routes to api/contact.js)
    if (pathname === '/api/contact' || pathname === '/api/contact.js') {
        if (req.method !== 'POST') {
            res.writeHead(405, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, message: 'Method Not Allowed' }));
            return;
        }

        let bodyRaw = '';
        req.on('data', chunk => { bodyRaw += chunk; });
        req.on('end', async () => {
            try {
                req.body = bodyRaw ? JSON.parse(bodyRaw) : {};
            } catch (e) {
                req.body = {};
            }

            // Mock Vercel response helper
            const mockRes = {
                status: function (code) {
                    this._statusCode = code;
                    return this;
                },
                setHeader: function (name, value) {
                    res.setHeader(name, value);
                },
                json: function (payload) {
                    res.writeHead(this._statusCode || 200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify(payload));
                }
            };

            try {
                // Delete require cache so edits to api/contact.js reload instantly
                const handlerPath = path.join(__dirname, 'api', 'contact.js');
                delete require.cache[require.resolve(handlerPath)];
                const handler = require(handlerPath);
                await handler(req, mockRes);
            } catch (handlerErr) {
                console.error('Error in /api/contact handler:', handlerErr);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, message: 'Server error processing contact form.' }));
            }
        });
        return;
    }

    // 3. Serve Static Files
    let filePath = path.join(__dirname, pathname === '/' ? 'index.html' : pathname);

    // If path is a directory or doesn't have an extension, try appending .html or index.html
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            const notFoundPath = path.join(__dirname, '404.html');
            if (fs.existsSync(notFoundPath)) {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                fs.createReadStream(notFoundPath).pipe(res);
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404 Not Found');
            }
            return;
        }

        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        fs.createReadStream(filePath).pipe(res);
    });
});

server.listen(PORT, () => {
    console.log(`\n=================================================`);
    console.log(`🚀 Portfolio Local Server Running!`);
    console.log(`📍 Open in browser: http://localhost:${PORT}`);
    console.log(`📬 API Endpoint:     http://localhost:${PORT}/api/contact`);
    console.log(`=================================================\n`);
});
