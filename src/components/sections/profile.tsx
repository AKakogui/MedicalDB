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
import { Loader } from 'lucide-react';
import { useFirestore, useMemoFirebase, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useAuth } from '@/firebase/auth-context'; // adjust if your auth context path differs
import { format } from 'date-fns';

type CaseRecord = {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt?: { seconds: number; nanoseconds: number };
  patientId: string;
};

export default function ProfilePage() {
  const firestore = useFirestore();
  const { currentUser } = useAuth(); // currentUser.uid should match patientId
  const casesQuery = useMemoFirebase(
    () =>
      firestore && currentUser
        ? query(collection(firestore, 'cases'), where('patientId', '==', currentUser.uid))
        : null,
    [firestore, currentUser]
  );
  const { data: cases, isLoading } = useCollection<CaseRecord>(casesQuery);

  return (
    <Card className="bg-neutral-900 text-white">
      <CardHeader>
        <CardTitle className="text-2xl">My Profile</CardTitle>
        <CardDescription className="text-gray-400">
          View your account details and submitted cases.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {currentUser && (
          <div className="mb-6">
            <p>
              <strong>Email:</strong> {currentUser.email}
            </p>
            <p>
              <strong>UID:</strong> {currentUser.uid}
            </p>
          </div>
        )}

        <h2 className="text-xl font-semibold mb-4">My Cases</h2>

        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader className="animate-spin" />
          </div>
        ) : cases && cases.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subject</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.subject}</TableCell>
                  <TableCell>{c.description}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === 'open'
                          ? 'default'
                          : c.status === 'closed'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {c.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {c.createdAt
                      ? format(
                          new Date(c.createdAt.seconds * 1000),
                          'MMM d, yyyy h:mm a'
                        )
                      : '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-gray-400">You haven’t submitted any cases yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
