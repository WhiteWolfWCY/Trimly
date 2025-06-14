import { DayOfWeek, FormattedHairdresserData } from "./hairdresser";

export interface HairdresserFormProps {
  initialData?: {
    hairdresser: {
      first_name: string;
      last_name: string;
      phone_number?: string | null;
      city?: string | null;
      postal_code?: string | null;
      street?: string | null;
      house_number?: string | null;
      apartment_number?: string | null;
    };
    availability?: {
      dayOfWeek: string;
      startTime: string | Date;
      endTime: string | Date;
    }[];
    services?: number[];
  };
  onSubmit: (data: FormattedHairdresserData) => Promise<void>;
}

export interface HairdresserManagementProps {
  initialHairdressers?: any[];
}

export interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
} 