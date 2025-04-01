import { NextRequest, NextResponse } from 'next/server';
import { 
  getHairdressers, 
  createHairdresserWithRelations 
} from '@/actions/hairdressers/hairdresser-service';
import { z } from 'zod';
import { dayOfWeekEnum } from '@/db/schema';

const availabilitySchema = z.object({
  dayOfWeek: z.enum(dayOfWeekEnum.enumValues),
  startTime: z.string().transform(val => new Date(val)),
  endTime: z.string().transform(val => new Date(val)),
});

const hairdresserSchema = z.object({
  hairdresser: z.object({
    first_name: z.string().min(1, "First name is required"),
    last_name: z.string().min(1, "Last name is required"),
    phone_number: z.string().optional(),
  }),
  availability: z.array(availabilitySchema),
  services: z.array(z.number().positive()),
});

export async function GET() {
  try {
    const hairdressers = await getHairdressers();
    return NextResponse.json(hairdressers);
  } catch (error) {
    console.error('Error fetching hairdressers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hairdressers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = hairdresserSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }
    
    const newHairdresser = await createHairdresserWithRelations(validation.data);
    return NextResponse.json(newHairdresser, { status: 201 });
  } catch (error) {
    console.error('Error creating hairdresser:', error);
    return NextResponse.json(
      { error: 'Failed to create hairdresser' },
      { status: 500 }
    );
  }
} 