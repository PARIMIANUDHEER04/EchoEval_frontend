import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import { DashboardSkeleton } from '../components/ui/Skeleton';
import AnimatedCounter from '../components/ui/AnimatedCounter';
import RadialProgress from '../components/ui/RadialProgress';
import GlowCard from '../components/ui/GlowCard';
import EmptyState from '../components/ui/EmptyState';
import {
  Mic, TrendingUp, Award, Target, BarChart3, Clock, ArrowRight,
  Calendar, Activity, TrendingDown, Star, Filter, ChevronRight,
} from 'lucide-react';

const API_URL = "https://echo-eval-backend.vercel.app";

const ROLE_META = {
  'Project Manager': { color: '#3b82f6', bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-500' },
  'Team Lead':       { color: '#8b5cf6', bg: 'bg-violet-500/10', text: 'text-violet-400', dot: 'bg-violet-500' },
  'Product Owner':   { color: '#10b981', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'Sales Manager':   { color: '#f59e0b', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [roleStats, setRoleStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('all');
  const [overallStats, setOverallStats] = useState({
    totalEvaluations: 0, averageScore: 0, totalTime: 0,
    bestRole: null, improvementRate: 0, recentActivity: []
  });

  useEffect(() => { loadUser(); loadRoles(); }, []);
  useEffect(() => { if (user?.email && roles.length > 0) loadAllRoleStats(); }, [user, roles]);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const loadRoles = async () => {
    try {
      const res = await fetch(`${API_URL}/roles`);
      if (!res.ok) throw new Error();
      setRoles(await res.json());
    } catch { toast.error('Failed to load roles'); }
  };

  const loadAllRoleStats = async () => {
    setLoading(true);
    const stats = {};
    let totalEvals = 0, totalScoreSum = 0, totalTimeSum = 0;
    let bestRoleScore = 0, bestRoleName = null, allEvaluations = [];
    let improvementSum = 0, improvementCount = 0;

    for (const role of roles) {
      try {
        const res = await fetch(`${API_URL}/evaluations/${encodeURIComponent(user.email)}/role/${encodeURIComponent(role.id)}`);
        if (!res.ok) continue;
        const data = await res.json();
        const evaluations = data.evaluations || [];

        if (evaluations.length > 0) {
          const avgScore = evaluations.reduce((s, e) => s + e.overall_score, 0) / evaluations.length;
          const totalTime = evaluations.reduce((s, e) => s + e.duration_minutes, 0);
          let trend = 0;
          if (evaluations.length >= 2) { trend = evaluations[0].overall_score - evaluations[1].overall_score; improvementSum += trend; improvementCount++; }

          stats[role.title] = {
            count: evaluations.length, averageScore: avgScore, latestScore: evaluations[0].overall_score,
            totalTime, trend, latestDate: evaluations[0].created_at, evaluations,
            scoreDistribution: {
              excellent: evaluations.filter(e => e.overall_score >= 8).length,
              good: evaluations.filter(e => e.overall_score >= 6 && e.overall_score < 8).length,
              needsWork: evaluations.filter(e => e.overall_score < 6).length,
            },
            bestScore: Math.max(...evaluations.map(e => e.overall_score)),
          };
          totalEvals += evaluations.length;
          totalScoreSum += avgScore * evaluations.length;
          totalTimeSum += totalTime;
          allEvaluations = [...allEvaluations, ...evaluations.map(e => ({ ...e, roleTitle: role.title }))];
          if (avgScore > bestRoleScore) { bestRoleScore = avgScore; bestRoleName = role.title; }
        } else {
          stats[role.title] = { count: 0, averageScore: 0, latestScore: 0, totalTime: 0, trend: 0, latestDate: null, evaluations: [], scoreDistribution: { excellent: 0, good: 0, needsWork: 0 }, bestScore: 0 };
        }
      } catch (err) { console.error(`Failed to load stats for ${role.title}:`, err); }
    }

    allEvaluations.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    setRoleStats(stats);
    setOverallStats({
      totalEvaluations: totalEvals,
      averageScore: totalEvals > 0 ? totalScoreSum / totalEvals : 0,
      totalTime: totalTimeSum, bestRole: bestRoleName,
      improvementRate: improvementCount > 0 ? improvementSum / improvementCount : 0,
      recentActivity: allEvaluations.slice(0, 20),
    });
    setLoading(false);
  };

  const scoreColor = (s) => s >= 8 ? 'text-emerald-600' : s >= 6 ? 'text-amber-600' : 'text-red-600';
  const scoreLabel = (s) => s >= 8 ? 'Excellent' : s >= 6 ? 'Good' : 'Needs work';
  const formatTime = (m) => m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`;
  const formatDate = (d) => {
    if (!d) return 'Never';
    const diff = Math.ceil(Math.abs(new Date() - new Date(d)) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Yesterday';
    if (diff < 7) return `${diff}d ago`;
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const tabs = ['overview', 'history'];

  return (
    <Layout onRefresh={loadAllRoleStats}>
      {loading ? <DashboardSkeleton /> : (
        <div className="animate-fade-in">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold text-fg mb-1">
              Welcome back{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-sm text-fg-muted">Here's an overview of your evaluation performance.</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-edge">
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                  activeTab === tab ? 'border-fg text-fg' : 'border-transparent text-fg-faint hover:text-fg-muted'
                }`}
              >{tab}</button>
            ))}
          </div>

          {/* OVERVIEW */}
          {activeTab === 'overview' && (
            <>
              {/* Metrics row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {[
                  { label: 'Total evaluations', value: overallStats.totalEvaluations, icon: Target },
                  { label: 'Average score', value: overallStats.averageScore, decimals: 1, isScore: true, icon: Star },
                  { label: 'Practice time', valueText: formatTime(overallStats.totalTime), icon: Clock },
                  { label: 'Improvement', value: overallStats.improvementRate, decimals: 1, prefix: overallStats.improvementRate >= 0 ? '+' : '', isTrend: true, icon: overallStats.improvementRate >= 0 ? TrendingUp : TrendingDown },
                ].map((m, i) => {
                  const Icon = m.icon;
                  return (
                    <div key={m.label} className={`bg-card border border-edge rounded-xl p-5 animate-slide-up stagger-${i + 1}`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-medium text-fg-muted uppercase tracking-wider">{m.label}</span>
                        <Icon size={15} className="text-fg-faint" strokeWidth={1.5} />
                      </div>
                      {m.valueText ? (
                        <p className="text-2xl font-semibold text-fg">{m.valueText}</p>
                      ) : (
                        <AnimatedCounter
                          value={m.value} decimals={m.decimals || 0} prefix={m.prefix || ''}
                          className={`text-2xl font-semibold ${m.isScore ? scoreColor(m.value) : m.isTrend ? (m.value >= 0 ? 'text-emerald-600' : 'text-red-600') : 'text-fg'}`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Role cards */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-fg">Performance by role</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {roles.map((role) => {
                  const s = roleStats[role.title] || { count: 0, averageScore: 0, latestScore: 0, totalTime: 0, trend: 0, latestDate: null, scoreDistribution: { excellent: 0, good: 0, needsWork: 0 }, bestScore: 0 };
                  const meta = ROLE_META[role.title] || { color: '#71717a', bg: 'bg-zinc-500/10', text: 'text-zinc-400', dot: 'bg-zinc-500' };

                  return (
                    <GlowCard key={role.id} onClick={() => navigate('/session', { state: { selectedRole: role.id } })}>
                      <div className="p-5">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${meta.dot}`} />
                            <div>
                              <h3 className="text-sm font-semibold text-fg">{role.title}</h3>
                              <p className="text-xs text-fg-faint">{s.count} session{s.count !== 1 ? 's' : ''}</p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-fg-faint" />
                        </div>

                        {s.count > 0 ? (
                          <>
                            <div className="flex items-end justify-between mb-5">
                              <div>
                                <p className="text-xs text-fg-muted mb-1">Average</p>
                                <div className="flex items-baseline gap-1.5">
                                  <span className={`text-3xl font-semibold ${scoreColor(s.averageScore)}`}>{s.averageScore.toFixed(1)}</span>
                                  <span className="text-xs text-fg-faint">/10</span>
                                </div>
                                <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${meta.bg} ${meta.text} mt-1 inline-block`}>
                                  {scoreLabel(s.averageScore)}
                                </span>
                              </div>
                              <RadialProgress score={s.latestScore} size={56} strokeWidth={5} />
                            </div>

                            {/* Distribution bars */}
                            <div className="space-y-2 mb-4">
                              {[
                                { label: 'Excellent', count: s.scoreDistribution.excellent, color: 'bg-emerald-500' },
                                { label: 'Good', count: s.scoreDistribution.good, color: 'bg-amber-500' },
                                { label: 'Needs work', count: s.scoreDistribution.needsWork, color: 'bg-red-500' },
                              ].map(d => (
                                <div key={d.label} className="flex items-center gap-3">
                                  <span className="text-[11px] text-fg-muted w-16">{d.label}</span>
                                  <div className="flex-1 h-1.5 bg-inset rounded-full overflow-hidden">
                                    <div className={`h-full ${d.color} rounded-full transition-all duration-700`} style={{ width: s.count > 0 ? `${(d.count / s.count) * 100}%` : '0%' }} />
                                  </div>
                                  <span className="text-[11px] text-fg-faint w-4 text-right">{d.count}</span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between pt-3 border-t border-edge-subtle">
                              <div className="flex items-center gap-4 text-xs text-fg-muted">
                                <span className="flex items-center gap-1">
                                  {s.trend >= 0 ? <TrendingUp size={12} className="text-emerald-500" /> : <TrendingDown size={12} className="text-red-500" />}
                                  <span className={s.trend >= 0 ? 'text-emerald-600' : 'text-red-600'}>{s.trend > 0 ? '+' : ''}{s.trend.toFixed(1)}</span>
                                </span>
                                <span>Best: {s.bestScore.toFixed(1)}</span>
                              </div>
                              <span className="text-xs text-fg-faint">{formatDate(s.latestDate)}</span>
                            </div>
                          </>
                        ) : (
                          <EmptyState icon={Mic} title="No sessions yet" description="Start your first evaluation" actionLabel="Start" onAction={() => navigate('/session', { state: { selectedRole: role.id } })} />
                        )}
                      </div>
                    </GlowCard>
                  );
                })}
              </div>

              {/* CTA */}
              <div className="bg-accent rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-fg-accent font-semibold mb-1">Ready to practice?</h3>
                  <p className="text-fg-accent/60 text-sm">Start a new voice evaluation session.</p>
                </div>
                <button onClick={() => navigate('/session')} className="bg-card text-fg px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-card-hover transition-colors flex items-center gap-2">
                  <Mic size={16} /> New session
                </button>
              </div>
            </>
          )}

          {/* HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-3 mb-2">
                <Filter size={14} className="text-fg-faint" />
                <select
                  value={selectedRoleFilter}
                  onChange={(e) => setSelectedRoleFilter(e.target.value)}
                  className="text-sm border border-edge rounded-lg px-3 py-1.5 text-fg focus:outline-none focus:border-edge-hover bg-card"
                >
                  <option value="all">All roles</option>
                  {roles.map(r => <option key={r.id} value={r.title}>{r.title}</option>)}
                </select>
              </div>

              <div className="bg-card border border-edge rounded-xl overflow-hidden">
                <div className="divide-y divide-edge-subtle">
                  {overallStats.recentActivity
                    .filter(a => selectedRoleFilter === 'all' || a.roleTitle === selectedRoleFilter)
                    .map((a, i) => {
                      const meta = ROLE_META[a.roleTitle] || { dot: 'bg-zinc-500', bg: 'bg-zinc-500/10', text: 'text-zinc-400' };
                      return (
                        <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-card-hover transition-colors">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${meta.dot}`} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className="text-sm font-medium text-fg">{a.roleTitle}</span>
                                {i === 0 && <span className="text-[10px] font-medium bg-card-hover text-fg-muted px-1.5 py-0.5 rounded">Latest</span>}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-fg-faint">
                                <span>{a.candidate_name}</span>
                                <span className="flex items-center gap-1"><Calendar size={11} />{formatDate(a.created_at)}</span>
                                <span>{a.duration_minutes}m</span>
                              </div>
                            </div>
                          </div>
                          <div className={`text-lg font-semibold ${scoreColor(a.overall_score)}`}>
                            {a.overall_score.toFixed(1)}
                          </div>
                        </div>
                      );
                    })}
                </div>
                {overallStats.recentActivity.length === 0 && (
                  <EmptyState icon={BarChart3} title="No evaluations yet" description="Complete your first session to see history" />
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
