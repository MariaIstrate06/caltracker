import { Injectable } from '@angular/core';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';

// TODO: Replace with your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAgMi6RtZMfEM-DWfGLrqFoKIdSDHpl1g4",
  authDomain: "caltrack-f3703.firebaseapp.com",
  projectId: "caltrack-f3703",
  storageBucket: "caltrack-f3703.firebasestorage.app",
  messagingSenderId: "538366371002",
  appId: "1:538366371002:web:de4372ee7ef36ed95ece83",
  measurementId: "G-XQ9ZCTZXBY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export interface CalTrackState {
  targetCalories: number;
  mealHistory: any[];
  customIngredients: any[];
}

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private user: User | null = null;
  private isInitialized = false;
  private selectedProfile: string | null = null;
  private initPromise: Promise<void>;
  private resolveInit!: () => void;

  constructor() {
    this.initPromise = new Promise<void>((resolve) => {
      this.resolveInit = resolve;
    });
    this.selectedProfile = localStorage.getItem('selectedProfile') ?? 'default';
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      await signInAnonymously(auth);
      onAuthStateChanged(auth, (user) => {
        this.user = user;
        this.isInitialized = true;
        this.resolveInit();
      });
    } catch (error) {
      console.error('Firebase auth error:', error);
    }
  }

  private async waitUntilReady() {
    await this.initPromise;
  }

  private getActiveProfile() {
    const storedProfile = localStorage.getItem('selectedProfile');
    const activeProfile = this.selectedProfile ?? storedProfile ?? 'default';
    if (!this.selectedProfile || this.selectedProfile !== activeProfile) {
      this.selectedProfile = activeProfile;
      localStorage.setItem('selectedProfile', activeProfile);
    }
    return activeProfile;
  }

  setSelectedProfile(profile: string) {
    this.selectedProfile = profile;
    localStorage.setItem('selectedProfile', profile);
  }

  getSelectedProfile(): string | null {
    if (!this.selectedProfile) {
      this.selectedProfile = localStorage.getItem('selectedProfile');
    }
    return this.selectedProfile;
  }

  async getAvailableProfiles(): Promise<string[]> {
    await this.waitUntilReady();
    if (!this.isInitialized) return [];
    try {
      const querySnapshot = await getDocs(collection(db, 'profiles'));
      return querySnapshot.docs.map(doc => doc.id);
    } catch (error) {
      console.error('Error getting profiles:', error);
      return [];
    }
  }

  async createProfile(profileName: string): Promise<void> {
    await this.waitUntilReady();
    if (!this.isInitialized) return;
    try {
      const emptyState: CalTrackState = {
        targetCalories: 2000,
        mealHistory: [],
        customIngredients: []
      };
      await setDoc(doc(db, 'profiles', profileName), emptyState);
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  }

  async saveState(state: CalTrackState): Promise<void> {
    await this.waitUntilReady();
    if (!this.user || !this.isInitialized) {
      console.warn('Firebase not ready, skipping save');
      return;
    }

    try {
      const profile = this.getActiveProfile();
      await setDoc(doc(db, 'profiles', profile), state);
    } catch (error) {
      console.error('Error saving to Firebase:', error);
    }
  }

  async loadState(): Promise<CalTrackState | null> {
    await this.waitUntilReady();
    if (!this.user || !this.isInitialized) {
      console.warn('Firebase not ready, skipping load');
      return null;
    }

    try {
      const profile = this.getActiveProfile();
      const docSnap = await getDoc(doc(db, 'profiles', profile));
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