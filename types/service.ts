export type Service = {
  id: number;
  name: string;
  description?: string | null;
  price: string;
  time_required: string;
  created_at: Date;
  updated_at: Date | null;
};

export type NewService = {
  name: string;
  description?: string | null;
  price: string | number;
  time_required: string | number;
  created_at?: Date;
  updated_at?: Date | null;
};

export const getServicePrice = (price: string | number): number => {
  return typeof price === 'number' ? price : parseFloat(price);
};

export const getServiceTimeRequired = (time: string | number): number => {
  return typeof time === 'number' ? time : parseInt(time, 10);
};