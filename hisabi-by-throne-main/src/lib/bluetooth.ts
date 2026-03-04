/**
 * bluetooth.ts
 * ─────────────
 * BLE thermal-printer manager.
 *
 * Workflow
 *  1. User taps "بحث عن طابعة" → scanAndConnect() → native device picker
 *  2. Auto-detects writable characteristic from device's GATT profile
 *  3. Falls back to a table of known printer service/characteristic UUIDs
 *  4. Config saved to localStorage; retrieved by printBytes() on every print job
 *
 * Transport
 *  – Native (Android/iOS): @capacitor-community/bluetooth-le
 *  – Web browser: same library falls back to Web Bluetooth API
 *
 * Chunking
 *  BLE MTU is typically 20 bytes (minimum) up to ~517 bytes (negotiated).
 *  We use 182 bytes per chunk as a safe conservative default.
 *  A tiny inter-chunk delay lets slower printers keep up.
 */

import { BleClient, BleDevice } from '@capacitor-community/bluetooth-le';
import { buildTestPage } from './escpos';

/* ─────────────────────────────────────────────────────────────────────
   Environment helpers
   ───────────────────────────────────────────────────────────────────── */

function isNativePlatform(): boolean {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return !!(window as any).Capacitor?.isNativePlatform?.();
  } catch {
    return false;
  }
}

function webBT(): Bluetooth | null {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator
    ? (navigator as Navigator & { bluetooth: Bluetooth }).bluetooth
    : null;
}

/* ── Known BLE printer profiles ────────────────────────────────────── */
export const PRINTER_PROFILES = [
  {
    label: 'Generic ESC/POS (Class 0x18F0)',
    serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
    charUUID:    '00002af1-0000-1000-8000-00805f9b34fb',
  },
  {
    label: 'Generic ESC/POS (Alt char)',
    serviceUUID: '000018f0-0000-1000-8000-00805f9b34fb',
    charUUID:    '00002af0-0000-1000-8000-00805f9b34fb',
  },
  {
    label: 'Serial Port BLE (SPP bridge)',
    serviceUUID: '49535343-fe7d-4ae5-8fa9-9fafd205e455',
    charUUID:    '49535343-8841-43f4-a8d4-ecbe34729bb3',
  },
  {
    label: 'TP / JP Series',
    serviceUUID: 'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
    charUUID:    'bef8d6c9-9c21-4c9e-b632-bd58c1009f9f',
  },
  {
    label: 'Zjiang / WH-series',
    serviceUUID: '6e400001-b5a3-f393-e0a9-e50e24dcca9e',
    charUUID:    '6e400002-b5a3-f393-e0a9-e50e24dcca9e',
  },
] as const;

const ALL_SERVICE_UUIDS = [...new Set(PRINTER_PROFILES.map(p => p.serviceUUID))];

/* ── Stored config ──────────────────────────────────────────────────── */
export const PRINTER_STORAGE_KEY = 'ma7ali-printer';

export interface PrinterConfig {
  deviceId:    string;
  deviceName:  string;
  serviceUUID: string;
  charUUID:    string;
  paperWidth:  58 | 80;
  encoding:    'utf8' | 'w1256';
}

export function loadPrinterConfig(): PrinterConfig | null {
  try {
    const raw = localStorage.getItem(PRINTER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PrinterConfig) : null;
  } catch {
    return null;
  }
}

export function savePrinterConfig(cfg: PrinterConfig): void {
  localStorage.setItem(PRINTER_STORAGE_KEY, JSON.stringify(cfg));
}

export function clearPrinterConfig(): void {
  localStorage.removeItem(PRINTER_STORAGE_KEY);
}

/* ─────────────────────────────────────────────────────────────────────
   Capacitor BLE helpers (native path)
   ───────────────────────────────────────────────────────────────────── */

let bleInitialised = false;

async function ensureNativeInit(): Promise<void> {
  if (bleInitialised) return;
  await BleClient.initialize({ androidNeverForLocation: true });
  bleInitialised = true;
}

async function safeDisconnectNative(deviceId: string): Promise<void> {
  try { await BleClient.disconnect(deviceId); } catch { /* ignore */ }
}

/* ─────────────────────────────────────────────────────────────────────
   WEB path — calls navigator.bluetooth directly to stay in user-gesture context
   (BleClient wraps requestDevice inside a queue which breaks the gesture window)
   ───────────────────────────────────────────────────────────────────── */

