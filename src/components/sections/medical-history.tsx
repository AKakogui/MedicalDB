'use client';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type {
  ImagingRecord,
  MedicalDocument,
  Prescription,
  LabResult,
  DoctorVisit,
} from '@/lib/types';
import {
  Beaker,
  Bone,
  FileScan,
  Pill,
  Stethoscope,
  Upload,
  Waves,
  Loader,
  BrainCircuit,
} from 'lucide-react';
import { Button } from '../ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../ui/card';
import { Badge } from '../ui/badge';
import React, { useState } from 'react';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm, type UseFormReturn } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { Textarea } from '../ui/textarea';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { ToastAction } from '../ui/toast';
import { Progress } from '../ui/progress';
import { Label } from '../ui/label';

const fileSchema = z
  .any()
  .refine((files) => files?.length > 0, 'File is required.');

const optionalFileSchema = z.any().optional();

const prescriptionSchema = z.object({
  medication: z.string().min(1, 'Medication name is required.'),
  dosage: z.string().min(1, 'Dosage is required.'),
  frequency: z.string().min(1, 'Frequency is required.'),
  prescribedBy: z.string().optional(),
  file: optionalFileSchema,
});

const imagingSchema = z.object({
  type: z.string().min(1, 'Type is required.'),
  bodyPart: z.string().min(1, 'Body part is required.'),
  result: z.string().optional(),
  file: fileSchema,
});

const labResultSchema = z.object({
  testName: z.string().min(1, 'Test name is required.'),
  value: z.string().min(1, 'Value is required.'),
  referenceRange: z.string().min(1, 'Reference range is required.'),
  file: fileSchema,
});

const specialties = [
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Hematology',
  'Infectious Disease',
  'Neurology',
  'Oncology',
  'Ophthalmology',
  'Orthopedics',
  'Otolaryngology (ENT)',
  'Pediatrics',
  'Psychiatry',
  'Pulmonology',
  'Radiology',
  'Rheumatology',
  'Urology',
  'Other',
];

const visitSummarySchema = z.object({
  doctorName: z.string().min(1, 'Doctor name is required.'),
  specialty: z.string().optional(),
  reason: z.string().optional(),
  file: optionalFileSchema,
});

const iconMap: Record<string, React.ReactNode> = {
  'X-Ray': <Bone className="text-muted-foreground" />,
  'CT Scan': <FileScan className="text-muted-foreground" />,
  MRI: <BrainCircuit className="text-muted-foreground" />,
  Ultrasound: <Waves className="text-muted-foreground" />,
};

type UploadSection = 'prescription' | 'imaging' | 'lab' | 'visit';

interface UploadFormProps<T extends z.ZodType<any, any>> {
  form: UseFormReturn<z.infer<T>>;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (values: z.infer<T>) => Promise<void>;
  children: React.ReactNode;
  isFileOptional?: boolean;
  uploadProgress: number | null;
}

