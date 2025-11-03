'use client';

import Link from 'next/link';
import { Logo } from './icons/logo';
import { Button } from './ui/button';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm md:px-6 justify-between">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="text-xl font-bold tracking-tight text-foreground">
          All Medical
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    </header>
  );
}
