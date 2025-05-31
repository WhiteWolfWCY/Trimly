'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, Loader2, RefreshCw, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { isGoogleCalendarConnected, disconnectGoogleCalendar } from '@/actions/admin/google-calendar';
import { toast } from 'sonner';

export function CalendarSettings() {
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisconnecting, setIsDisconnecting] = useState(false);

  const checkConnection = async () => {
    setIsLoading(true);
    try {
      const connected = await isGoogleCalendarConnected();
      setIsConnected(connected);
    } catch (error) {
      console.error('Error checking Google Calendar connection:', error);
      toast.error('Failed to check Google Calendar connection');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      const response = await fetch('/api/auth/google-calendar');
      const data = await response.json();
      window.location.href = data.authUrl;
    } catch (error) {
      console.error('Error connecting to Google Calendar:', error);
      toast.error('Failed to connect to Google Calendar');
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectGoogleCalendar();
      setIsConnected(false);
      toast.success('Google Calendar disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting Google Calendar:', error);
      toast.error('Failed to disconnect Google Calendar');
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integracja z kalendarzem google</CardTitle>
        <CardDescription>
          Połącz salon z kalendarzem google
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <Alert className={isConnected ? 'bg-green-50' : 'bg-amber-50'}>
              <CalendarDays className={isConnected ? 'text-green-600' : 'text-amber-600'} />
              <AlertTitle className="ml-4">
                {isConnected ? 'Połączony' : 'Nie połączony'}
              </AlertTitle>
              <AlertDescription className="ml-4">
                {isConnected
                  ? 'Twój salon jest połączony. Wszystkie wizyty są synchronizowane.'
                  : 'Połącz swój salon, aby synchronizować wizyty z kalendarzem.'}
              </AlertDescription>
            </Alert>

            <div className="flex justify-end space-x-2">
              {isConnected ? (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={checkConnection}
                    disabled={isLoading || isDisconnecting}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Odświez
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <X className="mr-2 h-4 w-4" />
                    )}
                    Rozłącz
                  </Button>
                </>
              ) : (
                <Button onClick={handleConnect}>
                  <CalendarDays className="mr-2 h-4 w-4" />
                  Połącz z kalendarzem google
                </Button>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 