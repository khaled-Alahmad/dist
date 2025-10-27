// @ts-ignore
import momentHijri from 'moment-hijri';

export type DateType = 'gregorian' | 'hijri';

export function formatDate(
  dateString: string,
  dateType: DateType = 'gregorian',
  format?: string
): string {
  if (!dateString) return '';

  try {
    if (dateType === 'hijri') {
      const m = momentHijri(dateString, 'YYYY-MM-DD');
      return m.format(format || 'iYYYY/iM/iD');
    } else {
      const date = new Date(dateString);
      if (format) {
        return momentHijri(date).format(format);
      }
      return date.toLocaleDateString('ar-SA-u-ca-gregory', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

export function formatDateLong(
  dateString: string,
  dateType: DateType = 'gregorian'
): string {
  if (!dateString) return '';

  try {
    if (dateType === 'hijri') {
      const m = momentHijri(dateString, 'YYYY-MM-DD');
      return m.format('iD iMMMM iYYYY');
    } else {
      const date = new Date(dateString);
      return date.toLocaleDateString('ar-SA-u-ca-gregory', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString;
  }
}

export function convertGregorianToHijri(dateString: string): string {
  if (!dateString) return '';
  
  try {
    const m = momentHijri(dateString, 'YYYY-MM-DD');
    return m.format('iYYYY-iMM-iDD');
  } catch (error) {
    console.error('Error converting to Hijri:', error);
    return dateString;
  }
}

export function convertHijriToGregorian(hijriDate: string): string {
  if (!hijriDate) return '';
  
  try {
    const m = momentHijri(hijriDate, 'iYYYY-iMM-iDD');
    return m.format('YYYY-MM-DD');
  } catch (error) {
    console.error('Error converting to Gregorian:', error);
    return hijriDate;
  }
}

export function getCurrentDate(dateType: DateType = 'gregorian'): string {
  const now = momentHijri();
  
  if (dateType === 'hijri') {
    return now.format('iYYYY-iMM-iDD');
  } else {
    return now.format('YYYY-MM-DD');
  }
}

export function getMonthName(month: number, dateType: DateType = 'gregorian'): string {
  if (dateType === 'hijri') {
    const hijriMonths = [
      'محرم', 'صفر', 'ربيع الأول', 'ربيع الثاني',
      'جمادى الأولى', 'جمادى الآخرة', 'رجب', 'شعبان',
      'رمضان', 'شوال', 'ذو القعدة', 'ذو الحجة'
    ];
    return hijriMonths[month - 1] || '';
  } else {
    const gregorianMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return gregorianMonths[month - 1] || '';
  }
}
