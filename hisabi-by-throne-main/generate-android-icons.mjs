import sharp from 'sharp';
import { mkdirSync } from 'fs';
import { join } from 'path';

const SOURCE = 'source-icon.jpg';
const RES = 'android/app/src/main/res';

// ─── Launcher icons (ic_launcher.png) ────────────────────────────────
const launcherSizes = {
  'mipmap-mdpi':    48,
  'mipmap-hdpi':    72,
  'mipmap-xhdpi':   96,
  'mipmap-xxhdpi':  144,
  'mipmap-xxxhdpi': 192,
};

// ─── Foreground for adaptive icons (ic_launcher_foreground.png) ──────
// Adaptive icons use 108dp base = 432px at xxxhdpi
// The foreground should have 18dp padding on each side (safe zone = 66%)
const foregroundSizes = {
  'mipmap-mdpi':    108,
  'mipmap-hdpi':    162,
  'mipmap-xhdpi':   216,
  'mipmap-xxhdpi':  324,
  'mipmap-xxxhdpi': 432,
};

// ─── Round icons (ic_launcher_round.png) ─────────────────────────────
// Same sizes as launcher but we'll apply a circular mask
const roundSizes = { ...launcherSizes };

// ─── Splash screens ─────────────────────────────────────────────────
// Centered logo on dark background (#0f1419)
const BG_COLOR = '#0f1419';
const splashConfigs = {
  // Portrait
  'drawable-port-mdpi':    { w: 320,  h: 480,  logo: 128 },
  'drawable-port-hdpi':    { w: 480,  h: 800,  logo: 192 },
  'drawable-port-xhdpi':   { w: 720,  h: 1280, logo: 256 },
  'drawable-port-xxhdpi':  { w: 960,  h: 1600, logo: 384 },
  'drawable-port-xxxhdpi': { w: 1280, h: 1920, logo: 512 },
  // Landscape
  'drawable-land-mdpi':    { w: 480,  h: 320,  logo: 128 },
  'drawable-land-hdpi':    { w: 800,  h: 480,  logo: 192 },
  'drawable-land-xhdpi':   { w: 1280, h: 720,  logo: 256 },
  'drawable-land-xxhdpi':  { w: 1600, h: 960,  logo: 384 },
  'drawable-land-xxxhdpi': { w: 1920, h: 1280, logo: 512 },
  // Default drawable
  'drawable':              { w: 480,  h: 800,  logo: 192 },
};

async function generateLauncherIcons() {
  console.log('── Launcher Icons ──');
  for (const [folder, size] of Object.entries(launcherSizes)) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });
    const out = join(dir, 'ic_launcher.png');
    await sharp(SOURCE)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .png()
      .toFile(out);
    console.log(`  ✓ ${out} (${size}x${size})`);
  }
}

async function generateForegroundIcons() {
  console.log('── Foreground Icons (adaptive) ──');
  for (const [folder, size] of Object.entries(foregroundSizes)) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });
    // Place the logo in the center with padding (66% safe zone)
    const logoSize = Math.round(size * 0.66);
    const padding = Math.round((size - logoSize) / 2);
    const logo = await sharp(SOURCE)
      .resize(logoSize, logoSize, { fit: 'cover', position: 'centre' })
      .toBuffer();
    const out = join(dir, 'ic_launcher_foreground.png');
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 15, g: 20, b: 25, alpha: 0 },  // transparent
      }
    })
      .composite([{ input: logo, left: padding, top: padding }])
      .png()
      .toFile(out);
    console.log(`  ✓ ${out} (${size}x${size}, logo ${logoSize}px)`);
  }
}

async function generateRoundIcons() {
  console.log('── Round Icons ──');
  for (const [folder, size] of Object.entries(roundSizes)) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });
    const r = Math.floor(size / 2);
    const circleSvg = Buffer.from(
      `<svg width="${size}" height="${size}"><circle cx="${r}" cy="${r}" r="${r}" fill="white"/></svg>`
    );
    const base = await sharp(SOURCE)
      .resize(size, size, { fit: 'cover', position: 'centre' })
      .toBuffer();
    const out = join(dir, 'ic_launcher_round.png');
    await sharp(base)
      .composite([{ input: circleSvg, blend: 'dest-in' }])
      .png()
      .toFile(out);
    console.log(`  ✓ ${out} (${size}x${size})`);
  }
}

async function generateSplashScreens() {
  console.log('── Splash Screens ──');
  for (const [folder, { w, h, logo }] of Object.entries(splashConfigs)) {
    const dir = join(RES, folder);
    mkdirSync(dir, { recursive: true });
    const resizedLogo = await sharp(SOURCE)
      .resize(logo, logo, { fit: 'cover', position: 'centre' })
      .toBuffer();
    const left = Math.round((w - logo) / 2);
    const top = Math.round((h - logo) / 2);
    const out = join(dir, 'splash.png');
    await sharp({
      create: {
        width: w,
        height: h,
        channels: 3,
        background: { r: 15, g: 20, b: 25 },  // #0f1419
      }
    })
      .composite([{ input: resizedLogo, left, top }])
      .png()
      .toFile(out);
    console.log(`  ✓ ${out} (${w}x${h})`);
  }
}

// ─── Run ─────────────────────────────────────────────────────────────
await generateLauncherIcons();
await generateForegroundIcons();
await generateRoundIcons();
await generateSplashScreens();
console.log('\n🎉 All Android icons & splash screens generated!');
