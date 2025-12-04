'use client';

import { useParams } from 'next/navigation';
import { useDocument, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Loader, FileScan, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CaseDetailsPage() {
  const firestore = useFirestore();
  const { id } = useParams();

  const docRef = useMemoFirebase(
    () => (firestore && id ? doc(firestore, 'cases', id as string) : null),
    [firestore, id]
  );

  const { data: caseData, isLoading } = useDocument(docRef);

  if (isLoading)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader className="animate-spin" />
      </div>
    );

  if (!caseData)
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Case not found or you do not have permission to view it.</p>
      </div>
    );

  const {
    subject,
    description,
    imagingFileUrl,
    imagingFileName,
    doctorResponse,
    createdAt,
    status,
  } = caseData;

  return (
    <div className="flex justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">{subject}</CardTitle>
          <CardDescription>
            Created on{' '}
            {createdAt?.toDate
              ? format(createdAt.toDate(), 'PP')
              : 'Unknown date'}
          </CardDescription>

          <Badge
            variant={
              status === 'answered'
                ? 'default'
                : status === 'open'
                ? 'secondary'
                : 'outline'
            }
            className="mt-2"
          >
            {status}
          </Badge>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* --- Description --- */}
          <div>
            <h3 className="font-semibold mb-1">Your Concern</h3>
            <p className="text-muted-foreground whitespace-pre-line border p-4 rounded-md">
              {description}
            </p>
          </div>

          {/* --- Uploaded Image --- */}
          {imagingFileUrl && (
            <div>
              <h3 className="font-semibold mb-1">Attached Imaging</h3>
              <a
                href={imagingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <FileScan />
                <span>{imagingFileName || 'View attached file'}</span>
              </a>
            </div>
          )}

          {/* --- Doctor Response --- */}
          <div className="pt-4 border-t">
            <h3 className="font-semibold mb-2">Doctor's Response</h3>

            {doctorResponse ? (
              <div className="p-4 rounded-md border bg-muted">
                <p className="whitespace-pre-line">{doctorResponse.message}</p>
                {doctorResponse.createdAt?.toDate && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Responded by {doctorResponse.doctorName || 'a doctor'} on{' '}
                    {format(doctorResponse.createdAt.toDate(), 'PPpp')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">
                A doctor has not responded yet. You will be notified when they
                do.
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button asChild>
            <Link href="/home">
              <Home />
              Return to Home
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
