/**
 * notifications.ts
 * Cross-platform notification helper.
 * – Native (Capacitor): uses @capacitor/local-notifications with
 *   proper Android channel setup for Android 8+
 * – Web / PWA: falls back to the browser Notifications API
 */

import { Capacitor } from '@capacitor/core';

let _capacitorNotifications: typeof import('@capacitor/local-notifications').LocalNotifications | null =
  null;
let _channelCreated = false;

const CHANNEL_ID = 'ma7ali-alerts';

/** Lazy-load the Capacitor plugin only when running natively. */
async function getPlugin() {
  if (!Capacitor.isNativePlatform()) return null;
  if (!_capacitorNotifications) {
    const mod = await import('@capacitor/local-notifications');
    _capacitorNotifications = mod.LocalNotifications;
  }
  return _capacitorNotifications;
}

/**
 * Creates a notification channel (required on Android 8+).
 * Safe to call multiple times – creation is idempotent.
 */
async function ensureChannel(plugin: typeof import('@capacitor/local-notifications').LocalNotifications) {
  if (_channelCreated) return;
  try {
    await plugin.createChannel({
      id: CHANNEL_ID,
      name: 'تنبيهات Ma7ali',
      description: 'تنبيهات المخزون والديون',
      importance: 4,       // HIGH
      visibility: 1,       // PUBLIC
      sound: 'beep.wav',
      vibration: true,
      lights: true,
      lightColor: '#b8960c',
    });
    _channelCreated = true;
  } catch {
    // Channel creation might not be supported on all devices; continue silently
    _channelCreated = true;
  }
}

// Id counter (wrap at 10_000 to avoid clashes)
let _nextId = Math.floor(Math.random() * 1000) + 1;
const nextId = () => (_nextId = (_nextId % 10_000) + 1);

/** Request notification permission (idempotent, safe to call multiple times). */
export async function requestNotificationPermission(): Promise<boolean> {
  const plugin = await getPlugin();

  if (plugin) {
    await ensureChannel(plugin);
    const { display } = await plugin.requestPermissions();
    return display === 'granted';
  }

  // Web fallback
  if ('Notification' in window) {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

export interface NotificationPayload {
  title: string;
  body: string;
}

/** Send an immediate local notification. */
export async function sendNotification({ title, body }: NotificationPayload) {
  const plugin = await getPlugin();

  if (plugin) {
    await ensureChannel(plugin);
    const { display } = await plugin.checkPermissions();
    if (display !== 'granted') return;

    await plugin.schedule({
      notifications: [
        {
          id: nextId(),
          title,
          body,
          channelId: CHANNEL_ID,
          schedule: { at: new Date(Date.now() + 300) }, // ~0.3s delay
          sound: 'beep.wav',
          // smallIcon omitted → uses the value set in capacitor.config.ts
          // which resolves to ic_launcher_foreground
        },
      ],
    });
    return;
  }

  // Web fallback
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icons/icon-192x192.png' });
  }
}

// ─── Domain helpers ────────────────────────────────────────────────────────────

export interface LowStockProduct {
  name: string;
  quantity: number;
}

/**
 * Sends a grouped low-stock notification for all products below threshold.
 * Called after every sale is recorded.
 */
export async function notifyLowStock(products: LowStockProduct[]) {
  if (products.length === 0) return;

  const title = `⚠️ تنبيه مخزون منخفض (${products.length} منتج)`;
  const body =
    products.length === 1
      ? `${products[0].name}: ${products[0].quantity} قطعة متبقية`
      : products
          .slice(0, 3)
          .map((p) => `${p.name}: ${p.quantity}`)
          .join(' | ') + (products.length > 3 ? ' ...' : '');

  await sendNotification({ title, body });
}
