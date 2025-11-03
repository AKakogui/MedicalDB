
'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { MapPin, Search, Star } from 'lucide-react';
import type { Doctor } from '@/lib/types';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query } from 'firebase/firestore';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { Button } from '../ui/button';

// Dynamically import the Map component to prevent SSR issues
const Map = dynamic(() => import('@/components/map'), {
  ssr: false,
});

function DoctorCard({
  doctor,
  onSelect,
  isSelected,
}: {
  doctor: Doctor;
  onSelect: (id: string | null) => void;
  isSelected: boolean;
}) {
  const doctorImage = PlaceHolderImages.find((img) => img.id === doctor.image);
  const averageRating =
    doctor.reviews && doctor.reviews.length > 0
      ? doctor.reviews.reduce((acc, r) => acc + r.rating, 0) /
        doctor.reviews.length
      : 0;
  return (
    <Card
      className={`cursor-pointer transition-colors ${
        isSelected ? 'bg-primary/10 border-primary' : 'hover:bg-accent/80'
      }`}
      onClick={() => onSelect(isSelected ? null : doctor.id)}
    >
      <CardHeader className="flex-row items-start gap-4 space-y-0">
        <Image
          src={doctorImage?.imageUrl || ''}
          alt={`Photo of ${doctor.firstName} ${doctor.lastName}`}
          data-ai-hint={doctorImage?.imageHint}
          width={80}
          height={80}
          className="rounded-full border"
        />
        <div className="flex-1">
          <CardTitle>
            Dr. {doctor.firstName} {doctor.lastName}
          </CardTitle>
          <CardDescription>{doctor.specialization}</CardDescription>
          <div className="flex items-center gap-1 pt-1">
            {averageRating > 0 ? (
              <>
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="text-sm font-medium">
                  {averageRating.toFixed(1)}
                </span>
                <span className="text-sm text-muted-foreground">
                  ({doctor.reviews.length} review
                  {doctor.reviews.length > 1 ? 's' : ''})
                </span>
              </>
            ) : (
              <span className="text-sm text-muted-foreground">
                No reviews yet
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="flex items-start gap-2">
          <MapPin className="size-4 mt-0.5 text-muted-foreground" />
          <span>{doctor.address}</span>
        </div>
        <div className="pt-2">
          <Link href={`/doctors/${doctor.id}`} passHref>
             <Button variant="outline" size="sm" onClick={(e) => e.stopPropagation()}>
               View Profile
             </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}


export default function DoctorDirectory() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string | null>(null);

  const firestore = useFirestore();
  const doctorsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'doctors')) : null),
    [firestore]
  );
  const { data: doctors, isLoading } = useCollection<Doctor>(doctorsQuery);

  const filteredDoctors =
    doctors?.filter(
      (doctor) =>
        `${doctor.firstName} ${doctor.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Doctor Directory</CardTitle>
        <CardDescription>
          Find local doctors by name or specialty, or on the map.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search doctors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-[600px] rounded-lg overflow-hidden border">
            {doctors && <Map doctors={doctors} selectedDoctorId={selectedDoctorId} />}
          </div>
           <div className="h-[600px] overflow-y-auto space-y-4 pr-2">
            {isLoading && <p>Loading doctors...</p>}
            {!isLoading && (
                <>
                {filteredDoctors.length > 0 ? (
                    filteredDoctors.map((doctor: Doctor) => (
                    <DoctorCard
                        key={doctor.id}
                        doctor={doctor}
                        onSelect={setSelectedDoctorId}
                        isSelected={selectedDoctorId === doctor.id}
                    />
                    ))
                ) : (
                    <p className="text-center text-muted-foreground">No doctors found.</p>
                )}
                </>
            )}
           </div>
        </div>
      </CardContent>
    </Card>
  );
}
