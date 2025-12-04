'use client';

import { useState } from 'react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import {
  collection,
  doc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Loader, FileScan } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type CaseRecord = {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'answered' | 'closed' | string;
  createdAt?: { seconds: number; nanoseconds: number };
  patientId: string;
  imagingFileUrl?: string;
  opinionText?: string;
  doctorId?: string;
  answeredAt?: { seconds: number; nanoseconds: number };
};

function formatDate(ts?: { seconds: number; nanoseconds: number }) {
  if (!ts) return '—';
  return format(new Date(ts.seconds * 1000), 'PPP');
}

export default function DoctorCases() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const casesQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'cases') : null),
    [firestore]
  );

  const { data: cases, isLoading } = useCollection<CaseRecord>(casesQuery);

  const [selectedCase, setSelectedCase] = useState<CaseRecord | null>(null);
  const [opinion, setOpinion] = useState('');
  const [saving, setSaving] = useState(false);

  const handleOpenCase = (c: CaseRecord) => {
    setSelectedCase(c);
    setOpinion(c.opinionText || '');
  };

  const handleCloseDialog = () => {
    if (saving) return;
    setSelectedCase(null);
    setOpinion('');
  };

  async function handleSubmitOpinion() {
    if (!selectedCase || !user || !firestore) return;

    try {
      setSaving(true);
      const caseRef = doc(firestore, 'cases', selectedCase.id);

      await updateDoc(caseRef, {
        opinionText: opinion,
        doctorId: user.uid,
        status: 'answered',
        answeredAt: serverTimestamp(),
      });

      toast({
        title: 'Opinion submitted',
        description: 'Your opinion has been saved for this case.',
      });

      setSelectedCase(null);
      setOpinion('');
    } catch (error) {
      console.error('Error submitting opinion:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to submit opinion. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Doctor Case Review</CardTitle>
          <CardDescription>
            Review patient-submitted cases and provide your professional
            opinion.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="animate-spin" />
            </div>
          ) : !cases || cases.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              There are no cases to review yet.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Patient ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.subject}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {c.patientId}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          c.status === 'open'
                            ? 'default'
                            : c.status === 'answered'
                            ? 'secondary'
                            : 'outline'
                        }
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(c.createdAt)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenCase(c)}
                      >
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Review / Opinion Dialog */}
      <Dialog open={!!selectedCase} onOpenChange={handleCloseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review Case</DialogTitle>
            <DialogDescription>
              Read the case details, open the imaging, and provide your written
              opinion.
            </DialogDescription>
          </DialogHeader>

          {selectedCase && (
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold">Subject</p>
                <p className="text-sm">{selectedCase.subject}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-semibold">Description</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {selectedCase.description}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Patient ID: {selectedCase.patientId}</span>
                <span>Created: {formatDate(selectedCase.createdAt)}</span>
              </div>

              {selectedCase.imagingFileUrl && (
                <div>
                  <Button
                    type="button"
                    variant="secondary"
                    className="flex items-center gap-2"
                    onClick={() =>
                      window.open(
                        selectedCase.imagingFileUrl as string,
                        '_blank',
                        'noopener,noreferrer'
                      )
                    }
                  >
                    <FileScan className="size-4" />
                    View Imaging File
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Your Opinion / Second Opinion
                </label>
                <Textarea
                  rows={6}
                  placeholder="Write your medical impression, recommendations, or second opinion here..."
                  value={opinion}
                  onChange={(e) => setOpinion(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  This will be visible to the patient in their case view.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseDialog}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleSubmitOpinion}
                  disabled={saving || !opinion.trim()}
                >
                  {saving ? (
                    <span className="flex items-center gap-2">
                      <Loader className="size-4 animate-spin" />
                      Saving…
                    </span>
                  ) : (
                    'Submit Opinion'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
