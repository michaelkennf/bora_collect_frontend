import React from 'react';
import ProjectManagerForm from '../components/ProjectManagerForm';

interface AdminCreateProjectManagerProps {
  onBack?: () => void;
}

const AdminCreateProjectManager: React.FC<AdminCreateProjectManagerProps> = ({ onBack }) => {
  return (
    <ProjectManagerForm 
      isAdmin={true}
      onBack={onBack}
      onSuccess={() => {
        console.log('Project Manager créé avec succès');
      }}
    />
  );
};

export default AdminCreateProjectManager;
