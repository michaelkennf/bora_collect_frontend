import React from 'react';

interface EnumeratorStats {
  id: string;
  name: string;
  totalSubmitted: number;
  dailySubmitted: number;
  validatedRate: number;
  performance: 'excellent' | 'good' | 'average' | 'needs-improvement';
}

interface EnumeratorLeaderboardProps {
  enumerators: EnumeratorStats[];
  campaignTitle: string;
}

export default function EnumeratorLeaderboard({ enumerators, campaignTitle }: EnumeratorLeaderboardProps) {
  
  // Calculer les indicateurs de performance
  const getPerformanceIndicators = (enumerator: EnumeratorStats) => {
    const avgDaily = enumerator.totalSubmitted / Math.max(1, enumerators.length); // Approximation
    const perfRatio = enumerator.dailySubmitted / Math.max(1, avgDaily);
    
    return {
      isTopPerformer: perfRatio >= 1.2,
      isBelowAverage: perfRatio < 0.8,
      efficiency: enumerator.validatedRate > 80 ? 'high' : enumerator.validatedRate > 60 ? 'medium' : 'low'
    };
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h3 className="text-xl font-bold text-gray-800 mb-4">
        🏆 Classement des Enquêteurs - {campaignTitle}
      </h3>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rang</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enquêteur</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aujourd'hui</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taux validé</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Performance</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {enumerators.map((enumerator, index) => {
              const indicators = getPerformanceIndicators(enumerator);
              const rankClass = index === 0 ? 'bg-yellow-100' : index === 1 ? 'bg-gray-100' : index === 2 ? 'bg-orange-50' : '';
              
              return (
                <tr key={enumerator.id} className={`${rankClass} ${indicators.isTopPerformer ? 'border-l-4 border-green-500' : ''}`}>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      {index === 0 && <span className="text-2xl">🥇</span>}
                      {index === 1 && <span className="text-2xl">🥈</span>}
                      {index === 2 && <span className="text-2xl">🥉</span>}
                      <span className="ml-2 font-bold">{index + 1}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-gray-900">{enumerator.name}</div>
                    {indicators.isTopPerformer && (
                      <span className="text-xs text-green-600 font-semibold">🌟 Top performer</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-semibold text-gray-900">{enumerator.totalSubmitted}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <span className="text-sm font-semibold text-gray-900">{enumerator.dailySubmitted}</span>
                      {indicators.isBelowAverage && (
                        <span className="ml-2 text-xs text-orange-600">⚠</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 max-w-xs">
                        <div 
                          className={`h-2 rounded-full ${
                            enumerator.validatedRate >= 80 ? 'bg-green-500' :
                            enumerator.validatedRate >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, enumerator.validatedRate)}%` }}
                        />
                      </div>
                      <span className="ml-2 text-sm text-gray-600">{enumerator.validatedRate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      enumerator.performance === 'excellent' ? 'bg-green-100 text-green-800' :
                      enumerator.performance === 'good' ? 'bg-blue-100 text-blue-800' :
                      enumerator.performance === 'average' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {enumerator.performance === 'excellent' ? '⭐ Excellent' :
                       enumerator.performance === 'good' ? '✓ Bon' :
                       enumerator.performance === 'average' ? '➖ Moyen' :
                       '⚠ À améliorer'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Statistiques globales */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{enumerators.length}</div>
          <div className="text-sm text-gray-600">Enquêteurs actifs</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {enumerators.reduce((sum, e) => sum + e.totalSubmitted, 0)}
          </div>
          <div className="text-sm text-gray-600">Total soumis</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(enumerators.reduce((sum, e) => sum + e.validatedRate, 0) / enumerators.length).toFixed(1)}%
          </div>
          <div className="text-sm text-gray-600">Taux moyen validé</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {enumerators.filter(e => e.performance === 'excellent' || e.performance === 'good').length}
          </div>
          <div className="text-sm text-gray-600">Bonnes performances</div>
        </div>
      </div>
    </div>
  );
}

