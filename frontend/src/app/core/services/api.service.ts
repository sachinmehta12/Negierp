import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'https://negierp.onrender.com/api';

  // ----------------- STUDENTS -----------------
  getStudents(params?: { class?: number; stream?: number; subjectId?: number; status?: string; q?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.class) httpParams = httpParams.set('class', params.class.toString());
    if (params?.stream) httpParams = httpParams.set('stream', params.stream.toString());
    if (params?.subjectId) httpParams = httpParams.set('subjectId', params.subjectId.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.q) httpParams = httpParams.set('q', params.q);
    return this.http.get(`${this.baseUrl}/students`, { params: httpParams });
  }

  getStudentById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/students/${id}`);
  }

  createStudent(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/students`, data);
  }

  updateStudent(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/students/${id}`, data);
  }

  toggleStudentActive(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/students/${id}/toggle-active`, {});
  }

  assignStudentSubjects(id: number, subjectIds: number[], lockSubjects?: boolean): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/${id}/assign-subjects`, { subjectIds, lockSubjects });
  }

  deleteStudent(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/students/${id}`);
  }

  updateSelfProfile(data: { contactNumber?: string; address?: string; emergencyContact?: string }): Observable<any> {
    return this.http.put(`${this.baseUrl}/students/self/profile`, data);
  }

  getSelfProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/students/self/profile`);
  }

  selectSelfStream(data: { streamId: number; lockStream?: boolean }): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/self/stream`, data);
  }

  selectSelfSubjects(data: { subjectIds: number[]; lockSubjects?: boolean }): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/self/subjects`, data);
  }

  submitAdmissionEnquiry(data: { name: string; phone: string; email?: string; targetClass: number; stream?: string; message?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/students/enquiry`, data);
  }

  // ----------------- STREAMS -----------------
  getStreams(): Observable<any> {
    return this.http.get(`${this.baseUrl}/streams`);
  }

  createStream(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/streams`, data);
  }

  updateStream(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/streams/${id}`, data);
  }

  deleteStream(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/streams/${id}`);
  }

  // ----------------- SUBJECTS -----------------
  getSubjects(params?: { class?: number; streamId?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.class) httpParams = httpParams.set('class', params.class.toString());
    if (params?.streamId !== undefined) httpParams = httpParams.set('streamId', params.streamId.toString());
    return this.http.get(`${this.baseUrl}/subjects`, { params: httpParams });
  }

  createSubject(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/subjects`, data);
  }

  updateSubject(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/subjects/${id}`, data);
  }

  deleteSubject(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/subjects/${id}`);
  }

  getMySubjects(): Observable<any> {
    return this.http.get(`${this.baseUrl}/subjects/my`);
  }

  updateMySubjects(subjectIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/subjects/my`, { subjectIds });
  }

  // ----------------- ATTENDANCE -----------------
  getAttendanceRegister(targetClass: number, date: string, subjectId?: number): Observable<any> {
    let params = new HttpParams()
      .set('class', targetClass.toString())
      .set('date', date);
    if (subjectId) params = params.set('subjectId', subjectId.toString());
    return this.http.get(`${this.baseUrl}/attendance/register`, { params });
  }

  recordAttendance(data: { targetClass: number; date: string; subjectId?: number | null; entries: { studentId: number; status: string; remarks?: string }[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/attendance/record`, data);
  }

  getStudentAttendance(): Observable<any> {
    return this.http.get(`${this.baseUrl}/attendance/my`);
  }

  // ----------------- FEES -----------------
  getFees(params?: { class?: number; status?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.class) httpParams = httpParams.set('class', params.class.toString());
    if (params?.status) httpParams = httpParams.set('status', params.status);
    return this.http.get(`${this.baseUrl}/fees`, { params: httpParams });
  }

  recordFeePayment(studentId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/fees/record/${studentId}`, data);
  }

  verifyFeePayment(paymentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/fees/verify/${paymentId}`, {});
  }

  batchVerifyFees(paymentIds: number[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/fees/batch-verify`, { paymentIds });
  }

  rejectFeePayment(paymentId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/fees/reject/${paymentId}`, {});
  }

  adjustFeeStructure(studentId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/fees/adjust/${studentId}`, data);
  }

  getFeeReceipt(paymentId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/fees/receipt/${paymentId}`);
  }

  getStudentFees(): Observable<any> {
    return this.http.get(`${this.baseUrl}/fees/my`);
  }

  studentSubmitPayment(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/fees/my/submit`, data);
  }

  // ----------------- EXAMS & MARKS -----------------
  getExams(params?: { class?: number; subjectId?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.class) httpParams = httpParams.set('class', params.class.toString());
    if (params?.subjectId) httpParams = httpParams.set('subjectId', params.subjectId.toString());
    return this.http.get(`${this.baseUrl}/exams`, { params: httpParams });
  }

  createExam(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/exams`, data);
  }

  updateExam(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/exams/${id}`, data);
  }

  deleteExam(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/exams/${id}`);
  }

  getExamMarksheet(examId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/exams/${examId}/marksheet`);
  }

  recordExamMarks(examId: number, marksEntries: { studentId: number; marksObtained: any; isAbsent: boolean; remarks?: string }[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/exams/${examId}/marks`, { marksEntries });
  }

  getStudentMarks(): Observable<any> {
    return this.http.get(`${this.baseUrl}/exams/my/results`);
  }

  // ----------------- TIMETABLE -----------------
  getTimetable(params?: { class?: number; view?: 'my' | 'class' }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.class) httpParams = httpParams.set('class', params.class.toString());
    if (params?.view) httpParams = httpParams.set('view', params.view);
    return this.http.get(`${this.baseUrl}/timetable`, { params: httpParams });
  }

  createTimetableSlot(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/timetable`, data);
  }

  deleteTimetableSlot(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/timetable/${id}`);
  }

  getStudentTimetable(): Observable<any> {
    return this.http.get(`${this.baseUrl}/timetable/my`);
  }

  // ----------------- ANNOUNCEMENTS -----------------
  getAnnouncements(targetClass?: string): Observable<any> {
    let httpParams = new HttpParams();
    if (targetClass) httpParams = httpParams.set('class', targetClass);
    return this.http.get(`${this.baseUrl}/announcements`, { params: httpParams });
  }

  createAnnouncement(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/announcements`, data);
  }

  deleteAnnouncement(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/announcements/${id}`);
  }

  // ----------------- HOMEWORK -----------------
  getHomework(params?: { class?: number; subjectId?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.class) httpParams = httpParams.set('class', params.class.toString());
    if (params?.subjectId) httpParams = httpParams.set('subjectId', params.subjectId.toString());
    return this.http.get(`${this.baseUrl}/homework`, { params: httpParams });
  }

  createHomework(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/homework`, data);
  }

  deleteHomework(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/homework/${id}`);
  }

  getStudentHomework(): Observable<any> {
    return this.http.get(`${this.baseUrl}/homework/my`);
  }

  markHomeworkComplete(homeworkId: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/homework/${homeworkId}/complete`, {});
  }

  // ----------------- CHANGE REQUESTS -----------------
  getChangeRequests(status = 'Pending'): Observable<any> {
    return this.http.get(`${this.baseUrl}/change-requests`, { params: { status } });
  }

  submitChangeRequest(data: { requestType: string; details: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-requests`, data);
  }

  handleChangeRequest(id: number, data: { action: 'approve' | 'reject'; mentorRemarks?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/change-requests/${id}/action`, data);
  }

  getStudentChangeRequests(): Observable<any> {
    return this.http.get(`${this.baseUrl}/change-requests/my`);
  }

  // ----------------- ANALYTICS -----------------
  getDashboardAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/dashboard`);
  }

  getAcademicAnalytics(): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/academic`);
  }

  // ----------------- REPORTS -----------------
  downloadReport(reportType: 'students' | 'fees' | 'marks' | 'attendance') {
    window.open(`${this.baseUrl}/reports/${reportType}.csv`, '_blank');
  }

  // ----------------- FACULTY (OWNER & PUBLIC) -----------------
  getPublicFaculty(): Observable<any> {
    return this.http.get(`${this.baseUrl}/faculty/public`);
  }

  getFaculty(): Observable<any> {
    return this.http.get(`${this.baseUrl}/faculty`);
  }

  createFaculty(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/faculty`, data);
  }

  updateFaculty(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/faculty/${id}`, data);
  }

  toggleFacultyActive(id: number): Observable<any> {
    return this.http.patch(`${this.baseUrl}/faculty/${id}/toggle-active`, {});
  }

  deleteFaculty(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/faculty/${id}`);
  }

  // ----------------- TESTIMONIALS -----------------
  getPublicTestimonials(): Observable<any> {
    return this.http.get(`${this.baseUrl}/testimonials/public`);
  }

  getTestimonials(): Observable<any> {
    return this.http.get(`${this.baseUrl}/testimonials`);
  }

  createTestimonial(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/testimonials`, data);
  }

  updateTestimonial(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/testimonials/${id}`, data);
  }

  deleteTestimonial(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/testimonials/${id}`);
  }

  // ----------------- SETTINGS -----------------
  getSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/settings`);
  }

  updateSettings(data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/settings`, data);
  }
}
