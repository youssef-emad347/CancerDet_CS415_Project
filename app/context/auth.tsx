import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, onSnapshot, setDoc } from 'firebase/firestore'; 
import { auth, db } from '../config/firebase';
import { UserProfile, UserRole } from '../types/user';
import { useRouter, useSegments } from 'expo-router';

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  role: UserRole | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  role: null,
  isLoading: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  // 1. Monitor Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
          setUserProfile(null);
          setIsLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // 2. Monitor Profile Data (Real-time)
  useEffect(() => {
     if (!user) return;

     const userRef = doc(db, 'users', user.uid);
     const unsubscribeProfile = onSnapshot(userRef, async (docSnap) => {
         if (docSnap.exists()) {
             setUserProfile(docSnap.data() as UserProfile);
         } else {
             // Profile missing? Create default.
             console.log("No profile found, creating default...");
             const newProfile: any = {
                 uid: user.uid,
                 email: user.email!,
                 displayName: user.displayName || 'User',
                 role: 'patient',
                 createdAt: Date.now(),
                 medicalHistory: [],
                 stats: { patientCount: 0, pendingReports: 0 } // Initialize stats
             };
             await setDoc(userRef, newProfile);
             // Snapshot will fire again after setDoc, updating state.
         }
         setIsLoading(false);
     }, (error) => {
         console.error("Profile listener error:", error);
         setIsLoading(false);
     });

     return () => unsubscribeProfile();
  }, [user]);

  // Protected Routes Logic
  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    
    // Scenario 1: Not logged in and not in auth group -> Redirect to login
    if (!user && !inAuthGroup) {
      router.replace('/(auth)/login');
    } 
    // Scenario 2: Logged in and in auth group -> Redirect to home IF userProfile is loaded
    else if (user && userProfile && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [user, userProfile, segments, isLoading]);

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setUserProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userProfile,
        role: userProfile?.role || null,
        isLoading,
        signOut,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

