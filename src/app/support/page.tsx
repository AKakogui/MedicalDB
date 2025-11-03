'use client';
import AuthGate from '@/components/auth-gate';
import Header from '@/components/header';
import SupportForm from '@/components/sections/support-form';

export default function SupportPage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4">
          <SupportForm />
        </main>
      </div>
    </AuthGate>
  );
}
