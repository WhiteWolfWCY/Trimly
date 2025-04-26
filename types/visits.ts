import { Service } from './service';

export interface Visit {
    id: number;
    userId: string;
    hairdresserId: number;
    serviceId?: number;
    service: {
        id: number;
        name: string;
        price: number | string;
        time_required?: number;
    } | null;
    appointmentDate: Date | string;
    status: 'booked' | 'cancelled' | 'past';
    notes?: string;
    cancellationReason?: string;
    created_at: Date;
    updated_at: Date | null;
}