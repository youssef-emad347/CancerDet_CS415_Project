import { doc, getDoc, setDoc, updateDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { UserProfile, DoctorProfile, PatientProfile } from '@/types/user';

export const createUserProfile = async (userProfile: UserProfile | DoctorProfile | PatientProfile) => {
  try {
    await setDoc(doc(db, 'users', userProfile.uid), userProfile);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (uid: string, data: Partial<UserProfile | DoctorProfile | PatientProfile>) => {
  try {
    const docRef = doc(db, 'users', uid);
    await updateDoc(docRef, data);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

export const getUserByDoctorCode = async (code: string): Promise<UserProfile | null> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('doctorCode', '==', code), limit(1));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error finding doctor by code:', error);
    throw error;
  }
};
