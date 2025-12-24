// utils/rosterUtils.ts
// Utility functions for roster management

/**
 * Check if a roster has expired
 * @param roster The roster object to check
 * @returns boolean indicating if the roster has expired
 */
export const isRosterExpired = (roster: any): boolean => {
  if (!roster) return true;
  
  // Get the end date of the roster
  const endDateString = roster.end_date || roster.week_dates?.end;
  if (!endDateString) return true;
  
  // Parse the end date
  const endDate = new Date(endDateString);
  
  // Add one day to the end date to include the end date itself
  endDate.setDate(endDate.getDate() + 1);
  
  // Compare with current date
  const currentDate = new Date();
  
  // Roster is expired if current date is after the end date
  return currentDate > endDate;
};

/**
 * Check if a roster is active (not expired)
 * @param roster The roster object to check
 * @returns boolean indicating if the roster is active
 */
export const isRosterActive = (roster: any): boolean => {
  return !isRosterExpired(roster);
};

/**
 * Filter rosters to only include active ones
 * @param rosters Array of roster objects
 * @returns Array of active roster objects
 */
export const getActiveRosters = (rosters: unknown[]): unknown[] => {
  return rosters.filter(isRosterActive);
};

/**
 * Filter rosters to only include expired ones
 * @param rosters Array of roster objects
 * @returns Array of expired roster objects
 */
export const getExpiredRosters = (rosters: unknown[]): unknown[] => {
  return rosters.filter(isRosterExpired);
};

/**
 * Get the status of a roster
 * @param roster The roster object to check
 * @returns 'active', 'expired', or 'unknown'
 */
export const getRosterStatus = (roster: any): 'active' | 'expired' | 'unknown' => {
  if (!roster) return 'unknown';
  
  if (isRosterExpired(roster)) {
    return 'expired';
  }
  
  return 'active';
};

/**
 * Format a date to a readable string
 * @param dateString The date string to format
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'Unknown date';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Get human-readable status text for a roster
 * @param roster The roster object to check
 * @returns Status text ('Active', 'Expired', or 'Unknown')
 */
export const getRosterStatusText = (roster: any): string => {
  const status = getRosterStatus(roster);
  
  switch (status) {
    case 'active':
      return 'Active';
    case 'expired':
      return 'Expired';
    default:
      return 'Unknown';
  }
};

/**
 * Get status badge class for a roster
 * @param roster The roster object to check
 * @returns CSS class for the status badge
 */
export const getRosterStatusBadgeClass = (roster: any): string => {
  const status = getRosterStatus(roster);
  
  switch (status) {
    case 'active':
      return 'px-3 py-1 bg-green-500/10 text-green-400 rounded-full text-xs font-bold border border-green-500/20 uppercase tracking-wide';
    case 'expired':
      return 'px-3 py-1 bg-red-500/10 text-red-400 rounded-full text-xs font-bold border border-red-500/20 uppercase tracking-wide';
    default:
      return 'px-3 py-1 bg-gray-500/10 text-gray-400 rounded-full text-xs font-bold border border-gray-500/20 uppercase tracking-wide';
  }
};