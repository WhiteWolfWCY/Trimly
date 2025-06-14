"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { format } from "date-fns";
import { Service } from "@/types/service";
import { 
  hairdresserSchema, 
  HairdresserFormValues, 
  FormattedHairdresserData, 
} from "@/types/hairdresser";
import { HairdresserFormProps } from "@/types/forms";

const daysOfWeek = [
  { value: "monday", label: "Poniedziałek" },
  { value: "tuesday", label: "Wtorek" },
  { value: "wednesday", label: "Środa" },
  { value: "thursday", label: "Czwartek" },
  { value: "friday", label: "Piątek" },
  { value: "saturday", label: "Sobota" },
  { value: "sunday", label: "Niedziela" },
];

export function HairdresserForm({ initialData, onSubmit }: HairdresserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoadingServices, setIsLoadingServices] = useState(true);
  const [popoverOpen, setPopoverOpen] = useState(false);

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

  const formatTimeValue = (value: string | Date): string => {
    if (typeof value === 'string') {
      if (value.includes('T')) {
        return format(new Date(value), "HH:mm");
      }
      return value.substring(0, 5);
    }
    return format(value, "HH:mm");
  };

  const defaultValues: HairdresserFormValues = {
    hairdresser: {
      first_name: initialData?.hairdresser?.first_name || "",
      last_name: initialData?.hairdresser?.last_name || "",
      phone_number: initialData?.hairdresser?.phone_number || "",
      city: initialData?.hairdresser?.city || "",
      postal_code: initialData?.hairdresser?.postal_code || "",
      street: initialData?.hairdresser?.street || "",
      house_number: initialData?.hairdresser?.house_number || "",
      apartment_number: initialData?.hairdresser?.apartment_number || "",
    },
    availability: initialData?.availability?.map(avail => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          <h3 className="text-base font-medium">Dane osobowe</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hairdresser.first_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Imię</FormLabel>
                  <FormControl>
                    <Input placeholder="Wpisz imię" {...field} />
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
                  <FormLabel>Nazwisko</FormLabel>
                  <FormControl>
                    <Input placeholder="Wpisz nazwisko" {...field} />
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
                <FormLabel>Numer telefonu (opcjonalnie)</FormLabel>
                <FormControl>
                  <Input placeholder="Wpisz numer telefonu" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="space-y-3">
          <h3 className="text-base font-medium">Adres</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hairdresser.city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Miasto (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="Wpisz miasto" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hairdresser.postal_code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Kod pocztowy (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="00-000" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hairdresser.street"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ulica (opcjonalnie)</FormLabel>
                <FormControl>
                  <Input placeholder="Wpisz nazwę ulicy" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="hairdresser.house_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numer domu (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="Numer domu" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hairdresser.apartment_number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Numer mieszkania (opcjonalnie)</FormLabel>
                  <FormControl>
                    <Input placeholder="Numer mieszkania" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-medium">Godziny pracy</h3>
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
              Dodaj dzień
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
                            <SelectValue placeholder="Dzień" />
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
          <h3 className="text-base font-medium">Usługi</h3>
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
                          <span>Wybierz usługi</span>
                        )}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-[300px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Wyszukaj usługi..." />
                      <CommandList>
                        <CommandEmpty>Nie znaleziono usług.</CommandEmpty>
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
            {initialData ? "Zaktualizuj fryzjera" : "Dodaj fryzjera"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 