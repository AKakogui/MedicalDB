
'use client';
import AdminGate from '@/components/admin/admin-gate';
import Header from '@/components/header';
import UserManagement from '@/components/sections/user-management';

export default function AdminPage() {
  return (
    <AdminGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <UserManagement />
        </main>
      </div>
    </AdminGate>
  );
}
