import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.activitylink.app',
  appName: 'ActivityLink',
  webDir: '.output/public',
  server: {
    url: 'https://activitylink-connect-main.vercel.app',
    cleartext: true,
    allowNavigation: [
      "*"
    ]
  }
};

export default config;
