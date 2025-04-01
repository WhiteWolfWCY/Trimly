export type Visit = {
    id: number;
    userId: string;
    hairdresserId: number;
    serviceId: number;
    appointmentDate: string;
    status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    cancellationReason?: string;
  };