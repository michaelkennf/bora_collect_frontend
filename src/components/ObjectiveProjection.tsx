import React from 'react';

interface ObjectiveProjectionProps {
  totalSubmitted: number;
  totalTarget: number;
  dailySubmitted: number;
  dailyTarget: number;
  remainingDays: number;
  averageDailyRate: number;
}

export default function ObjectiveProjection({
  totalSubmitted,
  totalTarget,
  dailySubmitted,
  dailyTarget,
  remainingDays,
  averageDailyRate
}: ObjectiveProjectionProps) {
  
  // Projections basées sur différents scénarios
  const safeRemainingDays = Math.max(remainingDays, 0);
  const optimisticProjection = averageDailyRate * 1.2 * safeRemainingDays + totalSubmitted;
  const realisticProjection = averageDailyRate * safeRemainingDays + totalSubmitted;
  const pessimisticProjection = averageDailyRate * 0.8 * safeRemainingDays + totalSubmitted;

  // Calculer le taux nécessaire
  const requiredDailyRate = safeRemainingDays > 0 ? Math.max((totalTarget - totalSubmitted) / safeRemainingDays, 0) : 0;
  const isOnTrack = totalTarget <= 0 ? true : realisticProjection >= totalTarget;
  const safeTotalTarget = totalTarget > 0 ? totalTarget : 1;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg shadow-lg p-6 border border-blue-200">
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
        <svg className="w-5 h-5 mr-2 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9,2A2,2 0 0,0 7,4V8H5A2,2 0 0,0 3,10V22A2,2 0 0,0 5,24H19A2,2 0 0,0 21,22V10A2,2 0 0,0 19,8H17V4A2,2 0 0,0 15,2H9M9,4H15V8H9V4M5,10H19V22H5V10M11,12V20H13V12H11Z"/>
        </svg>
        Projections et Prévisions
      </h3>

      {/* Projections */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Projection optimiste */}
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="text-sm text-gray-600 mb-2">Scénario Optimiste</div>
          <div className="text-2xl font-bold text-green-600">
            {Math.round(optimisticProjection)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Si +20% journalier
          </div>
          <div className="mt-2 text-xs font-semibold">
            {totalTarget <= 0 || optimisticProjection >= totalTarget ? '✅ Objectif dépassé' : '⚠️ Déficit: ' + Math.round(Math.max(totalTarget - optimisticProjection, 0))}
          </div>
        </div>

        {/* Projection réaliste */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <div className="text-sm text-gray-600 mb-2">Scénario Réaliste</div>
          <div className="text-2xl font-bold text-blue-600">
            {Math.round(realisticProjection)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Si moyenne actuelle maintenue
          </div>
          <div className="mt-2 text-xs font-semibold">
            {isOnTrack ? '✅ Objectif atteignable' : '⚠️ Déficit: ' + Math.round(Math.max(totalTarget - realisticProjection, 0))}
          </div>
        </div>

        {/* Projection pessimiste */}
        <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
          <div className="text-sm text-gray-600 mb-2">Scénario Pessimiste</div>
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(pessimisticProjection)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Si -20% journalier
          </div>
          <div className="mt-2 text-xs font-semibold">
            {totalTarget <= 0 || pessimisticProjection >= totalTarget ? '✅ Objectif atteignable' : '⚠️ Déficit: ' + Math.round(Math.max(totalTarget - pessimisticProjection, 0))}
          </div>
        </div>
      </div>

      {/* Graphique de projection */}
      <div className="bg-white rounded-lg p-4 mb-4">
        <div className="flex items-end justify-between h-32 gap-1">
          {[...Array(Math.min(7, safeRemainingDays + 1))].map((_, i) => {
            const projectedDaily = realisticProjection / Math.max(safeRemainingDays + 1, 1);
            const projectedValue = i < safeRemainingDays ? projectedDaily : totalSubmitted;
            const height = (projectedValue / safeTotalTarget) * 100;
            
            return (
              <div key={i} className="flex flex-col items-center flex-1">
                <div className="w-full flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300 relative"
                    style={{ height: `${Math.min(100, Math.max(10, height))}%` }}
                  >
                    <span className="absolute -top-6 left-0 right-0 text-xs text-center text-gray-600">
                      Jour {i + 1}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2">
                    {i < safeRemainingDays ? Math.round(projectedDaily) : totalSubmitted}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recommandations */}
      <div className={`rounded-lg p-4 ${isOnTrack ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <h4 className="font-semibold mb-2">
          {isOnTrack ? '✅ Recommandation' : '⚠️ Action requise'}
        </h4>
        <p className="text-sm text-gray-700">
          {isOnTrack 
            ? `Continuez au rythme actuel pour atteindre l'objectif. Vous êtes sur la bonne voie !`
            : `Pour atteindre l'objectif, vous devez soumettre en moyenne ${requiredDailyRate.toFixed(1)} formulaires par jour sur les ${safeRemainingDays} jours restants. Soit ${((requiredDailyRate / Math.max(dailyTarget, 1)) * 100).toFixed(0)}% de votre objectif quotidien.`}
        </p>
      </div>
    </div>
  );
}

