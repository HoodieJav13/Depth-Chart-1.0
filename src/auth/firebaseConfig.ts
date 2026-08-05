export interface FirebaseWebConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  appId?: string;
}

const optionalAppId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

export const firebaseConfig: FirebaseWebConfig = {
  apiKey: "AIzaSyDXwsb3V0PjXbU9sR9cvllmXFZ7IaMpomY",
  authDomain: "depth-chart-1d8be.firebaseapp.com",
  projectId: "depth-chart-1d8be",
  storageBucket: "depth-chart-1d8be.firebasestorage.app",
  ...(optionalAppId ? { appId: optionalAppId } : {}),
};
