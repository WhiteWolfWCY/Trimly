'use client';

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, parseISO, addDays, isToday, isBefore } from 'date-fns';
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
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Loader2, Calendar as CalendarIcon, Check } from 'lucide-react';
import { createBooking } from '@/actions/visits/bookings';
import { BookingFormValues, bookingSchema, TimeSlot } from '@/types/booking';
import { Service } from '@/types/service';
import { Hairdresser } from '@/types/hairdresser';

export default function NewVisit() {
  const { user, isLoaded } = useUser();
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

  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!selectedDate || (!watchServiceId && !watchHairdresserId)) return;
      
      setIsLoadingSlots(true);
      
      try {
        let queryParams = `date=${format(selectedDate, 'yyyy-MM-dd')}`;
        
        if (watchServiceId) {
          queryParams += `&serviceId=${watchServiceId}`;
        }
        
        const response = await fetch(`/api/bookings/availability?${queryParams}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch available slots');
        }
        
        const slots = await response.json();
        
        const filteredSlots = watchHairdresserId > 0
          ? slots.filter((slot: TimeSlot) => slot.hairdresserId === watchHairdresserId)
          : slots;
        
        setAvailableSlots(filteredSlots);
      } catch (err) {
        console.error('Error fetching available slots:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    };

    fetchAvailableSlots();
  }, [selectedDate, watchServiceId, watchHairdresserId]);

  const filteredServices = watchHairdresserId > 0
    ? services.filter(service => {
        const hairdresser = hairdressers.find(h => h.id === watchHairdresserId);
        return hairdresser?.services.some(s => s.id === service.id);
      })
    : services;

  const slotsGroupedByHairdresser = availableSlots.reduce((acc, slot) => {
    if (!acc[slot.hairdresserId]) {
      acc[slot.hairdresserId] = [];
    }
    if (slot.available) {
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
          <CardTitle>Booking Confirmed</CardTitle>
          <CardDescription>
            Your appointment has been scheduled
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-10">
          <div className="rounded-full bg-green-100 p-3 mb-4">
            <Check className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium mb-1">Thank you for your booking</h3>
          <p className="text-sm text-center text-muted-foreground mb-6">
            Your booking request has been received and is pending confirmation
          </p>
          <Button onClick={() => setBookingSuccess(false)}>
            Book Another Appointment
          </Button>
        </CardContent>
      </Card>
    );
  }

    return (
        <Card className="col-span-3">
            <CardHeader>
                <CardTitle>
                    Schedule a new visit
                </CardTitle>
                <CardDescription>
                    Schedule a new visit with your favorite hairdresser
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
                        disabled={services.length === 0}
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a service" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredServices.map((service) => (
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
                      <FormLabel>Hairdresser</FormLabel>
                      <Select
                        disabled={hairdressers.length === 0}
                        onValueChange={(value) => field.onChange(parseInt(value, 10))}
                        value={field.value ? field.value.toString() : undefined}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a hairdresser" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {hairdressers.map((hairdresser) => (
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
                  <FormLabel>Select Date & Time</FormLabel>
                  <div className="grid md:grid-cols-2 gap-4 border rounded-md mt-2">
                    <div className="p-4 border-r">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className="w-full justify-start text-left font-normal"
                            disabled={!watchServiceId}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            disabled={(date) => 
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
                              const hairdresser = hairdressers.find(h => h.id === parseInt(hairdresserId, 10));
                              return (
                                <div key={hairdresserId} className="space-y-2">
                                  {!watchHairdresserId && (
                                    <h4 className="text-sm font-medium">
                                      {hairdresser?.first_name} {hairdresser?.last_name}
                                    </h4>
                                  )}
                                  <div className="grid grid-cols-2 gap-2">
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
                                                  const appointmentDateTime = new Date(slot.startTime);
                                                  console.log("Selected time:", appointmentDateTime);
                                                  
                                                  field.onChange(appointmentDateTime);
                                                  
                                                  if (!watchHairdresserId) {
                                                    form.setValue('hairdresserId', slot.hairdresserId);
                                                  }
                                                  
                                                  setTimeout(() => {
                                                    console.log("Form values after selection:", form.getValues());
                                                  }, 100);
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
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-32 text-center">
                            <p className="text-muted-foreground">
                              No available slots found for this date
                            </p>
                          </div>
                        )
                      ) : (
                        <div className="flex flex-col items-center justify-center h-32 text-center">
                          <p className="text-muted-foreground">
                            Please select a date to view available time slots
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
                      <FormLabel>Notes (optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any special requests or notes for your appointment"
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
                    <p className="text-sm font-medium">Total price</p>
                    <p className="text-lg font-bold">${getServicePrice(watchServiceId)}</p>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || !form.getValues().appointmentDate}
                    onClick={() => {
                      const formValues = form.getValues();
                      console.log("Submitting form with values:", formValues);
                      if (!formValues.appointmentDate) {
                        form.setError('appointmentDate', {
                          type: 'required',
                          message: 'Please select an appointment time'
                        });
                      }
                    }}
                  >
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Book Appointment
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