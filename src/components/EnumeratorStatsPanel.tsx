import { useState, useEffect } from 'react';
import { Users, Link2, FileText, Trophy, ChevronDown, ChevronUp, Eye } from 'lucide-react';
import { environment } from '../config/environment';

interface EnumeratorStat {
  id: string;
  name: string;
  email: string;
  profilePhoto: string | null;
  directSubmissions: number;
  linkSubmissions: number;
  totalSubmissions: number;
  links: {
    id: string;
    surveyTitle: string;
    submissionsCount: number;
  }[];
}

interface EnumeratorStatsPanelProps {
  surveyId?: string;
  className?: string;
}

const EnumeratorStatsPanel: React.FC<EnumeratorStatsPanelProps> = ({ surveyId, className = '' }) => {
  const [stats, setStats] = useState<EnumeratorStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedEnumerator, setExpandedEnumerator] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      setLoading(true);
      try {
        const url = surveyId
          ? `${environment.apiBaseUrl}/public-links/enumerator-stats?surveyId=${surveyId}`
          : `${environment.apiBaseUrl}/public-links/enumerator-stats`;

        const response = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          setError('Erreur lors du chargement des statistiques');
        }
      } catch (err) {
        setError('Erreur de connexion');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [surveyId]);

  const toggleExpanded = (id: string) => {
    setExpandedEnumerator(expandedEnumerator === id ? null : id);
  };

  // Calculer les totaux
  const totalDirect = stats.reduce((sum, s) => sum + s.directSubmissions, 0);
  const totalViaLink = stats.reduce((sum, s) => sum + s.linkSubmissions, 0);
  const totalAll = totalDirect + totalViaLink;

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">Classement des enquêteurs</h2>
            <p className="text-blue-100 text-sm">Formulaires soumis (compte + liens partagés)</p>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">{totalAll}</div>
          <div className="text-xs text-gray-500">Total soumissions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{totalDirect}</div>
          <div className="text-xs text-gray-500">Via compte</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{totalViaLink}</div>
          <div className="text-xs text-gray-500">Via liens</div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="divide-y divide-gray-100">
        {stats.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>Aucune donnée disponible</p>
          </div>
        ) : (
          stats.map((enumerator, index) => (
            <div key={enumerator.id} className="hover:bg-gray-50 transition-colors">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer"
                onClick={() => toggleExpanded(enumerator.id)}
              >
                {/* Rank */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-700' :
                  index === 1 ? 'bg-gray-200 text-gray-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                  {enumerator.profilePhoto ? (
                    <img
                      src={`${environment.apiBaseUrl.replace('/api', '')}${enumerator.profilePhoto}`}
                      alt={enumerator.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-blue-600 font-semibold">
                      {enumerator.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{enumerator.name}</p>
                  <p className="text-xs text-gray-500 truncate">{enumerator.email}</p>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1 text-blue-600" title="Via compte">
                    <FileText className="h-4 w-4" />
                    <span className="font-medium">{enumerator.directSubmissions}</span>
                  </div>
                  <div className="flex items-center gap-1 text-green-600" title="Via liens">
                    <Link2 className="h-4 w-4" />
                    <span className="font-medium">{enumerator.linkSubmissions}</span>
                  </div>
                  <div className="w-16 text-right">
                    <span className="font-bold text-gray-900">{enumerator.totalSubmissions}</span>
                    <span className="text-xs text-gray-400 ml-1">total</span>
                  </div>
                  {enumerator.links.length > 0 && (
                    expandedEnumerator === enumerator.id ? (
                      <ChevronUp className="h-5 w-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    )
                  )}
                </div>
              </div>

              {/* Expanded Links Details */}
              {expandedEnumerator === enumerator.id && enumerator.links.length > 0 && (
                <div className="px-4 pb-4 pl-20">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2">Détail des liens partagés :</p>
                    <div className="space-y-2">
                      {enumerator.links.map((link) => (
                        <div
                          key={link.id}
                          className="flex items-center justify-between text-sm bg-white rounded-lg px-3 py-2 border border-gray-100"
                        >
                          <span className="text-gray-700">{link.surveyTitle}</span>
                          <span className="text-green-600 font-medium">
                            {link.submissionsCount} soumission(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default EnumeratorStatsPanel;

