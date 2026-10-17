export class ExamService {
  /**
   * Computes grade based on percentage achieved against maximum marks.
   */
  static calculateGrade(marksObtained: number | null | undefined, maxMarks: number, isAbsent: boolean): string {
    if (isAbsent || marksObtained === null || marksObtained === undefined) {
      return 'Ab';
    }

    const safeMax = maxMarks > 0 ? maxMarks : 100;
    const percentage = (marksObtained / safeMax) * 100;

    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 33) return 'D';
    return 'F';
  }
}
