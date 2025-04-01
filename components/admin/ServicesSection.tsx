import { Suspense } from 'react';
import { getServices } from '@/actions/services/services-service';
import { ServiceManagement } from '@/components/admin/ServiceManagement';
import { Loader2 } from 'lucide-react';

async function ServiceContent() {
  const services = await getServices();
  
  return <ServiceManagement initialServices={services} />;
}

export function ServicesSection() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <ServiceContent />
    </Suspense>
  );
} 