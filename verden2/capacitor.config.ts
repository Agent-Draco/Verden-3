import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.verdenmaps.app',
  appName: 'Verden Maps',
  webDir: '.output/public', // TanStack Start output directory
  backgroundColor: '#00000000',
  android: {
    path: '../verden-android',
    backgroundColor: '#00000000'
  }
};

export default config;