function GenericUploadForm<T extends z.ZodType<any, any>>({
  form,
  isLoading,
  onClose,
  onSubmit,
  children,
  isFileOptional = false,
  uploadProgress,
}: UploadFormProps<T>) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="file"
          render={({ field }) => (
            <FormItem>
              <FormLabel>File {isFileOptional && '(Optional)'}</FormLabel>
              <FormControl>
                <Input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.dcm"
                  disabled={isLoading}
                  onChange={(e) => {
                    field.onChange(e.target.files);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {children}
        {isLoading && uploadProgress !== null && (
          <div className="space-y-2">
            <Label>Uploading...</Label>
            <Progress value={uploadProgress} />
            <p className="text-sm text-muted-foreground text-center">
              {Math.round(uploadProgress)}%
            </p>
          </div>
        )}
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? <Loader className="animate-spin" /> : 'Upload & Save'}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

function UploadDialog({
  section,
  onClose,
}: {
  section: UploadSection | null;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const formDetails = React.useMemo(() => {
    switch (section) {
      case 'prescription':
        return {
          title: 'Upload Prescription',
          collectionName: 'prescriptions',
          schema: prescriptionSchema,
          defaultValues: {
            medication: '',
            dosage: '',
            frequency: '',
            prescribedBy: '',
            file: undefined,
          },
        };
      case 'imaging':
        return {
          title: 'Upload Imaging Record',
          collectionName: 'imagingRecords',
          schema: imagingSchema,
          defaultValues: {
            type: '',
            bodyPart: '',
            result: '',
            file: undefined,
          },
        };
      case 'lab':
        return {
          title: 'Upload Lab Result',
          collectionName: 'labResults',
          schema: labResultSchema,
          defaultValues: {
            testName: '',
            value: '',
            referenceRange: '',
            file: undefined,
          },
        };
      case 'visit':
        return {
          title: 'Upload Visit Summary',
          collectionName: 'doctorVisits',
          schema: visitSummarySchema,
          defaultValues: {
            doctorName: '',
            specialty: '',
            reason: '',
            file: undefined,
          },
        };
      default:
        return null;
    }
  }, [section]);

  const form = useForm({
    resolver: formDetails ? zodResolver(formDetails.schema) : undefined,
    defaultValues: formDetails?.defaultValues,
  });

  React.useEffect(() => {
    if (formDetails) {
      form.reset(formDetails.defaultValues);
    }
  }, [section, formDetails, form]);

  if (!section || !formDetails) return null;

  const { title, collectionName, schema } = formDetails;

  async function onSubmit(values: z.infer<typeof schema>) {
    if (!user || !firestore) return;
    setIsLoading(true);
    setUploadProgress(null);

    const file = values.file?.[0];
    let fileUrl: string | undefined = undefined;
    let fileName: string | undefined = undefined;

    try {
      if (file) {
        setUploadProgress(0);
        const storage = getStorage();
        const filePath = `users/${user.uid}/${collectionName}/${Date.now()}-${file.name}`;
        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on(
            'state_changed',
            (snapshot) => {
              const progress =
                (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              setUploadProgress(progress);
            },
            (error) => {
              console.error('Upload failed:', error);
              reject(error);
            },
            async () => {
              fileUrl = await getDownloadURL(uploadTask.snapshot.ref);
              fileName = file.name;
              resolve();
            }
          );
        });
      }

      const docData = {
        ...values,
        fileUrl,
        fileName,
        patientId: user.uid,
        uploadDate: serverTimestamp(),
      };
      delete docData.file;

      const docRef = collection(firestore, 'users', user.uid, collectionName);
      await addDoc(docRef, docData);

      toast({
        title: 'Upload Successful',
        description: `${fileName || 'Record'} has been added to your history.`,
        action: fileUrl ? (
          <ToastAction asChild altText="View File">
            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
              View File
            </a>
          </ToastAction>
        ) : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: 'There was a problem saving your record.',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(null);
    }
  }

  const renderFormContent = () => {
    switch (section) {
      case 'prescription':
        return (
          <GenericUploadForm
            form={form as UseFormReturn<z.infer<typeof prescriptionSchema>>}
            isLoading={isLoading}
            onClose={onClose}
            onSubmit={onSubmit}
            isFileOptional
            uploadProgress={uploadProgress}
          >
            <FormField
              control={form.control}
              name="medication"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Medication Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Lisinopril" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="dosage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Dosage</FormLabel>
                  <FormControl>
                    <Input placeholder="10mg" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="frequency"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Frequency</FormLabel>
                  <FormControl>
                    <Input placeholder="Once daily" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="prescribedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prescribed By (optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Evelyn Reed" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </GenericUploadForm>
        );
      case 'imaging':
        return (
          <GenericUploadForm
            form={form as UseFormReturn<z.infer<typeof imagingSchema>>}
            isLoading={isLoading}
            onClose={onClose}
            onSubmit={onSubmit}
            uploadProgress={uploadProgress}
          >
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imaging Type</FormLabel>
                  <FormControl>
                    <Input placeholder="X-Ray, MRI, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="bodyPart"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Body Part</FormLabel>
                  <FormControl>
                    <Input placeholder="Left Wrist" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="result"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Result/Notes (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., No fracture detected." {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </GenericUploadForm>
        );
      case 'lab':
        return (
          <GenericUploadForm
            form={form as UseFormReturn<z.infer<typeof labResultSchema>>}
            isLoading={isLoading}
            onClose={onClose}
            onSubmit={onSubmit}
            uploadProgress={uploadProgress}
          >
            <FormField
              control={form.control}
              name="testName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Test Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Hemoglobin A1c" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="value"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Value</FormLabel>
                  <FormControl>
                    <Input placeholder="6.2%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="referenceRange"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reference Range</FormLabel>
                  <FormControl>
                    <Input placeholder="< 5.7%" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </GenericUploadForm>
        );
      case 'visit':
        return (
          <GenericUploadForm
            form={form as UseFormReturn<z.infer<typeof visitSummarySchema>>}
            isLoading={isLoading}
            onClose={onClose}
            onSubmit={onSubmit}
            isFileOptional
            uploadProgress={uploadProgress}
          >
            <FormField
              control={form.control}
              name="doctorName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Doctor Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Dr. Isaac Chen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Specialty</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a specialty" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {specialties.map((specialty) => (
                        <SelectItem key={specialty} value={specialty}>
                          {specialty}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Visit (optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Annual check-up" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
          </GenericUploadForm>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog
      open={!!section}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Fill in the details for your uploaded document.
          </DialogDescription>
        </DialogHeader>
        {renderFormContent()}
      </DialogContent>
    </Dialog>
  );
}

function SectionLoader() {
  return (
    <div className="flex items-center justify-center p-8">
      <Loader className="animate-spin text-primary" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center text-muted-foreground p-8">
      No records found.
    </div>
  );
}

export default function MedicalHistory() {
  const [activeUpload, setActiveUpload] = useState<UploadSection | null>(null);
  const { user } = useUser();
  const firestore = useFirestore();

  const prescriptionsQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, 'users', user.uid, 'prescriptions') : null,
    [user, firestore]
  );
  const { data: prescriptions, isLoading: loadingPrescriptions } =
    useCollection<Prescription>(prescriptionsQuery);

  const imagingQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, 'users', user.uid, 'imagingRecords') : null,
    [user, firestore]
  );
  const { data: imagingRecords, isLoading: loadingImaging } =
    useCollection<ImagingRecord>(imagingQuery);

  const labsQuery = useMemoFirebase(
    () => (user ? collection(firestore, 'users', user.uid, 'labResults') : null),
    [user, firestore]
  );
  const { data: labResults, isLoading: loadingLabs } =
    useCollection<LabResult>(labsQuery);

  const visitsQuery = useMemoFirebase(
    () =>
      user ? collection(firestore, 'users', user.uid, 'doctorVisits') : null,
    [user, firestore]
  );
  const { data: doctorVisits, isLoading: loadingVisits } =
    useCollection<DoctorVisit>(visitsQuery);

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    return format(timestamp.toDate(), 'yyyy-MM-dd');
  };

  return (
    <>
      <UploadDialog
        section={activeUpload}
        onClose={() => setActiveUpload(null)}
      />
      <Card>
        <CardHeader>
          <CardTitle>Medical History</CardTitle>
          <CardDescription>
            A comprehensive overview of your medical records.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible defaultValue="prescriptions">
            <AccordionItem value="prescriptions">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <Pill className="text-primary size-6" />
                  Prescriptions
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setActiveUpload('prescription')}>
                    <Upload />
                    Upload Prescription
                  </Button>
                </div>
                {loadingPrescriptions ? (
                  <SectionLoader />
                ) : prescriptions && prescriptions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Medication</TableHead>
                        <TableHead>Dosage</TableHead>
                        <TableHead>Frequency</TableHead>
                        <TableHead>Prescribed By</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {prescriptions.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">
                            {p.medication}
                          </TableCell>
                          <TableCell>{p.dosage}</TableCell>
                          <TableCell>{p.frequency}</TableCell>
                          <TableCell>{p.prescribedBy}</TableCell>
                          <TableCell className="text-right">
                            {formatDate(p.uploadDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState />
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="imaging">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <FileScan className="text-primary size-6" />
                  Imaging
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setActiveUpload('imaging')}>
                    <Upload />
                    Upload Imaging Record
                  </Button>
                </div>
                {loadingImaging ? (
                  <SectionLoader />
                ) : imagingRecords && imagingRecords.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Body Part</TableHead>
                        <TableHead>Result</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {imagingRecords.map((record) => (
                        <TableRow
                          key={record.id}
                          className="cursor-pointer hover:bg-muted/30 transition"
                          onClick={() => {
                            if (record.fileUrl) {
                              window.open(
                                record.fileUrl,
                                '_blank',
                                'noopener,noreferrer'
                              );
                            } else {
                              alert('No file found for this record.');
                            }
                          }}
                        >
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {iconMap[record.type] || <FileScan />}
                              <span className="underline text-primary">
                                {record.type}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{record.bodyPart}</TableCell>
                          <TableCell>{record.result || '—'}</TableCell>
                          <TableCell className="text-right">
                            {formatDate(record.uploadDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState />
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="labs">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <Beaker className="text-primary size-6" />
                  Lab Results
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setActiveUpload('lab')}>
                    <Upload />
                    Upload Lab Result
                  </Button>
                </div>
                {loadingLabs ? (
                  <SectionLoader />
                ) : labResults && labResults.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Test Name</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Reference Range</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {labResults.map((result) => (
                        <TableRow key={result.id}>
                          <TableCell className="font-medium">
                            {result.testName}
                          </TableCell>
                          <TableCell>
                            <Badge variant={'secondary'}>
                              {result.value}
                            </Badge>
                          </TableCell>
                          <TableCell>{result.referenceRange}</TableCell>
                          <TableCell className="text-right">
                            {formatDate(result.uploadDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState />
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="visits">
              <AccordionTrigger className="text-lg font-semibold">
                <div className="flex items-center gap-3">
                  <Stethoscope className="text-primary size-6" />
                  Doctor Visits
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end mb-4">
                  <Button onClick={() => setActiveUpload('visit')}>
                    <Upload />
                    Upload Visit Summary
                  </Button>
                </div>
                {loadingVisits ? (
                  <SectionLoader />
                ) : doctorVisits && doctorVisits.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Doctor</TableHead>
                        <TableHead>Specialty</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="text-right">Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {doctorVisits.map((visit) => (
                        <TableRow key={visit.id}>
                          <TableCell className="font-medium">
                            {visit.doctorName}
                          </TableCell>
                          <TableCell>{visit.specialty}</TableCell>
                          <TableCell>{visit.reason}</TableCell>
                          <TableCell className="text-right">
                            {formatDate(visit.uploadDate)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <EmptyState />
                )}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </>
  );
}
