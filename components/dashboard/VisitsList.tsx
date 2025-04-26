'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Loader2, AlertCircle, CalendarX, Clock, MoreVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow, format, isPast } from 'date-fns';
import { Visit } from '@/types/visits';
import { useVisits } from '@/contexts/VisitsContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cancelVisit } from '@/actions/visits/visits';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RescheduleVisitDialog } from '@/components/shared/RescheduleVisitDialog';

interface VisitCardProps {
  visit: Visit;
  showCancelButton?: boolean;
}

export default function VisitsList() {
  const { userId, isLoaded } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { refreshKey } = useVisits();
  const [visitToCancel, setVisitToCancel] = useState<number | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [visitToReschedule, setVisitToReschedule] = useState<Visit | null>(null);

  console.log("userId", userId);

  const fetchVisits = useCallback(async () => {
    if (!isLoaded || !userId) return;
    
    try {
      setIsLoading(true);
      const timestamp = new Date().getTime();
      const response = await fetch(`/api/visits/${userId}?t=${timestamp}`, {
        next: { revalidate: 0 },
        cache: 'no-store',
      });
      
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
  }, [userId, isLoaded]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits, refreshKey]);

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
      case 'booked': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'past': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const EmptyState = ({ 
    icon: Icon, 
    title, 
    description 
  }: { 
    icon: any, 
    title: string, 
    description: string 
  }) => (
    <div className="flex flex-col items-center justify-center h-[300px] text-center p-4 border rounded-lg bg-muted/50">
      <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1">
        {description}
      </p>
    </div>
  );

  const handleCancelVisit = async () => {
    if (!visitToCancel) return;
    
    setIsCancelling(true);
    try {
      await cancelVisit(visitToCancel, cancelReason);
      toast.success('Visit cancelled successfully');
      fetchVisits();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to cancel visit');
    } finally {
      setIsCancelling(false);
      setVisitToCancel(null);
    }
  };

  const VisitCard = ({ visit, showCancelButton = false }: VisitCardProps) => (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium text-lg">
              {format(new Date(visit.appointmentDate), 'h:mm a')}
            </div>
            <Badge className={getStatusColor(visit.status)}>
              {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(visit.appointmentDate), 'MMMM d, yyyy')}
          </div>
        </div>
        {showCancelButton && visit.status === 'booked' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setVisitToReschedule(visit)}
              >
                Reschedule
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setVisitToCancel(visit.id);
                  setShowCancelDialog(true);
                }}
              >
                Cancel appointment
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="flex justify-between items-end">
        <div>
          <div className="font-medium text-primary">
            {visit.service?.name}
          </div>
          <div className="text-sm text-muted-foreground">
            ${parseFloat(visit.service?.price.toString() || '0').toFixed(2)}
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {isPast(new Date(visit.appointmentDate)) 
            ? `${formatDistanceToNow(new Date(visit.appointmentDate))} ago`
            : `In ${formatDistanceToNow(new Date(visit.appointmentDate))}`
          }
        </div>
      </div>
      {visit.cancellationReason && (
        <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
          <span className="font-medium">Cancellation reason:</span> {visit.cancellationReason}
        </div>
      )}
    </div>
  );

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

  return (
    <>
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingVisits.length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastVisits.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-4">
          {upcomingVisits.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {upcomingVisits.map((visit) => (
                  <VisitCard 
                    key={visit.id} 
                    visit={visit} 
                    showCancelButton={true}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState
              icon={Clock}
              title="No upcoming visits"
              description="Book a new appointment to see your upcoming visits here"
            />
          )}
        </TabsContent>

        <TabsContent value="past" className="mt-4">
          {pastVisits.length > 0 ? (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {pastVisits.map((visit) => (
                  <VisitCard 
                    key={visit.id} 
                    visit={visit}
                  />
                ))}
              </div>
            </ScrollArea>
          ) : (
            <EmptyState
              icon={CalendarX}
              title="No past visits"
              description="Your visit history will appear here after your first appointment"
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Reason for cancellation (optional)</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for cancellation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false);
                setVisitToCancel(null);
                setCancelReason('');
              }}
            >
              Keep appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelVisit}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Cancel appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <RescheduleVisitDialog
        visit={visitToReschedule}
        open={!!visitToReschedule}
        onOpenChange={(open) => !open && setVisitToReschedule(null)}
        onSuccess={async () => {
          await fetchVisits();
          setVisitToReschedule(null);
        }}
      />
    </>
  );
}
