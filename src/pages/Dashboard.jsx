import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { 
  Mic, 
  TrendingUp, 
  LogOut, 
  RefreshCw, 
  Award,
  Target,
  BarChart3,
  Clock,
  ChevronRight,
  Zap,
  Calendar,
  Activity,
  TrendingDown,
  User,
  Settings,
  Home,
  History,
  Star,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
  Share2
} from 'lucide-react';

const API_URL = "https://echo-eval-backend.vercel.app";

const ROLE_ICONS = {
  'Project Manager': '📊',
  'Team Lead': '👥',
  'Product Owner': '🎯',
  'Sales Manager': '💼'
};

const ROLE_COLORS = {
  'Project Manager': 'from-blue-500 to-blue-600',
  'Team Lead': 'from-purple-500 to-purple-600',
  'Product Owner': 'from-emerald-500 to-emerald-600',
  'Sales Manager': 'from-orange-500 to-orange-600'
};

const ROLE_BG_LIGHT = {
  'Project Manager': 'bg-blue-50',
  'Team Lead': 'bg-purple-50',
  'Product Owner': 'bg-emerald-50',
  'Sales Manager': 'bg-orange-50'
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleStats, setRoleStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState('all'); // all, week, month
  const [overallStats, setOverallStats] = useState({
    totalEvaluations: 0,
    averageScore: 0,
    totalTime: 0,
    bestRole: null,
    improvementRate: 0,
    completionRate: 100,
    recentActivity: []
  });

  useEffect(() => {
    loadUser();
    loadRoles();
  }, []);

  useEffect(() => {
    if (user?.email && roles.length > 0) {
      loadAllRoleStats();
    }
  }, [user, roles]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Failed to load roles:', err);
    }
  };

  const loadAllRoleStats = async () => {
    setLoading(true);
    const stats = {};
    let totalEvals = 0;
    let totalScoreSum = 0;
    let totalTimeSum = 0;
    let bestRoleScore = 0;
    let bestRoleName = null;
    let allEvaluations = [];
    let improvementSum = 0;
    let improvementCount = 0;

    for (const role of roles) {
      try {
        const res = await fetch(
          `${API_URL}/evaluations/${encodeURIComponent(user.email)}/role/${encodeURIComponent(role.id)}`
        );
        
        if (res.ok) {
          const data = await res.json();
          const evaluations = data.evaluations || [];
          
          if (evaluations.length > 0) {
            const avgScore = evaluations.reduce((sum, e) => sum + e.overall_score, 0) / evaluations.length;
            const totalTime = evaluations.reduce((sum, e) => sum + e.duration_minutes, 0);
            const latestEval = evaluations[0];
            
            // Calculate trend
            let trend = 0;
            if (evaluations.length >= 2) {
              trend = evaluations[0].overall_score - evaluations[1].overall_score;
              improvementSum += trend;
              improvementCount++;
            }
            
            // Calculate score distribution
            const scoreDistribution = {
              excellent: evaluations.filter(e => e.overall_score >= 8).length,
              good: evaluations.filter(e => e.overall_score >= 6 && e.overall_score < 8).length,
              needsWork: evaluations.filter(e => e.overall_score < 6).length
            };
            
            stats[role.title] = {
              count: evaluations.length,
              averageScore: avgScore,
              latestScore: latestEval.overall_score,
              totalTime: totalTime,
              trend: trend,
              latestDate: latestEval.created_at,
              evaluations: evaluations,
              scoreDistribution: scoreDistribution,
              bestScore: Math.max(...evaluations.map(e => e.overall_score)),
              worstScore: Math.min(...evaluations.map(e => e.overall_score)),
              consistency: calculateConsistency(evaluations.map(e => e.overall_score))
            };

            totalEvals += evaluations.length;
            totalScoreSum += avgScore * evaluations.length;
            totalTimeSum += totalTime;
            allEvaluations = [...allEvaluations, ...evaluations.map(e => ({ ...e, roleTitle: role.title }))];

            if (avgScore > bestRoleScore) {
              bestRoleScore = avgScore;
              bestRoleName = role.title;
            }
          } else {
            stats[role.title] = {
              count: 0,
              averageScore: 0,
              latestScore: 0,
              totalTime: 0,
              trend: 0,
              latestDate: null,
              evaluations: [],
              scoreDistribution: { excellent: 0, good: 0, needsWork: 0 },
              bestScore: 0,
              worstScore: 0,
              consistency: 0
            };
          }
        }
      } catch (err) {
        console.error(`Failed to load stats for ${role.title}:`, err);
      }
    }

    // Sort all evaluations by date
    allEvaluations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    setRoleStats(stats);
    setOverallStats({
      totalEvaluations: totalEvals,
      averageScore: totalEvals > 0 ? totalScoreSum / totalEvals : 0,
      totalTime: totalTimeSum,
      bestRole: bestRoleName,
      improvementRate: improvementCount > 0 ? (improvementSum / improvementCount) : 0,
      completionRate: 100,
      recentActivity: allEvaluations.slice(0, 10)
    });
    setLoading(false);
  };

  const calculateConsistency = (scores) => {
    if (scores.length < 2) return 100;
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avg, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, 100 - (stdDev * 10));
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-600';
    if (score >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score) => {
    if (score >= 8) return 'bg-emerald-50 border-emerald-200';
    if (score >= 6) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getScoreLabel = (score) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    return 'Needs Work';
  };

  const formatTime = (minutes) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const exportData = () => {
    // Implementation for exporting data as CSV or PDF
    console.log('Exporting data...');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold">Loading your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col shadow-lg fixed h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg font-black text-slate-900">AI Voice Coach</h1>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">Pro Platform</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4">
          <div className="space-y-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Home size={20} />
              <span>Overview</span>
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 size={20} />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <History size={20} />
              <span>History</span>
            </button>

            <button
              onClick={() => navigate('/session')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md mt-4"
            >
              <Mic size={20} />
              <span>New Session</span>
            </button>
          </div>
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center">
              <User className="text-white" size={18} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {user?.user_metadata?.full_name || 'User'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={loadAllRoleStats}
              className="flex-1 p-2 hover:bg-slate-100 rounded-lg transition-colors flex items-center justify-center"
              title="Refresh Data"
            >
              <RefreshCw size={16} className="text-slate-600" />
            </button>
            <button
              onClick={handleLogout}
              className="flex-1 p-2 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center text-red-600"
              title="Logout"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 ml-64 p-8 overflow-y-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-4xl font-black text-slate-900">
                Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'Champion'}! 👋
              </h2>
              <p className="text-lg text-slate-600 mt-1">
                Here's your performance across all leadership roles
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={exportData}
                className="px-4 py-2 bg-white border-2 border-slate-200 rounded-xl font-semibold text-slate-700 hover:border-slate-300 hover:shadow-md transition-all flex items-center gap-2"
              >
                <Download size={18} />
                Export
              </button>
            </div>
          </div>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Target className="text-blue-600" size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900">{overallStats.totalEvaluations}</p>
                    <p className="text-xs text-slate-500 font-semibold">Total</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-semibold">Evaluations Completed</p>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <CheckCircle2 className="text-green-500" size={14} />
                  <span className="text-green-600 font-bold">{overallStats.completionRate}% completion rate</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Star className="text-emerald-600" size={24} />
                  </div>
                  <div className="text-right">
                    <p className={`text-3xl font-black ${getScoreColor(overallStats.averageScore)}`}>
                      {overallStats.averageScore.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">/ 10</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-semibold">Average Score</p>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <Activity className="text-blue-500" size={14} />
                  <span className="text-slate-600 font-bold">Across all roles</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    <Clock className="text-purple-600" size={24} />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-slate-900">{formatTime(overallStats.totalTime)}</p>
                    <p className="text-xs text-slate-500 font-semibold">Time</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-semibold">Total Practice Time</p>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  <TrendingUp className="text-purple-500" size={14} />
                  <span className="text-slate-600 font-bold">Dedicated learning</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border-2 border-slate-200 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                    <Award className="text-amber-600" size={24} />
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black ${overallStats.improvementRate >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {overallStats.improvementRate >= 0 ? '+' : ''}{overallStats.improvementRate.toFixed(1)}
                    </p>
                    <p className="text-xs text-slate-500 font-semibold">Trend</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 font-semibold">Improvement Rate</p>
                <div className="mt-3 flex items-center gap-1 text-xs">
                  {overallStats.improvementRate >= 0 ? (
                    <>
                      <TrendingUp className="text-green-500" size={14} />
                      <span className="text-green-600 font-bold">Positive growth</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="text-red-500" size={14} />
                      <span className="text-red-600 font-bold">Needs focus</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Role Performance Cards */}
            <div className="mb-6">
              <h3 className="text-2xl font-black text-slate-900 mb-4">Performance by Role</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {roles.map((role) => {
                const stats = roleStats[role.title] || {
                  count: 0,
                  averageScore: 0,
                  latestScore: 0,
                  totalTime: 0,
                  trend: 0,
                  latestDate: null,
                  scoreDistribution: { excellent: 0, good: 0, needsWork: 0 },
                  bestScore: 0,
                  worstScore: 0,
                  consistency: 0
                };

                return (
                  <div
                    key={role.id}
                    className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden hover:border-blue-300 hover:shadow-xl transition-all duration-300 group cursor-pointer"
                    onClick={() => navigate('/session', { state: { selectedRole: role.id } })}
                  >
                    {/* Header */}
                    <div className={`bg-gradient-to-r ${ROLE_COLORS[role.title]} p-6 text-white relative overflow-hidden`}>
                      <div className="absolute top-0 right-0 text-8xl opacity-10">
                        {ROLE_ICONS[role.title]}
                      </div>
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-4xl">{ROLE_ICONS[role.title]}</div>
                          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                            <p className="text-xs font-bold">{stats.count} sessions</p>
                          </div>
                        </div>
                        <h3 className="text-2xl font-black mb-1">{role.title}</h3>
                        <p className="text-white/80 text-sm">{role.description}</p>
                      </div>
                    </div>

                    {/* Stats Body */}
                    <div className="p-6">
                      {stats.count > 0 ? (
                        <>
                          {/* Score Display */}
                          <div className="flex items-center justify-between mb-6">
                            <div>
                              <p className="text-sm text-slate-600 font-medium mb-1">Average Score</p>
                              <div className="flex items-baseline gap-2">
                                <span className={`text-4xl font-black ${getScoreColor(stats.averageScore)}`}>
                                  {stats.averageScore.toFixed(1)}
                                </span>
                                <span className="text-slate-400 text-lg font-semibold">/ 10</span>
                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                                  stats.averageScore >= 8 ? 'bg-emerald-100 text-emerald-700' :
                                  stats.averageScore >= 6 ? 'bg-yellow-100 text-yellow-700' :
                                  'bg-red-100 text-red-700'
                                }`}>
                                  {getScoreLabel(stats.averageScore)}
                                </span>
                              </div>
                            </div>
                            
                            <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${getScoreBg(stats.latestScore)}`}>
                              <div className="text-center">
                                <div className={`text-2xl font-black ${getScoreColor(stats.latestScore)}`}>
                                  {stats.latestScore.toFixed(1)}
                                </div>
                                <div className="text-[10px] text-slate-600 font-semibold -mt-1">Latest</div>
                              </div>
                            </div>
                          </div>

                          {/* Score Distribution */}
                          <div className="mb-6 p-4 bg-slate-50 rounded-xl">
                            <p className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide">Score Distribution</p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                  <span className="text-sm text-slate-700 font-medium">Excellent (8-10)</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{stats.scoreDistribution.excellent}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                  <span className="text-sm text-slate-700 font-medium">Good (6-7.9)</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{stats.scoreDistribution.good}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                  <span className="text-sm text-slate-700 font-medium">Needs Work (&lt;6)</span>
                                </div>
                                <span className="text-sm font-black text-slate-900">{stats.scoreDistribution.needsWork}</span>
                              </div>
                            </div>
                          </div>

                          {/* Metrics Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <TrendingUp size={14} className={stats.trend >= 0 ? 'text-green-500' : 'text-red-500'} />
                                <p className="text-xs text-slate-600 font-semibold">Trend</p>
                              </div>
                              <p className={`text-lg font-black ${stats.trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {stats.trend > 0 ? '+' : ''}{stats.trend.toFixed(1)}
                              </p>
                            </div>
                            
                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Clock size={14} className="text-blue-500" />
                                <p className="text-xs text-slate-600 font-semibold">Time</p>
                              </div>
                              <p className="text-lg font-black text-slate-900">
                                {formatTime(stats.totalTime)}
                              </p>
                            </div>

                            <div className="bg-slate-50 rounded-xl p-3 text-center">
                              <div className="flex items-center justify-center gap-1 mb-1">
                                <Activity size={14} className="text-purple-500" />
                                <p className="text-xs text-slate-600 font-semibold">Best</p>
                              </div>
                              <p className={`text-lg font-black ${getScoreColor(stats.bestScore)}`}>
                                {stats.bestScore.toFixed(1)}
                              </p>
                            </div>
                          </div>

                          {/* Last Session */}
                          <div className="flex items-center justify-between text-sm pt-4 border-t border-slate-100">
                            <div>
                              <p className="text-slate-500 text-xs mb-1">Last session</p>
                              <p className="font-bold text-slate-900">{formatDate(stats.latestDate)}</p>
                            </div>
                            <ChevronRight size={20} className="text-slate-400 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <Mic className="text-slate-400" size={28} />
                          </div>
                          <p className="text-slate-600 font-semibold mb-2">No evaluations yet</p>
                          <p className="text-sm text-slate-500 mb-4">Start your first session to see your progress</p>
                          <div className="flex items-center justify-center gap-2 text-blue-600 font-semibold">
                            <span>Start Evaluation</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8">
              <h3 className="text-2xl font-black text-slate-900 mb-6">Performance Analytics</h3>
              
              {/* Coming Soon Placeholder */}
              <div className="text-center py-12">
                <BarChart3 className="text-slate-300 mx-auto mb-4" size={64} />
                <p className="text-slate-600 font-semibold mb-2">Advanced Analytics Coming Soon</p>
                <p className="text-slate-500 text-sm">Detailed charts, trends, and insights will be available here</p>
              </div>
            </div>
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4 flex items-center gap-4">
              <Filter size={20} className="text-slate-400" />
              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.title}>{role.title}</option>
                ))}
              </select>
              
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Time</option>
                <option value="week">Last 7 Days</option>
                <option value="month">Last 30 Days</option>
              </select>
            </div>

            {/* History List */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200 bg-slate-50">
                <h3 className="text-xl font-black text-slate-900">Evaluation History</h3>
                <p className="text-sm text-slate-600 mt-1">
                  {overallStats.recentActivity.length} total evaluations
                </p>
              </div>
              
              <div className="divide-y divide-slate-100">
                {overallStats.recentActivity
                  .filter(activity => selectedRoleFilter === 'all' || activity.roleTitle === selectedRoleFilter)
                  .map((activity, index) => (
                    <div key={activity.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 flex-1">
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl ${ROLE_BG_LIGHT[activity.roleTitle]}`}>
                            {ROLE_ICONS[activity.roleTitle]}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="font-black text-slate-900">{activity.roleTitle}</h4>
                              {index === 0 && (
                                <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                                  Latest
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 font-medium">{activity.candidate_name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {formatDate(activity.created_at)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock size={12} />
                                {activity.duration_minutes}m
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className={`w-20 h-20 rounded-2xl border-2 flex items-center justify-center ${getScoreBg(activity.overall_score)}`}>
                          <div className="text-center">
                            <div className={`text-2xl font-black ${getScoreColor(activity.overall_score)}`}>
                              {activity.overall_score.toFixed(1)}
                            </div>
                            <div className="text-[10px] text-slate-600 font-semibold -mt-1">/ 10</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-8 text-white shadow-xl mt-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-3xl font-black mb-2">Ready to improve your skills?</h3>
              <p className="text-blue-100 text-lg">Start a new evaluation session and continue your growth journey</p>
            </div>
            <button
              onClick={() => navigate('/session')}
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-black text-lg hover:bg-blue-50 transition-all flex items-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
            >
              <Mic size={24} />
              New Session
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}