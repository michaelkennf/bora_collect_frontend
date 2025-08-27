// Assurez-vous d'avoir installé react-router-dom : npm install react-router-dom
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import AccountCreatedSuccess from './pages/AccountCreatedSuccess';
import AdminHome, { DashboardAdmin } from './pages/AdminHome';
import ControllerHome, { DashboardController } from './pages/ControllerHome';
import AnalystHome from './pages/AnalystHome';
import RecordsList from './pages/RecordsList';
import RecordsSyncedList from './pages/RecordsSyncedList';
import SchoolForm from './pages/SchoolForm';
import ExportsStats from './pages/ExportsStats';
import AdminUsers from './pages/AdminUsers';
import AdminParametres from './pages/AdminParametres';
import AdminDeletedUsers from './pages/AdminDeletedUsers';
import AdminPendingApprovals from './pages/AdminPendingApprovals';
import AdminSurveyPublication from './pages/AdminSurveyPublication';
import AdminCandidatures from './pages/AdminCandidatures';
import ControllerAvailableSurveys from './pages/ControllerAvailableSurveys';
import Settings from './pages/Settings';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Route protégée selon le rôle
function PrivateRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  if (!token || !user) return <Navigate to="/login" />;
  const { role } = JSON.parse(user);
  if (!roles.includes(role)) return <Navigate to="/login" />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/account-created" element={<AccountCreatedSuccess />} />
          <Route path="/admin" element={<PrivateRoute roles={["ADMIN"]}><AdminHome /></PrivateRoute>}>
            <Route index element={<DashboardAdmin />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="pending-approvals" element={<AdminPendingApprovals />} />
            <Route path="survey-publication" element={<AdminSurveyPublication />} />
            <Route path="candidatures" element={<AdminCandidatures />} />
            <Route path="parametres" element={<AdminParametres />} />
            <Route path="deleted-users" element={<AdminDeletedUsers />} />
            <Route path="exports" element={<ExportsStats />} />
          </Route>
          <Route path="/controleur" element={<PrivateRoute roles={["CONTROLLER"]}><ControllerHome /></PrivateRoute>}>
            <Route index element={<DashboardController setView={() => {}} />} />
            <Route path="formulaire" element={<SchoolForm />} />
            <Route path="enquetes-disponibles" element={<ControllerAvailableSurveys />} />
            <Route path="parametres" element={<Settings />} />
          </Route>
          <Route path="/admin/utilisateurs" element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminUsers />
            </PrivateRoute>
          } />
          <Route path="/admin/parametres" element={
            <PrivateRoute roles={["ADMIN"]}>
              <AdminParametres />
            </PrivateRoute>
          } />
          <Route path="/analyst-home" element={
            <PrivateRoute roles={["ANALYST"]}>
              <AnalystHome />
            </PrivateRoute>
          } />
          <Route path="/analyst/parametres" element={
            <PrivateRoute roles={["ANALYST"]}>
              <Settings />
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Router>
    </>
  );
}
