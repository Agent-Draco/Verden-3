import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.verdenmaps.app',
  appName: 'Verden Maps',
  webDir: '.output/public', // TanStack Start output directory
  android: {
    path: '../verden-android'
  }
};

export default config;
