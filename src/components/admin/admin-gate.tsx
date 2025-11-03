
'use client';

import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading, isAdmin } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isUserLoading) {
      return; // Wait until user status is resolved
    }
    if (!user) {
      router.replace('/login');
      return;
    }
    if (!isAdmin) {
      router.replace('/'); // Not an admin, redirect to home
    }
  }, [user, isUserLoading, isAdmin, router]);

  if (isUserLoading || !isAdmin) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">
          Verifying access...
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
