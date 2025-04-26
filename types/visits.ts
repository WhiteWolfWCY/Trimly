import { Service } from './service';

export type Visit = {
    id: number;
    userId: string;
    hairdresserId: number;
    serviceId: number;
    service?: Service;
    appointmentDate: string;
    status: 'booked' | 'cancelled' | 'past';
    notes?: string;
    cancellationReason?: string;
    created_at: Date;
    updated_at: Date | null;
  };