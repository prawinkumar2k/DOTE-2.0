import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Home from '../pages/Home';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import StudentResetPassword from '../pages/Auth/StudentResetPassword';
import AdminDashboard from '../pages/Admin/Dashboard';
import ManageColleges from '../pages/Admin/ManageColleges';
import MasterData from '../pages/Admin/MasterData';
import Reports from '../pages/Admin/Reports';
import StudentApplications from '../pages/Admin/StudentApplications';
import StudentApplicationReport from '../pages/Admin/StudentApplicationReport';
import AdminReportPreview from '../pages/Admin/ReportPreview';
import CollegeDashboard from '../pages/College/Dashboard';
import ApplicationsList from '../pages/College/ApplicationsList';
import ApplicationDetail from '../pages/College/ApplicationDetail';
import CollegeReports from '../pages/College/Reports';
import CollegeReportPreview from '../pages/College/ReportPreview';
import ApplicationForm from '../pages/Student/ApplicationForm';
import StudentPayment from '../pages/Student/StudentPayment';
import MyApp from '../pages/Student/MyApp';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/student-register" element={<Register />} />
      <Route path="/student/reset-password" element={<StudentResetPassword />} />

      {/* Admin Routes */}
      <Route element={<ProtectedRoute role="admin" />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/colleges" element={<ManageColleges />} />
        <Route path="/admin/student-applications" element={<StudentApplications />} />
        <Route path="/admin/student-applications/:id/report" element={<StudentApplicationReport />} />
        <Route path="/admin/master-data" element={<MasterData />} />
        <Route path="/admin/reports" element={<Reports />} />
        <Route path="/admin/reports/preview" element={<AdminReportPreview />} />
      </Route>

      {/* College Routes */}
      <Route element={<ProtectedRoute role="college" />}>
        <Route path="/college/dashboard" element={<CollegeDashboard />} />
        <Route path="/college/applications" element={<ApplicationsList />} />
        <Route path="/college/applications/:id" element={<ApplicationDetail />} />
        <Route path="/college/reports" element={<CollegeReports />} />
        <Route path="/college/reports/preview" element={<CollegeReportPreview />} />
      </Route>

      {/* Student Routes */}
      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student/apply" element={<ApplicationForm />} />
        <Route path="/student/payment" element={<StudentPayment />} />
        <Route path="/student/my-application" element={<MyApp />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;
