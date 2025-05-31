import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getStatusTranslation = (status: string) => {
  switch(status) {
    case 'booked': return 'Aktywna';
    case 'cancelled': return 'Anulowana';
    case 'past': return 'Miniona';
    default: return status;
  }
};
