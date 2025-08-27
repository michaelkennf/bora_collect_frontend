import React from 'react';

interface PNUDFooterProps {
  className?: string;
}

const PNUDFooter: React.FC<PNUDFooterProps> = ({ className = '' }) => {
  return (
    <footer className={`bg-gray-50 border-t border-gray-200 py-4 mt-8 ${className}`}>
      <div className="text-center">
        <p className="text-xs sm:text-sm text-gray-500">
          © PNUD 2025. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default PNUDFooter;
