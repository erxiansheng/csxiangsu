/**
 * 前端代码构建脚本 - 使用 Terser 压缩和混淆
 * 使用方法: node build.js
 */

const fs = require('fs');
const path = require('path');
const { minify } = require('terser');

const SRC_DIR = './frontend';
const DIST_DIR = './dist';

// Terser 混淆配置
const terserOptions = {
    compress: {
        drop_console: false,
        dead_code: true,
        unused: true,
        booleans_as_integers: true,
        passes: 2
    },
    mangle: {
        toplevel: false,  // 不混淆顶级变量，避免多文件冲突
        properties: {
            regex: /^_/
        },
        reserved: [
            'THREE', 'WebSocket', 'PixelCS3D', 'AudioSystem',
            'WeaponModelBuilder', 'WeaponConfigs', 'PlayerModel',
            'MapBuilder', 'preloadAllMaps', 'getMapConfig', 'MapNames',
            'MapEditor', 'MapCloudService', 'EdgeKV',
            'document', 'window', 'console', 'requestAnimationFrame',
            'setTimeout', 'setInterval', 'clearInterval', 'Math',
            'JSON', 'Date', 'Array', 'Object', 'String', 'Number',
            'Boolean', 'Promise', 'fetch', 'localStorage', 'Response',
            'URL', 'Request', 'Headers', 'process', 'globalThis', 'ENV'
        ]
    },
    format: {
        comments: false
    }
};

