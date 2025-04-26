import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HairdresserSection } from '@/components/admin/HairdresserSection';
import { ServicesSection } from '@/components/admin/ServicesSection';
import { getUserRole } from '@/actions/user/role';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { BookingsSection } from '@/components/admin/BookingsSection';
export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect('/');
  }

  const role = await getUserRole(userId);

  if (role !== 'admin') {
    redirect('/');
  }

  return (
    <div className="flex flex-col min-h-screen p-8 space-y-6">
      <div className="flex items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">Admin Panel</h1>
      </div>
      
      <Tabs defaultValue="hairdressers" className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger className="hover:cursor-pointer" value="hairdressers">Hairdressers</TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="services">Services</TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="bookings">Bookings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="hairdressers">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Manage Hairdressers</CardTitle>
              <CardDescription>
                Add, edit or remove hairdressers in your salon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HairdresserSection />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="services">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Services Management</CardTitle>
              <CardDescription>
                Add, edit or remove services offered by your salon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ServicesSection />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="bookings">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Bookings Management</CardTitle>
              <CardDescription>
                View and manage all bookings across your salon.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsSection />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
