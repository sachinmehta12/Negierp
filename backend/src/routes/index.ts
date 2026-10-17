import { Router } from 'express';
import authRoutes from './auth.routes';
import studentRoutes from './student.routes';
import streamRoutes from './stream.routes';
import subjectRoutes from './subject.routes';
import attendanceRoutes from './attendance.routes';
import feeRoutes from './fee.routes';
import examRoutes from './exam.routes';
import timetableRoutes from './timetable.routes';
import announcementRoutes from './announcement.routes';
import homeworkRoutes from './homework.routes';
import changeRequestRoutes from './change-request.routes';
import analyticsRoutes from './analytics.routes';
import reportRoutes from './report.routes';
import facultyRoutes from './faculty.routes';
import settingsRoutes from './settings.routes';
import testimonialRoutes from './testimonial.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/students', studentRoutes);
router.use('/streams', streamRoutes);
router.use('/subjects', subjectRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/fees', feeRoutes);
router.use('/exams', examRoutes);
router.use('/timetable', timetableRoutes);
router.use('/announcements', announcementRoutes);
router.use('/homework', homeworkRoutes);
router.use('/change-requests', changeRequestRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/reports', reportRoutes);
router.use('/faculty', facultyRoutes);
router.use('/settings', settingsRoutes);
router.use('/testimonials', testimonialRoutes);

export default router;
