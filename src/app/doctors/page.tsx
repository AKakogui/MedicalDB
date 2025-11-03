'use client';
import AuthGate from '@/components/auth-gate';
import Header from '@/components/header';
import DoctorDirectory from '@/components/sections/doctor-directory';

export default function DoctorsPage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <DoctorDirectory />
        </main>
      </div>
    </AuthGate>
  );
}
