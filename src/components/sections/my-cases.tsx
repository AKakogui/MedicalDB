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
import { Button } from '@/components/ui/button';
import { Loader, MessageSquare, Trash2, ShieldAlert } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import {
  collection,
  query,
  where,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { getStorage, ref, deleteObject } from 'firebase/storage';
import { useUser } from '@/firebase';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';

type CaseRecord = {
  id: string;
  subject: string;
  description: string;
  status: string;
  createdAt?: { seconds: number; nanoseconds: number };
  patientId: string;
  doctorResponse?: { message: string };
  imagingFileUrl?: string;
};

export default function MyCases() {
  const firestore = useFirestore();
  const { user: currentUser } = useUser();
  const { toast } = useToast();

  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const casesQuery = useMemoFirebase(
    () =>
      firestore && currentUser
        ? query(
            collection(firestore, 'cases'),
            where('patientId', '==', currentUser.uid)
          )
        : null,
    [firestore, currentUser]
  );

  const { data: cases, isLoading } = useCollection<CaseRecord>(casesQuery);

  async function handleDeleteCase(caseToDelete: CaseRecord) {
    if (!firestore) return;
    setIsDeleting(caseToDelete.id);

    try {
      // 1. Delete Firestore document
      const docRef = doc(firestore, 'cases', caseToDelete.id);
      await deleteDoc(docRef);

      // 2. Delete associated file from Storage if it exists
      if (caseToDelete.imagingFileUrl) {
        try {
          const storage = getStorage();
          const fileRef = ref(storage, caseToDelete.imagingFileUrl);
          await deleteObject(fileRef);
        } catch (storageError: any) {
          // If the file doesn't exist, that's okay. Log other storage errors.
          if (storageError.code !== 'storage/object-not-found') {
            console.warn('Could not delete storage file:', storageError);
          }
        }
      }

      toast({
        title: 'Case Deleted',
        description: 'Your case has been permanently removed.',
      });
    } catch (error) {
      console.error('Error deleting case:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not delete the case. Please try again.',
      });
    } finally {
      setIsDeleting(null);
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (!cases || cases.length === 0) {
    return (
      <p className="text-muted-foreground">
        You haven’t submitted any cases yet.
      </p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Subject</TableHead>
          <TableHead className="hidden md:table-cell">Created</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cases.map((c) => (
          <TableRow key={c.id}>
            <TableCell className="font-medium">{c.subject}</TableCell>
            <TableCell className="hidden md:table-cell">
              {c.createdAt
                ? format(new Date(c.createdAt.seconds * 1000), 'MMM d, yyyy')
                : '—'}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  c.status === 'answered'
                    ? 'default'
                    : c.status === 'open'
                    ? 'secondary'
                    : 'outline'
                }
              >
                {c.status}
              </Badge>
            </TableCell>
            <TableCell className="text-right">
              <div className="flex items-center justify-end gap-2">
                {c.status === 'answered' ? (
                  <Button asChild size="sm">
                    <Link href={`/cases/${c.id}`}>
                      <MessageSquare />
                      View Response
                    </Link>
                  </Button>
                ) : (
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/cases/${c.id}`}>View Details</Link>
                  </Button>
                )}
                {(c.status === 'open' || c.status === 'closed') && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon" className="h-9 w-9">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <ShieldAlert className="text-destructive" />
                          Are you sure?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete your case and any attached files.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteCase(c)}
                          disabled={isDeleting === c.id}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          {isDeleting === c.id ? (
                            <Loader className="animate-spin" />
                          ) : (
                            'Delete'
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
