'use client';
import { useState } from 'react';
import { generateSmartMedicalSummary } from '@/ai/flows/generate-smart-medical-summary';
import type { GenerateSmartMedicalSummaryOutput } from '@/ai/flows/generate-smart-medical-summary';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertCircle,
  BrainCircuit,
  Lightbulb,
  Loader,
  Sparkles,
  Info,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Logo } from '../icons/logo';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
} from '@/firebase';
import { collection } from 'firebase/firestore';
import type {
  Prescription,
  ImagingRecord,
  LabResult,
  DoctorVisit,
} from '@/lib/types';

function formatRecordsForAI(
  records: {
    prescriptions: Prescription[] | null;
    imaging: ImagingRecord[] | null;
    labs: LabResult[] | null;
    visits: DoctorVisit[] | null;
  }
) {
  let combinedText = "Here are the patient's medical records:\n\n";

  if (records.prescriptions && records.prescriptions.length > 0) {
    combinedText += "=== Prescriptions ===\n";
    combinedText += JSON.stringify(records.prescriptions, null, 2);
    combinedText += "\n\n";
  }

  if (records.imaging && records.imaging.length > 0) {
    combinedText += "=== Imaging Records ===\n";
    combinedText += JSON.stringify(records.imaging, null, 2);
    combinedText += "\n\n";
  }

  if (records.labs && records.labs.length > 0) {
    combinedText += "=== Lab Results ===\n";
    combinedText += JSON.stringify(records.labs, null, 2);
    combinedText += "\n\n";
  }

  if (records.visits && records.visits.length > 0) {
    combinedText += "=== Doctor Visits ===\n";
    combinedText += JSON.stringify(records.visits, null, 2);
    combinedText += "\n\n";
  }
  
  if (combinedText.length < 50) {
    return null;
  }

  return combinedText;
}


export default function SmartSummary() {
  const [summary, setSummary] = useState<GenerateSmartMedicalSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useUser();
  const firestore = useFirestore();

  // Fetch all medical records
  const prescriptionsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'prescriptions') : null, [user, firestore]);
  const { data: prescriptions, isLoading: loadingPrescriptions } = useCollection<Prescription>(prescriptionsQuery);
  
  const imagingQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'imagingRecords') : null, [user, firestore]);
  const { data: imagingRecords, isLoading: loadingImaging } = useCollection<ImagingRecord>(imagingQuery);

  const labsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'labResults') : null, [user, firestore]);
  const { data: labResults, isLoading: loadingLabs } = useCollection<LabResult>(labsQuery);

  const visitsQuery = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'doctorVisits') : null, [user, firestore]);
  const { data: doctorVisits, isLoading: loadingVisits } = useCollection<DoctorVisit>(visitsQuery);


  async function handleGenerateSummary() {
    setIsLoading(true);
    setSummary(null);

    const medicalRecords = formatRecordsForAI({
      prescriptions,
      imaging: imagingRecords,
      labs: labResults,
      visits: doctorVisits,
    });
    
    if (!medicalRecords) {
        toast({
            variant: 'destructive',
            title: 'No Records Found',
            description: 'Please upload some medical documents in the Medical History section first.',
        });
        setIsLoading(false);
        return;
    }
    
    try {
      const result = await generateSmartMedicalSummary({ medicalRecords });
      setSummary(result);
    } catch (error) {
      console.error('Error generating summary:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to generate summary. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  const areRecordsLoading = loadingPrescriptions || loadingImaging || loadingLabs || loadingVisits;

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Generate Smart Summary
          </CardTitle>
          <CardDescription>
            Use our intelligent AI to generate a concise summary of all your uploaded medical records. This can help you get a quick overview of your health history.
          </CardDescription>
        </CardHeader>
        <CardContent>
            {areRecordsLoading ? (
                 <div className="flex items-center justify-center h-24">
                    <Loader className="animate-spin" />
                    <p className="ml-2">Loading your records...</p>
                 </div>
            ) : (
                <div className="text-center p-4 border rounded-lg bg-background">
                    <Info className="mx-auto size-8 text-primary mb-2" />
                    <p className="font-semibold">Ready to Generate</p>
                    <p className="text-sm text-muted-foreground">Click the button below to process all your documents from the Medical History section.</p>
                </div>
            )}
        </CardContent>
        <CardFooter className="flex-col items-start gap-4">
          <Button onClick={handleGenerateSummary} disabled={isLoading || areRecordsLoading}>
            {isLoading ? (
              <>
                <Loader className="animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Summary from My Records'
            )}
          </Button>
           <Alert variant="default" className="bg-background">
             <AlertCircle className="h-4 w-4" />
            <AlertTitle>Disclaimer</AlertTitle>
            <AlertDescription>
              The AI summary is for informational purposes only and is not a substitute for professional medical advice. Always consult with a healthcare provider.
            </AlertDescription>
          </Alert>
        </CardFooter>
      </Card>
      
      <div className="space-y-8">
        {isLoading && (
            <Card className="flex flex-col items-center justify-center min-h-[400px]">
                <CardContent className="text-center">
                    <Loader className="size-12 animate-spin text-primary mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Analyzing Records...</h3>
                    <p className="text-muted-foreground">Please wait while our AI creates your summary.</p>
                </CardContent>
            </Card>
        )}
        {summary ? (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BrainCircuit className="text-primary" />
                  AI Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{summary.summary}</p>
              </CardContent>
            </Card>
            {summary.flaggedFacts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-500">
                    <Lightbulb />
                    Key Highlights
                  </CardTitle>
                  <CardDescription>
                    The AI has flagged these points for your review.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 list-disc list-inside">
                    {summary.flaggedFacts.map((fact, index) => (
                      <li key={index}>{fact}</li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </>
        ) : !isLoading && (
            <Card className="flex flex-col items-center justify-center min-h-[400px] border-dashed">
                <CardContent className="text-center">
                    <Logo className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">Your summary will appear here</h3>
                    <p className="text-muted-foreground">Click "Generate Summary from My Records" to begin.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
