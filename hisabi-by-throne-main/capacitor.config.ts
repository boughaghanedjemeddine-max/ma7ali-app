import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.throne.ma7ali',
  appName: 'Ma7ali - محلي',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    // DEV ONLY: uncomment to enable live reload from phone
    // url: 'http://192.168.1.4:8080',
    // cleartext: true,
    allowNavigation: [],
  },
  android: {
    buildOptions: {
      keystorePath: 'release.keystore',
      keystoreAlias: 'ma7ali',
    },
    backgroundColor: '#0f1419',
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  ios: {
    backgroundColor: '#0f1419',
    contentInset: 'automatic',
    limitsNavigationsToAppBoundDomains: true,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#0f1419',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      iosSpinnerStyle: 'small',
      spinnerColor: '#1e3a5f',
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f1419',
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true,
      style: 'dark',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_launcher_foreground',
      iconColor: '#b8960c',
      sound: 'beep.wav',
    },
  },
};

export default config;
