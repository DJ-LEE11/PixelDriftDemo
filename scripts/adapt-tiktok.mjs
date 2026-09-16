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

for (const fileName of ['game.js', 'game.json', 'project.config.json']) {
    await readFile(resolve(targetDir, fileName));
}

console.log(`TikTok Mini Game package prepared at ${targetDir}`);
