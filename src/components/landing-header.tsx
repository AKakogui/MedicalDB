'use client';

import Link from 'next/link';
import { Logo } from './icons/logo';
import { Button } from './ui/button';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-white/10 bg-[#2c3e50] px-4 md:px-6">
      <Link href="/" className="flex items-center gap-2">
        <Logo />
        <span className="text-xl font-bold tracking-tight text-white">
          All Medical
        </span>
      </Link>
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild className="text-white hover:bg-white/10 hover:text-white">
          <Link href="/login">Log In</Link>
        </Button>
        <Button asChild>
          <Link href="/signup">Sign Up</Link>
        </Button>
      </div>
    </header>
  );
}
