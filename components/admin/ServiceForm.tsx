"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { Service } from "@/types/service";

const serviceSchema = z.object({
  name: z.string().min(1, "Nazwa usługi jest wymagana"),
  description: z.string().optional(),
  price: z.string().min(1, "Cena jest wymagana")
    .refine(val => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: "Cena musi być liczbą dodatnią",
    }),
  time_required: z.string().min(1, "Czas trwania jest wymagany")
    .refine(val => !isNaN(parseInt(val, 10)) && parseInt(val, 10) > 0, {
      message: "Czas trwania musi być liczbą dodatnią (w minutach)",
    }),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

interface ServiceFormProps {
  initialData?: Service;
  onSubmit: (data: ServiceFormValues) => Promise<void>;
}

export function ServiceForm({ initialData, onSubmit }: ServiceFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const defaultValues: ServiceFormValues = {
    name: initialData?.name || "",
    description: initialData?.description || "",
    price: initialData ? 
      (typeof initialData.price === 'number' ? 
       initialData.price : initialData.price) : "",
    time_required: initialData ? 
      (typeof initialData.time_required === 'number' ? 
       initialData.time_required : initialData.time_required) : "",
  };

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues,
  });

  const handleSubmit = async (data: ServiceFormValues) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nazwa usługi</FormLabel>
              <FormControl>
                <Input placeholder="Wpisz nazwę usługi" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Opis usługi (opcjonalnie)</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Dodaj opis usługi..." 
                  className="resize-none h-20"
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cena ($)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    placeholder="0.00" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="time_required"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Czas trwania (minuty)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="1" 
                    placeholder="30" 
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Zaktualizuj usługę" : "Dodaj usługę"}
          </Button>
        </div>
      </form>
    </Form>
  );
} 