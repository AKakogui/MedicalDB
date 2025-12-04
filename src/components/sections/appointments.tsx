
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Appointment, Doctor } from '@/lib/types';
import { format } from 'date-fns';
import { Building, Clock, Loader, PlusCircle, Trash2 } from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { addDoc, collection, deleteDoc, doc, query } from 'firebase/firestore';
import { Button } from '../ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '../ui/form';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Textarea } from '../ui/textarea';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '../ui/input';
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
} from '../ui/alert-dialog';

const appointmentSchema = z.object({
  doctorName: z
    .string({ required_error: "Please enter a doctor's name." })
    .min(1, "Please enter a doctor's name."),
  appointmentDate: z.date({ required_error: 'Please select a date.' }),
  appointmentTime: z.string().min(1, 'Time is required.'),
  notes: z.string().optional(),
});

function generateTimeSlots() {
  const slots = [];
  for (let i = 8; i < 18; i++) {
    const hour24 = i < 10 ? `0${i}` : `${i}`;
    const hour12 = i > 12 ? i - 12 : i === 0 ? 12 : i;
    const ampm = i < 12 ? 'AM' : 'PM';

    slots.push({ value: `${hour24}:00`, label: `${hour12}:00 ${ampm}` });
    if (i < 17) {
      slots.push({ value: `${hour24}:30`, label: `${hour12}:30 ${ampm}` });
    }
  }
  return slots;
}

const timeSlots = generateTimeSlots();

function NewAppointmentForm({
  doctors,
  onFinished,
}: {
  doctors: Doctor[];
  onFinished: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof appointmentSchema>>({
    resolver: zodResolver(appointmentSchema),
    defaultValues: {
      doctorName: '',
      appointmentTime: '',
      notes: '',
    },
  });

  async function onSubmit(values: z.infer<typeof appointmentSchema>) {
    if (!user || !firestore) return;
    setIsLoading(true);

    try {
      const appointmentsRef = collection(
        firestore,
        'users',
        user.uid,
        'appointments'
      );

      const [hours, minutes] = values.appointmentTime.split(':').map(Number);
      const combinedDateTime = new Date(values.appointmentDate);
      combinedDateTime.setHours(hours);
      combinedDateTime.setMinutes(minutes);

      const doctor = doctors.find(
        (d) =>
          `${d.firstName} ${d.lastName}`.toLowerCase() ===
          values.doctorName.toLowerCase()
      );

      await addDoc(appointmentsRef, {
        doctorId: doctor ? doctor.id : values.doctorName, // Save ID if found, otherwise save the name
        doctorName: values.doctorName,
        patientId: user.uid,
        appointmentDate: combinedDateTime,
        notes: values.notes,
      });

      toast({
        title: 'Success',
        description: 'Your appointment has been scheduled.',
      });
      onFinished();
    } catch (error: any) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not schedule your appointment.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="doctorName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Doctor</FormLabel>
              <FormControl>
                <Input placeholder="Dr. John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <FormField
            control={form.control}
            name="appointmentDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground'
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>Pick a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="appointmentTime"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Time</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a time" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeSlots.map((slot) => (
                      <SelectItem key={slot.value} value={slot.value}>
                        {slot.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any specific reason for this visit?"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader className="animate-spin" /> : 'Schedule'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export default function Appointments() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const appointmentsQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, 'users', user.uid, 'appointments') : null,
    [firestore, user]
  );
  const { data: appointments, isLoading: isLoadingAppointments } =
    useCollection<Appointment>(appointmentsQuery);

  const doctorsQuery = useMemoFirebase(
    () => (firestore ? query(collection(firestore, 'doctors')) : null),
    [firestore]
  );
  const { data: doctors, isLoading: isLoadingDoctors } =
    useCollection<Doctor>(doctorsQuery);

  const appointmentDates =
    appointments?.map((a: any) => new Date(a.appointmentDate.seconds * 1000)) ||
    [];

  const getDoctorName = (apt: any) => {
    if (apt.doctorName) return apt.doctorName;
    const doctor = doctors?.find((d) => d.id === apt.doctorId);
    return doctor
      ? `Dr. ${doctor.firstName} ${doctor.lastName}`
      : 'Unknown Doctor';
  };
  const getDoctorSpecialty = (doctorId: string) => {
    const doctor = doctors?.find((d) => d.id === doctorId);
    return doctor ? doctor.specialization : '';
  };

  const handleDelete = async (appointmentId: string) => {
    if (!user) return;
    setIsDeleting(true);

    try {
      const appointmentRef = doc(
        firestore,
        'users',
        user.uid,
        'appointments',
        appointmentId
      );
      await deleteDoc(appointmentRef);
      toast({
        title: 'Success',
        description: 'Appointment cancelled.',
      });
    } catch (error) {
      console.error('Error deleting appointment: ', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not cancel the appointment.',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Appointments</CardTitle>
          <CardDescription>
            Manage your upcoming doctor appointments.
          </CardDescription>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle />
              New Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Fill out the details below to book your next appointment.
              </DialogDescription>
            </DialogHeader>
            {isLoadingDoctors ? (
              <div className="flex justify-center items-center h-24">
                <Loader className="animate-spin" />
              </div>
            ) : (
              <NewAppointmentForm
                doctors={doctors || []}
                onFinished={() => setIsDialogOpen(false)}
              />
            )}
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="grid gap-8 md:grid-cols-2">
        <div className="flex justify-center">
          <Calendar
            mode="multiple"
            selected={appointmentDates}
            className="rounded-md border"
          />
        </div>
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Upcoming Appointments</h3>
          {isLoadingAppointments ? (
            <p>Loading appointments...</p>
          ) : appointments && appointments.length > 0 ? (
            (appointments as any[])
              .sort(
                (a, b) =>
                  a.appointmentDate.seconds - b.appointmentDate.seconds
              )
              .map((apt) => {
                const specialty = getDoctorSpecialty(apt.doctorId);
                return (
                  <Card key={apt.id} className="bg-background">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {getDoctorName(apt)}
                      </CardTitle>
                      {specialty && (
                        <CardDescription>{specialty}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="size-4 text-muted-foreground" />
                        <span>
                          {format(
                            new Date(apt.appointmentDate.seconds * 1000),
                            'PPPPp'
                          )}
                        </span>
                      </div>
                      {apt.notes && (
                        <div className="flex items-start gap-2">
                          <Building className="size-4 text-muted-foreground mt-1" />
                          <p>{apt.notes}</p>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="justify-end">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm">
                            <Trash2 />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently
                              delete this appointment.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(apt.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader className="animate-spin" />
                              ) : (
                                'Delete'
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                );
              })
          ) : (
            <p className="text-muted-foreground">No upcoming appointments.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
