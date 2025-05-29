'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays, isToday, isBefore } from 'date-fns';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { 
  Textarea } from "@/components/ui/textarea";
import { Loader2, Calendar as CalendarIcon, Check } from 'lucide-react';
import { createBooking } from '@/actions/visits/bookings';
import { BookingFormValues, bookingSchema, TimeSlot } from '@/types/booking';
import { Service } from '@/types/service';
import { Hairdresser } from '@/types/hairdresser';
import { useVisits } from '@/contexts/VisitsContext';

export default function NewVisit() {
  const { user, isLoaded } = useUser();
  const { refreshVisits } = useVisits();
  const [hairdressers, setHairdressers] = useState<(Hairdresser & { services: Service[] })[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      hairdresserId: 0,
      serviceId: 0,
      appointmentDate: undefined,
      notes: ''
    }
  });

  const watchHairdresserId = form.watch('hairdresserId');
  const watchServiceId = form.watch('serviceId');
  
  useEffect(() => {
    const fetchHairdressers = async () => {
      if (!isLoaded || !user) return;
      
      try {
        setIsLoading(true);
        const response = await fetch('/api/bookings/hairdressers');
        
        if (!response.ok) {
          throw new Error('Failed to fetch hairdressers');
        }
        
        const data = await response.json();
        
        const allServices = new Map<number, Service>();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data.forEach((hairdresser: any) => {
          hairdresser.services.forEach((service: Service) => {
            allServices.set(service.id, service);
          });
        });
        
        setHairdressers(data);
        setServices(Array.from(allServices.values()));
      } catch (err) {
        console.error('Error fetching hairdressers:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchHairdressers();
  }, [user, isLoaded]);

  const filteredHairdressers = watchServiceId > 0
    ? hairdressers.filter(hd =>
        hd.services.some(s => s.id === watchServiceId)
      )
    : [];

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || !watchServiceId || !watchHairdresserId) return;

      setIsLoadingSlots(true);

      try {
        let queryParams = `date=${format(selectedDate, 'yyyy-MM-dd')}`;
        if (watchServiceId) {
          queryParams += `&serviceId=${watchServiceId}`;
        }
        if (watchHairdresserId) {
          queryParams += `&hairdresserId=${watchHairdresserId}`;
        }

        const response = await fetch(`/api/bookings/availability?${queryParams}`);

        if (!response.ok) {
          throw new Error('Failed to fetch available slots');
        }

        const slots = await response.json();
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error fetching available slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, watchServiceId, watchHairdresserId]);

  const slotsGroupedByHairdresser = availableSlots.reduce((acc, slot) => {
    if (slot.hairdresserId === watchHairdresserId && slot.available) {
      if (!acc[slot.hairdresserId]) {
        acc[slot.hairdresserId] = [];
      }
      acc[slot.hairdresserId].push(slot);
    }
    return acc;
  }, {} as Record<number, TimeSlot[]>);

  const onSubmit = async (data: BookingFormValues) => {
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      await createBooking({
        userId: user.id,
        hairdresserId: data.hairdresserId,
        serviceId: data.serviceId,
        appointmentDate: data.appointmentDate,
        notes: data.notes
      });
      
      refreshVisits();
      
      setBookingSuccess(true);
      form.reset();
      setSelectedDate(undefined);
      setAvailableSlots([]);
    } catch (error) {
      console.error('Error creating booking:', error);
      form.setError('root', { 
        message: error instanceof Error ? error.message : 'Failed to create booking' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const getServicePrice = (serviceId: number) => {
    const service = services.find(s => s.id === serviceId);
    return service ? parseFloat(service.price.toString()).toFixed(2) : '0.00';
  };

  if (bookingSuccess) {
    return (
      <Card className="col-span-3">
        <CardHeader>
          <CardTitle>Rezerwacja potwierdzona</CardTitle>
          <CardDescription>
            Twoja rezerwacja została zarezerwowana
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium mb-1">Dziękujemy za rezerwację</h3>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Twoja rezerwacja została potwierdzona. Do zobaczenia!
          </p>
          <Button onClick={() => setBookingSuccess(false)}>
            Zarezerwuj kolejną wizytę
          </Button>
        </CardContent>
      </Card>
    );
  }

  const formValues = form.getValues();
  console.log('Form Values:', {
    serviceId: formValues.serviceId,
    hairdresserId: formValues.hairdresserId,
    appointmentDate: formValues.appointmentDate,
    isValid: form.formState.isValid
  });

  return (
    <Card className="col-span-3">
      <CardHeader>
        <CardTitle>
          Zarezerwuj nową wizytę
        </CardTitle>
        <CardDescription>
          Zarezerwuj nową wizytę z ulubionym fryzjerem
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="serviceId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Service</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(parseInt(value, 10));
                          form.setValue('hairdresserId', 0);
                          setSelectedDate(undefined);
                        }}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz usługę" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {services.map((service) => (
                            <SelectItem key={service.id} value={service.id.toString()}>
                              {service.name} - ${parseFloat(service.price.toString()).toFixed(2)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hairdresserId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fryzjer</FormLabel>
                      <Select
                        disabled={filteredHairdressers.length === 0}
                        onValueChange={(value) => {
                          field.onChange(parseInt(value, 10));
                          setSelectedDate(undefined);
                        }}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wybierz fryzjera" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredHairdressers.map((hairdresser) => (
                            <SelectItem key={hairdresser.id} value={hairdresser.id.toString()}>
                              {hairdresser.first_name} {hairdresser.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <FormLabel>Wybierz datę i godzinę</FormLabel>
                  <div className="grid md:grid-cols-2 gap-4 border rounded-md mt-2">
                    <div className="p-4 border-r">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={!watchServiceId || !watchHairdresserId}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "PPP")
                            ) : (
                              <span>Wybierz datę</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) =>
                              !watchServiceId ||
                              !watchHairdresserId ||
                              isBefore(date, new Date()) && !isToday(date) ||
                              isBefore(date, addDays(new Date(), -1))
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="p-4">
                      {isLoadingSlots ? (
                        <div className="flex justify-center items-center h-32">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : selectedDate ? (
                        Object.keys(slotsGroupedByHairdresser).length > 0 ? (
                          <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                            {Object.entries(slotsGroupedByHairdresser).map(([hairdresserId, slots]) => {
                              return (
                                <div key={hairdresserId} className="grid grid-cols-2 gap-2">
                                  {slots.map((slot, index) => (
                                    <FormField
                                      key={index}
                                      control={form.control}
                                      name="appointmentDate"
                                      render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                          <FormControl>
                                            <Button
                                              type="button"
                                              variant={field.value && 
                                                new Date(field.value).getTime() === new Date(slot.startTime).getTime() 
                                                ? "default" 
                                                : "outline"
                                              }
                                              className="w-full"
                                              onClick={() => {
                                                form.setValue('appointmentDate', new Date(slot.startTime));
                                                form.trigger();
                                              }}
                                            >
                                              {format(new Date(slot.startTime), "h:mm a")}
                                            </Button>
                                          </FormControl>
                                        </FormItem>
                                      )}
                                    />
                                  ))}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 text-center">
                            <p className="text-muted-foreground">
                              Brak dostępnych terminów dla tej daty
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <p className="text-muted-foreground">
                            Proszę wybrać datę, aby zobaczyć dostępne terminy
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notatki (opcjonalnie)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Dowolne specjalne żądania lub notatki do Twojej wizyty"
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {watchServiceId > 0 && (
                <div className="bg-muted/50 p-4 rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Suma</p>
                    <p className="text-lg font-bold">${getServicePrice(watchServiceId)}</p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={
                      isSubmitting || 
                      !form.getValues().serviceId || 
                      !form.getValues().hairdresserId || 
                      !form.getValues().appointmentDate
                    }
                    onClick={() => {
                      const formValues = form.getValues();
                      console.log('Submitting with values:', formValues);
                    }}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Zarezerwuj wizytę
                  </Button>
                </div>
              )}

              {form.formState.errors.root?.message && (
                <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm">
                  {form.formState.errors.root.message}
                </div>
              )}

              {form.formState.errors.appointmentDate && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.appointmentDate.message}
                </p>
              )}
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  );
}