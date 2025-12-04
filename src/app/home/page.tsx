
'use client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  CalendarDays,
  LayoutGrid,
  User,
  FolderOpenDot,
  Shield,
  BrainCircuit,
  Briefcase,
  FolderKanban,
} from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/header';
import AuthGate from '@/components/auth-gate';
import { useUser } from '@/firebase';
import { useEffect, useState } from 'react';
import DoctorDashboard from '@/components/sections/doctor-dashboard';

const defaultMenuItems = [
  {
    href: '/dashboard',
    icon: <LayoutGrid className="size-10" />,
    label: 'Dashboard',
  },
  {
    href: '/appointments',
    icon: <CalendarDays className="size-10" />,
    label: 'Appointments',
  },
  {
    href: '/medical-history',
    icon: <FolderOpenDot className="size-10" />,
    label: 'Medical History',
  },
  {
    href: '/new-case',
    icon: <Briefcase className="size-10" />,
    label: 'New Case',
  },
  {
    href: '/my-cases',
    icon: <FolderKanban className="size-10" />,
    label: 'My Cases',
  },
  {
    href: '/profile',
    icon: <User className="size-10" />,
    label: 'Profile',
  },
  {
    href: '/smart-summary',
    icon: <BrainCircuit className="size-10" />,
    label: 'Smart Summary',
  },
];

const adminMenuItem = {
  href: '/admin',
  icon: <Shield className="size-10" />,
  label: 'Admin Dashboard',
};


export default function HomePage() {
  const { isAdmin, role } = useUser();
  const [menuItems, setMenuItems] = useState(defaultMenuItems);

  useEffect(() => {
    if (isAdmin) {
      // Add admin menu item if it doesn't exist
      setMenuItems(prevItems => {
        if (prevItems.find(item => item.href === '/admin')) {
          return prevItems;
        }
        return [...defaultMenuItems, adminMenuItem];
      });
    } else {
      // Remove admin menu item if it exists
      setMenuItems(prevItems => prevItems.filter(item => item.href !== '/admin'));
    }
  }, [isAdmin]);


  return (
    <AuthGate>
        <div className="flex min-h-screen w-full flex-col">
        <Header />
        <main className="flex flex-1 items-center justify-center p-4 md:p-8">
            {role === 'doctor' ? (
              <DoctorDashboard />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 w-full max-w-4xl">
                  {menuItems.map((item) => (
                  <Link href={item.href} key={item.label} className="w-full">
                      <Card className="h-full hover:bg-primary/90 transition-colors text-card-foreground hover:text-primary-foreground">
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-2 text-center h-40">
                          {item.icon}
                          <span className="font-medium text-sm">{item.label}</span>
                      </CardContent>
                      </Card>
                  </Link>
                  ))}
              </div>
            )}
        </main>
      </div>
    </AuthGate>
  );
}
