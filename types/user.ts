import { z } from "zod";

// User profile schema and types
export const profileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;

export type UserRole = "admin" | "user";

export type UserProfile = {
  id: number;
  userId: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}; 