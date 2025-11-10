import React from 'react';

interface ObjectiveAlertsProps {
  totalSubmitted: number;
  totalTarget: number;
  dailySubmitted: number;
  dailyTarget: number;
  remainingDays: number;
  userRole: 'CONTROLLER' | 'PROJECT_MANAGER';
}

export default function ObjectiveAlerts({ 
  totalSubmitted, 
  totalTarget, 
  dailySubmitted, 
  dailyTarget,
  remainingDays,
  userRole
}: ObjectiveAlertsProps) {
  
  const totalProgressValue = totalTarget > 0 ? (totalSubmitted / totalTarget) * 100 : 0;
  const totalProgress = totalProgressValue.toFixed(1);
  const dailyProgress = dailyTarget > 0 ? ((dailySubmitted / dailyTarget) * 100).toFixed(1) : '0.0';
  const dailyShortfall = Math.max(dailyTarget - dailySubmitted, 0);
  const overallShortfall = Math.max(totalTarget - totalSubmitted, 0);
  const avgNeeded = remainingDays > 0 ? (overallShortfall / remainingDays).toFixed(1) : '0.0';

  const hasGlobalTarget = totalTarget > 0;

  // Ne pas afficher l'alerte si aucune soumission n'a été faite aujourd'hui
  const shouldShowDailyAlert = dailyTarget > 0 && dailySubmitted > 0 && dailySubmitted < dailyTarget;

  return (
    <div className="space-y-3">
      {/* Alerte objectif quotidien - Ne s'affiche que si l'objectif est défini, qu'il y a eu des soumissions ET que l'objectif n'est pas atteint */}
      {shouldShowDailyAlert && (
        <div className="bg-orange-50 border-l-4 border-orange-500 p-4 rounded-lg animate-pulse">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-orange-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,17L10.5,16L11.5,14H9V10H13.5C14.61,10 15.5,10.9 15.5,12A2,2 0 0,1 13.5,14H10.5L9,15L10.5,17M11,13.5L12.5,12.5L11,11.5V13.5Z"/>
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold text-orange-800">
                ⚠️ Objectif quotidien non atteint
              </h3>
              <p className="mt-1 text-sm text-orange-700">
                {userRole === 'PROJECT_MANAGER' 
                  ? <>L'équipe a soumis <strong>{dailySubmitted}</strong> sur <strong>{dailyTarget}</strong> formulaires aujourd'hui. Il manque <strong>{dailyShortfall}</strong> formulaire{dailyShortfall > 1 ? 's' : ''} pour atteindre l'objectif.</>
                  : <>Vous avez soumis <strong>{dailySubmitted}</strong> sur <strong>{dailyTarget}</strong> formulaires aujourd'hui. Il vous manque <strong>{dailyShortfall}</strong> formulaire{dailyShortfall > 1 ? 's' : ''} pour atteindre votre objectif.</>}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Alerte progression globale */}
      {hasGlobalTarget && overallShortfall > 0 && (
        <div className={`border-l-4 p-4 rounded-lg ${
          totalProgressValue < 50 ? 'bg-red-50 border-red-500' : 
          totalProgressValue < 75 ? 'bg-yellow-50 border-yellow-500' : 
          'bg-green-50 border-green-500'
        }`}>
          <div className="flex items-start">
            <div className="flex-shrink-0">
              {totalProgressValue < 50 ? (
                <svg className="h-6 w-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2L3.09,8.26L4,21.82L12,18L20,21.82L20.91,8.26L12,2M10,14L5,11L6.5,7L10,10L17.5,4L19,11L10,14Z"/>
                </svg>
              ) : (
                <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,2L3.09,8.26L4,21.82L12,18L20,21.82L20.91,8.26L12,2M10,14L5,11L6.5,7L10,10L17.5,4L19,11L10,14Z"/>
                </svg>
              )}
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-semibold">
                {totalProgressValue < 50 ? '🚨 Attention: Retard important' : 
                 totalProgressValue < 75 ? '⚠️ Retard modéré' : 
                 '✅ Bon rythme'}
              </h3>
              <p className="mt-1 text-sm">
                Progression globale: <strong>{totalProgress}%</strong> ({totalSubmitted}/{totalTarget} formulaires {userRole === 'PROJECT_MANAGER' ? 'validés' : 'soumis'})
              </p>
              {remainingDays > 0 && (
                <p className="mt-1 text-sm opacity-80">
                  {userRole === 'CONTROLLER' 
                    ? `Vous devez soumettre en moyenne ${avgNeeded} formulaires/jour pour les ${remainingDays} jours restants`
                    : `L'équipe doit soumettre en moyenne ${avgNeeded} formulaires/jour pour les ${remainingDays} jours restants`}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Alerte réussite quotidienne */}
      {dailySubmitted >= dailyTarget && (
        <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M10,17L5,12L6.41,10.59L10,14.17L17.59,6.58L19,8M10,17Z"/>
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-semibold text-green-800">
                🎉 Objectif quotidien atteint !
              </h3>
              <p className="mt-1 text-sm text-green-700">
                {userRole === 'PROJECT_MANAGER'
                  ? `Félicitations ! L'équipe a dépassé l'objectif du jour avec ${dailySubmitted} formulaires.`
                  : `Félicitations ! Vous avez dépassé votre objectif du jour avec ${dailySubmitted} formulaires.`}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

