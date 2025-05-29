"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Pencil, 
  Trash2, 
  Plus, 
  Clock, 
  DollarSign, 
  Loader2, 
  Search, 
  Scissors 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { ServiceForm } from "./ServiceForm";
import { Service, getServicePrice, getServiceTimeRequired } from "@/types/service";

interface ServiceManagementProps {
  initialServices?: Service[];
}

export function ServiceManagement({ initialServices = [] }: ServiceManagementProps) {
  const router = useRouter();
  const [services, setServices] = useState<Service[]>(initialServices);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(!initialServices.length);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!initialServices.length) {
      fetchServices();
    }
  }, [initialServices]);

  const fetchServices = async () => {
    setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleAddService = async (data: any) => {
    try {
      const response = await fetch("/api/services", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchServices();
        setIsAddDialogOpen(false);
        router.refresh();
      } else {
        console.error("Failed to add service");
      }
    } catch (error) {
      console.error("Error adding service:", error);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditService = async (data: any) => {
    if (!selectedService) return;

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchServices();
        setIsEditDialogOpen(false);
        router.refresh();
      } else {
        console.error("Failed to update service");
      }
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleDeleteService = async () => {
    if (!selectedService) return;

    try {
      const response = await fetch(`/api/services/${selectedService.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchServices();
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        console.error("Failed to delete service");
      }
    } catch (error) {
      console.error("Error deleting service:", error);
    }
  };

  const formatPrice = (price: string | number): string => {
    const numPrice = getServicePrice(price);
    return `${numPrice.toFixed(2)}`;
  };

  const formatTime = (time: string | number): string => {
    const minutes = getServiceTimeRequired(time);
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h${remainingMinutes > 0 ? ` ${remainingMinutes}m` : ''}`;
    }
    return `${minutes} min`;
  };

  const filteredServices = services.filter(
    (service) => service.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Wyszukaj usługi..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Dodaj usługę
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dodaj nową usługę</DialogTitle>
              <DialogDescription>
                Wpisz szczegóły nowej usługi poniżej.
              </DialogDescription>
            </DialogHeader>
            <ServiceForm onSubmit={handleAddService} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-y-auto max-h-[500px] pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4 border rounded-lg bg-muted/50">
            <Scissors className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">Nie znaleziono usług</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Spróbuj dostosować swoje wyszukiwanie"
                : "Dodaj usługę, aby rozpocząć"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredServices.map((service) => (
              <Card key={service.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">{service.name}</h3>
                        <div className="flex items-center space-x-3 text-sm text-muted-foreground mt-1">
                          <div className="flex items-center">
                            <DollarSign className="h-3 w-3 mr-1" />
                            {formatPrice(service.price)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(service.time_required)}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedService(service);
                          setIsEditDialogOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edytuj</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedService(service);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Usuń</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edytuj usługę</DialogTitle>
            <DialogDescription>
              Zaktualizuj informacje o usłudze poniżej.
            </DialogDescription>
          </DialogHeader>
          {selectedService && (
            <ServiceForm
              initialData={selectedService}
              onSubmit={handleEditService}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Czy jesteś pewny?</AlertDialogTitle>
            <AlertDialogDescription>
              To usunie usługę{' '}
              {selectedService && (
                <span className="font-medium">
                  {selectedService.name}
                </span>
              )}.
              Ta akcja nie może zostać cofnięta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Anuluj</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteService}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Usuń
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 