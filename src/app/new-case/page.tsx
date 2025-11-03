'use client';
import AuthGate from '@/components/auth-gate';
import Header from '@/components/header';
import NewCaseForm from '@/components/sections/new-case-form';

export default function NewCasePage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col items-center justify-start gap-4 p-4 md:gap-8 md:p-8">
          <NewCaseForm />
        </main>
      </div>
    </AuthGate>
  );
}
