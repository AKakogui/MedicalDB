'use client';

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useUser } from '@/firebase';
import { format } from 'date-fns';

type CaseRecord = {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt?: { seconds: number; nanoseconds: number };
  patientId: string;
};

export default function MyCases() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();


  const casesQuery = useMemoFirebase(
    () =>
      firestore && currentUser
        ? query(collection(firestore, 'cases'), where('patientId', '==', currentUser.uid))
        : null,
    [firestore, currentUser]
  );

  const { data: cases, isLoading } = useCollection<CaseRecord>(casesQuery);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return <p className="text-muted-foreground">You haven’t submitted any cases yet.</p>;
  }

  return (
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
            <TableCell className="max-w-[400px] truncate">{c.description}</TableCell>
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
                ? format(new Date(c.createdAt.seconds * 1000), 'MMM d, yyyy')
                : '—'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
