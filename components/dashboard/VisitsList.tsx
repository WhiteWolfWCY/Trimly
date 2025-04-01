'use client';

import { useEffect, useState } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import { Loader2, Calendar, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { Visit } from '@/types/visits';

export default function VisitsList() {
  const { userId, isLoaded } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log("userId", userId);

  useEffect(() => {
    const fetchVisits = async () => {
      if (!isLoaded || !userId) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`/api/visits/${userId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch visits');
        }
        
        const data = await response.json();
        setVisits(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchVisits();
  }, [userId, isLoaded]);

  const upcomingVisits = visits.filter(visit => 
    !isPast(new Date(visit.appointmentDate)) && 
    visit.status !== 'cancelled'
  );
  
  const pastVisits = visits.filter(visit => 
    isPast(new Date(visit.appointmentDate)) || 
    visit.status === 'cancelled'
  );

  const getStatusColor = (status: Visit['status']) => {
    switch(status) {
      case 'confirmed': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'rescheduled': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-32 text-center p-4 border rounded-lg bg-muted/50">
        <AlertCircle className="h-8 w-8 text-destructive mb-2" />
        <h3 className="text-lg font-medium">Failed to load visits</h3>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  if (visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-4 border rounded-lg bg-muted/50">
        <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
        <h3 className="text-lg font-medium">No visits found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Book your first appointment to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-full">
      {upcomingVisits.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Upcoming</h3>
          <div className="space-y-3">
            {upcomingVisits.map((visit) => (
              <div key={visit.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {format(new Date(visit.appointmentDate), 'MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(visit.appointmentDate), 'h:mm a')}
                    </div>
                  </div>
                  <Badge className={getStatusColor(visit.status)}>
                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm">
                  {`In ${formatDistanceToNow(new Date(visit.appointmentDate))}`}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pastVisits.length > 0 && (
        <div>
          <h3 className="font-medium mb-2">Past</h3>
          <div className="space-y-3">
            {pastVisits.map((visit) => (
              <div key={visit.id} className="border rounded-lg p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">
                      {format(new Date(visit.appointmentDate), 'MMMM d, yyyy')}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(new Date(visit.appointmentDate), 'h:mm a')}
                    </div>
                  </div>
                  <Badge className={getStatusColor(visit.status)}>
                    {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                  </Badge>
                </div>
                <div className="mt-2 text-sm text-muted-foreground">
                  {formatDistanceToNow(new Date(visit.appointmentDate))} ago
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
