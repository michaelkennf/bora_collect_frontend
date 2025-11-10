// Assurez-vous d'avoir installé react-router-dom : npm install react-router-dom
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ProjectManagerRegistration from './pages/ProjectManagerRegistration';
import AccountCreatedSuccess from './pages/AccountCreatedSuccess';
import AdminHome, { DashboardAdmin } from './pages/AdminHome';
import ControllerHome, { DashboardController } from './pages/ControllerHome';
import AnalystHome from './pages/AnalystHome';
import ProjectManagerHome from './pages/ProjectManagerHome';
import PMEnumeratorRequests from './pages/PMEnumeratorRequests';
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
  
  console.log('🔍 PrivateRoute - Token:', !!token, 'User:', !!user);
  console.log('🔍 PrivateRoute - Roles attendus:', roles);
  
  if (!token || !user) {
    console.log('❌ PrivateRoute - Token ou user manquant, redirection vers login');
    return <Navigate to="/login" />;
  }
  
  try {
    const userData = JSON.parse(user);
    console.log('🔍 PrivateRoute - User data:', userData);
    console.log('🔍 PrivateRoute - User role:', userData.role);
    console.log('🔍 PrivateRoute - User status:', userData.status);
    
    // Vérifier que les données utilisateur sont valides
    if (!userData || !userData.role || !userData.id) {
      console.log('❌ PrivateRoute - Données utilisateur invalides');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" />;
    }
    
    // Vérifier si l'utilisateur est actif (sauf pour les PM qui peuvent être PENDING_APPROVAL)
    if (userData.status && userData.status !== 'ACTIVE' && userData.status !== 'PENDING_APPROVAL') {
      console.log('❌ PrivateRoute - Utilisateur non actif:', userData.status);
      return <Navigate to="/login" />;
    }
    
    // Pour les PM en attente d'approbation, permettre l'accès mais avec un message
    if (userData.status === 'PENDING_APPROVAL' && userData.role === 'PROJECT_MANAGER') {
      console.log('⚠️ PrivateRoute - PM en attente d\'approbation, accès autorisé');
    }
    
    if (!roles.includes(userData.role)) {
      console.log('❌ PrivateRoute - Rôle non autorisé:', userData.role, 'pour roles:', roles);
      return <Navigate to="/login" />;
    }
    
    console.log('✅ PrivateRoute - Accès autorisé pour rôle:', userData.role);
    return <>{children}</>;
  } catch (error) {
    console.error('❌ PrivateRoute - Erreur parsing user data:', error);
    // Nettoyer les données corrompues
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    return <Navigate to="/login" />;
  }
}

export default function App() {
  return (
    <>
      <ToastContainer position="top-right" autoClose={3000} hideProgressBar newestOnTop closeOnClick pauseOnFocusLoss draggable pauseOnHover />
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/create-account" element={<CreateAccount />} />
          <Route path="/project-manager-registration" element={<ProjectManagerRegistration />} />
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
          <Route path="/project-manager" element={
            <PrivateRoute roles={["PROJECT_MANAGER"]}>
              <ProjectManagerHome />
            </PrivateRoute>
          } />
          <Route path="/analyst/enumerator-requests" element={
            <PrivateRoute roles={["PROJECT_MANAGER"]}>
              <PMEnumeratorRequests />
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
