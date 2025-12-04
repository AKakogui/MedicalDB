'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Case } from '@/lib/types';
import { collection, query } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { Loader } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import AuthGate from '@/components/auth-gate';

function DoctorDashboardContent() {
  const firestore = useFirestore();
  const casesQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'cases')) : null),
    [firestore]
  );
  const { data: cases, isLoading } = useCollection<Case>(casesQuery);

  const getStatusVariant = (status: Case['status']) => {
    switch (status) {
      case 'open':
        return 'secondary';
      case 'answered':
        return 'default';
      case 'closed':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle>Patient Cases</CardTitle>
            <CardDescription>
              Review and manage second opinion requests.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Case Subject</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {cases && cases.length > 0 ? (
                    cases.map((caseItem) => (
                      <TableRow key={caseItem.id}>
                        <TableCell className="font-medium">
                          {caseItem.subject}
                        </TableCell>

                        <TableCell>
                          {caseItem.createdAt
                            ? formatDistanceToNow(
                                caseItem.createdAt.toDate(),
                                {
                                  addSuffix: true,
                                }
                              )
                            : 'N/A'}
                        </TableCell>

                        <TableCell>
                          <Badge variant={getStatusVariant(caseItem.status)}>
                            {caseItem.status}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-right">
                          <Button asChild variant="outline" size="sm">
                            <Link href={`/doctor-dashboard/${caseItem.id}`}>
                              View Details
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        className="text-center text-muted-foreground"
                      >
                        No cases found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function DoctorDashboard() {
  return (
    <AuthGate>
      <DoctorDashboardContent />
    </AuthGate>
  );
}
