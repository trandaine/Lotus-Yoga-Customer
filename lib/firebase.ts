import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Use singleton initialization to avoid re-initializing during fast refresh
const firebaseConfig = {
  apiKey: 'AIzaSyBr2Yp9mxD0FwxoKosecjQT9KDpw3-XNJc',
  authDomain: 'lotusyogaapplication.firebaseapp.com',
  projectId: 'lotusyogaapplication',
  storageBucket: 'lotusyogaapplication.firebasestorage.app',
  messagingSenderId: '864007661732',
  appId: '1:864007661732:web:31e684a6d57ba14b921e31',
};

function getFirebaseApp(): FirebaseApp {
  if (getApps().length) {
    return getApp();
  }
  return initializeApp(firebaseConfig);
}

export const firebaseApp = getFirebaseApp();
export const db = getFirestore(firebaseApp);

export default db;


