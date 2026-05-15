"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  Activity, 
  Briefcase, 
  GraduationCap, 
  Users, 
  Truck, 
  Search, 
  Zap,
  TrendingUp,
  ShieldAlert,
  Loader2,
  Newspaper,
  ExternalLink,
  RefreshCw
} from "lucide-react";

const PERSONAS = [
  { id: "investor", label: "Investor", icon: TrendingUp },
  { id: "student", label: "Student", icon: GraduationCap },
  { id: "business_owner", label: "Business Owner", icon: Briefcase },
  { id: "general_public", label: "General Public", icon: Users },
  { id: "supply_chain", label: "Supply Chain Manager", icon: Truck },
  { id: "job_seeker", label: "Job Seeker", icon: Search },
];

interface Article {
  title: string;
  description: string;
  source: string;
  pubDate: string;
  link: string;
}

interface AnalysisResult {
  category: string;
  summary: string;
  immediate_impacts: string[];
  secondary_impacts: string[];
  risk_score: "Low" | "Medium" | "High";
  recommended_actions: string[];
}

export default function Home() {
  const [input, setInput] = useState("");
  const [persona, setPersona] = useState(PERSONAS[0].id);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [news, setNews] = useState<Article[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setNewsLoading(true);
    try {
      const res = await fetch('/api/news?q=economy+geopolitics+technology');
      const data = await res.json();
      setNews(data.articles || []);
    } catch {
      console.error("Failed to load trending news");
    } finally {
      setNewsLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!input.trim()) return;
    
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const selectedPersonaLabel = PERSONAS.find(p => p.id === persona)?.label || "User";
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, persona: selectedPersonaLabel }),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${response.status}`);
      }
      
      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Analysis failed. Please check your GEMINI_API_KEY in .env.local");
    } finally {
      setLoading(false);
    }
  };

  const riskColor = (score: string) => {
    if (score === 'High') return 'text-red-400';
    if (score === 'Medium') return 'text-amber-400';
    return 'text-emerald-400';
  };

  const riskBg = (score: string) => {
    if (score === 'High') return 'bg-red-500/10 border-red-500/30';
    if (score === 'Medium') return 'bg-amber-500/10 border-amber-500/30';
    return 'bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <main className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      
      {/* Header */}
      <header className="text-center mb-16 space-y-4 pt-8">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-blue-500/30 text-blue-400 mb-4"
        >
          <Activity size={16} />
          <span className="text-xs font-semibold tracking-widest uppercase">Decision Intelligence</span>
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-bold tracking-tight"
        >
          Sanket <span className="gradient-text">AI</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl text-zinc-400 max-w-2xl mx-auto font-light"
        >
          Don't just read the news.<br />
          <span className="text-zinc-200 font-medium">Understand exactly what it means for you.</span>
        </motion.p>
      </header>

      {/* Input Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass rounded-3xl p-6 md:p-8 mb-8"
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-3">
            <label className="block text-sm font-semibold text-zinc-300 ml-1 uppercase tracking-wider">
              📰 News Headline, Article Text, or URL
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. 'US raises tariffs on Chinese EV imports' or paste any article URL..."
              className="w-full bg-zinc-900/50 border border-zinc-700/50 rounded-2xl p-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all resize-none h-36 text-sm leading-relaxed"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-zinc-300 ml-1 uppercase tracking-wider">
              🎯 Your Persona
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PERSONAS.map((p) => {
                const Icon = p.icon;
                const isSelected = persona === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPersona(p.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-500/20 border-blue-500 text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]' 
                        : 'bg-zinc-900/50 border-zinc-800 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-200 hover:border-zinc-600'
                    }`}
                  >
                    <Icon size={18} className="mb-1.5" />
                    <span className="text-[9px] font-bold text-center uppercase tracking-wider leading-tight">{p.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
            ⚠️ {error}
          </div>
        )}

        <div className="mt-6 flex justify-between items-center">
          <p className="text-xs text-zinc-600">Scenario analysis only — not financial or investment advice.</p>
          <button
            onClick={handleAnalyze}
            disabled={!input.trim() || loading}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 active:scale-95 text-white px-8 py-3.5 rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(59,130,246,0.35)] hover:shadow-[0_0_35px_rgba(59,130,246,0.55)]"
          >
            {loading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Analyzing...
              </>
            ) : (
              <>
                <Zap size={18} />
                Generate Analysis
              </>
            )}
          </button>
        </div>
      </motion.div>

      {/* Trending News Cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-12"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
            <Newspaper size={14} /> Trending — Click to Analyze
          </h2>
          <button
            onClick={fetchNews}
            disabled={newsLoading}
            className="text-zinc-500 hover:text-zinc-200 transition-colors p-1.5 rounded-lg hover:bg-zinc-800"
          >
            <RefreshCw size={14} className={newsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
        
        {newsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glass-card h-28 rounded-2xl animate-pulse bg-zinc-800/30" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {news.slice(0, 6).map((article, i) => (
              <button
                key={i}
                onClick={() => setInput(article.title + (article.description ? `\n\n${article.description}` : ''))}
                className="glass-card text-left p-4 rounded-2xl cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs text-blue-400 font-medium uppercase tracking-wider">{article.source}</span>
                  <ExternalLink size={12} className="text-zinc-600 group-hover:text-zinc-400 flex-shrink-0 mt-0.5" />
                </div>
                <p className="text-sm text-zinc-200 font-medium leading-snug line-clamp-3">{article.title}</p>
              </button>
            ))}
          </div>
        )}
      </motion.section>

      {/* Results Dashboard */}
      <AnimatePresence>
        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="space-y-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-px bg-zinc-800 flex-1" />
              <span className="text-zinc-500 font-semibold uppercase tracking-widest text-xs">Impact Analysis</span>
              <div className="h-px bg-zinc-800 flex-1" />
            </div>

            {/* Summary & Risk */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3 glass-card p-6 rounded-2xl">
                <span className="inline-flex items-center px-3 py-1 rounded-full bg-zinc-800 text-zinc-300 text-xs font-semibold mb-4 uppercase tracking-wider">
                  {result.category}
                </span>
                <p className="text-lg font-medium text-zinc-100 leading-relaxed">{result.summary}</p>
              </div>
              
              <div className={`glass-card p-6 rounded-2xl border flex flex-col items-center justify-center text-center ${riskBg(result.risk_score)}`}>
                <ShieldAlert size={36} className={`${riskColor(result.risk_score)} mb-3`} />
                <span className="text-zinc-400 text-xs font-semibold uppercase tracking-widest mb-2">Risk Level</span>
                <span className={`text-4xl font-black ${riskColor(result.risk_score)}`}>
                  {result.risk_score}
                </span>
              </div>
            </div>

            {/* Impacts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-amber-400 uppercase tracking-wider">
                  <Zap size={16} /> Immediate Impact
                </h3>
                <ul className="space-y-3">
                  {result.immediate_impacts.map((impact, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                      <span className="text-zinc-300 text-sm leading-relaxed">{impact}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
              
              <div className="glass-card p-6 rounded-2xl">
                <h3 className="text-base font-bold mb-4 flex items-center gap-2 text-violet-400 uppercase tracking-wider">
                  <ArrowRight size={16} /> Secondary Effects
                </h3>
                <ul className="space-y-3">
                  {result.secondary_impacts.map((impact, i) => (
                    <motion.li 
                      key={i} 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 + 0.3 }}
                      className="flex items-start gap-3"
                    >
                      <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-2 flex-shrink-0" />
                      <span className="text-zinc-300 text-sm leading-relaxed">{impact}</span>
                    </motion.li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="glass-card p-8 rounded-2xl border border-blue-500/10">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-blue-400 uppercase tracking-wider">
                <Activity size={20} /> Recommended Actions for{' '}
                <span className="text-white">{PERSONAS.find(p => p.id === persona)?.label}</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {result.recommended_actions.map((action, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15 }}
                    className="bg-zinc-900/70 p-5 rounded-xl border border-zinc-800 flex items-start gap-3 hover:border-blue-500/30 transition-colors"
                  >
                    <div className="bg-blue-500/20 text-blue-400 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-zinc-200 text-sm font-medium leading-relaxed">{action}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Disclaimer */}
            <p className="text-center text-xs text-zinc-600 pb-8">
              ⚠️ Sanket AI provides scenario analysis only. This is not financial, investment, or legal advice.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

    </main>
  );
}
