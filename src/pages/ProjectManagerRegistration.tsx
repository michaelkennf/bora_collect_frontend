import React from 'react';
import logo2 from '../assets/images/logo2.jpg';
import ProjectManagerForm from '../components/ProjectManagerForm';

const ProjectManagerRegistration: React.FC = () => {

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center">
          <img className="mx-auto h-20 w-auto" src={logo2} alt="Logo" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Inscription Project Manager
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Créez votre compte Project Manager pour gérer vos campagnes d'enquête
          </p>
        </div>

        <ProjectManagerForm 
          isAdmin={false}
        />
      </div>
    </div>
  );
};

export default ProjectManagerRegistration;