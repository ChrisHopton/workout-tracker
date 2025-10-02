import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';

dayjs.extend(isoWeek);
dayjs.extend(utc);

export function startOfIsoWeek(date = dayjs()) {
  return dayjs(date).startOf('isoWeek');
}

export function formatIso(date) {
  return dayjs(date).format('YYYY-MM-DD');
}

export default dayjs;
