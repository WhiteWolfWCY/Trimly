import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HairdresserSection } from '@/components/admin/HairdresserSection';
import { ServicesSection } from '@/components/admin/ServicesSection';
import { getUserRole } from '@/actions/user/role';
import { redirect } from 'next/navigation';
import { auth } from '@clerk/nextjs/server';
import { BookingsSection } from '@/components/admin/BookingsSection';
import { CalendarSettings } from '@/components/admin/CalendarSettings';
import { CalendarDays, Scissors, ListChecks, Calendar } from 'lucide-react';
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
        <h1 className="text-4xl font-bold tracking-tight">Panel administracyjny</h1>
      </div>
      
      <Tabs defaultValue="hairdressers" className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger className="hover:cursor-pointer" value="hairdressers">
            <Scissors className="w-4 h-4 mr-2" />
            Fryzjerzy
          </TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="services">
            <ListChecks className="w-4 h-4 mr-2" />
            Usługi
          </TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="bookings">
            <Calendar className="w-4 h-4 mr-2" />
            Rezerwacje
          </TabsTrigger>
          <TabsTrigger className="hover:cursor-pointer" value="calendar">
            <CalendarDays className="w-4 h-4 mr-2" />
            Google Calendar
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="hairdressers">
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Zarządzaj fryzjerami</CardTitle>
              <CardDescription>
                Dodaj, edytuj lub usuń fryzjerów w twoim salonie.
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
              <CardTitle>Zarządzaj usługami</CardTitle>
              <CardDescription>
                Dodaj, edytuj lub usuń usługi oferowane przez twój salon.
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
              <CardTitle>Zarządzaj rezerwacjami</CardTitle>
              <CardDescription>
                Wyświetl i zarządzaj wszystkimi rezerwacjami w twoim salonie.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BookingsSection />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="calendar">
          <div className="max-w-2xl mx-auto">
            <CalendarSettings />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
