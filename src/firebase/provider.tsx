'use client';
import { initializeFirebase } from '.';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

const FirebaseContext = createContext<User | null>(null);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Initialize Firebase and get the auth instance
    const { auth } = initializeFirebase();

    // Set up the authentication state listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseContext.Provider value={user}>
      {children}
    </FirebaseContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(FirebaseContext);
};