function translateWebBtError(e: unknown): Error {
  const raw = (e instanceof Error ? e.message : String(e)) ?? '';
  const lc  = raw.toLowerCase();
  if (lc.includes('cancel') || lc.includes('user') || lc.includes('chosen') || raw === '') {
    return new Error('تم إلغاء البحث — اضغط مجدداً واختر الطابعة من القائمة');
  }
  if (lc.includes('security') || lc.includes('permission') || lc.includes('https')) {
    return new Error('يتطلب البلوتوث تشغيل التطبيق عبر HTTPS أو localhost');
  }
  if (lc.includes('not supported') || lc.includes('not available') || lc.includes('bluetooth')) {
    return new Error('متصفحك لا يدعم Web Bluetooth — استخدم Chrome أو Edge');
  }
  return new Error(`فشل البحث: ${raw || 'خطأ غير معروف'}`);
}

async function scanAndConnectWeb(onStatus?: (msg: string) => void): Promise<PrinterConfig> {
  const bt = webBT();
  if (!bt) {
    throw new Error(
      location.protocol !== 'https:' && location.hostname !== 'localhost'
        ? 'يتطلب البلوتوث HTTPS — افتح التطبيق من رابط https:// أو ثبّته كـ PWA'
        : 'متصفحك لا يدعم Web Bluetooth — استخدم Chrome أو Edge على Android/PC',
    );
  }

  onStatus?.('جاري فتح قائمة الأجهزة...');

  // ⚠ Must call requestDevice() synchronously inside user-gesture context.
  //    We go directly to navigator.bluetooth — NOT through BleClient.queue().
  let webDevice: BluetoothDevice;
  try {
    webDevice = await bt.requestDevice({ acceptAllDevices: true, optionalServices: ALL_SERVICE_UUIDS });
  } catch (e) {
    throw translateWebBtError(e);
  }

  const deviceName = webDevice.name || webDevice.id;
  onStatus?.(`جاري الاتصال بـ ${deviceName}...`);

  if (!webDevice.gatt) throw new Error('هذا الجهاز لا يدعم GATT');
  let server: BluetoothRemoteGATTServer;
  try {
    server = await webDevice.gatt.connect();
  } catch (e) {
    throw new Error(`فشل الاتصال: ${(e as Error).message}`);
  }

  await sleep(500);
  onStatus?.('جاري اكتشاف خدمات الطابعة...');

  let found: { serviceUUID: string; charUUID: string } | null = null;

  // Try auto-detect first
  try {
    const services = await server.getPrimaryServices();
    outer: for (const svc of services) {
      const chars = await svc.getCharacteristics();
      for (const ch of chars) {
        if (ch.properties.write || ch.properties.writeWithoutResponse) {
          found = { serviceUUID: svc.uuid, charUUID: ch.uuid };
          break outer;
        }
      }
    }
  } catch { /* fall through to probe */ }

  // Probe known profiles
  if (!found) {
    for (const profile of PRINTER_PROFILES) {
      try {
        const svc  = await server.getPrimaryService(profile.serviceUUID);
        const char = await svc.getCharacteristic(profile.charUUID);
        if (char.properties.write || char.properties.writeWithoutResponse) {
          found = { serviceUUID: profile.serviceUUID, charUUID: profile.charUUID };
          break;
        }
      } catch { /* try next */ }
    }
  }

  try { server.disconnect(); } catch { /* ignore */ }

  if (!found) throw new Error('لم يتم العثور على طابعة متوافقة. تأكد من أن الجهاز طابعة حرارية BLE.');

  const config: PrinterConfig = {
    deviceId: webDevice.id, deviceName,
    serviceUUID: found.serviceUUID, charUUID: found.charUUID,
    paperWidth: 58, encoding: 'utf8',
  };
  savePrinterConfig(config);
  onStatus?.('تم الاتصال بنجاح ✓');
  return config;
}

async function printBytesWeb(config: PrinterConfig, data: Uint8Array, onStatus?: (msg: string) => void): Promise<void> {
  const bt = webBT();
  if (!bt) throw new Error('Web Bluetooth غير متاح');

  onStatus?.('جاري الاتصال...');

  let webDevice: BluetoothDevice | undefined;
  try {
    const permitted = await bt.getDevices();
    webDevice = permitted.find(d => d.id === config.deviceId);
  } catch { /* getDevices() not in all Chrome versions */ }

  if (!webDevice) throw new Error('يجب إعادة الإقران — اضغط "بحث عن طابعة" مرة أخرى');
  if (!webDevice.gatt) throw new Error('GATT غير متاح');

  const server = await webDevice.gatt.connect();
  await sleep(300);
  onStatus?.('جاري الطباعة...');

  try {
    const svc  = await server.getPrimaryService(config.serviceUUID);
    const char = await svc.getCharacteristic(config.charUUID);
    const CHUNK = 512;
    for (let i = 0; i < data.length; i += CHUNK) {
      const slice = data.slice(i, i + CHUNK);
      if (char.properties.writeWithoutResponse) {
        await char.writeValueWithoutResponse(slice);
      } else {
        await char.writeValue(slice);
      }
      await sleep(20);
    }
  } finally {
    try { server.disconnect(); } catch { /* ignore */ }
  }
  onStatus?.('تمت الطباعة');
}

