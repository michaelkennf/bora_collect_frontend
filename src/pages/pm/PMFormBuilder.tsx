import React from 'react';
import FormBuilder from '../../components/FormBuilder';

const PMFormBuilder: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Utilisation du FormBuilder existant */}
        <FormBuilder />
      </div>
    </div>
  );
};

export default PMFormBuilder;
