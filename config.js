import { Platform } from 'react-native';

const ENV = {
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY ?? '',
  // Add other environment variables here
};

// Validate that all required env vars are set
const validateEnv = () => {
  const required = ['GOOGLE_GEMINI_API_KEY'];
  const missing = required.filter(key => !ENV[key as keyof typeof ENV]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    );
  }
};

// Only validate in development
if (__DEV__) {
  validateEnv();
}

export default ENV;