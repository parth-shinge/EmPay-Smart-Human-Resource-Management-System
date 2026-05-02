import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import DashboardLayout from '@/components/DashboardLayout';

// Public pages
import LandingPage from '@/pages/LandingPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Protected pages
import DashboardPage from '@/pages/DashboardPage';
import AttendancePage from '@/pages/AttendancePage';
import AttendanceAllPage from '@/pages/AttendanceAllPage';
import LeaveApplyPage from '@/pages/LeaveApplyPage';
import LeaveMyPage from '@/pages/LeaveMyPage';
import LeaveManagePage from '@/pages/LeaveManagePage';
import EmployeesPage from '@/pages/EmployeesPage';
import EmployeeDetailPage from '@/pages/EmployeeDetailPage';
import SalaryPage from '@/pages/SalaryPage';
import PayrollPage from '@/pages/PayrollPage';
import PayslipsPage from '@/pages/PayslipsPage';
import ProfilePage from '@/pages/ProfilePage';
import SettingsPage from '@/pages/SettingsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#191f31',
              color: '#dce1fb',
              border: '1px solid rgba(6,182,212,0.2)',
            },
          }}
        />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes with sidebar layout */}
          <Route
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />

            {/* Attendance */}
            <Route path="/attendance" element={<AttendancePage />} />
            <Route path="/attendance/all" element={
              <ProtectedRoute roles={['ADMIN', 'HR_OFFICER']}>
                <AttendanceAllPage />
              </ProtectedRoute>
            } />

            {/* Leave */}
            <Route path="/leave/apply" element={<LeaveApplyPage />} />
            <Route path="/leave/my" element={<LeaveMyPage />} />
            <Route path="/leave/manage" element={
              <ProtectedRoute roles={['ADMIN', 'PAYROLL_OFFICER']}>
                <LeaveManagePage />
              </ProtectedRoute>
            } />

            {/* Employees */}
            <Route path="/employees" element={
              <ProtectedRoute roles={['ADMIN', 'HR_OFFICER']}>
                <EmployeesPage />
              </ProtectedRoute>
            } />
            <Route path="/employees/:id" element={
              <ProtectedRoute roles={['ADMIN', 'HR_OFFICER']}>
                <EmployeeDetailPage />
              </ProtectedRoute>
            } />

            {/* Payroll */}
            <Route path="/salary" element={
              <ProtectedRoute roles={['ADMIN', 'PAYROLL_OFFICER']}>
                <SalaryPage />
              </ProtectedRoute>
            } />
            <Route path="/payroll" element={
              <ProtectedRoute roles={['ADMIN', 'PAYROLL_OFFICER']}>
                <PayrollPage />
              </ProtectedRoute>
            } />
            <Route path="/payroll/payslips" element={<PayslipsPage />} />

            {/* Profile & Settings */}
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/settings" element={
              <ProtectedRoute roles={['ADMIN']}>
                <SettingsPage />
              </ProtectedRoute>
            } />
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
