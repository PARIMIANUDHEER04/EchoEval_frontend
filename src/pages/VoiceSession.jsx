import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Vapi from '@vapi-ai/web';
import { 
  Mic, 
  Square, 
  ArrowLeft, 
  RefreshCw, 
  Clock, 
  Trophy,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Play,
  Zap,
  Home,
  History,
  BarChart3,
  User,
  LogOut,
  Activity,
  Star,
  Target,
  Calendar,
  TrendingDown,
  Info,
  Volume2,
  Waves
} from 'lucide-react';

const API_URL = "https://echo-eval-backend.vercel.app";
let vapi = null;

const ROLE_ICONS = {
  'Project Manager': '📊',
  'Team Lead': '👥',
  'Product Owner': '🎯',
  'Sales Manager': '💼'
};

const ROLE_COLORS = {
  'project_manager': 'from-blue-500 to-blue-600',
  'team_lead': 'from-purple-500 to-purple-600',
  'product_owner': 'from-emerald-500 to-emerald-600',
  'sales_manager': 'from-orange-500 to-orange-600'
};

export default function VoiceSession() {
  const navigate = useNavigate();
  const location = useLocation();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(location.state?.selectedRole || '');
  const [candidateName, setCandidateName] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [user, setUser] = useState(null);
  const [scenario, setScenario] = useState('');
  const [callState, setCallState] = useState('idle');
  const [activeTab, setActiveTab] = useState('session');
  
  // Previous results
  const [previousResults, setPreviousResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState(null);
  const [selectedHistoryRole, setSelectedHistoryRole] = useState('all');

  // Session insights
  const [sessionInsights, setSessionInsights] = useState({
    averageScore: 0,
    totalSessions: 0,
    improvementTrend: 0,
    lastSessionDate: null
  });

  useEffect(() => {
    loadUser();
    loadRoles();
  }, []);

  useEffect(() => {
    if (user?.email) {
      loadAllEvaluations();
    }
  }, [user]);

  useEffect(() => {
    if (selectedRole && user?.email) {
      loadPreviousResults();
    }
  }, [selectedRole, user]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user?.user_metadata?.full_name) {
      setCandidateName(user.user_metadata.full_name);
    }
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      if (!res.ok) throw new Error('Failed to fetch roles');
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      console.error('Failed to load roles:', err);
      setError('Failed to load roles');
    }
  };

  const loadAllEvaluations = async () => {
    if (!user?.email) return;
    
    try {
      const res = await fetch(`${API_URL}/evaluations/${encodeURIComponent(user.email)}`);
      if (res.ok) {
        const data = await res.json();
        const allEvals = data.evaluations || [];
        
        if (allEvals.length > 0) {
          const avgScore = allEvals.reduce((sum, e) => sum + e.overall_score, 0) / allEvals.length;
          const trend = allEvals.length >= 2 ? allEvals[0].overall_score - allEvals[1].overall_score : 0;
          
          setSessionInsights({
            averageScore: avgScore,
            totalSessions: allEvals.length,
            improvementTrend: trend,
            lastSessionDate: allEvals[0].created_at
          });
        }
      }
    } catch (err) {
      console.error('Error loading all evaluations:', err);
    }
  };

  const loadPreviousResults = async () => {
    if (!user?.email || !selectedRole) return;
    
    setIsLoadingResults(true);
    setResultsError(null);
    
    try {
      const res = await fetch(`${API_URL}/evaluations/${encodeURIComponent(user.email)}/role/${encodeURIComponent(selectedRole)}`);
      
      if (res.ok) {
        const data = await res.json();
        setPreviousResults(data.evaluations || []);
      } else {
        throw new Error('Failed to load results');
      }
    } catch (err) {
      console.error('❌ Error loading results:', err);
      setResultsError('Could not load previous results');
    } finally {
      setIsLoadingResults(false);
    }
  };

  useEffect(() => {
    let interval;
    if (isCalling) {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  const setupVapi = () => {
    vapi.on('call-start', () => {
      console.log('✅ Call started');
      setIsCalling(true);
      setCallState('active');
      setError(null);
    });

    vapi.on('call-end', () => {
      console.log('✅ Call ended');
      setIsCalling(false);
      setCallState('idle');
      setTimeout(() => {
        loadPreviousResults();
        loadAllEvaluations();
      }, 2000);
    });

    vapi.on('error', (err) => {
      console.error('❌ Error:', err);
      setIsCalling(false);
      setCallState('idle');
      setError('Call failed: ' + err.message);
    });
  };

  const startEvaluation = async () => {
    if (!selectedRole || !candidateName.trim()) {
      setError('Please select role and enter name');
      return;
    }

    if (!user || !user.email) {
      setError('User not authenticated');
      return;
    }

    try {
      setError(null);
      setCallState('connecting');
      
      const res = await fetch(`${API_URL}/session/start`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          role: selectedRole,
          candidate_name: candidateName,
          user_email: user.email
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to start session');
      }

      const data = await res.json();
      setSessionId(data.sessionId);
      setScenario(data.scenario);

      if (!vapi) {
        vapi = new Vapi(data.publicKey);
        setupVapi();
      }

      await vapi.start(data.assistantId);
    } catch (err) {
      console.error('❌ Failed to start:', err);
      setError('Failed to start: ' + err.message);
      setCallState('idle');
    }
  };

  const stopCall = () => {
    if (vapi) {
      setCallState('ending');
      vapi.stop();
    }
    setIsCalling(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const getScoreBadge = (score) => {
    if (score >= 8) return 'bg-emerald-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const selectedRoleData = roles.find(r => r.id === selectedRole);

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
              onClick={() => navigate('/')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold text-slate-600 hover:bg-slate-50 transition-all"
            >
              <Home size={20} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveTab('session')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'session'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mic size={20} />
              <span>New Session</span>
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
              onClick={() => setActiveTab('insights')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-semibold transition-all ${
                activeTab === 'insights'
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <BarChart3 size={20} />
              <span>Insights</span>
            </button>
          </div>

          {/* Session Stats Card */}
          <div className="mt-6 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-100 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Star className="text-blue-600" size={18} />
              <p className="text-xs font-black text-blue-900 uppercase tracking-wide">Your Progress</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Total Sessions</span>
                <span className="text-sm font-black text-slate-900">{sessionInsights.totalSessions}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Avg Score</span>
                <span className={`text-sm font-black ${getScoreColor(sessionInsights.averageScore)}`}>
                  {sessionInsights.averageScore.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">Trend</span>
                <div className="flex items-center gap-1">
                  {sessionInsights.improvementTrend >= 0 ? (
                    <TrendingUp size={12} className="text-green-500" />
                  ) : (
                    <TrendingDown size={12} className="text-red-500" />
                  )}
                  <span className={`text-sm font-black ${sessionInsights.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {sessionInsights.improvementTrend >= 0 ? '+' : ''}{sessionInsights.improvementTrend.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
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
              onClick={() => {
                loadPreviousResults();
                loadAllEvaluations();
              }}
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
        {/* SESSION TAB */}
        {activeTab === 'session' && (
          <>
            <div className="mb-6">
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors mb-4"
              >
                <ArrowLeft size={20} />
                Back to Dashboard
              </button>
              <h2 className="text-4xl font-black text-slate-900 mb-2">
                {isCalling ? '🎙️ Live Evaluation Session' : '🎯 Start New Evaluation'}
              </h2>
              <p className="text-lg text-slate-600">
                {isCalling ? 'Recording your voice evaluation...' : 'Configure your session and begin evaluation'}
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* LEFT - Session Setup */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-3xl border-2 border-slate-200 overflow-hidden shadow-lg">
                  {/* Card Header */}
                  <div className={`bg-gradient-to-r ${selectedRole ? ROLE_COLORS[selectedRole] : 'from-slate-600 to-slate-700'} p-8 text-white relative overflow-hidden`}>
                    <div className="absolute top-0 right-0 text-9xl opacity-10">
                      {selectedRoleData ? ROLE_ICONS[selectedRoleData.title] : '🎯'}
                    </div>
                    <div className="relative z-10">
                      <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold mb-4">
                        <div className={`w-2 h-2 rounded-full ${isCalling ? 'bg-red-500 animate-pulse' : 'bg-green-400'}`} />
                        {callState === 'connecting' ? 'Connecting...' : 
                         callState === 'active' ? 'Live Recording' :
                         callState === 'ending' ? 'Processing...' : 'Ready to Start'}
                      </div>
                      <h1 className="text-3xl font-black mb-2">
                        {selectedRoleData?.title || 'Voice Evaluation'}
                      </h1>
                      <p className="text-white/90">
                        {selectedRoleData?.description || 'Select a role to begin'}
                      </p>
                    </div>
                  </div>

                  <div className="p-8">
                    {error && (
                      <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                        <div>
                          <p className="font-semibold text-red-900 mb-1">Error</p>
                          <p className="text-sm text-red-700">{error}</p>
                        </div>
                      </div>
                    )}

                    {!isCalling ? (
                      <div className="space-y-6">
                        {/* Role Selection */}
                        <div>
                          <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                            Select Your Role
                          </label>
                          <select
                            value={selectedRole}
                            onChange={(e) => setSelectedRole(e.target.value)}
                            className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none font-semibold text-slate-900 bg-white hover:border-slate-300 transition-colors"
                          >
                            <option value="">-- Choose a role --</option>
                            {roles.map((r) => (
                              <option key={r.id} value={r.id}>
                                {ROLE_ICONS[r.title]} {r.title}
                              </option>
                            ))}
                          </select>
                          {selectedRoleData && (
                            <div className="mt-3 p-4 bg-blue-50 border-2 border-blue-100 rounded-xl">
                              <div className="flex items-start gap-2">
                                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={16} />
                                <p className="text-sm text-blue-900 font-medium">
                                  {selectedRoleData.description}
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Candidate Name */}
                        <div>
                          <label className="block text-sm font-black text-slate-900 mb-3 uppercase tracking-wide">
                            Your Full Name
                          </label>
                          <input
                            type="text"
                            value={candidateName}
                            onChange={(e) => setCandidateName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full p-4 border-2 border-slate-200 rounded-2xl focus:border-blue-500 focus:outline-none font-semibold text-slate-900 bg-white hover:border-slate-300 transition-colors"
                          />
                        </div>

                        {/* Start Button */}
                        <button
                          onClick={startEvaluation}
                          disabled={!selectedRole || !candidateName || callState === 'connecting'}
                          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-xl active:scale-95"
                        >
                          {callState === 'connecting' ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                              Connecting to AI...
                            </>
                          ) : (
                            <>
                              <Mic size={24} />
                              Start Voice Evaluation
                            </>
                          )}
                        </button>

                        {/* Feature Cards */}
                        <div className="grid grid-cols-3 gap-3 mt-6">
                          <div className="bg-emerald-50 rounded-xl p-4 border-2 border-emerald-100 text-center">
                            <CheckCircle className="text-emerald-600 mx-auto mb-2" size={24} />
                            <p className="text-xs font-bold text-emerald-900">AI-Powered</p>
                            <p className="text-[10px] text-emerald-700 mt-1">Real-time analysis</p>
                          </div>
                          <div className="bg-blue-50 rounded-xl p-4 border-2 border-blue-100 text-center">
                            <Trophy className="text-blue-600 mx-auto mb-2" size={24} />
                            <p className="text-xs font-bold text-blue-900">Instant Results</p>
                            <p className="text-[10px] text-blue-700 mt-1">Detailed feedback</p>
                          </div>
                          <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-100 text-center">
                            <Target className="text-purple-600 mx-auto mb-2" size={24} />
                            <p className="text-xs font-bold text-purple-900">Track Progress</p>
                            <p className="text-[10px] text-purple-700 mt-1">Growth insights</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        {/* Recording Animation */}
                        <div className="relative inline-block mb-8">
                          <div className="w-32 h-32 bg-gradient-to-br from-red-500 to-red-600 rounded-full animate-pulse flex items-center justify-center shadow-2xl">
                            <Volume2 className="text-white animate-pulse" size={48} />
                          </div>
                          <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
                          <div className="absolute -inset-4 rounded-full border-2 border-red-300 animate-pulse"></div>
                        </div>

                        <div className="mb-6">
                          <h2 className="text-3xl font-black text-slate-900 mb-2 flex items-center justify-center gap-3">
                            <Waves className="text-red-500 animate-pulse" size={32} />
                            Recording in Progress
                          </h2>
                          <p className="text-slate-600 font-medium">Speak clearly and confidently into your microphone</p>
                        </div>
                        
                        {/* Timer */}
                        <div className="mb-8 inline-block">
                          <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-10 py-5 rounded-2xl shadow-lg">
                            <div className="text-sm font-semibold mb-2 text-slate-300 uppercase tracking-wide">Duration</div>
                            <div className="text-5xl font-black tabular-nums">{formatTime(callDuration)}</div>
                          </div>
                        </div>

                        {/* Scenario */}
                        {scenario && (
                          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl text-left max-w-2xl mx-auto">
                            <div className="flex items-center gap-2 mb-3">
                              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                                <Play className="text-white" size={16} />
                              </div>
                              <p className="text-sm font-black text-blue-900 uppercase tracking-wide">Current Scenario</p>
                            </div>
                            <p className="text-slate-700 font-medium leading-relaxed">{scenario}</p>
                          </div>
                        )}

                        {/* Stop Button */}
                        <button
                          onClick={stopCall}
                          disabled={callState === 'ending'}
                          className="bg-gradient-to-r from-red-600 to-red-700 text-white px-12 py-5 rounded-2xl font-black text-lg hover:from-red-700 hover:to-red-800 transition-all flex items-center justify-center gap-3 mx-auto shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50"
                        >
                          {callState === 'ending' ? (
                            <>
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white" />
                              Processing Evaluation...
                            </>
                          ) : (
                            <>
                              <Square size={20} />
                              End Evaluation
                            </>
                          )}
                        </button>

                        <p className="mt-6 text-sm text-slate-500">
                          Your evaluation will be saved and results will appear in your history
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* RIGHT - Quick Stats */}
              <div className="space-y-6">
                {/* Role Stats */}
                {selectedRole && previousResults.length > 0 && (
                  <div className="bg-white rounded-2xl border-2 border-slate-200 p-6 shadow-lg">
                    <h3 className="text-lg font-black text-slate-900 mb-4">Role Performance</h3>
                    
                    <div className="space-y-4">
                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-semibold mb-2">Latest Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-3xl font-black ${getScoreColor(previousResults[0].overall_score)}`}>
                            {previousResults[0].overall_score.toFixed(1)}
                          </span>
                          <span className="text-slate-400 text-lg font-semibold">/ 10</span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-semibold mb-2">Total Sessions</p>
                        <p className="text-3xl font-black text-slate-900">{previousResults.length}</p>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-xl">
                        <p className="text-xs text-slate-600 font-semibold mb-2">Average Score</p>
                        <div className="flex items-baseline gap-2">
                          <span className={`text-3xl font-black ${getScoreColor(previousResults.reduce((sum, r) => sum + r.overall_score, 0) / previousResults.length)}`}>
                            {(previousResults.reduce((sum, r) => sum + r.overall_score, 0) / previousResults.length).toFixed(1)}
                          </span>
                          <span className="text-slate-400 text-lg font-semibold">/ 10</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips Card */}
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center">
                      <Info className="text-white" size={16} />
                    </div>
                    <h3 className="text-lg font-black text-amber-900">Pro Tips</h3>
                  </div>
                  <ul className="space-y-3 text-sm text-amber-900">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="font-medium">Speak clearly and at a moderate pace</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="font-medium">Be confident in your responses</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="font-medium">Use specific examples when possible</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                      <span className="font-medium">Stay focused on the scenario</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Evaluation History</h2>
              <p className="text-lg text-slate-600">Review your past evaluations and track improvements</p>
            </div>

            {/* Filter */}
            <div className="bg-white rounded-2xl border-2 border-slate-200 p-4">
              <select
                value={selectedHistoryRole}
                onChange={(e) => setSelectedHistoryRole(e.target.value)}
                className="px-4 py-2 border-2 border-slate-200 rounded-xl font-semibold text-slate-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="all">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.title}>{ROLE_ICONS[role.title]} {role.title}</option>
                ))}
              </select>
            </div>

            {/* Results Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {previousResults
                .filter(result => selectedHistoryRole === 'all' || result.role === selectedHistoryRole)
                .map((result, index) => (
                  <div
                    key={result.id}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-6 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {index === 0 && (
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase">
                              Latest
                            </span>
                          )}
                          <h3 className="font-black text-slate-900">{result.role}</h3>
                        </div>
                        <p className="text-sm text-slate-600 font-medium mb-1">{result.candidate_name}</p>
                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar size={12} />
                            {formatDate(result.created_at)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {result.duration_minutes}m
                          </span>
                        </div>
                      </div>
                      
                      <div className={`w-16 h-16 rounded-xl border-2 flex items-center justify-center ${getScoreBg(result.overall_score)}`}>
                        <div className="text-center">
                          <div className={`text-xl font-black ${getScoreColor(result.overall_score)}`}>
                            {result.overall_score.toFixed(1)}
                          </div>
                          <div className="text-[9px] text-slate-600 font-semibold -mt-0.5">/ 10</div>
                        </div>
                      </div>
                    </div>

                    {/* Score Breakdown */}
                    <div className="space-y-2 mb-4">
                      {[result.score_1, result.score_2, result.score_3, result.score_4, result.score_5].map((score, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getScoreBadge(score)} rounded-full transition-all`}
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-600 w-6 text-right">{score}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t border-slate-100">
                      <p className="text-xs text-slate-500 line-clamp-2">{result.recommendation}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* INSIGHTS TAB */}
        {activeTab === 'insights' && (
          <div className="space-y-6">
            <div className="mb-6">
              <h2 className="text-4xl font-black text-slate-900 mb-2">Performance Insights</h2>
              <p className="text-lg text-slate-600">Analyze your growth and identify improvement areas</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Activity className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">Total Sessions</p>
                    <p className="text-2xl font-black text-slate-900">{sessionInsights.totalSessions}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                    <Star className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">Average Score</p>
                    <p className={`text-2xl font-black ${getScoreColor(sessionInsights.averageScore)}`}>
                      {sessionInsights.averageScore.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border-2 border-slate-200 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                    {sessionInsights.improvementTrend >= 0 ? (
                      <TrendingUp className="text-purple-600" size={24} />
                    ) : (
                      <TrendingDown className="text-purple-600" size={24} />
                    )}
                  </div>
                  <div>
                    <p className="text-xs text-slate-600 font-semibold">Improvement</p>
                    <p className={`text-2xl font-black ${sessionInsights.improvementTrend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {sessionInsights.improvementTrend >= 0 ? '+' : ''}{sessionInsights.improvementTrend.toFixed(1)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Placeholder for Charts */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 p-8 text-center">
              <BarChart3 className="text-slate-300 mx-auto mb-4" size={64} />
              <p className="text-slate-600 font-semibold mb-2">Detailed Charts Coming Soon</p>
              <p className="text-slate-500 text-sm">Performance trends and analytics will be displayed here</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}