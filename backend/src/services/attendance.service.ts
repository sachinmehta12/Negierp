export class AttendanceService {
  /**
   * Calculates overall attendance percentage: (Present + Late) / Total * 100.0
   * Defaults to 100.0 if no records exist.
   */
  static calculatePercentage(records: { status: string }[]): number {
    if (!records || records.length === 0) {
      return 0.0;
    }

    const total = records.length;
    const attended = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    return Math.round((attended / total) * 1000) / 10;
  }
}
