'use client';
import AuthGate from '@/components/auth-gate';
import Header from '@/components/header';
import MedicalHistory from '@/components/sections/medical-history';

export default function MedicalHistoryPage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <MedicalHistory />
        </main>
      </div>
    </AuthGate>
  );
}
