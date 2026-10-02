
import { SavedScan, UserProfile, SkinAnalysisResult, SmartShelfItem } from '../types';
import { db, auth } from './firebase';
import { collection, doc, setDoc, getDoc, getDocs, query, where, orderBy, deleteDoc, addDoc, limit } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Helper to convert Base64 to Blob
const base64ToBlob = async (base64: string): Promise<Blob> => {
  try {
    const response = await fetch(base64);
    return await response.blob();
  } catch (e) {
    console.warn("Failed to fetch image blob, returning empty blob", e);
    const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
    const fallbackResponse = await fetch(fallbackBase64);
    return await fallbackResponse.blob();
  }
};

// Helper to remove undefined values from an object
const cleanUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(v => cleanUndefined(v));
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc, key) => {
      const value = cleanUndefined(obj[key]);
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {} as any);
  }
  return obj;
};

export const saveScan = async (analysis: SkinAnalysisResult, imageBase64: string): Promise<SavedScan> => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');

  const imageBlob = await base64ToBlob(imageBase64);
  
  const scanData = cleanUndefined({
    userId: user.uid,
    date: new Date().toISOString(),
    timestamp: Date.now(),
    score: analysis.healthScore,
    imageBase64: imageBase64,
    analysis: analysis
  });

  try {
    const docRef = await addDoc(collection(db, 'scans'), scanData);
    return {
      id: docRef.id,
      date: scanData.date,
      timestamp: scanData.timestamp,
      score: scanData.score,
      imageBlob: imageBlob,
      analysis: scanData.analysis,
      thumbnailUrl: imageBase64
    };
  } catch (e) {
    handleFirestoreError(e, OperationType.CREATE, 'scans');
    throw e;
  }
};

export const getAllScans = async (): Promise<SavedScan[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'scans'), 
    where('userId', '==', user.uid),
    orderBy('timestamp', 'desc')
  );

  try {
    const querySnapshot = await getDocs(q);
    
    const scans = await Promise.all(querySnapshot.docs.map(async (doc) => {
      const data = doc.data();
      let imageBlob;
      let thumbnailUrl = data.imageBase64;
      try {
        const response = await fetch(data.imageBase64);
        imageBlob = await response.blob();
      } catch (e) {
        console.warn("Failed to fetch image blob, returning empty blob", e);
        const fallbackBase64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        const fallbackResponse = await fetch(fallbackBase64);
        imageBlob = await fallbackResponse.blob();
        thumbnailUrl = fallbackBase64;
      }
      return {
        id: doc.id,
        date: data.date,
        timestamp: data.timestamp,
        score: data.score,
        imageBlob,
        analysis: data.analysis,
        thumbnailUrl
      };
    }));

    return scans;
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'scans');
    throw e;
  }
};

export const getHistoricalScansAnalysis = async (limitCount: number = 5): Promise<{ timestamp: number, analysis: SkinAnalysisResult, score: number }[]> => {
  const user = auth.currentUser;
  if (!user) return [];

  const q = query(
    collection(db, 'scans'), 
    where('userId', '==', user.uid),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return [];

    return querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        timestamp: data.timestamp,
        analysis: data.analysis,
        score: data.score
      };
    });
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'scans');
    throw e;
  }
};

export const getLatestScanAnalysis = async (): Promise<{ timestamp: number, analysis: SkinAnalysisResult } | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const q = query(
    collection(db, 'scans'), 
    where('userId', '==', user.uid),
    orderBy('timestamp', 'desc'),
    limit(1)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;

    const firstDoc = querySnapshot.docs[0].data();
    return {
      timestamp: firstDoc.timestamp,
      analysis: firstDoc.analysis
    };
  } catch (e) {
    handleFirestoreError(e, OperationType.LIST, 'scans');
    throw e;
  }
};

export const deleteScan = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'scans', id));
  } catch (e) {
    handleFirestoreError(e, OperationType.DELETE, `scans/${id}`);
    throw e;
  }
};

// User Profile Management
export const saveUserProfile = async (profile: UserProfile): Promise<void> => {
  const user = auth.currentUser;
  if (!user) return;

  const profileData = cleanUndefined({
    name: profile.name,
    email: profile.email,
    joinedDate: profile.joinedDate,
    avatarUrl: profile.avatarUrl,
    selfReportedSkinType: profile.selfReportedSkinType,
    medicalProfile: profile.medicalProfile,
    watchlist: profile.watchlist,
    shelf: profile.shelf
  });

  try {
    await setDoc(doc(db, 'users', user.uid), profileData, { merge: true });
  } catch (e) {
    handleFirestoreError(e, OperationType.UPDATE, `users/${user.uid}`);
    throw e;
  }
};

export const getUserProfile = async (): Promise<UserProfile | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  const docRef = doc(db, 'users', user.uid);
  try {
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name,
        email: data.email,
        joinedDate: data.joinedDate,
        avatarUrl: data.avatarUrl,
        selfReportedSkinType: data.selfReportedSkinType,
        medicalProfile: data.medicalProfile,
        watchlist: data.watchlist,
        shelf: data.shelf
      };
    } else {
      return null;
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, `users/${user.uid}`);
    throw e;
  }
};

export const clearUserProfile = async (): Promise<void> => {
  try {
    await auth.signOut();
  } catch (e) {
    console.error("Error signing out:", e);
  }
};


