"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2, Plus, X, ChevronDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { Service } from "@/types/service";
import { 
  hairdresserSchema, 
  HairdresserFormValues, 
  FormattedHairdresserData, 
  DayOfWeek 
} from "@/types/hairdresser";
import { HairdresserFormProps } from "@/types/forms";

const daysOfWeek = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export function HairdresserForm({ initialData, onSubmit }: HairdresserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Fetch services
  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch("/api/services");
        if (response.ok) {
          const data = await response.json();
          setServices(data);
        } else {
          console.error("Failed to fetch services");
        }
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setIsLoadingServices(false);
      }
    };

    fetchServices();
  }, []);

  // Format initial availability data
  const formatTimeValue = (value: string | Date): string => {
    if (typeof value === 'string') {
      // Handle ISO strings or time strings
      if (value.includes('T')) {
        return format(new Date(value), "HH:mm");
      }
      return value.substring(0, 5); // extract "HH:MM" part
    }
    return format(value, "HH:mm");
  };

  // Prepare default values for the form
  const defaultValues: HairdresserFormValues = {
    hairdresser: {
      first_name: initialData?.hairdresser?.first_name || "",
      last_name: initialData?.hairdresser?.last_name || "",
      phone_number: initialData?.hairdresser?.phone_number || "",
    },
    availability: initialData?.availability?.map(avail => ({
      dayOfWeek: avail.dayOfWeek as any,
      startTime: formatTimeValue(avail.startTime),
      endTime: formatTimeValue(avail.endTime),
    })) || [{
      dayOfWeek: "monday",
      startTime: "09:00",
      endTime: "17:00",
    }],
    services: initialData?.services || [],
  };

  const form = useForm<HairdresserFormValues>({
    resolver: zodResolver(hairdresserSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "availability",
  });

  const handleSubmit = async (data: HairdresserFormValues) => {
    setIsSubmitting(true);
    try {
      // Convert time strings to Date objects for API
      const formattedData: FormattedHairdresserData = {
        ...data,
        availability: data.availability.map(avail => ({
          dayOfWeek: avail.dayOfWeek,
          startTime: new Date(`2000-01-01T${avail.startTime}:00`),
          endTime: new Date(`2000-01-01T${avail.endTime}:00`),
        })),
      };
      
      await onSubmit(formattedData);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get selected service names for display
  const getSelectedServiceNames = () => {
    const selectedIds = form.watch("services") || [];
    return services
      .filter(service => selectedIds.includes(service.id))
      .map(service => service.name);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
        <div className="space-y-3">
          <h3 className="text-base font-medium">Personal Information</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hairdresser.first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>First Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter first name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hairdresser.last_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter last name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hairdresser.phone_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number (Optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Enter phone number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Working Hours</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  dayOfWeek: "monday",
                  startTime: "09:00",
                  endTime: "17:00",
                })
              }
            >
              <Plus className="mr-1 h-3 w-3" />
              Add Day
            </Button>
          </div>

          <div className="space-y-2 max-h-[200px] overflow-y-auto pr-1">
            {fields.map((field, index) => (
              <div key={field.id} className="flex gap-2 items-center bg-muted/40 p-2 rounded-md">
                <FormField
                  control={form.control}
                  name={`availability.${index}.dayOfWeek`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Day" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {daysOfWeek.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
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
                  name={`availability.${index}.startTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="time"
                          className="h-8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="text-sm text-muted-foreground">to</div>

                <FormField
                  control={form.control}
                  name={`availability.${index}.endTime`}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input
                          type="time"
                          className="h-8"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          {form.formState.errors.availability?.message && (
            <p className="text-sm font-medium text-destructive">
              {form.formState.errors.availability.message}
            </p>
          )}
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-medium">Services</h3>
          <FormField
            control={form.control}
            name="services"
            render={({ field }) => (
              <FormItem>
                <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={`w-full justify-between h-auto min-h-[40px] items-center text-left font-normal ${!field.value?.length && "text-muted-foreground"}`}
                      >
                        {field.value?.length ? (
                          <div className="flex flex-wrap gap-1">
                            {getSelectedServiceNames().map(name => (
                              <Badge key={name} variant="secondary">
                                {name}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span>Select services</span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search services..." />
                      <CommandList>
                        <CommandEmpty>No services found.</CommandEmpty>
                        <CommandGroup>
                          {isLoadingServices ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            </div>
                          ) : (
                            services.map((service: Service) => {
                              const isSelected = field.value?.includes(service.id);
                              return (
                                <CommandItem
                                  key={service.id}
                                  onSelect={() => {
                                    const updatedValue = isSelected
                                      ? field.value.filter(id => id !== service.id)
                                      : [...(field.value || []), service.id];
                                    
                                    field.onChange(updatedValue);
                                  }}
                                >
                                  <div className="flex items-center gap-2 w-full">
                                    <Checkbox checked={isSelected} />
                                    <div className="flex-1">
                                      <p className="text-sm">{service.name}</p>
                                      <p className="text-xs text-muted-foreground">
                                        ${typeof service.price === 'number' 
                                          ? service.price
                                          : parseFloat(service.price.toString()).toFixed(2)} • {service.time_required} min
                                      </p>
                                    </div>
                                  </div>
                                </CommandItem>
                              );
                            })
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting || isLoadingServices}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Update Hairdresser" : "Add Hairdresser"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 