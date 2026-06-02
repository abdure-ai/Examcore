import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

// Layouts
import AuthLayout from '../components/Layout/AuthLayout';
import DashboardLayout from '../components/Layout/DashboardLayout';

// Pages - Auth
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';

// Pages - Shared
import ProtectedRoute from './ProtectedRoute';

// Role Dashboards mapping
import AdminDashboard from '../pages/admin/Dashboard';
import InstructorDashboard from '../pages/instructor/Dashboard';
import StudentDashboard from '../pages/student/Dashboard';

// Admin Pages
import UserManagement from '../pages/admin/UserManagement';
import AuditLogs from '../pages/admin/AuditLogs';
import SystemSettings from '../pages/admin/SystemSettings';

// Instructor Pages
import Groups from '../pages/instructor/Groups';
import ExamManagement from '../pages/instructor/ExamManagement';

// Student Exams (read-only view)
import StudentExams from '../pages/student/StudentExams';
import QuestionBank from '../pages/instructor/QuestionBank';
import BulkImport from '../pages/instructor/BulkImport';
import AssignExam from '../pages/instructor/AssignExam';
import ExamResults from '../pages/instructor/ExamResults';
import ManualGrading from '../pages/instructor/ManualGrading';

// Student Pages
import ExamLobby from '../pages/student/ExamLobby';
import ExamTaker from '../pages/student/ExamTaker';
import ExamReview from '../pages/student/ExamReview';
import ResultPage from '../pages/student/ResultPage';
import NotificationsPage from '../pages/student/Notifications';

function ExamsResolver() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  return role === 'instructor' || role === 'super_admin'
    ? <ExamManagement />
    : <StudentExams />;
}

// Simple dashboard router resolver based on role
function RoleDashboardResolver() {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;

  if (role === 'super_admin') return <AdminDashboard />;
  if (role === 'instructor')  return <InstructorDashboard />;
  return <StudentDashboard />;
}

export default function AppRouter() {
  return (
    <Routes>
      {/* Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Authenticated Dashboard Routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<RoleDashboardResolver />} />
        
        {/* Super Admin specific */}
        <Route path="/users" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="/audit-logs" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <AuditLogs />
          </ProtectedRoute>
        } />
        <Route path="/settings" element={
          <ProtectedRoute allowedRoles={['super_admin']}>
            <SystemSettings />
          </ProtectedRoute>
        } />

        {/* Instructor specific */}
        <Route path="/groups" element={
          <ProtectedRoute allowedRoles={['instructor', 'super_admin']}>
            <Groups />
          </ProtectedRoute>
        } />
        <Route path="/exams" element={
          <ProtectedRoute allowedRoles={['instructor', 'student']}>
            <ExamsResolver />
          </ProtectedRoute>
        } />
        <Route path="/exams/:examId/questions" element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <QuestionBank />
          </ProtectedRoute>
        } />
        <Route path="/exams/:examId/import" element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <BulkImport />
          </ProtectedRoute>
        } />
        <Route path="/exams/:examId/assign" element={
          <ProtectedRoute allowedRoles={['instructor']}>
            <AssignExam />
          </ProtectedRoute>
        } />
        <Route path="/results" element={
          <ProtectedRoute allowedRoles={['instructor', 'student']}>
            <ExamResults />
          </ProtectedRoute>
        } />
        <Route path="/results/:resultId" element={
          <ProtectedRoute allowedRoles={['instructor', 'student']}>
            <ManualGrading />
          </ProtectedRoute>
        } />

        {/* Student specific */}
        <Route path="/exams/:examId/lobby" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamLobby />
          </ProtectedRoute>
        } />
        <Route path="/results/:resultId/review" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ExamReview />
          </ProtectedRoute>
        } />
        <Route path="/results/:resultId/summary" element={
          <ProtectedRoute allowedRoles={['student']}>
            <ResultPage />
          </ProtectedRoute>
        } />
        <Route path="/notifications" element={
          <ProtectedRoute allowedRoles={['student', 'instructor', 'super_admin']}>
            <NotificationsPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Direct Exam Taker Session (No Sidebars Layout) */}
      <Route path="/sessions/:sessionId/take" element={
        <ProtectedRoute allowedRoles={['student']}>
          <ExamTaker />
        </ProtectedRoute>
      } />

      {/* Default fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
