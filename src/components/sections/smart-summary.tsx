'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AlertCircle, BrainCircuit, Lightbulb, Loader, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Logo } from '../icons/logo';

const formSchema = z.object({
  medicalRecords: z
    .string()
    .min(50, { message: 'Please enter at least 50 characters of medical records.' }),
});

export default function SmartSummary() {
  const [summary, setSummary] = useState<GenerateSmartMedicalSummaryOutput | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      medicalRecords: '',
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    setSummary(null);
    try {
      const result = await generateSmartMedicalSummary(values);
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

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="text-primary" />
            Generate Smart Summary
          </CardTitle>
          <CardDescription>
            Paste your medical records below to generate an AI-powered summary.
            This tool helps organize your history for sharing with providers.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <FormField
                control={form.control}
                name="medicalRecords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Medical Records</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Paste your prescriptions, lab results, visit notes, etc. here..."
                        className="min-h-[250px] resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex-col items-start gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  'Generate Summary'
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
          </form>
        </Form>
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
                    <p className="text-muted-foreground">Enter your records and click "Generate Summary".</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
