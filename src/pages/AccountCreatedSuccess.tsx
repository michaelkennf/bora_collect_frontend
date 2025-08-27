import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Clock, Home } from 'lucide-react';

export default function AccountCreatedSuccess() {
  const navigate = useNavigate();

  const handleGoToLogin = () => {
    navigate('/login');
  };

  const handleGoToHome = () => {
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
        {/* Icône de succès */}
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-green-600" />
        </div>

        {/* Titre principal */}
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎉 Félicitations !
        </h1>
        
        <h2 className="text-xl font-semibold text-gray-700 mb-6">
          Votre compte a été créé avec succès
        </h2>



        {/* Message de connexion après 30 minutes */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Clock className="w-6 h-6 text-amber-600 mr-2" />
            <span className="text-lg font-medium text-amber-800">
              Essayez de vous connecter après 30 minutes
            </span>
          </div>
          
          <p className="text-amber-600 text-center">
            Votre compte sera validé par un administrateur dans les 30 minutes. 
            Une fois validé, vous pourrez vous connecter à votre compte.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                     <button
             onClick={handleGoToLogin}
             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
           >
             Aller à la connexion
           </button>
          
          <button
            onClick={handleGoToHome}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center"
          >
            <Home className="w-5 h-5 mr-2" />
            Retour à l'accueil
          </button>
        </div>


      </div>
    </div>
  );
}
