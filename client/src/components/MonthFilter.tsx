import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar, ChevronsUpDown, Check } from 'lucide-react';

interface MonthFilterProps {
  selectedYears: number[];
  selectedMonths: number[];
  onYearsChange: (years: number[]) => void;
  onMonthsChange: (months: number[]) => void;
}

const MONTHS = [
  { value: 1, label: 'يناير' },
  { value: 2, label: 'فبراير' },
  { value: 3, label: 'مارس' },
  { value: 4, label: 'أبريل' },
  { value: 5, label: 'مايو' },
  { value: 6, label: 'يونيو' },
  { value: 7, label: 'يوليو' },
  { value: 8, label: 'أغسطس' },
  { value: 9, label: 'سبتمبر' },
  { value: 10, label: 'أكتوبر' },
  { value: 11, label: 'نوفمبر' },
  { value: 12, label: 'ديسمبر' },
];

export default function MonthFilter({ selectedYears, selectedMonths, onYearsChange, onMonthsChange }: MonthFilterProps) {
  const [monthsOpen, setMonthsOpen] = useState(false);
  const [yearsOpen, setYearsOpen] = useState(false);
  const years = Array.from({ length: 11 }, (_, i) => 2025 + i);

  const toggleMonth = (month: number) => {
    if (selectedMonths.includes(month)) {
      onMonthsChange(selectedMonths.filter(m => m !== month));
    } else {
      onMonthsChange([...selectedMonths, month].sort((a, b) => a - b));
    }
  };

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      onYearsChange(selectedYears.filter(y => y !== year));
    } else {
      onYearsChange([...selectedYears, year].sort((a, b) => b - a));
    }
  };

  const selectAllMonths = () => {
    onMonthsChange(MONTHS.map(m => m.value));
  };

  const clearAllMonths = () => {
    onMonthsChange([]);
  };

  const getSelectedMonthsText = () => {
    if (selectedMonths.length === 0) return 'اختر الأشهر';
    if (selectedMonths.length === MONTHS.length) return 'جميع الأشهر';
    if (selectedMonths.length === 1) {
      const month = MONTHS.find(m => m.value === selectedMonths[0]);
      return month?.label;
    }
    return `${selectedMonths.length} شهر محدد`;
  };

  const getSelectedYearsText = () => {
    if (selectedYears.length === 0) return 'اختر السنوات';
    if (selectedYears.length === 1) return selectedYears[0].toString();
    return `${selectedYears.length} سنة محددة`;
  };

  return (
    <div className="glass-card rounded-2xl p-6 mb-6" data-testid="month-filter">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-gray-700 dark:text-white" />
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">فلترة حسب الفترة الزمنية</h3>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={selectAllMonths}
            data-testid="button-select-all-months"
          >
            تحديد الكل
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllMonths}
            data-testid="button-clear-all-months"
          >
            إلغاء الكل
          </Button>
        </div>
      </div>

      {/* Year and Month Selection Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Year Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">السنوات</label>
          <Popover open={yearsOpen} onOpenChange={setYearsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={yearsOpen}
                className="w-full justify-between bg-purple-600 text-white border-purple-700 hover:bg-purple-700"
                data-testid="button-year-dropdown"
              >
                {getSelectedYearsText()}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-white" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="ابحث عن سنة..." data-testid="input-search-years" />
                <CommandList>
                  <CommandEmpty>لا توجد نتائج</CommandEmpty>
                  <CommandGroup>
                    {years.map(year => {
                      const isSelected = selectedYears.includes(year);
                      return (
                        <CommandItem
                          key={year}
                          value={year.toString()}
                          onSelect={() => toggleYear(year)}
                          data-testid={`button-year-${year}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                              isSelected ? 'bg-primary border-primary' : 'border-input'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span>{year}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* Month Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-white mb-2">الأشهر</label>
          <Popover open={monthsOpen} onOpenChange={setMonthsOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={monthsOpen}
                className="w-full justify-between"
                data-testid="button-month-dropdown"
              >
                {getSelectedMonthsText()}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput placeholder="ابحث عن شهر..." data-testid="input-search-months" />
                <CommandList>
                  <CommandEmpty>لا توجد نتائج</CommandEmpty>
                  <CommandGroup>
                    {MONTHS.map(month => {
                      const isSelected = selectedMonths.includes(month.value);
                      return (
                        <CommandItem
                          key={month.value}
                          value={month.label}
                          onSelect={() => toggleMonth(month.value)}
                          data-testid={`button-month-${month.value}`}
                        >
                          <div className="flex items-center gap-2 w-full">
                            <div className={`flex h-4 w-4 items-center justify-center rounded border ${
                              isSelected ? 'bg-primary border-primary' : 'border-input'
                            }`}>
                              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                            </div>
                            <span>{month.label}</span>
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}
