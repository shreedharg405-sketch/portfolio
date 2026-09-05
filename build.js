/**
 * Production Build Script for Cloudflare Pages Deployment
 * Usage: npm run build  OR  node build.js
 */
const fs = require('fs');
const path = require('path');

console.log('----------------------------------------------------');
console.log('🚀 Starting Cloudflare Pages Production Build');
console.log('----------------------------------------------------');

const ROOT_DIR = __dirname;
const DIST_DIR = path.join(ROOT_DIR, 'dist');

// 1. Mandatory Project Images Verification
const REQUIRED_PROJECT_IMAGES = [
    'student-management-system.jpg',
    'awardslogo.png',
    'student-record-backend.jpg',
    'weather-application.jpg',
    'smart-lume.jpg',
    'smart-poultry-farm.jpg'
];

console.log('🔍 Checking showcase project images...');
let validatedCount = 0;

for (const img of REQUIRED_PROJECT_IMAGES) {
    // Check in both images/projects/ and public/images/projects/
    const stdPath = path.join(ROOT_DIR, 'images', 'projects', img);
    const pubPath = path.join(ROOT_DIR, 'public', 'images', 'projects', img);

    let resolvedPath = null;
    if (fs.existsSync(stdPath)) {
        resolvedPath = stdPath;
    } else if (fs.existsSync(pubPath)) {
        resolvedPath = pubPath;
    }

    if (!resolvedPath) {
        throw new Error(`[Build Error] Missing required project image: images/projects/${img}`);
    }

    const stat = fs.statSync(resolvedPath);
    const sizeKB = Math.round(stat.size / 1024);
    validatedCount++;
    console.log(`✓ [${validatedCount}/${REQUIRED_PROJECT_IMAGES.length}] ${img} (${sizeKB} KB) -> ${path.relative(ROOT_DIR, resolvedPath)}`);
}

console.log(`✓ All ${REQUIRED_PROJECT_IMAGES.length} showcase project images verified.`);

// 2. Core Portfolio Files & Cloudflare Function Verification
const REQUIRED_PORTFOLIO_FILES = [
    'index.html',
    '404.html',
    '_headers',
    path.join('assets', 'resume.pdf'),
    path.join('functions', 'api', 'contact.js')
];

for (const rel of REQUIRED_PORTFOLIO_FILES) {
    const full = path.join(ROOT_DIR, rel);
    if (!fs.existsSync(full)) {
        throw new Error(`[Build Error] Missing required portfolio file: ${rel}`);
    }
}
console.log('✓ Core portfolio files, headers, and Cloudflare Function verified.');

// 3. Prepare dist/ Directory
if (fs.existsSync(DIST_DIR)) {
    fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR, { recursive: true });

// Helper to copy recursive
function copyRecursiveSync(src, dest) {
    if (!fs.existsSync(src)) return;
    const stat = fs.statSync(src);
    if (stat.isDirectory()) {
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        for (const child of fs.readdirSync(src)) {
            copyRecursiveSync(path.join(src, child), path.join(dest, child));
        }
    } else {
        fs.copyFileSync(src, dest);
    }
}

// 4. Compile Production Assets into dist/
console.log('📦 Compiling production assets into dist/...');

// Copy root static files
fs.copyFileSync(path.join(ROOT_DIR, 'index.html'), path.join(DIST_DIR, 'index.html'));
fs.copyFileSync(path.join(ROOT_DIR, '404.html'), path.join(DIST_DIR, '404.html'));
fs.copyFileSync(path.join(ROOT_DIR, '_headers'), path.join(DIST_DIR, '_headers'));

// Copy asset directories
copyRecursiveSync(path.join(ROOT_DIR, 'css'), path.join(DIST_DIR, 'css'));
copyRecursiveSync(path.join(ROOT_DIR, 'js'), path.join(DIST_DIR, 'js'));
copyRecursiveSync(path.join(ROOT_DIR, 'images'), path.join(DIST_DIR, 'images'));
copyRecursiveSync(path.join(ROOT_DIR, 'assets'), path.join(DIST_DIR, 'assets'));
if (fs.existsSync(path.join(ROOT_DIR, 'public'))) {
    copyRecursiveSync(path.join(ROOT_DIR, 'public'), path.join(DIST_DIR, 'public'));
}

// 5. Security & Isolation Audit on dist/
console.log('🔒 Performing Security & Isolation Audit on dist/...');

function auditDir(dir) {
    for (const item of fs.readdirSync(dir)) {
        const full = path.join(dir, item);
        const stat = fs.statSync(full);
        if (stat.isDirectory()) {
            auditDir(full);
        } else {
            // Check forbidden filenames
            const lower = item.toLowerCase();
            if (lower.startsWith('.env') || lower.endsWith('.sql') || lower.endsWith('.php')) {
                throw new Error(`[Security Violation] Private or server-side file leaked into dist: ${full}`);
            }

            // Inspect text files for accidentally embedded secrets
            const ext = path.extname(full).toLowerCase();
            if (['.html', '.js', '.css', '.json'].includes(ext)) {
                const content = fs.readFileSync(full, 'utf8');
                if (/re_[a-zA-Z0-9]{20,}/.test(content)) {
                    throw new Error(`[Security Violation] Hardcoded Resend API key found in built asset: ${full}`);
                }
            }
        }
    }
}

auditDir(DIST_DIR);
console.log('✓ Security Audit PASSED: No secrets, .env, or forbidden files in dist/.');

console.log('----------------------------------------------------');
console.log('✨ Build Completed Successfully!');
console.log(`📁 Production Output: ${DIST_DIR}`);
console.log('⚡ Ready for Cloudflare Pages deployment.');
console.log('----------------------------------------------------');
