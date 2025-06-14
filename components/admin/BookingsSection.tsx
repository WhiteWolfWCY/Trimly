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
  MoreVertical,
  FileText
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn, getStatusTranslation } from '@/lib/utils';
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
import { ReportDialog } from '@/components/admin/ReportDialog';
import { DateRange } from 'react-day-picker';

type BookingStatus = 'booked' | 'cancelled' | 'past';

interface Hairdresser {
  id: number;
  first_name: string;
  last_name: string;
}

const statusOptions: { value: BookingStatus; label: string }[] = [
  { value: 'booked', label: 'Zarezerwowane' },
  { value: 'cancelled', label: 'Anulowane' },
  { value: 'past', label: 'Zakończone' },
];

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
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>([]);
  const [filters, setFilters] = useState({
    statuses: [] as BookingStatus[],
    dateRange: undefined as DateRange | undefined,
    search: '',
    hairdresserIds: [] as number[],
  });
  const [visitToCancel, setVisitToCancel] = useState<number | null>(null);
  const [visitToReschedule, setVisitToReschedule] = useState<Visit | null>(null);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [statusPopoverOpen, setStatusPopoverOpen] = useState(false);
  const [hairdresserPopoverOpen, setHairdresserPopoverOpen] = useState(false);

  const fetchHairdressers = useCallback(async () => {
    try {
      const response = await fetch('/api/hairdressers');
      if (!response.ok) throw new Error('Failed to fetch hairdressers');
      const data = await response.json();
      setHairdressers(data);
    } catch (error) {
      console.error('Error fetching hairdressers:', error);
    }
  }, []);

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters.statuses.length > 0) {
        filters.statuses.forEach(status => queryParams.append('status', status));
      }
      if (filters.hairdresserIds.length > 0) {
        filters.hairdresserIds.forEach(id => queryParams.append('hairdresserId', id.toString()));
      }
      if (filters.dateRange?.from) queryParams.append('dateFrom', format(filters.dateRange.from, 'yyyy-MM-dd'));
      if (filters.dateRange?.to) queryParams.append('dateTo', format(filters.dateRange.to, 'yyyy-MM-dd'));
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
    fetchHairdressers();
  }, [fetchHairdressers]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'booked': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'cancelled': return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'past': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return '';
    }
  };

  const hasActiveFilters = filters.statuses.length > 0 || filters.dateRange || filters.search || filters.hairdresserIds.length > 0;

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
              {getStatusTranslation(booking.status)}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            {format(new Date(booking.appointmentDate), 'MMMM d, yyyy')}
          </div>
        </div>
        {booking.status === 'booked' && booking.status !== 'past' && (
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
          <div className="text-sm text-muted-foreground mt-1">
            <span className="font-medium">Fryzjer:</span> {booking.hairdresser.first_name} {booking.hairdresser.last_name}
          </div>
        </div>
      </div>
      {booking.notes && (
        <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
          <span className="font-medium">Notatka:</span> {booking.notes}
        </div>
      )}
      {booking.cancellationReason && (
        <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
          <span className="font-medium">Powód anulacji:</span> {booking.cancellationReason}
        </div>
      )}
      {booking.rescheduleReason && (
        <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
          <span className="font-medium">Powód przesunięcia:</span> {booking.rescheduleReason}
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
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowReportDialog(true)}
            >
              <FileText className="h-4 w-4" />
              Generuj raport
            </Button>
            <Popover open={statusPopoverOpen} onOpenChange={setStatusPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-[180px] justify-between h-auto min-h-[40px] items-center text-left font-normal",
                    !filters.statuses.length && "text-muted-foreground"
                  )}
                >
                  {filters.statuses.length ? (
                    <div className="flex flex-wrap gap-1">
                      {filters.statuses.map(status => {
                        const statusOption = statusOptions.find(opt => opt.value === status);
                        return (
                          <Badge key={status} variant="secondary">
                            {statusOption?.label}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span>Wybierz statusy</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Wyszukaj statusy..." />
                  <CommandList>
                    <CommandEmpty>Nie znaleziono statusów.</CommandEmpty>
                    <CommandGroup>
                      {statusOptions.map((option) => {
                        const isSelected = filters.statuses.includes(option.value);
                        return (
                          <CommandItem
                            key={option.value}
                            onSelect={() => {
                              const updatedStatuses = isSelected
                                ? filters.statuses.filter(s => s !== option.value)
                                : [...filters.statuses, option.value as BookingStatus];
                              
                              setFilters(prev => ({ ...prev, statuses: updatedStatuses }));
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Checkbox checked={isSelected} />
                              <span>{option.label}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover open={hairdresserPopoverOpen} onOpenChange={setHairdresserPopoverOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  className={cn(
                    "w-[180px] justify-between h-auto min-h-[40px] items-center text-left font-normal",
                    !filters.hairdresserIds.length && "text-muted-foreground"
                  )}
                >
                  {filters.hairdresserIds.length ? (
                    <div className="flex flex-wrap gap-1">
                      {filters.hairdresserIds.map(id => {
                        const hairdresser = hairdressers.find(h => h.id === id);
                        return (
                          <Badge key={id} variant="secondary">
                            {hairdresser?.first_name} {hairdresser?.last_name}
                          </Badge>
                        );
                      })}
                    </div>
                  ) : (
                    <span>Wybierz fryzjerów</span>
                  )}
                  <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[250px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Wyszukaj fryzjerów..." />
                  <CommandList>
                    <CommandEmpty>Nie znaleziono fryzjerów.</CommandEmpty>
                    <CommandGroup>
                      {hairdressers.map((hairdresser) => {
                        const isSelected = filters.hairdresserIds.includes(hairdresser.id);
                        return (
                          <CommandItem
                            key={hairdresser.id}
                            onSelect={() => {
                              const updatedIds = isSelected
                                ? filters.hairdresserIds.filter(id => id !== hairdresser.id)
                                : [...filters.hairdresserIds, hairdresser.id];
                              
                              setFilters(prev => ({ ...prev, hairdresserIds: updatedIds }));
                            }}
                          >
                            <div className="flex items-center gap-2 w-full">
                              <Checkbox checked={isSelected} />
                              <span>{hairdresser.first_name} {hairdresser.last_name}</span>
                            </div>
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-[250px] justify-start text-left font-normal",
                    !filters.dateRange && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateRange?.from ? (
                    filters.dateRange.to ? (
                      <>
                        {format(filters.dateRange.from, 'LLL dd, y')} -{' '}
                        {format(filters.dateRange.to, 'LLL dd, y')}
                      </>
                    ) : (
                      format(filters.dateRange.from, 'LLL dd, y')
                    )
                  ) : (
                    <span>Wybierz zakres dat</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={filters.dateRange?.from}
                  selected={filters.dateRange}
                  onSelect={(dateRange) => setFilters(prev => ({ ...prev, dateRange }))}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
            {hasActiveFilters && (
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => setFilters({
                  statuses: [],
                  dateRange: undefined,
                  search: '',
                  hairdresserIds: [],
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

      <ReportDialog 
        open={showReportDialog} 
        onOpenChange={setShowReportDialog} 
      />
    </>
  );
} 