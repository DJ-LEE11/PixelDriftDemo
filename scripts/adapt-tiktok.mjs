import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const projectRoot = resolve(import.meta.dirname, '..');
const sourceDir = resolve(projectRoot, 'build/tiktok-native-base');
const targetDir = resolve(projectRoot, 'build/tiktok-mini-game');
const clientKey = process.env.TIKTOK_CLIENT_KEY;

if (!clientKey) {
    throw new Error('TIKTOK_CLIENT_KEY is required.');
}

await rm(targetDir, { recursive: true, force: true });
await mkdir(targetDir, { recursive: true });
await cp(sourceDir, targetDir, { recursive: true });

const gameJsonPath = resolve(targetDir, 'game.json');
const gameJson = JSON.parse(await readFile(gameJsonPath, 'utf8'));
gameJson.deviceOrientation = 'portrait';
gameJson.showStatusBar = false;
await writeFile(gameJsonPath, `${JSON.stringify(gameJson, null, 2)}\n`);

const projectConfigPath = resolve(targetDir, 'project.config.json');
const projectConfig = JSON.parse(await readFile(projectConfigPath, 'utf8'));
projectConfig.appid = clientKey;
projectConfig.projectname = 'PixelDriftDemo';
await writeFile(projectConfigPath, `${JSON.stringify(projectConfig, null, 2)}\n`);

const gameEntryPath = resolve(targetDir, 'game.js');
const gameEntry = await readFile(gameEntryPath, 'utf8');
const runtimeBridge = `// TikTok native runtime bridge for Cocos' Douyin mini-game adapter.
(function setupTikTokRuntime() {
    var root = typeof globalThis !== 'undefined' ? globalThis : this;
    var api = root.tt || (root.TTMinis && root.TTMinis.game) || root.wx;

    // TikTok documents tt, wx and TTMinis.game as equivalent namespaces.
    // Cocos' Douyin adapter expects tt, so normalize whichever one is present.
    if (api) {
        root.tt = root.tt || api;
        root.wx = root.wx || api;
    }
    if (!root.GameGlobal) {
        root.GameGlobal = root;
    }

    // Cocos reads frame/timer functions from GameGlobal during adapter setup.
    // Some TikTok runtime versions expose these functions on the API namespace.
    ['requestAnimationFrame', 'cancelAnimationFrame', 'setTimeout', 'clearTimeout',
        'setInterval', 'clearInterval'].forEach(function (name) {
        if (!root.GameGlobal[name] && api && typeof api[name] === 'function') {
            root.GameGlobal[name] = api[name].bind(api);
        }
    });

    function reportStartupError(error) {
        var message = error && (error.message || error.errMsg) || String(error);
        console.error('[PixelDriftDemo startup]', error);
        if (api && typeof api.showModal === 'function') {
            api.showModal({
                title: 'Startup error',
                content: message.slice(0, 500),
                showCancel: false
            });
        }
    }

    if (api && typeof api.onError === 'function') {
        api.onError(reportStartupError);
    }
    if (!api) {
        console.error('[PixelDriftDemo startup] TikTok Mini Game runtime API is unavailable.');
    }
}());

`;
await writeFile(gameEntryPath, `${runtimeBridge}${gameEntry}`);

for (const fileName of ['game.js', 'game.json', 'project.config.json']) {
    await readFile(resolve(targetDir, fileName));
}

console.log(`TikTok Mini Game package prepared at ${targetDir}`);
