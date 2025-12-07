import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { getUserProfile, createUserProfile } from '../services/user';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
           // Ensure token is fresh
           await firebaseUser.getIdToken();
           // 1. Try to fetch profile
           let profile = await getUserProfile(firebaseUser.uid);
           console.log(profile)
           
           // 2. If no profile exists (new user race condition or first login), create default
           if (!profile) {
               console.log("No profile found, creating default...");
               const newProfile: any = {
                   uid: firebaseUser.uid,
                   email: firebaseUser.email!,
                   displayName: firebaseUser.displayName || 'User',
                   role: 'patient', // Default to patient
                   createdAt: Date.now(),
                   medicalHistory: []
               };
               await createUserProfile(newProfile);
               profile = newProfile;
           }

           if (profile) {
             setUserProfile(profile);
           }
        } catch (error) {
          console.error("Failed to fetch/create user profile", error);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

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
    // Scenario 3: Logged in (Firebase) but userProfile failed to load and not in auth group -> Force logout/redirect to login
    else if (user && !userProfile && !inAuthGroup) {
        console.warn("User logged in but profile not found. Forcing logout.");
        firebaseSignOut(auth); // Force sign out if profile is missing
        router.replace('/(auth)/login');
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
