import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey:            'AIzaSyBcqVb0Y9U5WaVq1wLsXFmX7ij6phEXBD0',
  authDomain:        'chanho-app.firebaseapp.com',
  projectId:         'chanho-app',
  storageBucket:     'chanho-app.firebasestorage.app',
  messagingSenderId: '435596240811',
  appId:             '1:435596240811:web:4ff6977847db370a9114ee',
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
