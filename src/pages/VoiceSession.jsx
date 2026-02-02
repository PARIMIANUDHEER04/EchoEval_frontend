import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import Vapi from '@vapi-ai/web';
import { Mic, Square, ArrowLeft, RefreshCw, Clock, Trophy } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
let vapi = null;

export default function VoiceSession() {
  const navigate = useNavigate();
  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [candidateName, setCandidateName] = useState('');
  const [isCalling, setIsCalling] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [callDuration, setCallDuration] = useState(0);
  const [user, setUser] = useState(null);
  const [scenario, setScenario] = useState('');
  
  // Previous results
  const [previousResults, setPreviousResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [resultsError, setResultsError] = useState(null);

  useEffect(() => {
    loadUser();
    loadRoles();
  }, []);

  // Load previous results when role changes
  useEffect(() => {
    if (selectedRole && user?.email) {
      loadPreviousResults();
    }
  }, [selectedRole, user]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    console.log('✅ User loaded:', user?.email);
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      const data = await res.json();
      setRoles(data);
    } catch (err) {
      setError('Failed to load roles');
    }
  };

  // Load previous results for selected role
  const loadPreviousResults = async () => {
    if (!user?.email || !selectedRole) return;
    
    setIsLoadingResults(true);
    setResultsError(null);
    
    try {
      console.log('📊 Loading previous results for:', user.email, selectedRole);
      const res = await fetch(`${API_URL}/evaluations/${user.email}/role/${selectedRole}`);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ Loaded results:', data.evaluations);
        setPreviousResults(data.evaluations);
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

  // Duration timer
  useEffect(() => {
    let interval;
    if (isCalling) {
      interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isCalling]);

  // Setup VAPI listeners
  const setupVapi = () => {
    vapi.on('call-start', () => {
      console.log('✅ Call started');
      setIsCalling(true);
      setError(null);
    });

    vapi.on('call-end', () => {
      console.log('✅ Call ended');
      setIsCalling(false);
      // Don't show processing - just let user refresh the results card
    });

    vapi.on('error', (err) => {
      console.error('❌ Error:', err);
      setIsCalling(false);
      setError('Call failed: ' + err.message);
    });
  };

  // Start evaluation
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
      
      console.log('🚀 Starting evaluation with:', {
        role: selectedRole,
        candidate_name: candidateName,
        user_email: user.email
      });

      const res = await fetch(`${API_URL}/session/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: selectedRole,
          candidate_name: candidateName,
          user_email: user.email
        })
      });

      if (!res.ok) {
        throw new Error('Failed to start session');
      }

      const data = await res.json();
      console.log('✅ Session started:', data);
      setSessionId(data.sessionId);
      setScenario(data.scenario);

      // Initialize VAPI
      if (!vapi) {
        vapi = new Vapi(data.publicKey);
        setupVapi();
      }

      // Start call
      await vapi.start(data.assistantId);
    } catch (err) {
      console.error('❌ Failed to start:', err);
      setError('Failed to start: ' + err.message);
    }
  };

  // Stop call
  const stopCall = () => {
    if (vapi) vapi.stop();
    setIsCalling(false);
  };

  // Format time
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Format date
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
    if (score >= 8) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 6) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getScoreBadge = (score) => {
    if (score >= 8) return 'bg-green-500';
    if (score >= 6) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // ==================== MAIN VIEW ====================
  return (
    <div className="flex-1 p-8">
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6"
      >
        <ArrowLeft size={20} />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
        
        {/* LEFT CARD - Evaluation Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <h1 className="text-2xl font-bold mb-1">🎯 New Evaluation</h1>
            <p className="text-blue-100 text-sm">Start a voice evaluation session</p>
          </div>

          <div className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                ⚠️ {error}
              </div>
            )}

            {!isCalling ? (
              <div className="space-y-4">
                {/* Role Selection */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Select Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                  >
                    <option value="">-- Choose a role --</option>
                    {roles.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title}
                      </option>
                    ))}
                  </select>
                  {selectedRole && (
                    <p className="mt-2 text-xs text-slate-600">
                      {roles.find(r => r.id === selectedRole)?.description}
                    </p>
                  )}
                </div>

                {/* Candidate Name */}
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Candidate Name
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    placeholder="Enter candidate name"
                    className="w-full p-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:outline-none text-sm"
                  />
                </div>

                <button
                  onClick={startEvaluation}
                  disabled={!selectedRole || !candidateName}
                  className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                >
                  <Mic size={20} />
                  Start Evaluation
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="relative inline-block mb-4">
                  <div className="w-24 h-24 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                    <Mic className="text-white" size={32} />
                  </div>
                  <div className="absolute inset-0 rounded-full border-4 border-red-500 animate-ping"></div>
                </div>

                <h2 className="text-xl font-bold text-slate-900 mb-2">
                  🔴 Recording in Progress
                </h2>
                
                <div className="mb-4 p-3 bg-slate-50 rounded-lg inline-block">
                  <div className="text-xs text-slate-600 mb-1">Duration</div>
                  <div className="text-2xl font-bold text-slate-900">{formatTime(callDuration)}</div>
                </div>

                {scenario && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg text-left">
                    <div className="text-xs font-semibold text-blue-900 mb-1">Scenario:</div>
                    <p className="text-sm text-slate-700">{scenario}</p>
                  </div>
                )}

                <button
                  onClick={stopCall}
                  className="bg-red-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <Square size={18} />
                  End Evaluation
                </button>

                <p className="mt-4 text-xs text-slate-500">
                  Results will appear on the right after processing
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT CARD - Previous Results */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="bg-gradient-to-r from-slate-700 to-slate-900 p-6 text-white flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-1">📊 Previous Results</h2>
              <p className="text-slate-300 text-sm">
                {selectedRole ? `For ${roles.find(r => r.id === selectedRole)?.title}` : 'Select a role to view'}
              </p>
            </div>
            <button
              onClick={loadPreviousResults}
              disabled={isLoadingResults || !selectedRole}
              className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm"
            >
              <RefreshCw size={16} className={isLoadingResults ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>

          <div className="p-6 max-h-[600px] overflow-y-auto">
            {!selectedRole ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Trophy className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 text-sm">Select a role to view previous evaluations</p>
              </div>
            ) : isLoadingResults ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-slate-600 text-sm">Loading results...</p>
              </div>
            ) : resultsError ? (
              <div className="text-center py-12">
                <p className="text-red-600 text-sm mb-2">{resultsError}</p>
                <button
                  onClick={loadPreviousResults}
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                >
                  Try Again
                </button>
              </div>
            ) : previousResults.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Clock className="text-slate-400" size={32} />
                </div>
                <p className="text-slate-500 text-sm mb-1">No evaluations yet</p>
                <p className="text-slate-400 text-xs">Complete an evaluation to see results here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {previousResults.map((result) => (
                  <div
                    key={result.id}
                    className="border-2 border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all cursor-pointer"
                    onClick={() => navigate('/', { state: { selectedEvaluation: result } })}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 text-sm mb-1">
                          {result.candidate_name}
                        </h3>
                        <p className="text-xs text-slate-500 flex items-center gap-2">
                          <Clock size={12} />
                          {formatDate(result.created_at)} • {result.duration_minutes} min
                        </p>
                      </div>
                      <div className={`flex items-center justify-center w-14 h-14 rounded-full border-2 ${getScoreColor(result.overall_score)}`}>
                        <div className="text-center">
                          <div className="text-lg font-bold">{result.overall_score}</div>
                          <div className="text-[9px] -mt-1">/ 10</div>
                        </div>
                      </div>
                    </div>

                    {/* Score Bars */}
                    <div className="space-y-1.5 mb-3">
                      {[result.score_1, result.score_2, result.score_3, result.score_4, result.score_5].map((score, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className={`h-full ${getScoreBadge(score)} rounded-full transition-all`}
                              style={{ width: `${score * 10}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-slate-600 w-6">{score}</span>
                        </div>
                      ))}
                    </div>

                    {/* Recommendation */}
                    <div className="pt-2 border-t border-slate-100">
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {result.recommendation}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}