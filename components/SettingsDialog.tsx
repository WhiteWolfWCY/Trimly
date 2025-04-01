"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Pencil } from "lucide-react";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

import { profileSchema, ProfileFormValues } from "@/types/user";
import { SettingsDialogProps } from "@/types/forms";

const SettingsDialog = ({ isOpen, onClose }: SettingsDialogProps) => {
  const { userId } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [editableFields, setEditableFields] = useState<{
    [key: string]: boolean;
  }>({
    firstName: false,
    lastName: false,
    email: false,
    phoneNumber: false,
  });

  const toggleFieldEdit = (fieldName: string) => {
    setEditableFields((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId || !isOpen) return;
      setIsLoading(true);

      try {
        const response = await fetch(`/api/profile?userId=${userId}`, {
          method: "GET",
        });

        if (response.ok) {
          const data = await response.json();
          if (data.profile && data.profile.length > 0) {
            const userProfile = data.profile[0];
            form.reset({
              firstName: userProfile.first_name,
              lastName: userProfile.last_name,
              email: userProfile.email,
              phoneNumber: userProfile.phone_number || "",
            });
            setIsLoading(false);
          } else {
            setIsLoading(false);
            console.error("Profile data is empty");
          }
        }
      } catch (error) {
        setIsLoading(false);
        console.error("Error fetching profile:", error);
      }
    };

    fetchUserProfile();
  }, [isOpen, userId, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!userId) return;

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          ...data,
        }),
      });

      if (response.ok) {
        toast("Profile updated successfully! Dialog will be now closed.");
        setTimeout(() => {
          onClose();
        }, 1250);
      } else {
        console.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setEditableFields({
        firstName: false,
        lastName: false,
        email: false,
        phoneNumber: false,
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your application preferences
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="space-y-2">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              </div>
            ) : (
              <Form {...form}>
                <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 pt-2"
              >
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <div className="flex items-center">
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!editableFields.firstName}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="link"
                            size="icon"
                            onClick={() => toggleFieldEdit("firstName")}
                          >
                            <Pencil className="h-0.5 w-0.5" />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <div className="flex items-center">
                          <FormControl>
                            <Input 
                              {...field} 
                              disabled={!editableFields.lastName}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="link"
                            size="icon"
                            onClick={() => toggleFieldEdit("lastName")}
                          >
                                <Pencil className="h-0.5 w-0.5" />
                          </Button>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <div className="flex items-center">
                        <FormControl>
                          <Input 
                            type="email" 
                            {...field} 
                            disabled={!editableFields.email}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="link"
                          size="icon"
                          onClick={() => toggleFieldEdit("email")}
                        >
                          <Pencil className="h-0.5 w-0.5" />
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <div className="flex items-center">
                        <FormControl>
                          <Input 
                            type="tel" 
                            {...field} 
                            disabled={!editableFields.phoneNumber}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          variant="link"
                          size="icon"
                          onClick={() => toggleFieldEdit("phoneNumber")}
                        >
                          <Pencil className="h-0.5 w-0.5" />
                        </Button>
                      </div>
                    </FormItem>
                  )}
                />

                <DialogFooter className="pt-4">
                  <Button variant="outline" type="button" onClick={()=>handleOpenChange(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={form.formState.isSubmitting}>
                    {form.formState.isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </DialogFooter>
                </form>
              </Form>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettingsDialog;
