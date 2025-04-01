import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HairdresserSection } from '@/components/admin/HairdresserSection';
import { ServicesSection } from '@/components/admin/ServicesSection';
import { getUserRole } from '@/actions/user/role';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
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
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
      </div>
      
      <Tabs defaultValue="hairdressers" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="hairdressers">Hairdressers</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="bookings">Bookings</TabsTrigger>
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
                Coming soon...
              </CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
