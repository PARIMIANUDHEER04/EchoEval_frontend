import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import Vapi from '@vapi-ai/web';
import Layout from '../components/Layout';
import { SessionSkeleton } from '../components/ui/Skeleton';
import RadialProgress from '../components/ui/RadialProgress';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import AudioBars from '../components/ui/AudioBars';
import EmptyState from '../components/ui/EmptyState';
import {
  Mic, Square, Clock, TrendingUp, CheckCircle, AlertCircle, Play,
  Activity, Star, Calendar, TrendingDown, Info, Volume2, History,
} from 'lucide-react';

const API_URL = "https://echo-eval-backend.vercel.app";
let vapi = null;

const ROLE_STYLE = {
  'project_manager': { label: 'Project Manager', color: 'border-blue-500 bg-blue-500/10', active: 'text-blue-400', dot: 'bg-blue-500' },
  'team_lead':       { label: 'Team Lead', color: 'border-violet-500 bg-violet-500/10', active: 'text-violet-400', dot: 'bg-violet-500' },
  'product_owner':   { label: 'Product Owner', color: 'border-emerald-500 bg-emerald-500/10', active: 'text-emerald-400', dot: 'bg-emerald-500' },
  'sales_manager':   { label: 'Sales Manager', color: 'border-amber-500 bg-amber-500/10', active: 'text-amber-400', dot: 'bg-amber-500' },
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
  const [pageLoading, setPageLoading] = useState(true);
  const [previousResults, setPreviousResults] = useState([]);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [selectedHistoryRole, setSelectedHistoryRole] = useState('all');
  const [sessionInsights, setSessionInsights] = useState({ averageScore: 0, totalSessions: 0, improvementTrend: 0 });

  useEffect(() => { loadUser(); loadRoles(); }, []);
  useEffect(() => { if (user?.email) loadAllEvaluations(); }, [user]);
  useEffect(() => { if (selectedRole && user?.email) loadPreviousResults(); }, [selectedRole, user]);
  useEffect(() => { if (roles.length > 0 && user) setPageLoading(false); }, [roles, user]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user?.user_metadata?.full_name) setCandidateName(user.user_metadata.full_name);
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      if (!res.ok) throw new Error();
      setRoles(await res.json());
    } catch { toast.error('Failed to load roles'); }
  };

  const loadAllEvaluations = async () => {
    if (!user?.email) return;
    try {
      const res = await fetch(`${API_URL}/evaluations/${encodeURIComponent(user.email)}`);
      if (!res.ok) return;
      const evals = (await res.json()).evaluations || [];
      if (evals.length > 0) {
        setSessionInsights({
          averageScore: evals.reduce((s, e) => s + e.overall_score, 0) / evals.length,
          totalSessions: evals.length,
          improvementTrend: evals.length >= 2 ? evals[0].overall_score - evals[1].overall_score : 0,
        });
      }
    } catch {}
  };

  const loadPreviousResults = async () => {
    if (!user?.email || !selectedRole) return;
    setIsLoadingResults(true);
    try {
      const res = await fetch(`${API_URL}/evaluations/${encodeURIComponent(user.email)}/role/${encodeURIComponent(selectedRole)}`);
      if (res.ok) setPreviousResults((await res.json()).evaluations || []);
    } catch {} finally { setIsLoadingResults(false); }
  };

  useEffect(() => {
    let interval;
    if (isCalling) interval = setInterval(() => setCallDuration(d => d + 1), 1000);
    else setCallDuration(0);
    return () => clearInterval(interval);
  }, [isCalling]);

  const setupVapi = () => {
    vapi.on('call-start', () => { setIsCalling(true); setCallState('active'); setError(null); });
    vapi.on('call-end', () => { setIsCalling(false); setCallState('idle'); toast.success('Evaluation complete!'); setTimeout(() => { loadPreviousResults(); loadAllEvaluations(); }, 2000); });
    vapi.on('error', (err) => { setIsCalling(false); setCallState('idle'); toast.error('Call failed: ' + err.message); });
  };

  const startEvaluation = async () => {
    if (!selectedRole || !candidateName.trim()) { toast.error('Please select a role and enter your name'); return; }
    if (!user?.email) { toast.error('Not authenticated'); return; }
    try {
      setError(null); setCallState('connecting');
      const res = await fetch(`${API_URL}/session/start`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: selectedRole, candidate_name: candidateName, user_email: user.email }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.error || 'Failed to start'); }
      const data = await res.json();
      setSessionId(data.sessionId); setScenario(data.scenario);
      if (!vapi) { vapi = new Vapi(data.publicKey); setupVapi(); }
      await vapi.start(data.assistantId);
    } catch (err) { toast.error(err.message); setCallState('idle'); }
  };

  const stopCall = () => { if (vapi) { setCallState('ending'); vapi.stop(); } setIsCalling(false); };
  const handleRefresh = () => { loadPreviousResults(); loadAllEvaluations(); };
  const formatTime = (s) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  const formatDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  const scoreColor = (s) => s >= 8 ? 'text-emerald-600' : s >= 6 ? 'text-amber-600' : 'text-red-600';
  const barColor = (s) => s >= 8 ? 'bg-emerald-500' : s >= 6 ? 'bg-amber-500' : 'bg-red-500';

  const selectedRoleData = roles.find(r => r.id === selectedRole);
  const tabs = [
    { id: 'session', label: 'Session', icon: Mic },
    { id: 'history', label: 'History', icon: History },
    { id: 'insights', label: 'Insights', icon: Activity },
  ];

  return (
    <Layout onRefresh={handleRefresh}>
      {pageLoading ? <SessionSkeleton /> : (
        <div className="animate-fade-in">
          {/* Tabs */}
          <div className="flex gap-1 mb-6 border-b border-edge">
            {tabs.map(t => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                    activeTab === t.id ? 'border-fg text-fg' : 'border-transparent text-fg-faint hover:text-fg-muted'
                  }`}>
                  <Icon size={14} /> {t.label}
                </button>
              );
            })}
          </div>

          {/* SESSION TAB */}
          {activeTab === 'session' && (
            <div className="animate-slide-up">
              <div className="mb-6">
                <h1 className="text-2xl font-semibold text-fg mb-1">
                  {isCalling ? 'Recording session' : 'New evaluation'}
                </h1>
                <p className="text-sm text-fg-muted">
                  {isCalling ? 'Speak clearly into your microphone.' : 'Select a role and start your voice evaluation.'}
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="bg-card border border-edge rounded-xl overflow-hidden">
                    {/* Status bar */}
                    <div className="px-5 py-3 border-b border-edge-subtle flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isCalling ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-xs font-medium text-fg-muted">
                          {callState === 'connecting' ? 'Connecting...' : callState === 'active' ? 'Live' : callState === 'ending' ? 'Processing...' : 'Ready'}
                        </span>
                      </div>
                      {selectedRoleData && <span className="text-xs text-fg-faint">{selectedRoleData.title}</span>}
                    </div>

                    <div className="p-5 md:p-6">
                      {error && (
                        <div className="mb-5 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2.5 text-sm">
                          <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                          <span className="text-red-400">{error}</span>
                        </div>
                      )}

                      {!isCalling ? (
                        <div className="space-y-5">
                          {/* Role cards */}
                          <div>
                            <label className="block text-xs font-medium text-fg-muted uppercase tracking-wider mb-2.5">Role</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                              {roles.map(r => {
                                const style = ROLE_STYLE[r.id] || { color: 'border-zinc-500 bg-zinc-500/10', active: 'text-zinc-400', dot: 'bg-zinc-500' };
                                const selected = selectedRole === r.id;
                                return (
                                  <button key={r.id} onClick={() => setSelectedRole(r.id)}
                                    className={`p-3.5 rounded-lg border-2 text-left transition-all ${
                                      selected ? style.color : 'border-edge bg-card hover:border-edge-hover'
                                    }`}>
                                    <div className="flex items-center gap-2.5">
                                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${selected ? style.dot : 'bg-edge-hover'}`} />
                                      <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${selected ? style.active : 'text-fg'}`}>{r.title}</p>
                                        <p className="text-xs text-fg-faint truncate">{r.description}</p>
                                      </div>
                                      {selected && <CheckCircle size={16} className={style.active} />}
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Name */}
                          <div>
                            <label className="block text-xs font-medium text-fg-muted uppercase tracking-wider mb-2">Name</label>
                            <input type="text" value={candidateName} onChange={(e) => setCandidateName(e.target.value)}
                              placeholder="Your full name"
                              className="w-full px-3.5 py-2.5 border border-edge rounded-lg text-sm text-fg bg-inset placeholder:text-fg-faint focus:outline-none focus:border-edge-hover transition-colors" />
                          </div>

                          {/* Start */}
                          <button onClick={startEvaluation} disabled={!selectedRole || !candidateName || callState === 'connecting'}
                            className="w-full bg-accent text-fg-accent py-3 rounded-lg text-sm font-medium hover:bg-accent-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2">
                            {callState === 'connecting' ? (
                              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Connecting...</>
                            ) : (
                              <><Mic size={16} /> Start evaluation</>
                            )}
                          </button>
                        </div>
                      ) : (
                        /* Recording state */
                        <div className="text-center py-10">
                          {/* Recording indicator */}
                          <div className="relative inline-flex items-center justify-center mb-8">
                            <div className="w-24 h-24 bg-red-500 rounded-full flex items-center justify-center relative z-10">
                              <Volume2 className="text-white" size={32} />
                            </div>
                            <div className="absolute inset-0 bg-red-500/30 rounded-full animate-pulse-ring" />
                          </div>

                          <div className="mb-6">
                            <div className="flex items-center justify-center gap-3 mb-2">
                              <AudioBars active barCount={4} />
                              <span className="text-lg font-semibold text-fg">Recording</span>
                              <AudioBars active barCount={4} />
                            </div>
                            <p className="text-sm text-fg-muted">Speak clearly and confidently</p>
                          </div>

                          {/* Timer */}
                          <div className="inline-block bg-accent text-fg-accent px-6 py-3 rounded-lg mb-6">
                            <span className="text-xs text-fg-accent/50 block mb-0.5">Duration</span>
                            <span className="text-3xl font-mono font-semibold tabular-nums">{formatTime(callDuration)}</span>
                          </div>

                          {/* Scenario */}
                          {scenario && (
                            <div className="mb-6 p-4 bg-inset border border-edge rounded-lg text-left max-w-lg mx-auto">
                              <div className="flex items-center gap-2 mb-2">
                                <Play size={12} className="text-fg-muted" />
                                <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">Scenario</span>
                              </div>
                              <p className="text-sm text-fg leading-relaxed">{scenario}</p>
                            </div>
                          )}

                          <button onClick={stopCall} disabled={callState === 'ending'}
                            className="bg-red-600 text-white px-8 py-3 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors flex items-center gap-2 mx-auto disabled:opacity-50">
                            {callState === 'ending' ? (
                              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> Processing...</>
                            ) : (
                              <><Square size={14} /> End evaluation</>
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right panel */}
                <div className="space-y-4">
                  {selectedRole && previousResults.length > 0 && (
                    <div className="bg-card border border-edge rounded-xl p-5">
                      <h3 className="text-sm font-semibold text-fg mb-4">Role stats</h3>
                      <div className="flex justify-center mb-4">
                        <RadialProgress score={previousResults[0].overall_score} size={72} strokeWidth={5} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-inset rounded-lg p-3 text-center">
                          <p className="text-[10px] text-fg-muted mb-0.5">Sessions</p>
                          <p className="text-lg font-semibold text-fg">{previousResults.length}</p>
                        </div>
                        <div className="bg-inset rounded-lg p-3 text-center">
                          <p className="text-[10px] text-fg-muted mb-0.5">Average</p>
                          <p className={`text-lg font-semibold ${scoreColor(previousResults.reduce((s, r) => s + r.overall_score, 0) / previousResults.length)}`}>
                            {(previousResults.reduce((s, r) => s + r.overall_score, 0) / previousResults.length).toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-card border border-edge rounded-xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Info size={14} className="text-fg-faint" />
                      <h3 className="text-sm font-semibold text-fg">Tips</h3>
                    </div>
                    <ul className="space-y-2">
                      {['Speak at a moderate pace', 'Be confident and direct', 'Use specific examples', 'Stay focused on the scenario'].map((tip, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-fg-muted">
                          <CheckCircle size={14} className="text-fg-faint flex-shrink-0 mt-0.5" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div className="mb-2">
                <h1 className="text-2xl font-semibold text-fg mb-1">History</h1>
                <p className="text-sm text-fg-muted">Review past evaluations and scores.</p>
              </div>

              <div className="flex items-center gap-3 mb-2">
                <select value={selectedHistoryRole} onChange={(e) => setSelectedHistoryRole(e.target.value)}
                  className="text-sm border border-edge rounded-lg px-3 py-1.5 text-fg focus:outline-none focus:border-edge-hover bg-card">
                  <option value="all">All roles</option>
                  {roles.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                </select>
              </div>

              {previousResults.length === 0 ? (
                <EmptyState icon={History} title="No evaluations yet" description="Complete a session to see history" actionLabel="Start session" onAction={() => setActiveTab('session')} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {previousResults
                    .filter(r => selectedHistoryRole === 'all' || r.role === selectedHistoryRole)
                    .map((r, i) => (
                      <div key={r.id} className="bg-card border border-edge rounded-xl p-5 hover:border-edge-hover transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-fg">{r.role}</span>
                              {i === 0 && <span className="text-[10px] font-medium bg-card-hover text-fg-muted px-1.5 py-0.5 rounded">Latest</span>}
                            </div>
                            <div className="flex items-center gap-3 text-xs text-fg-faint">
                              <span>{r.candidate_name}</span>
                              <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(r.created_at)}</span>
                              <span>{r.duration_minutes}m</span>
                            </div>
                          </div>
                          <RadialProgress score={r.overall_score} size={48} strokeWidth={4} />
                        </div>
                        <div className="space-y-1.5 mb-3">
                          {[r.score_1, r.score_2, r.score_3, r.score_4, r.score_5].map((sc, j) => (
                            <div key={j} className="flex items-center gap-2">
                              <div className="flex-1 h-1 bg-inset rounded-full overflow-hidden">
                                <div className={`h-full ${barColor(sc)} rounded-full transition-all duration-700`} style={{ width: `${sc * 10}%` }} />
                              </div>
                              <span className="text-[11px] text-fg-faint w-4 text-right">{sc}</span>
                            </div>
                          ))}
                        </div>
                        {r.recommendation && (
                          <p className="text-xs text-fg-muted line-clamp-2 pt-2 border-t border-edge-subtle">{r.recommendation}</p>
                        )}
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* INSIGHTS TAB */}
          {activeTab === 'insights' && (
            <div className="space-y-6 animate-fade-in">
              <div className="mb-2">
                <h1 className="text-2xl font-semibold text-fg mb-1">Insights</h1>
                <p className="text-sm text-fg-muted">Track your growth over time.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { label: 'Total sessions', value: sessionInsights.totalSessions, icon: Activity },
                  { label: 'Average score', value: sessionInsights.averageScore, decimals: 1, isScore: true, icon: Star },
                  { label: 'Improvement', value: sessionInsights.improvementTrend, decimals: 1, prefix: sessionInsights.improvementTrend >= 0 ? '+' : '', isTrend: true, icon: sessionInsights.improvementTrend >= 0 ? TrendingUp : TrendingDown },
                ].map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <div key={s.label} className={`bg-card border border-edge rounded-xl p-5 animate-slide-up stagger-${i + 1}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">{s.label}</span>
                        <Icon size={15} className="text-fg-faint" strokeWidth={1.5} />
                      </div>
                      <AnimatedCounter value={s.value} decimals={s.decimals || 0} prefix={s.prefix || ''}
                        className={`text-2xl font-semibold ${s.isScore ? scoreColor(s.value) : s.isTrend ? (s.value >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-fg'}`} />
                    </div>
                  );
                })}
              </div>

              <div className="bg-card border border-edge rounded-xl p-8">
                <EmptyState icon={Activity} title="Detailed analytics coming soon" description="Charts and trends will appear here" />
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
