'use client';

import {
  CircleUser,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Settings,
  User,
  Home,
  Sun,
  Moon,
} from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Logo } from './icons/logo';
import { useAuth, useUser } from '@/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
      className="text-white/70 hover:text-white hover:bg-white/10"
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

export default function Header() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const [role, setRole] = useState<string | null>(null);

  // Load user role from Firestore
  useEffect(() => {
    async function loadRole() {
      if (!user || !firestore) return;
      const ref = doc(firestore, 'users', user.uid);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        setRole(snap.data().role || null);
      }
    }
    loadRole();
  }, [user, firestore]);

  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  function getInitials(displayName: string | null | undefined): string {
    if (!displayName) return '';
    const names = displayName.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    return (
      (names[0].charAt(0) || '') + (names[names.length - 1].charAt(0) || '')
    ).toUpperCase();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-white/10 bg-[#2c3e50] px-4 md:px-6">
      <Link href="/home" className="flex items-center gap-2">
        <Logo />
        <span className="text-xl font-bold tracking-tight text-white">
          All Medical
        </span>
      </Link>

      <div className="flex flex-1 items-center justify-end gap-2">
        <ThemeToggle />
        <div className="hidden items-center gap-4 text-white md:flex">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.photoURL || undefined} alt="User avatar" />
            <AvatarFallback>{getInitials(user?.displayName)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">
              {user?.displayName || 'User'}
            </p>
            <p className="text-xs leading-none text-white/70">
              {user?.email}
            </p>
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-white/70 hover:text-white hover:bg-white/10"
            >
              <Settings />
              <span className="sr-only">Settings</span>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.displayName || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* MAIN MENU ITEMS */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/home">
                  <Home />
                  Home
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard />
                  Dashboard
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/profile">
                  <User />
                  Profile
                </Link>
              </DropdownMenuItem>

              {/* 🔥 CONDITIONAL DOCTOR DASHBOARD LINK */}
              {role === 'doctor' || role === 'admin' ? (
                <DropdownMenuItem asChild>
                  <Link href="/doctor-dashboard">
                    <LayoutDashboard />
                    Doctor Dashboard
                  </Link>
                </DropdownMenuItem>
              ) : null}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuItem asChild>
              <Link href="/support">
                <LifeBuoy />
                Support
              </Link>
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="text-white/70 hover:text-white hover:bg-white/10"
        >
          <LogOut />
          Log Out
        </Button>
      </div>
    </header>
  );
}
