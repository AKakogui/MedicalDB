
'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useUser, useMemoFirebase } from '@/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useState } from 'react';
import { Loader, Send, FileScan, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import Link from 'next/link';

export default function CaseDetailPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const caseDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'cases', id as string) : null),
    [firestore, id]
  );
  const { data: caseData, isLoading } = useDoc(caseDocRef);

  const [response, setResponse] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submitResponse() {
    if (!firestore || !caseData || !user || !response.trim()) return;
    setIsSubmitting(true);

    try {
      await updateDoc(doc(firestore, 'cases', id as string), {
        doctorResponse: {
          message: response,
          doctorId: user.uid,
          doctorName: user.displayName || 'Doctor',
          createdAt: serverTimestamp(),
        },
        status: 'answered',
      });
      toast({
        title: 'Response Submitted',
        description: 'Your opinion has been sent to the patient.',
      });
      setResponse('');
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not submit your response. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!caseData) {
    return <p className="p-8 text-center">Case not found.</p>;
  }

  return (
    <div className="p-6 space-y-4">
       <div className="flex justify-start">
        <Button asChild variant="outline">
          <Link href="/doctor-dashboard">
            <LayoutDashboard />
            Return to Dashboard
          </Link>
        </Button>
      </div>
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{caseData.subject}</CardTitle>
              <CardDescription>
                Submitted by patient: {caseData.patientId}
              </CardDescription>
            </div>
            <Badge
              variant={
                caseData.status === 'answered'
                  ? 'default'
                  : caseData.status === 'open'
                  ? 'secondary'
                  : 'outline'
              }
            >
              {caseData.status}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Patient's Concern</h3>
            <p className="text-muted-foreground whitespace-pre-line border p-4 rounded-md">
              {caseData.description}
            </p>
          </div>

          {caseData.imagingFileUrl && (
            <div>
              <h3 className="font-semibold mb-2">Attached Imaging</h3>
              <a
                href={caseData.imagingFileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <FileScan className="h-5 w-5" />
                <span>{caseData.imagingFileName || 'View Attached File'}</span>
              </a>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex-col items-start gap-4 border-t pt-6">
          <h3 className="font-semibold">Your Response</h3>
          {caseData.doctorResponse ? (
            <div className="w-full space-y-2 rounded-md border bg-muted p-4">
              <p className="whitespace-pre-line">
                {caseData.doctorResponse.message}
              </p>
              <p className="text-xs text-muted-foreground">
                You responded on{' '}
                {caseData.doctorResponse.createdAt
                  ? new Date(
                      caseData.doctorResponse.createdAt.seconds * 1000
                    ).toLocaleDateString()
                  : ''}
              </p>
            </div>
          ) : (
            <>
              <Textarea
                className="w-full"
                rows={6}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Write your medical analysis and opinion here..."
              />
              <div className="flex w-full justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Your response will be visible to the patient.
                </p>
                <Button
                  onClick={submitResponse}
                  disabled={isSubmitting || !response.trim()}
                >
                  {isSubmitting ? (
                    <Loader className="animate-spin" />
                  ) : (
                    <Send />
                  )}
                  Submit Response
                </Button>
              </div>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
