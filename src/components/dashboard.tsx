import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  CalendarDays,
  History,
  MapPin,
  Sparkles,
} from 'lucide-react';
import MedicalHistory from './sections/medical-history';
import Appointments from './sections/appointments';
import DoctorDirectory from './sections/doctor-directory';
import SmartSummary from './sections/smart-summary';

export default function Dashboard() {
  return (
    <Tabs defaultValue="history" className="grid-cols-4">
      <TabsList className="grid w-full grid-cols-2 h-auto md:grid-cols-4 mb-4">
        <TabsTrigger value="history" className="py-2">
          <History />
          Medical History
        </TabsTrigger>
        <TabsTrigger value="appointments" className="py-2">
          <CalendarDays />
          Appointments
        </TabsTrigger>
        <TabsTrigger value="directory" className="py-2">
          <MapPin />
          Doctor Directory
        </TabsTrigger>
        <TabsTrigger value="summary" className="py-2">
          <Sparkles />
          Smart Summary
        </TabsTrigger>
      </TabsList>
      <TabsContent value="history">
        <MedicalHistory />
      </TabsContent>
      <TabsContent value="appointments">
        <Appointments />
      </TabsContent>
      <TabsContent value="directory">
        <DoctorDirectory />
      </TabsContent>
      <TabsContent value="summary">
        <SmartSummary />
      </TabsContent>
    </Tabs>
  );
}
