import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "your-app-id"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export interface CalTrackState {
  targetCalories: number;
  mealHistory: any[]; // Use proper types from app.component
  customIngredients: any[];
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private user: User | null = null;
  private isInitialized = false;

  constructor() {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      await signInAnonymously(auth);
      onAuthStateChanged(auth, (user) => {
        this.user = user;
        this.isInitialized = true;
      });
    } catch (error) {
      console.error('Firebase auth error:', error);
    }
  }

  async saveState(state: CalTrackState): Promise<void> {
    if (!this.user || !this.isInitialized) {
      console.warn('Firebase not ready, skipping save');
      return;
    }

    try {
      await setDoc(doc(db, 'users', this.user.uid), state);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }
  }

  async loadState(): Promise<CalTrackState | null> {
    if (!this.user || !this.isInitialized) {
      console.warn('Firebase not ready, skipping load');
      return null;
    }

    try {
      const docSnap = await getDoc(doc(db, 'users', this.user.uid));
      if (docSnap.exists()) {
        return docSnap.data() as CalTrackState;
      }
    } catch (error) {
      console.error('Error loading from Firebase:', error);
    }
    return null;
  }

  get isReady(): boolean {
    return this.isInitialized && !!this.user;
  }
}