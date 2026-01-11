'use client';
import { initializeFirebase } from '.';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
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

    // Use onIdTokenChanged to get the latest user state with custom claims
    const unsubscribeAuth = onIdTokenChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        // Force refresh the token to make sure we have the latest claims.
        const idTokenResult = await user.getIdTokenResult(true);
        const roleFromClaim = idTokenResult.claims.role as string || null;
        setUserRole(roleFromClaim);

        // Optional: you can still listen to the document for other profile info if needed,
        // but the primary role should come from the claim for security.
        const userDocRef = doc(firestore, 'users', user.uid);
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
             // You could set other profile data here
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
