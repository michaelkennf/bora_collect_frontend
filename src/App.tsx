// Assurez-vous d'avoir installé react-router-dom : npm install react-router-dom
import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Imports critiques (chargés immédiatement)
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import PublicFormPage from './pages/PublicFormPage';

// Lazy loading pour réduire le bundle initial
const CreateAccount = lazy(() => import('./pages/CreateAccount'));
const ProjectManagerRegistration = lazy(() => import('./pages/ProjectManagerRegistration'));
const AccountCreatedSuccess = lazy(() => import('./pages/AccountCreatedSuccess'));
const AdminHomeModule = lazy(() => import('./pages/AdminHome'));
const ControllerHomeModule = lazy(() => import('./pages/ControllerHome'));
const AnalystHome = lazy(() => import('./pages/AnalystHome'));
const ProjectManagerHome = lazy(() => import('./pages/ProjectManagerHome'));
const PMEnumeratorRequests = lazy(() => import('./pages/PMEnumeratorRequests'));
const RecordsList = lazy(() => import('./pages/RecordsList'));
const RecordsSyncedList = lazy(() => import('./pages/RecordsSyncedList'));
const SchoolForm = lazy(() => import('./pages/SchoolForm'));
const ExportsStats = lazy(() => import('./pages/ExportsStats'));
const AdminUsers = lazy(() => import('./pages/AdminUsers'));
const AdminParametres = lazy(() => import('./pages/AdminParametres'));
const AdminDeletedUsers = lazy(() => import('./pages/AdminDeletedUsers'));
const AdminPendingApprovals = lazy(() => import('./pages/AdminPendingApprovals'));
const AdminSurveyPublication = lazy(() => import('./pages/AdminSurveyPublication'));
const AdminCandidatures = lazy(() => import('./pages/AdminCandidatures'));
const ControllerAvailableSurveys = lazy(() => import('./pages/ControllerAvailableSurveys'));
const Settings = lazy(() => import('./pages/Settings'));

// Composant de chargement
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      <p className="mt-4 text-gray-600">Chargement...</p>
    </div>
  </div>
);

// Route protégée selon le rôle (optimisée - logs réduits)
function PrivateRoute({ children, roles }: { children: React.ReactNode; roles: string[] }) {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  if (!token || !user) {
    return <Navigate to="/login" />;
  }
  
  try {
    const userData = JSON.parse(user);
    
    // Vérifier que les données utilisateur sont valides
    if (!userData || !userData.role || !userData.id) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return <Navigate to="/login" />;
    }
    
    // Vérifier si l'utilisateur est actif (sauf pour les PM qui peuvent être PENDING_APPROVAL)
    if (userData.status && userData.status !== 'ACTIVE' && userData.status !== 'PENDING_APPROVAL') {
      return <Navigate to="/login" />;
    }
    
    if (!roles.includes(userData.role)) {
      return <Navigate to="/login" />;
    }
    
    return <>{children}</>;
  } catch (error) {
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
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/create-account" element={<Suspense fallback={<LoadingFallback />}><CreateAccount /></Suspense>} />
            <Route path="/project-manager-registration" element={<Suspense fallback={<LoadingFallback />}><ProjectManagerRegistration /></Suspense>} />
            <Route path="/account-created" element={<Suspense fallback={<LoadingFallback />}><AccountCreatedSuccess /></Suspense>} />
            <Route path="/admin" element={<PrivateRoute roles={["ADMIN"]}><Suspense fallback={<LoadingFallback />}><AdminHomeModule /></Suspense></PrivateRoute>}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><AdminHomeModule /></Suspense>} />
              <Route path="users" element={<Suspense fallback={<LoadingFallback />}><AdminUsers /></Suspense>} />
              <Route path="pending-approvals" element={<Suspense fallback={<LoadingFallback />}><AdminPendingApprovals /></Suspense>} />
              <Route path="survey-publication" element={<Suspense fallback={<LoadingFallback />}><AdminSurveyPublication /></Suspense>} />
              <Route path="candidatures" element={<Suspense fallback={<LoadingFallback />}><AdminCandidatures /></Suspense>} />
              <Route path="parametres" element={<Suspense fallback={<LoadingFallback />}><AdminParametres /></Suspense>} />
              <Route path="deleted-users" element={<Suspense fallback={<LoadingFallback />}><AdminDeletedUsers /></Suspense>} />
              <Route path="exports" element={<Suspense fallback={<LoadingFallback />}><ExportsStats /></Suspense>} />
            </Route>
            <Route path="/controleur" element={<PrivateRoute roles={["CONTROLLER"]}><Suspense fallback={<LoadingFallback />}><ControllerHomeModule /></Suspense></PrivateRoute>}>
              <Route index element={<Suspense fallback={<LoadingFallback />}><ControllerHomeModule /></Suspense>} />
              <Route path="formulaire" element={<Suspense fallback={<LoadingFallback />}><SchoolForm /></Suspense>} />
              <Route path="enquetes-disponibles" element={<Suspense fallback={<LoadingFallback />}><ControllerAvailableSurveys /></Suspense>} />
              <Route path="parametres" element={<Suspense fallback={<LoadingFallback />}><Settings /></Suspense>} />
            </Route>
            <Route path="/admin/utilisateurs" element={
              <PrivateRoute roles={["ADMIN"]}>
                <Suspense fallback={<LoadingFallback />}><AdminUsers /></Suspense>
              </PrivateRoute>
            } />
            <Route path="/admin/parametres" element={
              <PrivateRoute roles={["ADMIN"]}>
                <Suspense fallback={<LoadingFallback />}><AdminParametres /></Suspense>
              </PrivateRoute>
            } />
            <Route path="/analyst-home" element={
              <PrivateRoute roles={["ANALYST"]}>
                <Suspense fallback={<LoadingFallback />}><AnalystHome /></Suspense>
              </PrivateRoute>
            } />
            <Route path="/project-manager" element={
              <PrivateRoute roles={["PROJECT_MANAGER"]}>
                <Suspense fallback={<LoadingFallback />}><ProjectManagerHome /></Suspense>
              </PrivateRoute>
            } />
            <Route path="/analyst/enumerator-requests" element={
              <PrivateRoute roles={["PROJECT_MANAGER"]}>
                <Suspense fallback={<LoadingFallback />}><PMEnumeratorRequests /></Suspense>
              </PrivateRoute>
            } />
            <Route path="/analyst/parametres" element={
              <PrivateRoute roles={["ANALYST"]}>
                <Suspense fallback={<LoadingFallback />}><Settings /></Suspense>
              </PrivateRoute>
            } />
            {/* Route publique pour formulaires via lien partagé */}
            <Route path="/form/:token" element={<PublicFormPage />} />
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </Router>
    </>
  );
}
