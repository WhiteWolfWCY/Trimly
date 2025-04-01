import { NextRequest, NextResponse } from 'next/server';
import { getServices, createService } from '@/actions/services/services-service';
import { z } from 'zod';

const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  price: z.string().min(1, "Price is required")
    .transform(val => parseFloat(val)),
  time_required: z.string().min(1, "Time required is required")
    .transform(val => parseInt(val, 10)),
});

export async function GET() {
  try {
    const services = await getServices();
    return NextResponse.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    return NextResponse.json(
      { error: 'Failed to fetch services' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = serviceSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.format() },
        { status: 400 }
      );
    }
    
    const newService = await createService({
      name: validation.data.name,
      price: validation.data.price.toString(),
      time_required: validation.data.time_required.toString(),
    });
    
    return NextResponse.json(newService, { status: 201 });
  } catch (error) {
    console.error('Error creating service:', error);
    return NextResponse.json(
      { error: 'Failed to create service' },
      { status: 500 }
    );
  }
} 