'use client';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  CalendarDays,
  Stethoscope,
  LayoutGrid,
  User,
  FolderOpenDot,
  Shield,
  BrainCircuit,
  Briefcase,
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
    href: '/medical-history',
    icon: <FolderOpenDot className="size-10" />,
    label: 'Medical History',
  },
  {
    href: '/appointments',
    icon: <CalendarDays className="size-10" />,
    label: 'Appointments',
  },
  {
    href: '/doctors',
    icon: <Stethoscope className="size-10" />,
    label: 'Doctor Directory',
  },
  {
    href: '/new-case',
    icon: <Briefcase className="size-10" />,
    label: 'New Case',
  },
  {
    href: '/smart-summary',
    icon: <BrainCircuit className="size-10" />,
    label: 'Smart Summary',
  },
  {
    href: '/profile',
    icon: <User className="size-10" />,
    label: 'Profile',
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            {role === 'doctor' ? (
              <DoctorDashboard />
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                  {menuItems.map((item) => (
                  <Link href={item.href} key={item.label}>
                      <Card className="h-full hover:bg-accent/80 transition-colors">
                      <CardContent className="flex flex-col items-center justify-center p-6 space-y-2 text-center">
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
