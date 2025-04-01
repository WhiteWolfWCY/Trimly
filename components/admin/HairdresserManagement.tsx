"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Trash2,
  Plus,
  Scissors,
  Phone,
  Loader2,
  Search,
  UserRound,
  Clock,
  Calendar
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { HairdresserForm } from "./HairdresserForm";
import { format } from "date-fns";

import { Hairdresser, HairdresserDetails, FormattedHairdresserData } from "@/types/hairdresser";
import { Service } from "@/types/service";
import { HairdresserManagementProps } from "@/types/forms";

export function HairdresserManagement({ initialHairdressers = [] }: HairdresserManagementProps) {
  const router = useRouter();
  const [hairdressers, setHairdressers] = useState<Hairdresser[]>(initialHairdressers);
  const [selectedHairdresser, setSelectedHairdresser] = useState<HairdresserDetails | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(!initialHairdressers.length);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDetailsOpen, setIsViewDetailsOpen] = useState(false);

  useEffect(() => {
    if (!initialHairdressers.length) {
      fetchHairdressers();
    }
    fetchServices();
  }, [initialHairdressers]);

  const fetchHairdressers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/hairdressers");
      if (response.ok) {
        const data = await response.json();
        setHairdressers(data);
      } else {
        console.error("Failed to fetch hairdressers");
      }
    } catch (error) {
      console.error("Error fetching hairdressers:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
    }
  };

  const fetchHairdresserDetails = async (id: number) => {
    setIsLoadingDetails(true);
    try {
      const response = await fetch(`/api/hairdressers/${id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedHairdresser(data);
        return data;
      } else {
        console.error("Failed to fetch hairdresser details");
        return null;
      }
    } catch (error) {
      console.error("Error fetching hairdresser details:", error);
      return null;
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAddHairdresser = async (data: FormattedHairdresserData) => {
    try {
      const response = await fetch("/api/hairdressers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchHairdressers();
        setIsAddDialogOpen(false);
        router.refresh();
      } else {
        console.error("Failed to add hairdresser");
      }
    } catch (error) {
      console.error("Error adding hairdresser:", error);
    }
  };

  const handleEditHairdresser = async (data: FormattedHairdresserData) => {
    if (!selectedHairdresser) return;

    try {
      const response = await fetch(`/api/hairdressers/${selectedHairdresser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        fetchHairdressers();
        setIsEditDialogOpen(false);
        router.refresh();
      } else {
        console.error("Failed to update hairdresser");
      }
    } catch (error) {
      console.error("Error updating hairdresser:", error);
    }
  };

  const handleDeleteHairdresser = async () => {
    if (!selectedHairdresser) return;

    try {
      const response = await fetch(`/api/hairdressers/${selectedHairdresser.id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchHairdressers();
        setIsDeleteDialogOpen(false);
        router.refresh();
      } else {
        console.error("Failed to delete hairdresser");
      }
    } catch (error) {
      console.error("Error deleting hairdresser:", error);
    }
  };

  const handleEditClick = async (hairdresser: Hairdresser) => {
    const details = await fetchHairdresserDetails(hairdresser.id);
    if (details) {
      setIsEditDialogOpen(true);
    }
  };
  
  const handleViewDetailsClick = async (hairdresser: Hairdresser) => {
    const details = await fetchHairdresserDetails(hairdresser.id);
    if (details) {
      setIsViewDetailsOpen(true);
    }
  };

  const getServiceNameById = (id: number) => {
    const service = services.find(s => s.id === id);
    return service ? service.name : "Unknown service";
  };

  const formatDayOfWeek = (day: string) => {
    return day.charAt(0).toUpperCase() + day.slice(1);
  };

  const formatTime = (timeInput: string | Date): string => {
    if (!timeInput) return "";
    try {
      // Handle Date objects directly
      if (timeInput instanceof Date) {
        return format(timeInput, "h:mm a");
      }
      
      // Handle ISO strings
      if (typeof timeInput === 'string' && timeInput.includes('T')) {
        const date = new Date(timeInput);
        return format(date, "h:mm a");
      }
      
      // Handle time strings like "09:00:00"
      if (typeof timeInput === 'string') {
        return format(new Date(`2000-01-01T${timeInput}`), "h:mm a");
      }
      
      return String(timeInput);
    } catch (error) {
      console.error("Error formatting time:", error);
      return String(timeInput);
    }
  };

  const filteredHairdressers = hairdressers.filter(
    (hairdresser) =>
      hairdresser.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      hairdresser.last_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search hairdressers..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Hairdresser
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Hairdresser</DialogTitle>
              <DialogDescription>
                Enter the details of the new hairdresser below.
              </DialogDescription>
            </DialogHeader>
            <HairdresserForm onSubmit={handleAddHairdresser} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-y-auto max-h-[500px] pr-2">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredHairdressers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center p-4 border rounded-lg bg-muted/50">
            <UserRound className="h-8 w-8 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No hairdressers found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {searchQuery
                ? "Try adjusting your search query"
                : "Add a hairdresser to get started"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredHairdressers.map((hairdresser) => (
              <Card key={hairdresser.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-4">
                      <div className="bg-primary/10 p-2 rounded-full">
                        <Scissors className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-medium">
                          {hairdresser.first_name} {hairdresser.last_name}
                        </h3>
                        {hairdresser.phone_number && (
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Phone className="h-3 w-3 mr-1" />
                            {hairdresser.phone_number}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleViewDetailsClick(hairdresser)}
                      >
                        <Clock className="h-4 w-4" />
                        <span className="sr-only">View Details</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditClick(hairdresser)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedHairdresser(hairdresser as any);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                        <span className="sr-only">Delete</span>
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
        <DialogContent className="max-w-xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Hairdresser</DialogTitle>
            <DialogDescription>
              Update the hairdresser's information below.
            </DialogDescription>
          </DialogHeader>
          {selectedHairdresser && (
            <HairdresserForm
              initialData={{
                hairdresser: {
                  first_name: selectedHairdresser.first_name,
                  last_name: selectedHairdresser.last_name,
                  phone_number: selectedHairdresser.phone_number || "",
                },
                availability: selectedHairdresser.availability,
                services: selectedHairdresser.serviceIds,
              }}
              onSubmit={handleEditHairdresser}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDetailsOpen} onOpenChange={setIsViewDetailsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hairdresser Details</DialogTitle>
          </DialogHeader>
          {selectedHairdresser && !isLoadingDetails ? (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Personal Information</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{selectedHairdresser.first_name} {selectedHairdresser.last_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{selectedHairdresser.phone_number || "—"}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Availability</h3>
                <div className="space-y-2">
                  {selectedHairdresser.availability?.length > 0 ? (
                    selectedHairdresser.availability.map((avail) => (
                      <div key={avail.id} className="flex justify-between border-b pb-2">
                        <div className="font-medium">{formatDayOfWeek(avail.dayOfWeek)}</div>
                        <div className="text-muted-foreground">
                          {formatTime(avail.startTime)} - {formatTime(avail.endTime)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No availability set</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium mb-2">Services</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedHairdresser.serviceIds?.length > 0 ? (
                    selectedHairdresser.serviceIds.map((id) => (
                      <Badge key={id} variant="outline">
                        {getServiceNameById(id)}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-muted-foreground">No services assigned</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the hairdresser{' '}
              {selectedHairdresser && (
                <span className="font-medium">
                  {selectedHairdresser.first_name} {selectedHairdresser.last_name}
                </span>
              )}.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteHairdresser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 