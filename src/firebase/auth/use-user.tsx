
'use client';

import { useContext } from 'react';
import { User } from 'firebase/auth';
import { FirebaseContext } from '@/firebase/provider';

// The return type for the useUser hook, providing a clear interface.
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
  isAdmin: boolean;
  role: 'admin' | 'patient' | 'doctor' | null;
}

/**
 * The primary hook for accessing the current user's authentication state.
 * It provides the user object, loading status, any errors, and admin status.
 * This hook must be used within a component tree wrapped by `FirebaseProvider`.
 *
 * @returns {UserHookResult} The current authentication state.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);

  // This ensures that any component using this hook is a child of FirebaseProvider.
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }

  const { user, isUserLoading, userError, isAdmin, role } = context;
  return { user, isUserLoading, userError, isAdmin, role };
};
