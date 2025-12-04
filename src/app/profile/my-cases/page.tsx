'use client';

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function MyCasesPage() {
  const { user } = useUser();
  const firestore = useFirestore();

  const casesQuery = useMemoFirebase(
    () =>
      user && firestore
        ? query(
            collection(firestore, 'cases'),
            where('patientId', '==', user.uid)
          )
        : null,
    [firestore, user]
  );

  const { data: cases, isLoading } = useCollection(casesQuery);

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>My Second Opinion Cases</CardTitle>
      </CardHeader>

      <CardContent>
        {isLoading && <p>Loading...</p>}

        {!isLoading && cases?.length === 0 && (
          <p className="text-muted-foreground">You haven't submitted any cases yet.</p>
        )}

        <div className="space-y-4">
          {cases?.map((c) => (
            <Link key={c.id} href={`/profile/my-cases/${c.id}`}>
              <div className="border p-4 rounded-lg cursor-pointer hover:bg-muted/20 transition">
                <h3 className="text-lg font-semibold">{c.subject}</h3>
                <p className="text-sm text-muted-foreground">
                  Submitted{' '}
                  {c.createdAt
                    ? formatDistanceToNow(c.createdAt.toDate(), { addSuffix: true })
                    : 'N/A'}
                </p>

                <Badge className="mt-2">{c.status}</Badge>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
