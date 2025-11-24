import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(duration);
dayjs.extend(relativeTime);

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatDate(dateString: string): string {
  return dayjs(dateString).format("MMM D, YYYY");
}

export function formatDateTime(dateString: string): string {
  return dayjs(dateString).format("MMM D, YYYY h:mm A");
}

export function formatRelative(dateString: string): string {
  return dayjs(dateString).fromNow();
}

export function calculateDuration(start: string, end?: string): number {
  const startTime = dayjs(start);
  const endTime = end ? dayjs(end) : dayjs();
  return endTime.diff(startTime, "minute");
}

export { dayjs };
