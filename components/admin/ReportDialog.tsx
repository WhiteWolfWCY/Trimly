'use client';

import { useState } from 'react';
import { format, subDays, isBefore, startOfMonth, endOfMonth, startOfYear, endOfYear, startOfQuarter, endOfQuarter } from 'date-fns';
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2, CalendarIcon, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { generateExcelReport } from '@/actions/admin/generateExcelReport';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type ReportTab = 'monthly' | 'quarterly' | 'yearly' | 'custom';

export function ReportDialog({ open, onOpenChange }: ReportDialogProps) {
  const [activeTab, setActiveTab] = useState<ReportTab>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  // For custom date range
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });
  const [fromDatePickerOpen, setFromDatePickerOpen] = useState(false);
  const [toDatePickerOpen, setToDatePickerOpen] = useState(false);
  
  // For monthly reports
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  
  // For quarterly reports
  const [quarterYear, setQuarterYear] = useState(new Date().getFullYear());
  const [selectedQuarter, setSelectedQuarter] = useState<number | null>(null);
  
  // For yearly reports
  const [yearlyYear, setYearlyYear] = useState(new Date().getFullYear());

  // Generate year options (last 10 years + current + next 2 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 13 }, (_, i) => currentYear - 10 + i);
  
  // Generate month options
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i,
    label: format(new Date(2024, i, 1), 'LLLL', { locale: pl })
  }));

  const quarterOptions = [
    { value: 1, label: 'I', period: 'I kwartał (sty-mar)' },
    { value: 2, label: 'II', period: 'II kwartał (kwi-cze)' },
    { value: 3, label: 'III', period: 'III kwartał (lip-wrz)' },
    { value: 4, label: 'IV', period: 'IV kwartał (paź-gru)' },
  ];

  const getDateRangeForTab = (): { from: Date; to: Date } | null => {
    switch (activeTab) {
      case 'monthly':
        const monthStart = startOfMonth(new Date(selectedYear, selectedMonth, 1));
        const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth, 1));
        return { from: monthStart, to: monthEnd };
      
      case 'quarterly':
        if (selectedQuarter === null) return null;
        const quarterStart = startOfQuarter(new Date(quarterYear, (selectedQuarter - 1) * 3, 1));
        const quarterEnd = endOfQuarter(new Date(quarterYear, (selectedQuarter - 1) * 3, 1));
        return { from: quarterStart, to: quarterEnd };
      
      case 'yearly':
        const yearStart = startOfYear(new Date(yearlyYear, 0, 1));
        const yearEnd = endOfYear(new Date(yearlyYear, 0, 1));
        return { from: yearStart, to: yearEnd };
      
      case 'custom':
        if (!dateRange.from || !dateRange.to || isBefore(dateRange.to, dateRange.from)) {
          return null;
        }
        return dateRange;
      
      default:
        return null;
    }
  };

  const handleGenerateReport = async () => {
    const reportDateRange = getDateRangeForTab();
    
    if (!reportDateRange) {
      toast.error('Wybierz prawidłowy zakres dat');
      return;
    }

    setIsLoading(true);
    try {
      const reportData = await generateExcelReport({
        from: format(reportDateRange.from, 'yyyy-MM-dd'),
        to: format(reportDateRange.to, 'yyyy-MM-dd'),
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

  const isReportReady = () => {
    switch (activeTab) {
      case 'monthly':
        return true; // Always ready as year and month have defaults
      case 'quarterly':
        return selectedQuarter !== null;
      case 'yearly':
        return true; // Always ready as year has default
      case 'custom':
        return dateRange.from && dateRange.to && !isBefore(dateRange.to, dateRange.from);
      default:
        return false;
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generuj raport Excel</DialogTitle>
            <DialogDescription>
              Wybierz typ raportu i zakres dat aby wygenerować plik Excel z raportem rezerwacji.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as ReportTab)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="monthly">Miesięczny</TabsTrigger>
              <TabsTrigger value="quarterly">Kwartalny</TabsTrigger>
              <TabsTrigger value="yearly">Roczny</TabsTrigger>
              <TabsTrigger value="custom">Dowolny</TabsTrigger>
            </TabsList>

            <TabsContent value="monthly" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rok</label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {yearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Miesiąc</label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {monthOptions.map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                Raport za: {format(new Date(selectedYear, selectedMonth, 1), 'LLLL yyyy', { locale: pl })}
              </div>
            </TabsContent>

            <TabsContent value="quarterly" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rok</label>
                <Select value={quarterYear.toString()} onValueChange={(value) => setQuarterYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Kwartał</label>
                <div className="grid grid-cols-4 gap-2">
                  {quarterOptions.map((quarter) => (
                    <Button
                      key={quarter.value}
                      variant={selectedQuarter === quarter.value ? "default" : "outline"}
                      className="flex flex-col h-auto py-3"
                      onClick={() => setSelectedQuarter(quarter.value)}
                    >
                      <span className="font-bold text-lg">{quarter.label}</span>
                      <span className="text-[8px] opacity-70">{quarter.period}</span>
                    </Button>
                  ))}
                </div>
              </div>
              {selectedQuarter && (
                <div className="text-sm text-muted-foreground">
                  Raport za: {quarterOptions.find(q => q.value === selectedQuarter)?.period} {quarterYear}
                </div>
              )}
            </TabsContent>

            <TabsContent value="yearly" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Rok</label>
                <Select value={yearlyYear.toString()} onValueChange={(value) => setYearlyYear(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {yearOptions.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-muted-foreground">
                Raport za: cały rok {yearlyYear}
              </div>
            </TabsContent>

            <TabsContent value="custom" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Zakres dat</label>
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
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button
              onClick={handleGenerateReport}
              disabled={isLoading || !isReportReady()}
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