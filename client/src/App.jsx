import { BrowserRouter, Routes, Route } from 'react-router-dom';
import StudentLogin from './pages/StudentLogin';
import StudentEditor from './pages/StudentEditor';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminStudentDetail from './pages/AdminStudentDetail';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StudentLogin />} />
        <Route path="/story" element={<StudentEditor />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/students/:id" element={<AdminStudentDetail />} />
      </Routes>
    </BrowserRouter>
  );
}
