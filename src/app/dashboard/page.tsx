'use client';
import AuthGate from '@/components/auth-gate';
import Header from '@/components/header';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  CalendarDays,
  FileText,
  Stethoscope,
  BrainCircuit,
  Briefcase,
  PlusCircle,
} from 'lucide-react';
import Appointments from '@/components/sections/appointments';
import MedicalHistory from '@/components/sections/medical-history';
import DoctorDirectory from '@/components/sections/doctor-directory';
import SmartSummary from '@/components/sections/smart-summary';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  return (
    <AuthGate>
      <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          <Card>
            <CardHeader>
              <CardTitle>Dashboard</CardTitle>
              <CardDescription>
                Your central hub for managing your health information.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Accordion type="multiple" className="w-full space-y-4">
                <AccordionItem value="new-case">
                  <AccordionTrigger className="text-lg font-semibold p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Briefcase className="text-primary size-6" />
                      New Case
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4 flex flex-col items-start gap-4">
                    <p className="text-muted-foreground">
                      Click the button below to open a new second opinion case.
                      You can provide details about your condition for a medical
                      professional to review.
                    </p>
                    <Button asChild>
                      <Link href="/new-case">
                        <PlusCircle />
                        Open a New Case
                      </Link>
                    </Button>
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="appointments">
                  <AccordionTrigger className="text-lg font-semibold p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <CalendarDays className="text-primary size-6" />
                      Appointments
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-4">
                    <Appointments />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="medical-history">
                  <AccordionTrigger className="text-lg font-semibold p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="text-primary size-6" />
                      Medical History
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <MedicalHistory />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="doctor-directory">
                  <AccordionTrigger className="text-lg font-semibold p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Stethoscope className="text-primary size-6" />
                      Doctor Directory
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <DoctorDirectory />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="smart-summary">
                  <AccordionTrigger className="text-lg font-semibold p-4 bg-card rounded-lg border">
                    <div className="flex items-center gap-3">
                      <BrainCircuit className="text-primary size-6" />
                      Smart Summary
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <SmartSummary />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </main>
      </div>
    </AuthGate>
  );
}
