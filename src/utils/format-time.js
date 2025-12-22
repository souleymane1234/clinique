import dayjs from 'dayjs';
import { fr } from 'date-fns/locale';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { format, getTime, formatDistanceToNow } from 'date-fns';

dayjs.extend(customParseFormat);
// ----------------------------------------------------------------------

export function fDate(date, newFormat) {
  const fm = newFormat || 'dd MMM yyyy';

  return date ? format(new Date(date), fm, { locale: fr }) : '';
}

export function fDateByDateString(date, newFormat) {
  const arrayDate = date.toString().split('-');
  const fm = newFormat || 'dd MMM yyyy';

  return date
    ? format(
        new Date(
          parseInt(arrayDate[0], 10),
          parseInt(arrayDate[1], 10) - 1,
          parseInt(arrayDate[2], 10)
        ),
        fm,
        { locale: fr }
      )
    : '';
}

export function fDateTime(date, newFormat) {
  const fm = newFormat || 'dd MMM yyyy p';

  return date ? format(new Date(date), fm, { locale: fr }) : '';
}

export function fTime(date, newFormat) {
  const fm = newFormat || 'HH:mm';

  return date ? format(new Date(date), fm, { locale: fr }) : '';
}

export function fTimestamp(date) {
  return date ? getTime(new Date(date)) : '';
}

export function fToNow(date) {
  return date
    ? formatDistanceToNow(new Date(date), {
        addSuffix: true,
        locale: fr,
        includeSeconds: true,
      })
    : '';
}

export const disabledDate = (current) => current && current < dayjs().endOf('day');
