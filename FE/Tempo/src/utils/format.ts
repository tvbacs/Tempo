/**
 * Utility format functions
 */

export const formatDuration = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds <= 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const paddedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const paddedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${paddedMins}:${paddedSecs}`;
};

export const formatDurationMs = (ms: number): string => {
  return formatDuration(Math.floor(ms / 1000));
};
