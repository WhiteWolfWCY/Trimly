import { Suspense } from 'react';
import { getHairdressers } from '@/actions/hairdressers/hairdresser-service';
import { HairdresserManagement } from '@/components/admin/HairdresserManagement';
import { Loader2 } from 'lucide-react';

async function HairdresserContent() {
  const hairdressers = await getHairdressers();
  
  return <HairdresserManagement initialHairdressers={hairdressers} />;
}

export function HairdresserSection() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <HairdresserContent />
    </Suspense>
  );
} 