// 递归创建目录
function mkdirp(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// 递归复制目录
function copyDirRecursive(src, dest) {
    mkdirp(dest);
    fs.readdirSync(src).forEach(item => {
        const srcPath = path.join(src, item);
        const destPath = path.join(dest, item);
        if (fs.statSync(srcPath).isDirectory()) {
            copyDirRecursive(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    });
}


// 创建输出目录结构
function createDistDir() {
    mkdirp(DIST_DIR);
    mkdirp(path.join(DIST_DIR, 'image'));
    mkdirp(path.join(DIST_DIR, 'yinxiao'));
    mkdirp(path.join(DIST_DIR, 'functions'));
    mkdirp(path.join(DIST_DIR, 'map-editor'));
    mkdirp(path.join(DIST_DIR, 'dem'));
}

// 复制静态资源
function copyAssets() {
    console.log('📁 复制静态资源...');

    // 复制图片
    const imageDir = path.join(SRC_DIR, 'image');
    if (fs.existsSync(imageDir)) {
        copyDirRecursive(imageDir, path.join(DIST_DIR, 'image'));
        console.log('   ✓ image/');
    }

    // 复制音效
    const yinxiaoDir = path.join(SRC_DIR, 'yinxiao');
    if (fs.existsSync(yinxiaoDir)) {
        copyDirRecursive(yinxiaoDir, path.join(DIST_DIR, 'yinxiao'));
        console.log('   ✓ yinxiao/');
    }

    // 复制 dem 目录
    const demDir = path.join(SRC_DIR, 'dem');
    if (fs.existsSync(demDir)) {
        copyDirRecursive(demDir, path.join(DIST_DIR, 'dem'));
        console.log('   ✓ dem/');
    }

    // 复制 functions 目录（边缘函数）
    const functionsDir = path.join(SRC_DIR, 'functions');
    if (fs.existsSync(functionsDir)) {
        copyDirRecursive(functionsDir, path.join(DIST_DIR, 'functions'));
        console.log('   ✓ functions/');
    }

    // 复制 esa.jsonc
    const esaConfig = path.join(SRC_DIR, 'esa.jsonc');
    if (fs.existsSync(esaConfig)) {
        fs.copyFileSync(esaConfig, path.join(DIST_DIR, 'esa.jsonc'));
        console.log('   ✓ esa.jsonc');
    }
}

// 压缩混淆 JavaScript 文件
async function minifyJS(srcPath, destPath) {
    const code = fs.readFileSync(srcPath, 'utf8');
    const originalSize = Buffer.byteLength(code, 'utf8');

    try {
        const result = await minify(code, terserOptions);
        fs.writeFileSync(destPath, result.code);
        const newSize = Buffer.byteLength(result.code, 'utf8');
        const ratio = ((1 - newSize / originalSize) * 100).toFixed(1);
        console.log(`   ${path.basename(srcPath)}: ${originalSize} -> ${newSize} bytes (-${ratio}%)`);
        return true;
    } catch (err) {
        console.error(`   ❌ ${path.basename(srcPath)} 压缩失败:`, err.message);
        fs.copyFileSync(srcPath, destPath);
        return false;
    }
}

// 处理主目录 JS 文件
async function processMainJS() {
    console.log('🔧 压缩混淆主目录 JavaScript...');

    const jsFiles = [
        'game3d.js', 'audio.js', 'maps.js', 'player.js',
        'weapons.js', 'minimap.js', 'background.js', 'map-cloud.js'
    ];

    for (const file of jsFiles) {
        const srcPath = path.join(SRC_DIR, file);
        const destPath = path.join(DIST_DIR, file);
        if (fs.existsSync(srcPath)) {
            await minifyJS(srcPath, destPath);
        }
    }
}

// 处理地图编辑器
async function processMapEditor() {
    console.log('🔧 压缩混淆地图编辑器...');

    const editorDir = path.join(SRC_DIR, 'map-editor');
    const destDir = path.join(DIST_DIR, 'map-editor');

    // 处理 editor.js
    const editorJS = path.join(editorDir, 'editor.js');
    if (fs.existsSync(editorJS)) {
        await minifyJS(editorJS, path.join(destDir, 'editor.js'));
    }

    // 压缩 CSS
    const editorCSS = path.join(editorDir, 'style.css');
    if (fs.existsSync(editorCSS)) {
        let css = fs.readFileSync(editorCSS, 'utf8');
        css = minifyCSS(css);
        fs.writeFileSync(path.join(destDir, 'style.css'), css);
        console.log('   style.css (editor)');
    }

    // 压缩 HTML
    const editorHTML = path.join(editorDir, 'index.html');
    if (fs.existsSync(editorHTML)) {
        let html = fs.readFileSync(editorHTML, 'utf8');
        html = minifyHTML(html);
        fs.writeFileSync(path.join(destDir, 'index.html'), html);
        console.log('   index.html (editor)');
    }

    // 复制 maps 子目录
    const mapsDir = path.join(editorDir, 'maps');
    if (fs.existsSync(mapsDir)) {
        copyDirRecursive(mapsDir, path.join(destDir, 'maps'));
        console.log('   ✓ maps/');
    }
}


// CSS 压缩
function minifyCSS(code) {
    code = code.replace(/\/\*[\s\S]*?\*\//g, '');
    code = code.replace(/\s+/g, ' ');
    code = code.replace(/\s*{\s*/g, '{');
    code = code.replace(/\s*}\s*/g, '}');
    code = code.replace(/\s*:\s*/g, ':');
    code = code.replace(/\s*;\s*/g, ';');
    code = code.replace(/;}/g, '}');
    return code.trim();
}

// HTML 压缩
function minifyHTML(code) {
    code = code.replace(/<!--[\s\S]*?-->/g, '');
    code = code.replace(/\n\s*/g, '\n');
    code = code.replace(/\n+/g, '\n');
    return code.trim();
}

// 处理主目录 CSS
function processMainCSS() {
    console.log('🎨 压缩 CSS...');

    const srcPath = path.join(SRC_DIR, 'style.css');
    const destPath = path.join(DIST_DIR, 'style.css');

    if (fs.existsSync(srcPath)) {
        const code = fs.readFileSync(srcPath, 'utf8');
        const originalSize = Buffer.byteLength(code, 'utf8');
        const minified = minifyCSS(code);
        fs.writeFileSync(destPath, minified);
        const newSize = Buffer.byteLength(minified, 'utf8');
        const ratio = ((1 - newSize / originalSize) * 100).toFixed(1);
        console.log(`   style.css: ${originalSize} -> ${newSize} bytes (-${ratio}%)`);
    }
}

// 处理主目录 HTML
function processMainHTML() {
    console.log('📄 压缩 HTML...');

    const srcPath = path.join(SRC_DIR, 'index.html');
    const destPath = path.join(DIST_DIR, 'index.html');

    if (fs.existsSync(srcPath)) {
        const code = fs.readFileSync(srcPath, 'utf8');
        const originalSize = Buffer.byteLength(code, 'utf8');
        const minified = minifyHTML(code);
        fs.writeFileSync(destPath, minified);
        const newSize = Buffer.byteLength(minified, 'utf8');
        const ratio = ((1 - newSize / originalSize) * 100).toFixed(1);
        console.log(`   index.html: ${originalSize} -> ${newSize} bytes (-${ratio}%)`);
    }
}

// 主函数
async function build() {
    console.log('🚀 开始构建前端代码...\n');

    createDistDir();
    copyAssets();
    await processMainJS();
    await processMapEditor();
    processMainCSS();
    processMainHTML();

    console.log('\n✅ 构建完成！输出目录: ' + DIST_DIR);
}

build().catch(err => {
    console.error('构建失败:', err);
    process.exit(1);
});
