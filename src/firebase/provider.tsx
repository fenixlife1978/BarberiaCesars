'use client';
import { initializeFirebase } from '.';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// undefined: initial loading state
// null: user is not logged in
// User: user is logged in
const AuthContext = createContext<User | null | undefined>(undefined);

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const { auth, firestore } = initializeFirebase();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        // If user is logged in, listen to their user document for role changes
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserRole(docSnap.data().role || null);
          } else {
            setUserRole(null);
          }
        });
        return () => unsubscribeDoc(); // Cleanup doc listener on user change
      } else {
        setUserRole(null);
      }
    });

    return () => unsubscribeAuth(); // Cleanup auth listener
  }, []);

  return (
    <AuthContext.Provider value={user}>
      <UserRoleContext.Provider value={userRole}>
        {children}
      </UserRoleContext.Provider>
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  return useContext(AuthContext);
};

const UserRoleContext = createContext<string | null>(null);

export const useUserRole = () => {
    return useContext(UserRoleContext);
}
