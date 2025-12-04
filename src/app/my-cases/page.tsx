'use client';
import AuthGate from '@/components/auth-gate';
import Header from '@/components/header';
import MyCases from '@/components/sections/my-cases';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function MyCasesPage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>My Cases</CardTitle>
              <CardDescription>
                View your submitted medical cases and their status.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MyCases />
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  );
}
