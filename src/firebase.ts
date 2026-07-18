import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc, 
  Firestore,
  writeBatch
} from 'firebase/firestore';
import { Project } from './types';

export interface FirebaseConfigDetails {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Key for local storage
const CONFIG_LOCAL_STORAGE_KEY = 'clickdo_firebase_custom_config';

/**
 * Get active Firebase Configuration.
 * Tries local storage first (for interactive custom configuration),
 * then falls back to VITE_ environment variables.
 */
export function getFirebaseConfig(): FirebaseConfigDetails | null {
  // Check local storage override first
  const stored = localStorage.getItem(CONFIG_LOCAL_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed && parsed.apiKey && parsed.projectId) {
        return parsed as FirebaseConfigDetails;
      }
    } catch (e) {
      console.warn('Failed to parse local stored firebase config', e);
    }
  }

  // Your web app's Firebase configuration
  const envConfig: FirebaseConfigDetails = {
    apiKey: 'AIzaSyCOCq4VipzaxPdu9Fp3_hKzgxZlzqupSl8',
    authDomain: 'click-do-9f5ad.firebaseapp.com',
    projectId: 'click-do-9f5ad',
    storageBucket: 'click-do-9f5ad.firebasestorage.app',
    messagingSenderId: '955660995711',
    appId: '1:955660995711:web:a2981fdfe8d6bba6f4034a',
  };

  return envConfig;
}

/**
 * Save user custom configuration to local storage
 */
export function saveCustomFirebaseConfig(config: FirebaseConfigDetails) {
  localStorage.setItem(CONFIG_LOCAL_STORAGE_KEY, JSON.stringify(config));
}

/**
 * Clear custom configuration from local storage
 */
export function clearCustomFirebaseConfig() {
  localStorage.removeItem(CONFIG_LOCAL_STORAGE_KEY);
}

let activeApp: FirebaseApp | null = null;
let activeDb: Firestore | null = null;

/**
 * Get initialized Firebase app and Firestore DB
 */
export function getFirebaseInstance(): { app: FirebaseApp; db: Firestore } | null {
  const config = getFirebaseConfig();
  if (!config) return null;

  try {
    if (getApps().length === 0) {
      activeApp = initializeApp(config);
    } else {
      activeApp = getApp();
    }
    activeDb = getFirestore(activeApp);
    return { app: activeApp, db: activeDb };
  } catch (error) {
    console.error('Firebase initialization failed:', error);
    return null;
  }
}

/**
 * Fetch all projects from Firestore.
 */
export async function fetchProjectsFromFirebase(): Promise<Project[]> {
  const instance = getFirebaseInstance();
  if (!instance) {
    throw new Error('Firebase is not configured or failed to initialize.');
  }

  try {
    const querySnapshot = await getDocs(collection(instance.db, 'projects'));
    const projectsList: Project[] = [];
    querySnapshot.forEach((docSnap) => {
      projectsList.push(docSnap.data() as Project);
    });
    return projectsList;
  } catch (error) {
    console.error('Error fetching projects from Firebase:', error);
    throw error;
  }
}

/**
 * Save a single project to Firestore.
 */
export async function saveProjectToFirebase(project: Project): Promise<void> {
  const instance = getFirebaseInstance();
  if (!instance) return;

  try {
    await setDoc(doc(instance.db, 'projects', project.id), project);
  } catch (error) {
    console.error(`Error saving project ${project.id} to Firebase:`, error);
    throw error;
  }
}

/**
 * Batch save multiple projects to Firestore.
 */
export async function saveAllProjectsToFirebase(projects: Project[]): Promise<void> {
  const instance = getFirebaseInstance();
  if (!instance) return;

  try {
    const batch = writeBatch(instance.db);
    projects.forEach((proj) => {
      const docRef = doc(instance.db, 'projects', proj.id);
      batch.set(docRef, proj);
    });
    await batch.commit();
  } catch (error) {
    console.error('Error batch saving projects to Firebase:', error);
    throw error;
  }
}

/**
 * Delete a project from Firestore.
 */
export async function deleteProjectFromFirebase(projectId: string): Promise<void> {
  const instance = getFirebaseInstance();
  if (!instance) return;

  try {
    await deleteDoc(doc(instance.db, 'projects', projectId));
  } catch (error) {
    console.error(`Error deleting project ${projectId} from Firebase:`, error);
    throw error;
  }
}
