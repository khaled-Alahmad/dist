import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { SchoolSettings } from '@shared/schema';
import { formatDate, formatDateLong, type DateType } from '@/lib/dateUtils';

interface SchoolSettingsContextType {
  settings: SchoolSettings | undefined;
  isLoading: boolean;
  currency: string;
  currencySymbol: string;
  dateType: DateType;
  formatDate: (dateString: string) => string;
  formatDateLong: (dateString: string) => string;
}

const SchoolSettingsContext = createContext<SchoolSettingsContextType | undefined>(undefined);

const CURRENCY_SYMBOLS: Record<string, string> = {
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  EGP: 'ج.م',
  JOD: 'د.ا',
  LBP: 'ل.ل',
  IQD: 'د.ع',
  SYP: 'ل.س',
  MAD: 'د.م',
  TND: 'د.ت',
  DZD: 'د.ج',
  LYD: 'د.ل',
  SDG: 'ج.س',
  YER: 'ر.ي',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
  CNY: '¥',
  INR: '₹',
  PKR: '₨',
  BDT: '৳',
  TRY: '₺',
  IRR: '﷼',
  AFN: '؋',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
  NZD: 'NZ$',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  PLN: 'zł',
  ZAR: 'R',
  BRL: 'R$',
  MXN: 'MX$',
  ARS: 'AR$',
  CLP: 'CL$',
  COP: 'CO$',
  SGD: 'S$',
  MYR: 'RM',
  THB: '฿',
  IDR: 'Rp',
  PHP: '₱',
  VND: '₫',
  KRW: '₩',
  HKD: 'HK$',
  TWD: 'NT$',
};

export function SchoolSettingsProvider({ children }: { children: ReactNode }) {
  const { data: settings, isLoading } = useQuery<SchoolSettings>({
    queryKey: ['/api/school-settings'],
  });

  const currency = settings?.currency || 'SAR';
  const currencySymbol = CURRENCY_SYMBOLS[currency] || currency;
  const dateType: DateType = (settings?.dateType as DateType) || 'gregorian';

  const formatDateWithSettings = (dateString: string) => {
    return formatDate(dateString, dateType);
  };

  const formatDateLongWithSettings = (dateString: string) => {
    return formatDateLong(dateString, dateType);
  };

  return (
    <SchoolSettingsContext.Provider 
      value={{ 
        settings, 
        isLoading, 
        currency, 
        currencySymbol, 
        dateType,
        formatDate: formatDateWithSettings,
        formatDateLong: formatDateLongWithSettings
      }}
    >
      {children}
    </SchoolSettingsContext.Provider>
  );
}

export function useSchoolSettings() {
  const context = useContext(SchoolSettingsContext);
  if (context === undefined) {
    throw new Error('useSchoolSettings must be used within a SchoolSettingsProvider');
  }
  return context;
}
