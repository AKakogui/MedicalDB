
'use client';
import {
  useDoc,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { doc, updateDoc, arrayUnion, collection } from 'firebase/firestore';
import { useParams } from 'next/navigation';
import Header from '@/components/header';
import { Doctor, Review } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Building, Phone, Star, User as UserIcon, Loader } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';

const reviewSchema = z.object({
  comment: z.string().min(10, 'Review must be at least 10 characters.'),
  rating: z.number().min(1, 'Rating is required').max(5),
});

function StarRating({
  rating,
  setRating,
}: {
  rating: number;
  setRating: (rating: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`cursor-pointer h-6 w-6 ${
            star <= rating
              ? 'text-yellow-400 fill-yellow-400'
              : 'text-gray-300'
          }`}
          onClick={() => setRating(star)}
        />
      ))}
    </div>
  );
}

function ReviewForm({
  doctorId,
  onReviewAdded,
}: {
  doctorId: string;
  onReviewAdded: () => void;
}) {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      comment: '',
      rating: 0,
    },
  });

  async function onSubmit(values: z.infer<typeof reviewSchema>) {
    if (!user || !firestore) return;
    setIsLoading(true);
    const doctorRef = doc(firestore, 'doctors', doctorId);

    // This creates a reference to a new document, just to get a unique ID.
    // The document itself is not created in the 'reviews' collection.
    const newReviewId = doc(collection(firestore, 'reviews')).id;

    const newReview: Review = {
      id: newReviewId,
      patientName: user.displayName || 'Anonymous',
      rating: values.rating,
      comment: values.comment,
      date: new Date().toISOString(),
    };

    try {
      await updateDoc(doctorRef, {
        reviews: arrayUnion(newReview),
      });
      toast({ title: 'Success', description: 'Your review has been added.' });
      form.reset({ comment: '', rating: 0 });
      onReviewAdded();
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not add your review.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leave a Review</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Overall Rating</FormLabel>
                  <FormControl>
                    <StarRating rating={field.value} setRating={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Your Review</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your experience..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader className="animate-spin" />
              ) : (
                'Submit Review'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function DoctorReviews({ reviews }: { reviews: Review[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient Reviews</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {reviews.length > 0 ? (
          reviews
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((review) => (
              <div key={review.id} className="flex gap-4">
                <Avatar>
                  <AvatarFallback>
                    <UserIcon />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{review.patientName}</p>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.date), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 my-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= review.rating
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {review.comment}
                  </p>
                </div>
              </div>
            ))
        ) : (
          <p className="text-muted-foreground">No reviews yet.</p>
        )}
      </CardContent>
    </Card>
  );
}

export default function DoctorDetailPage() {
  const { id } = useParams();
  const firestore = useFirestore();
  const doctorRef = useMemoFirebase(
    () =>
      firestore && typeof id === 'string'
        ? doc(firestore, 'doctors', id)
        : null,
    [firestore, id]
  );
  const {
    data: doctor,
    isLoading,
    error,
  } = useDoc<Doctor>(doctorRef);
  const [key, setKey] = useState(0); // Used to force re-render

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader className="animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div>Error loading doctor details.</div>;
  }

  if (!doctor) {
    return <div>Doctor not found.</div>;
  }

  const doctorImage = PlaceHolderImages.find((img) => img.id === doctor.image);
  const averageRating =
    doctor.reviews && doctor.reviews.length > 0
      ? doctor.reviews.reduce((acc, r) => acc + r.rating, 0) /
        doctor.reviews.length
      : 0;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <Card>
              <CardHeader className="items-center text-center">
                <Image
                  src={doctorImage?.imageUrl || ''}
                  alt={`Photo of Dr. ${doctor.firstName} ${doctor.lastName}`}
                  data-ai-hint={doctorImage?.imageHint}
                  width={120}
                  height={120}
                  className="rounded-full border-4 border-primary"
                />
                <CardTitle className="text-2xl pt-2">
                  Dr. {doctor.firstName} {doctor.lastName}
                </CardTitle>
                <CardDescription>{doctor.specialization}</CardDescription>
                <div className="flex items-center gap-1 pt-1">
                  {averageRating > 0 && (
                    <>
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <span className="text-lg font-bold">
                        {averageRating.toFixed(1)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        ({doctor.reviews.length} reviews)
                      </span>
                    </>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div className="flex items-start gap-3">
                  <Building className="size-5 mt-0.5 text-muted-foreground" />
                  <span>{doctor.address}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="size-5 text-muted-foreground" />
                  <span>{doctor.contactNumber}</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="md:col-span-2 space-y-8" key={key}>
            <Accordion type="single" collapsible defaultValue="reviews">
              <AccordionItem value="reviews">
                <AccordionTrigger className="text-xl font-semibold">
                  Patient Reviews
                </AccordionTrigger>
                <AccordionContent>
                  <DoctorReviews reviews={doctor.reviews || []} />
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="add-review">
                <AccordionTrigger className="text-xl font-semibold">
                  Leave a Review
                </AccordionTrigger>
                <AccordionContent>
                  <ReviewForm
                    doctorId={doctor.id}
                    onReviewAdded={() => setKey((prev) => prev + 1)}
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>
    </div>
  );
}
