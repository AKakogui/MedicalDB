
'use client';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  BrainCircuit,
  FileText,
  ShieldCheck,
  CalendarCheck2,
  Stethoscope,
} from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/icons/logo';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import LandingHeader from '@/components/landing-header';
import { useUser } from '@/firebase';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader } from 'lucide-react';

const features = [
  {
    icon: <FileText />,
    title: 'Centralized Health Records',
    description:
      'Keep all your medical documents, from prescriptions to lab results, in one secure and easily accessible place.',
  },
  {
    icon: <CalendarCheck2 />,
    title: 'Appointment Management',
    description:
      'Schedule and track your doctor appointments with our integrated calendar and reminder system.',
  },
  {
    icon: <BrainCircuit />,
    title: 'AI-Powered Smart Summaries',
    description:
      'Let our intelligent AI generate concise summaries of your medical history, making it easy to share with new providers.',
  },
  {
    icon: <Stethoscope />,
    title: 'Doctor Directory & Reviews',
    description:
      'Find and connect with local healthcare professionals. Read patient reviews to make informed decisions.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Secure and Private',
    description:
      'Your data is encrypted and protected with industry-leading security standards, ensuring your privacy is our priority.',
  },
];

const dashboardImage = PlaceHolderImages.find(p => p.id === 'doctor1');

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.replace('/home');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || user) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center">
        <Loader className="h-16 w-16 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <LandingHeader />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-primary/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Your Health, Organized and Empowered
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    All Medical is the single source of truth for your health
                    journey. Securely manage your records, appointments, and
                    gain powerful insights with AI.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/signup">Get Started Free</Link>
                  </Button>
                  <Button asChild variant="secondary" size="lg">
                    <Link href="/login">Log In</Link>
                  </Button>
                </div>
              </div>
              {dashboardImage && 
              <Image
                src={dashboardImage.imageUrl}
                alt="Dashboard Preview"
                data-ai-hint={dashboardImage.imageHint}
                width={600}
                height={400}
                className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full lg:order-last"
              />
              }
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-secondary px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need for Your Health
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Our platform provides a comprehensive suite of tools to help
                  you manage every aspect of your healthcare.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:grid-cols-3 pt-12">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="grid gap-1 p-4 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-primary/10 text-primary p-3 rounded-full">
                      {feature.icon}
                    </div>
                    <h3 className="text-lg font-bold">{feature.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 border-t bg-primary/5">
          <div className="container grid items-center justify-center gap-4 px-4 text-center md:px-6">
            <div className="space-y-3">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Take Control of Your Health Today
              </h2>
              <p className="mx-auto max-w-[600px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Join thousands of users who are managing their health more
                effectively. Sign up now and experience the future of personal
                health management.
              </p>
            </div>
            <div className="mx-auto w-full max-w-sm space-y-2">
              <Button asChild size="lg" className="w-full">
                <Link href="/signup">Sign Up Now</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <div className="flex items-center gap-2">
          <Logo />
          <p className="text-xs text-muted-foreground">
            &copy; 2024 All Medical. All rights reserved.
          </p>
        </div>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Terms of Service
          </Link>
          <Link
            href="#"
            className="text-xs hover:underline underline-offset-4"
          >
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