/* ─────────────────────────────────────────────────────────────────────
   NATIVE path — uses @capacitor-community/bluetooth-le
   ───────────────────────────────────────────────────────────────────── */

async function scanAndConnectNative(onStatus?: (msg: string) => void): Promise<PrinterConfig> {
  await ensureNativeInit();
  onStatus?.('جاري بحث عن الأجهزة...');

  let device: BleDevice;
  try {
    device = await BleClient.requestDevice({ optionalServices: ALL_SERVICE_UUIDS });
  } catch (e) {
    const raw = (e as Error).message ?? '';
    const lc  = raw.toLowerCase();
    if (lc.includes('cancel') || lc.includes('user') || raw === '') {
      throw new Error('تم إلغاء البحث — اضغط مجدداً واختر الطابعة من القائمة');
    }
    throw new Error(`فشل البحث: ${raw || 'خطأ غير معروف'}`);
  }

  onStatus?.(`جاري الاتصال بـ ${device.name || device.deviceId}...`);
  try { await BleClient.connect(device.deviceId, () => {}); }
  catch (e) { throw new Error(`فشل الاتصال: ${(e as Error).message}`); }

  await sleep(600);
  onStatus?.('جاري اكتشاف خدمات الطابعة...');

  let found: { serviceUUID: string; charUUID: string } | null = null;
  try {
    const services = await BleClient.getServices(device.deviceId);
    outer: for (const svc of services) {
      for (const ch of svc.characteristics) {
        if (ch.properties.write || ch.properties.writeWithoutResponse) {
          found = { serviceUUID: svc.uuid, charUUID: ch.uuid }; break outer;
        }
      }
    }
  } catch { /* fall through */ }

  if (!found) {
    for (const profile of PRINTER_PROFILES) {
      try {
        await BleClient.writeWithoutResponse(device.deviceId, profile.serviceUUID, profile.charUUID, new DataView(new ArrayBuffer(0)));
        found = { serviceUUID: profile.serviceUUID, charUUID: profile.charUUID };
        break;
      } catch { /* try next */ }
    }
  }

  await safeDisconnectNative(device.deviceId);
  if (!found) throw new Error('لم يتم العثور على طابعة متوافقة. تأكد من أن الجهاز طابعة حرارية BLE.');

  const config: PrinterConfig = {
    deviceId: device.deviceId, deviceName: device.name || device.deviceId,
    serviceUUID: found.serviceUUID, charUUID: found.charUUID,
    paperWidth: 58, encoding: 'utf8',
  };
  savePrinterConfig(config);
  onStatus?.('تم الاتصال بنجاح ✓');
  return config;
}

async function printBytesNative(config: PrinterConfig, data: Uint8Array, onStatus?: (msg: string) => void): Promise<void> {
  await ensureNativeInit();
  onStatus?.('جاري الاتصال...');

  try { await BleClient.connect(config.deviceId, () => {}); }
  catch (e) {
    const msg = (e as Error).message ?? '';
    if (!msg.toLowerCase().includes('already')) throw new Error(`فشل الاتصال بالطابعة: ${msg}`);
  }

  await sleep(300);
  onStatus?.('جاري الطباعة...');

  const CHUNK = 182;
  try {
    for (let i = 0; i < data.length; i += CHUNK) {
      const slice = data.slice(i, i + CHUNK);
      await BleClient.writeWithoutResponse(config.deviceId, config.serviceUUID, config.charUUID,
        new DataView(slice.buffer, slice.byteOffset, slice.byteLength));
      await sleep(20);
    }
  } finally {
    await sleep(400);
    await safeDisconnectNative(config.deviceId);
  }
  onStatus?.('تمت الطباعة');
}

/* ─────────────────────────────────────────────────────────────────────
   Public API — auto-selects web or native path
   ───────────────────────────────────────────────────────────────────── */

export async function scanAndConnect(onStatus?: (msg: string) => void): Promise<PrinterConfig> {
  return isNativePlatform() ? scanAndConnectNative(onStatus) : scanAndConnectWeb(onStatus);
}

export async function printBytes(config: PrinterConfig, data: Uint8Array, onStatus?: (msg: string) => void): Promise<void> {
  return isNativePlatform() ? printBytesNative(config, data, onStatus) : printBytesWeb(config, data, onStatus);
}

export async function testPrint(
  config: PrinterConfig,
  storeInfo: { storeName: string; phone?: string; address?: string; currency: string },
  onStatus?: (msg: string) => void,
): Promise<void> {
  const bytes = buildTestPage(storeInfo, { paperWidth: config.paperWidth, encoding: config.encoding });
  await printBytes(config, bytes, onStatus);
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
