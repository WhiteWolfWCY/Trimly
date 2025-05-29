'use client';

import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, 
  Loader2, 
  XCircle, 
  AlertCircle,
  CalendarX,
  Search,
  MoreVertical
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
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
import { toast } from 'sonner';
import { Visit } from '@/types/visits';

type BookingStatus = 'all' | 'booked' | 'cancelled' | 'past';

const EmptyState = ({ 
  icon: Icon, 
  title, 
  description 
}: { 
  icon: React.ElementType, 
  title: string, 
  description: string 
}) => (
  <div className="flex flex-col items-center justify-center h-[400px] text-center p-4 border rounded-lg bg-muted/50">
    <Icon className="h-12 w-12 text-muted-foreground mb-4" />
    <h3 className="text-lg font-medium">{title}</h3>
    <p className="text-sm text-muted-foreground mt-2 max-w-sm">
      {description}
    </p>
  </div>
);

export function BookingsSection() {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    status: 'all' as BookingStatus,
    date: undefined as Date | undefined,
    search: '',
  });
  const [visitToCancel, setVisitToCancel] = useState<number | null>(null);
  const [visitToReschedule, setVisitToReschedule] = useState<Visit | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.date) queryParams.append('date', format(filters.date, 'yyyy-MM-dd'));
      if (filters.search) queryParams.append('search', filters.search);

      const response = await fetch(`/api/admin/bookings?${queryParams}`);
      if (!response.ok) throw new Error('Failed to fetch bookings');
      const data = await response.json();
      setBookings(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'booked': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'past': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      default: return '';
    }
  };

  const hasActiveFilters = filters.status !== 'all' || filters.date || filters.search;

  const handleCancelVisit = async () => {
    if (!visitToCancel) return;
    
    setIsCancelling(true);
    try {
      const response = await fetch(`/api/visits/${visitToCancel}/cancel`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: cancelReason }),
      });

      if (!response.ok) throw new Error('Failed to cancel visit');
      
      toast.success('Visit cancelled successfully');
      fetchBookings();
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error cancelling visit:', error);
      toast.error('Failed to cancel visit');
    } finally {
      setIsCancelling(false);
      setVisitToCancel(null);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderBookingCard = (booking: any) => (
    <div
      key={booking.id}
      className="border rounded-lg p-4 space-y-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2">
            <div className="font-medium text-lg">
              {format(new Date(booking.appointmentDate), 'h:mm a')}
            </div>
            <Badge className={getStatusColor(booking.status)}>
              {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(booking.appointmentDate), 'MMMM d, yyyy')}
          </div>
        </div>
        {booking.status === 'booked' && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => setVisitToReschedule(booking)}
              >
                Zmień datę
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => {
                  setVisitToCancel(booking.id);
                  setShowCancelDialog(true);
                }}
              >
                Anuluj rezerwację
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-sm font-medium">Klient</div>
          <div className="text-sm text-muted-foreground">
            {booking.user.first_name} {booking.user.last_name}
          </div>
          <div className="text-sm text-muted-foreground">
            {booking.user.email}
          </div>
        </div>
        <div>
          <div className="text-sm font-medium">Usługa</div>
          <div className="text-sm text-primary">
            {booking.service.name}
          </div>
          <div className="text-sm text-muted-foreground">
            ${parseFloat(booking.service.price.toString()).toFixed(2)}
          </div>
        </div>
      </div>
      {booking.cancellationReason && (
        <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
          <span className="font-medium">Powód anulacji:</span> {booking.cancellationReason}
        </div>
      )}
    </div>
  );

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Wyszukaj po imieniu lub emailu..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="w-full pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Select
              value={filters.status}
              onValueChange={(value: BookingStatus) => 
                setFilters(prev => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Wybierz status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie statusy</SelectItem>
                <SelectItem value="booked">Zarezerwowane</SelectItem>
                <SelectItem value="cancelled">Anulowane</SelectItem>
                <SelectItem value="past">Minione</SelectItem>
              </SelectContent>
            </Select>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[180px] justify-start text-left font-normal",
                    !filters.date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.date ? format(filters.date, 'PPP') : <span>Wybierz datę</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.date}
                  onSelect={(date) => setFilters(prev => ({ ...prev, date }))}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setFilters({
                  status: 'all',
                  date: undefined,
                  search: '',
                })}
              >
                <XCircle className="h-4 w-4" />
                Wyczyść filtry
              </Button>
            )}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <EmptyState
            icon={AlertCircle}
            title="Błąd podczas ładowania rezerwacji"
            description={error}
          />
        ) : bookings.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={Search}
              title="Nie znaleziono rezerwacji"
              description="Spróbuj dostosować swoje filtry, aby znaleźć to, czego szukasz"
            />
          ) : (
            <EmptyState
              icon={CalendarX}
              title="Brak rezerwacji"
              description="Rezerwacje pojawią się tutaj, gdy klienci zaczną tworzyć rezerwacje"
            />
          )
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {bookings.map(renderBookingCard)}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Anuluj rezerwację</DialogTitle>
            <DialogDescription>
              Czy jesteś pewny, że chcesz anulować tę rezerwację? Ta akcja nie może zostać cofnięta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="reason">Powód anulacji</Label>
              <Textarea
                id="reason"
                placeholder="Podaj powód anulacji..."
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
              Zatrzymaj rezerwację
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelVisit}
              disabled={isCancelling}
            >
              {isCancelling && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anuluj rezerwację
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {visitToReschedule && (
        <RescheduleVisitDialog
          visit={visitToReschedule}
          open={true}
          onOpenChange={(open) => {
            if (!open) {
              setVisitToReschedule(null);
            }
          }}
          onSuccess={fetchBookings}
        />
      )}
    </>
  );
} 