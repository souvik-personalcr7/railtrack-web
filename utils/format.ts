export interface DelayFormat {
  text: string;
  shortText: string;
  color: string;
  badgeBg: string;
}

/**
 * Formats train delay according to requirements:
 * - If on time: "On Time"
 * - If delayed: "Delayed by X minutes"
 */
export function formatDelay(minutes: number): DelayFormat {
  if (minutes <= 0) {
    return {
      text: 'On Time',
      shortText: 'On Time',
      color: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    };
  }

  const text = minutes === 1 ? 'Delayed by 1 minute' : `Delayed by ${minutes} minutes`;
  const shortText = `+${minutes}m delay`;

  if (minutes < 15) {
    return {
      text,
      shortText,
      color: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    };
  }

  return {
    text,
    shortText,
    color: 'text-rose-600 dark:text-rose-400',
    badgeBg: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  };
}

export function formatDistance(km: number): string {
  return `${Math.round(km)} km`;
}

export function formatTimeAgo(isoTimestamp: string): string {
  const diffMs = Date.now() - new Date(isoTimestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  return `${Math.floor(diffMin / 60)}h ago`;
}

/**
 * Calculates the difference in minutes between scheduled time and actual time (actual - scheduled).
 * Returns null if either time string is missing or invalid.
 * Handles 24-hour midnight wrap-around.
 */
export function diffMinutes(scheduledTime?: string, actualTime?: string): number | null {
  if (!scheduledTime || !actualTime || scheduledTime === '--:--' || actualTime === '--:--') {
    return null;
  }

  const parseMins = (str: string): number | null => {
    if (str.includes('T')) {
      const d = new Date(str);
      if (isNaN(d.getTime())) return null;
      return d.getHours() * 60 + d.getMinutes();
    }
    const match = str.trim().match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  };

  const sched = parseMins(scheduledTime);
  const act = parseMins(actualTime);
  if (sched === null || act === null) return null;

  let diff = act - sched;
  // Handle midnight wrap-around
  if (diff < -720) diff += 1440;
  else if (diff > 720) diff -= 1440;

  return diff;
}

/**
 * Adds minutes (positive or negative) to a given time string (e.g. "14:30" or ISO timestamp).
 * Automatically handles 24-hour midnight rollover (e.g., "23:50" + 25m = "00:15").
 * Returns formatted "HH:mm".
 */
export function addMinutesToTime(timeStr?: string, minutes: number = 0): string {
  if (!timeStr || timeStr === '--:--' || timeStr.trim() === '') return '--:--';
  if (!minutes) return timeStr;

  let hours = 0;
  let mins = 0;

  if (timeStr.includes('T')) {
    const d = new Date(timeStr);
    if (!isNaN(d.getTime())) {
      d.setMinutes(d.getMinutes() + minutes);
      return d.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Asia/Kolkata',
      });
    }
  }

  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})/);
  if (!match) return timeStr;

  hours = parseInt(match[1], 10);
  mins = parseInt(match[2], 10);

  if (isNaN(hours) || isNaN(mins)) return timeStr;

  const totalMinutes = hours * 60 + mins + minutes;
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const newHours = Math.floor(normalizedMinutes / 60);
  const newMins = normalizedMinutes % 60;

  return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
}

/**
 * Returns the effective time after delay.
 * If actualTime is present and valid, returns actualTime.
 * Otherwise, if delayMinutes > 0 and scheduledTime is valid, calculates scheduledTime + delayMinutes.
 * If not delayed, returns scheduledTime.
 */
export function getDelayedTime(
  scheduledTime?: string,
  actualTime?: string,
  delayMinutes: number = 0
): string {
  if (actualTime && actualTime !== '--:--' && actualTime.trim() !== '') {
    return actualTime;
  }
  if (scheduledTime && scheduledTime !== '--:--' && scheduledTime.trim() !== '') {
    if (delayMinutes > 0) {
      return addMinutesToTime(scheduledTime, delayMinutes);
    }
    return scheduledTime;
  }
  return '--:--';
}
