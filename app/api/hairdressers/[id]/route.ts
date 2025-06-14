import { NextRequest, NextResponse } from 'next/server';
import { 
  getHairdresserById, 
  updateHairdresserWithRelations, 
  deleteHairdresser,
} from '@/actions/hairdressers/hairdresser-service';
import { getHairdresserAvailability } from '@/actions/hairdressers/hairdresser-availability-service';
import { getHairdresserServices } from '@/actions/hairdressers/hairdresser-services-service';
import { z } from 'zod';
import { dayOfWeekEnum } from '@/db/schema';
import { HairdresserUpdateRelations } from '@/types/hairdresser';
import { getUserRole } from '@/actions/user/role';
import { auth } from '@clerk/nextjs/server';

const availabilitySchema = z.object({
  dayOfWeek: z.enum(dayOfWeekEnum.enumValues),
  startTime: z.string().transform(val => new Date(val)),
  endTime: z.string().transform(val => new Date(val)),
});

const hairdresserUpdateSchema = z.object({
  hairdresser: z.object({
    first_name: z.string().min(1, "First name is required").optional(),
    last_name: z.string().min(1, "Last name is required").optional(),
    phone_number: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    postal_code: z.string().optional().nullable(),
    street: z.string().optional().nullable(),
    house_number: z.string().optional().nullable(),
    apartment_number: z.string().optional().nullable(),
  }),
  availability: z.array(availabilitySchema).optional(),
  services: z.array(z.number().positive()).optional(),
});

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(userId);

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
      return NextResponse.json(
        { error: 'Invalid hairdresser ID' },
        { status: 400 }
      );
    }
    
    const hairdresser = await getHairdresserById(idNumber);
    if (!hairdresser) {
      return NextResponse.json(
        { error: 'Hairdresser not found' },
        { status: 404 }
      );
    }
    
    const availability = await getHairdresserAvailability(idNumber);
    const serviceRelations = await getHairdresserServices(idNumber);
    const serviceIds = serviceRelations.map(relation => relation.serviceId);
    
    return NextResponse.json({
      ...hairdresser,
      availability,
      serviceIds
    });
  } catch (error) {
    console.error('Error fetching hairdresser:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hairdresser' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(userId);

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
      return NextResponse.json(
        { error: 'Invalid hairdresser ID' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const validation = hairdresserUpdateSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }
    
    const updateData: HairdresserUpdateRelations = validation.data;
    
    const updatedHairdresser = await updateHairdresserWithRelations(idNumber, updateData);
    if (!updatedHairdresser) {
      return NextResponse.json(
        { error: 'Hairdresser not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedHairdresser);
  } catch (error) {
    console.error('Error updating hairdresser:', error);
    return NextResponse.json(
      { error: 'Failed to update hairdresser' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  const { id } = await params;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const role = await getUserRole(userId);

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const idNumber = Number(id);
    if (isNaN(idNumber)) {
      return NextResponse.json(
        { error: 'Invalid hairdresser ID' },
        { status: 400 }
      );
    }
    
    const deleted = await deleteHairdresser(idNumber);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Hairdresser not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting hairdresser:', error);
    return NextResponse.json(
      { error: 'Failed to delete hairdresser' },
      { status: 500 }
    );
  }
} 