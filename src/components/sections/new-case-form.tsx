'use client';

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';
import { Case } from '@/lib/types';


export default function NewCaseForm() {
  const { user } = useUser();
  const firestore = useFirestore();
  const storage = getStorage();
  const router = useRouter();
  const { toast } = useToast();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [selectedImaging, setSelectedImaging] = useState<string>("none");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load previous imaging records for linking
  const imagingQuery = useMemoFirebase(
    () => (user ? collection(firestore, "users", user.uid, "imagingRecords") : null),
    [firestore, user]
  );
  const { data: imagingRecords } = useCollection(imagingQuery);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !firestore) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    let imagingFileUrl: string | undefined;
    let imagingFileName: string | undefined;

    try {
      // If user attached a new file
      if (file) {
        const filePath = `users/${user.uid}/cases/${Date.now()}/${file.name}`;
        const storageRef = ref(storage, filePath);

        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => reject(error),
            async () => {
              imagingFileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              imagingFileName = file.name;
              resolve();
            }
          );
        });
      }

      // Prepare Firestore doc data
      const data: Partial<Case> = {
        subject,
        description,
        createdAt: serverTimestamp() as any,
        status: "open",
        patientId: user.uid,
        imagingFileUrl: imagingFileUrl,
        imagingFileName: imagingFileName,
      };

      // If linking an existing imaging record
      if (selectedImaging !== "none") {
        const linkedRecord = imagingRecords?.find((r) => r.id === selectedImaging);
        if (linkedRecord) {
          data.imagingFileUrl = linkedRecord.fileUrl;
          data.imagingFileName = linkedRecord.fileName;
        }
      }

      const docRef = await addDoc(collection(firestore, "cases"), data);

      toast({
        title: "Case Submitted",
        description: "Your second opinion request has been sent."
      });
      router.push(`/cases/${docRef.id}`);

    } catch (err) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Submission Failed',
        description: 'Could not submit your case. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="max-w-2xl w-full">
      <CardHeader>
        <CardTitle>Open a New Case for Second Opinion</CardTitle>
        <CardDescription>
          Fill out the details below to submit your case. A medical professional will review it shortly.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2">
            <Label>Subject</Label>
            <Input
              placeholder="e.g. Chest X-RAY follow up"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="Describe your concern..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={5}
            />
          </div>

          {/* Choose existing imaging */}
          <div className="space-y-2">
            <Label>Link an Existing Imaging Record (optional)</Label>
            <Select onValueChange={setSelectedImaging} value={selectedImaging}>
              <SelectTrigger>
                <SelectValue placeholder="Select a record" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {imagingRecords?.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.type} – {item.bodyPart}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Upload new file */}
          <div className="space-y-2">
            <Label>Or Upload Image (optional)</Label>
            <Input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.dcm"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          {uploadProgress !== null && isSubmitting && (
            <div className="space-y-2">
              <Label>Uploading...</Label>
              <Progress value={uploadProgress} />
              <p className="text-center text-muted-foreground">
                {Math.round(uploadProgress)}%
              </p>
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
             {isSubmitting ? <Loader className="animate-spin" /> : 'Submit Case'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
