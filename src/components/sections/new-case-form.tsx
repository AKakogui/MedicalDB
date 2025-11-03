
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Loader } from 'lucide-react';
import {
  useFirestore,
  useUser,
  errorEmitter,
  FirestorePermissionError,
} from '@/firebase';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';

const newCaseSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters.'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters.'),
});

export default function NewCaseForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();

  const form = useForm<z.infer<typeof newCaseSchema>>({
    resolver: zodResolver(newCaseSchema),
    defaultValues: {
      subject: '',
      description: '',
    },
  });

  async function onSubmit(values: z.infer<typeof newCaseSchema>) {
    if (!user || !firestore) {
      // This should ideally not happen if the user is on this page,
      // but it's a good safeguard.
      alert('You must be logged in to create a case.');
      return;
    }

    setIsLoading(true);
    const casesCollection = collection(firestore, 'cases');
    const newCaseRef = doc(casesCollection); 

    const caseData = {
      id: newCaseRef.id,
      ...values,
      patientId: user.uid,
      status: 'open',
      createdAt: serverTimestamp(),
    };

    setDoc(newCaseRef, caseData)
      .then(() => {
        router.push('/new-case/success');
      })
      .catch((error) => {
        const permissionError = new FirestorePermissionError({
          path: newCaseRef.path,
          operation: 'create',
          requestResourceData: caseData,
        });
        errorEmitter.emit('permission-error', permissionError);

      })
      .finally(() => {
        setIsLoading(false);
      });
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardHeader>
            <CardTitle>Open a New Case for Second Opinion</CardTitle>
            <CardDescription>
              Fill out the details below to submit your case. A medical
              professional will review it shortly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="subject"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subject</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Second opinion on recent MRI results"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Please provide a detailed description of your condition, the documents you're sharing, and the specific questions you have."
                      className="min-h-[150px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader className="animate-spin" />
              ) : (
                'Open Second Opinion Case'
              )}
            </Button>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}
