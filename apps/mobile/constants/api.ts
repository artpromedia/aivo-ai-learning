import { Platform } from 'react-native';

const DEV_API_BASE = Platform.select({
  ios: 'http://localhost',
  android: 'http://10.0.2.2',
  web: '',
  default: '',
});

const PROD_API_BASE = process.env.EXPO_PUBLIC_API_URL || '';

const API_BASE = __DEV__ ? DEV_API_BASE : PROD_API_BASE;

export const API = {
  IDENTITY: `${API_BASE}:3001`,
  BRAIN: `${API_BASE}:3002`,
  ASSESSMENT: `${API_BASE}:3003`,
  AI: `${API_BASE}:3004`,
  LEARNING: `${API_BASE}:3005`,
  TUTOR: `${API_BASE}:3006`,
  FAMILY: `${API_BASE}:3007`,
  ENGAGEMENT: `${API_BASE}:3008`,
  BILLING: `${API_BASE}:3009`,
  COMMS: `${API_BASE}:3010`,
  I18N: `${API_BASE}:3011`,
  INTEGRATIONS: `${API_BASE}:3012`,
  ADMIN: `${API_BASE}:3013`,
} as const;
