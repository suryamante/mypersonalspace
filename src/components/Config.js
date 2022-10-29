import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber,
  signOut } from "firebase/auth";
import { getFirestore, collection, addDoc, doc, setDoc, getDoc, getDocs, query, limit,startAfter,
deleteDoc, orderBy, writeBatch, updateDoc, deleteField, where, startAt} from 'firebase/firestore';
import { getStorage, ref, uploadBytes, deleteObject, getDownloadURL} from 'firebase/storage';

const firebaseConfig = {
  
};

const app = initializeApp(firebaseConfig);
const auth = getAuth();
const db = getFirestore();
const storage = getStorage();
auth.languageCode = 'en';

export {app, auth, onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, signOut, db,
        collection, addDoc, doc, setDoc, getDoc, getDocs, query, limit, startAfter, storage, ref, uploadBytes,
      deleteDoc, deleteObject, getDownloadURL, orderBy, writeBatch, updateDoc, deleteField, where, startAt};
