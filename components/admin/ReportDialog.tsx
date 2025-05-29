'use client';

import { useState } from 'react';
import { format, subDays, isBefore } from 'date-fns';
import { pl } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateExcelReport } from '@/actions/admin/generateExcelReport';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [fromDatePickerOpen, setFromDatePickerOpen] = useState(false);
  const [toDatePickerOpen, setToDatePickerOpen] = useState(false);

  const handleGenerateReport = async () => {
    if (!dateRange.from || !dateRange.to || isBefore(dateRange.to, dateRange.from)) {
      toast.error('Wybierz prawidłowy zakres dat');
      return;
    }

    setIsLoading(true);
    try {
      const reportData = await generateExcelReport({
        from: format(dateRange.from, 'yyyy-MM-dd'),
        to: format(dateRange.to, 'yyyy-MM-dd'),
      });
      
      const blob = new Blob([reportData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `raport-rezerwacji-${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Raport został wygenerowany i pobrany');
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Wystąpił błąd podczas generowania raportu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFromDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({ ...prev, from: date }));
    }
    setFromDatePickerOpen(false);
  };

  const handleToDateSelect = (date: Date | undefined) => {
    if (date) {
      setDateRange(prev => ({ ...prev, to: date }));
    }
    setToDatePickerOpen(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Generuj raport Excel</DialogTitle>
            <DialogDescription>
              Wybierz zakres dat aby wygenerować plik Excel z raportem rezerwacji.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="text-sm font-medium mb-2">Zakres dat</div>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.from && "text-muted-foreground"
                  )}
                  onClick={() => setFromDatePickerOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    format(dateRange.from, 'PPP', { locale: pl })
                  ) : (
                    <span>Od daty</span>
                  )}
                </Button>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !dateRange.to && "text-muted-foreground"
                  )}
                  onClick={() => setToDatePickerOpen(true)}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange.to ? (
                    format(dateRange.to, 'PPP', { locale: pl })
                  ) : (
                    <span>Do daty</span>
                  )}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading || !dateRange.from || !dateRange.to || isBefore(dateRange.to, dateRange.from)}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generowanie...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Pobierz raport Excel
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Separate Dialog for From Date Picker */}
      <Dialog open={fromDatePickerOpen} onOpenChange={setFromDatePickerOpen}>
        <DialogContent className="sm:max-w-[350px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Wybierz datę początkową</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={handleFromDateSelect}
              initialFocus
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Separate Dialog for To Date Picker */}
      <Dialog open={toDatePickerOpen} onOpenChange={setToDatePickerOpen}>
        <DialogContent className="sm:max-w-[350px] p-0">
          <DialogHeader className="p-4 pb-0">
            <DialogTitle>Wybierz datę końcową</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={handleToDateSelect}
              initialFocus
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
} 