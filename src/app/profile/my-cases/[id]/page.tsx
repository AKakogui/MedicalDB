'use client';

import { useParams } from 'next/navigation';
import { useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function PatientCaseDetail() {
  const { id } = useParams();
  const firestore = useFirestore();

  const caseDocRef = useMemoFirebase(
    () => (firestore ? doc(firestore, 'cases', id as string) : null),
    [firestore, id]
  );

  const { data: caseData, isLoading } = useDoc(caseDocRef);

  if (isLoading || !caseData) return <p>Loading...</p>;

  return (
    <Card className="p-4">
      <CardHeader>
        <CardTitle>Case Details</CardTitle>
      </CardHeader>

      <CardContent>
        <p><strong>Subject:</strong> {caseData.subject}</p>
        <p><strong>Description:</strong> {caseData.description}</p>

        {caseData.imageUrl && (
          <div className="my-4">
            <img
              src={caseData.imageUrl}
              alt="Uploaded"
              className="border rounded-lg"
            />
          </div>
        )}

        <h3 className="text-lg font-semibold mt-6">Doctor’s Response:</h3>
        {caseData.doctorOpinion ? (
          <p className="bg-muted p-3 rounded-lg mt-2">{caseData.doctorOpinion}</p>
        ) : (
          <p className="text-muted-foreground">Your case is still under review.</p>
        )}
      </CardContent>
    </Card>
  );
}
