'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from '@/lib/utils';
import { TimeSlot } from '@/types/booking';
import { Visit } from '@/types/visits';
import { Service } from '@/types/service';
import { Hairdresser } from '@/types/hairdresser';
import { toast } from 'sonner';
import { rescheduleVisit } from '@/actions/visits/visits';
import React from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface RescheduleVisitDialogProps {
  visit: Visit | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function RescheduleVisitDialog({
  visit,
  open,
  onOpenChange,
  onSuccess
}: RescheduleVisitDialogProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hairdressers, setHairdressers] = useState<(Hairdresser & { services: Service[] })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<number | undefined>(undefined);
  const [selectedHairdresser, setSelectedHairdresser] = useState<number | undefined>(undefined);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [rescheduleReason, setRescheduleReason] = useState('');

  // Fetch hairdressers and set initial values
  useEffect(() => {
    if (open && visit) {
      const fetchHairdressers = async () => {
        try {
          const response = await fetch('/api/bookings/hairdressers');
          if (!response.ok) throw new Error('Failed to fetch hairdressers');
          const data = await response.json();
          
          const allServices = new Map<number, Service>();
          data.forEach((hairdresser: Hairdresser & { services: Service[] }) => {
            hairdresser.services.forEach((service: Service) => {
              allServices.set(service.id, service);
            });
          });
          
          setHairdressers(data);
          setServices(Array.from(allServices.values()));
          setSelectedService(visit.service?.id);
          setSelectedHairdresser(visit.hairdresserId);
        } catch (err) {
          console.error('Error fetching hairdressers:', err);
          toast.error('Failed to load hairdressers and services');
        } finally {
        }
      };

      fetchHairdressers();
    }
  }, [open, visit]);

  const filteredHairdressers = selectedService
    ? hairdressers.filter(hd =>
        hd.services.some(s => s.id === selectedService)
      )
    : [];

  useEffect(() => {
    if (selectedDate && selectedService && selectedHairdresser) {
      const fetchSlots = async () => {
        setIsLoadingSlots(true);
        try {
          const queryParams = new URLSearchParams({
            date: format(selectedDate, 'yyyy-MM-dd'),
            serviceId: selectedService.toString(),
            hairdresserId: selectedHairdresser.toString()
          });

          console.log('Fetching slots with params:', Object.fromEntries(queryParams.entries()));
          
          const response = await fetch(`/api/bookings/availability?${queryParams}`);
          if (!response.ok) throw new Error('Failed to fetch available slots');
          
          const slots = await response.json();
          console.log('Received slots:', slots);
          
          // Filter slots only by hairdresser, not by availability
          const filteredSlots = slots.filter((slot: TimeSlot) => 
            slot.hairdresserId === selectedHairdresser
          );
          
          console.log('Filtered slots:', filteredSlots);
          setAvailableSlots(filteredSlots);
        } catch (error) {
          console.error('Error fetching slots:', error);
          toast.error('Failed to load available time slots');
        } finally {
          setIsLoadingSlots(false);
        }
      };

      fetchSlots();
    }
  }, [selectedDate, selectedService, selectedHairdresser]);

  const handleReschedule = async () => {
    if (!selectedSlot || !visit?.id || !selectedService || !selectedHairdresser) return;
    
    setIsSubmitting(true);
    try {
      await rescheduleVisit(visit.id, selectedSlot, selectedService, selectedHairdresser, rescheduleReason);
      toast.success('Wizyta przesunięta pomyślnie');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error rescheduling visit:', error);
        toast.error(error instanceof Error ? error.message : 'Nie udało się przesunąć wizyty');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!visit) return null;

  const getServicePrice = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service ? parseFloat(service.price.toString()).toFixed(2) : '0.00';
  };

  const handleDateSelect = (date: Date | undefined) => {
    console.log("Date selected:", date);
    setSelectedDate(date);
    setSelectedSlot(undefined);
    setDatePickerOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Przesuń wizytę</DialogTitle>
            <DialogDescription>
              Zaktualizuj szczegóły swojej wizyty
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid gap-4">
              <Select
                value={selectedService?.toString()}
                onValueChange={(value) => {
                  const serviceId = parseInt(value, 10);
                  setSelectedService(serviceId);
                  setSelectedHairdresser(undefined);
                  setSelectedDate(undefined);
                  setSelectedSlot(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz usługę" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((service) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.name} - ${parseFloat(service.price.toString()).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                disabled={!selectedService || filteredHairdressers.length === 0}
                value={selectedHairdresser?.toString()}
                onValueChange={(value) => {
                  setSelectedHairdresser(parseInt(value, 10));
                  setSelectedDate(undefined);
                  setSelectedSlot(undefined);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Wybierz fryzjera" />
                </SelectTrigger>
                <SelectContent>
                  {filteredHairdressers.map((hairdresser) => (
                    <SelectItem key={hairdresser.id} value={hairdresser.id.toString()}>
                      {hairdresser.first_name} {hairdresser.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
                disabled={!selectedService || !selectedHairdresser}
                onClick={() => {
                  console.log("Date picker button clicked");
                  setDatePickerOpen(true);
                }}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP") : <span>Wybierz datę</span>}
              </Button>
            </div>

            {selectedDate && (
              <div className="grid gap-2">
                {isLoadingSlots ? (
                  <div className="flex justify-center items-center h-32">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {availableSlots.map((slot, index) => (
                      <Button
                        key={`${slot.startTime}-${index}`}
                        variant={selectedSlot && 
                          new Date(selectedSlot).getTime() === new Date(slot.startTime).getTime() 
                          ? "default" 
                          : "outline"
                        }
                        className={cn(
                          "w-full",
                          !slot.available && "bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                        )}
                        disabled={!slot.available}
                        onClick={() => setSelectedSlot(new Date(slot.startTime))}
                      >
                        {format(new Date(slot.startTime), "h:mm a")}
                      </Button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-4">
                    Brak dostępnych terminów dla tej daty
                  </div>
                )}
              </div>
            )}

            {selectedService && (
              <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">Suma</p>
                  <p className="text-lg font-bold">${getServicePrice(selectedService)}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-2 mt-4">
              <Label htmlFor="rescheduleReason">Powód przesunięcia wizyty (opcjonalnie)</Label>
              <Textarea
                id="rescheduleReason"
                placeholder="Podaj powód przesunięcia wizyty..."
                value={rescheduleReason}
                onChange={(e) => setRescheduleReason(e.target.value)}
                className="resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Anuluj
            </Button>
            <Button
              onClick={handleReschedule}
              disabled={!selectedSlot || !selectedService || !selectedHairdresser || isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Potwierdź przesunięcie
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Separate Dialog for Date Picker */}
      <Dialog open={datePickerOpen} onOpenChange={setDatePickerOpen}>
        <DialogContent className="sm:max-w-[350px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Wybierz datę</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return date < today;
              }}
              initialFocus
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 