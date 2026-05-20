import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Sparkles, History, Edit3, RefreshCw, Copy, Check } from 'lucide-react';

const Linkedin = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);
import { TypeAnimation } from 'react-type-animation';

const API_URL = 'http://localhost:5000/api';

function App() {
  const [topic, setTopic] = useState('');
  const [tone, setTone] = useState('Professional');
  const [keywords, setKeywords] = useState('');
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const res = await axios.get(`${API_URL}/posts/history`);
      setHistory(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setPost(null);
    try {
      const res = await axios.post(`${API_URL}/posts/generate`, { topic, tone, keywords });
      setPost(res.data.post);
      fetchHistory();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleImprove = async () => {
    setLoading(true);
    const oldPost = post;
    setPost(null);
    try {
      const res = await axios.post(`${API_URL}/posts/improve`, { currentContent: oldPost, feedback });
      setPost(res.data.post);
      setFeedback('');
    } catch (err) {
      console.error(err);
      setPost(oldPost);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setPost(null);
    handleGenerate({ preventDefault: () => {} });
  };

  const copyToClipboard = () => {
    if (post) {
      navigator.clipboard.writeText(post);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center">
      <header className="w-full bg-white/80 backdrop-blur-md shadow-sm py-4 px-6 flex items-center justify-between sticky top-0 z-50 border-b border-white/20">
        <div className="flex items-center gap-2 text-brand-blue font-bold text-xl">
          <div className="bg-brand-blue p-1.5 rounded-lg text-white shadow-lg shadow-brand-blue/20">
            <Linkedin className="w-6 h-6" />
          </div>
          <span className="tracking-tight text-slate-800">PostGen <span className="text-brand-blue">AI</span></span>
        </div>
        <div className="flex items-center gap-4">
        </div>
      </header>

      <main className="w-full max-w-7xl p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Input Form */}
        <div className="lg:col-span-4 space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
              <Edit3 className="w-5 h-5 text-brand-blue" />
              Creative Studio
            </h2>
            <form onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Topic or Intent</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full glass-input rounded-xl p-4 min-h-[120px] resize-none text-sm leading-relaxed"
                  placeholder="What's on your mind? e.g. The future of AI in coding..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select the Vibe</label>
                <div className="grid grid-cols-2 gap-2">
                    {['Professional', 'Motivational', 'Storytelling', 'Casual & Humorous'].map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTone(t)}
                            className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition-all border ${
                                tone === t 
                                ? 'bg-brand-blue text-white border-brand-blue shadow-lg shadow-brand-blue/20' 
                                : 'bg-white/50 text-slate-600 border-slate-200/50 hover:bg-white'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Strategic Keywords</label>
                <input 
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full glass-input rounded-xl p-4 text-sm"
                  placeholder="e.g. innovation, web3, scaling"
                />
              </div>

              <button 
                type="submit" 
                disabled={loading || !topic}
                className="w-full bg-slate-900 hover:bg-black text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-slate-200"
              >
                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5 text-brand-blue" />}
                {loading ? 'AI is thinking...' : 'Generate Magic'}
              </button>
            </form>
          </div>
        </div>

        {/* Middle Column: Preview & Output */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-card p-6 flex flex-col min-h-[600px]">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold flex items-center gap-2 text-slate-800">
                <Sparkles className="w-5 h-5 text-brand-blue" />
                AI Output
                </h2>
                {post && (
                    <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-1 rounded-full uppercase tracking-widest animate-pulse">
                        Ready to post
                    </span>
                )}
            </div>

            <div className="flex-1 bg-white/40 rounded-2xl p-6 border border-white/50 mb-6 relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-brand-blue/20 group-hover:bg-brand-blue transition-colors duration-500"></div>
              {loading ? (
                <div className="h-full flex items-center justify-center flex-col text-slate-400">
                  <div className="relative mb-6">
                    <div className="w-16 h-16 border-4 border-brand-blue/10 border-t-brand-blue rounded-full animate-spin"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 text-brand-blue animate-pulse" />
                  </div>
                  <p className="font-medium text-slate-600">Drafting your masterpiece...</p>
                  <p className="text-xs mt-1 text-slate-400">Usually takes 2-4 seconds</p>
                </div>
              ) : post ? (
                <div className="prose prose-slate max-w-none text-slate-800 leading-relaxed font-sans text-[15px] whitespace-pre-wrap">
                  <TypeAnimation
                    sequence={[post, 1000]}
                    wrapper="div"
                    cursor={true}
                    speed={90}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center px-10">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 border border-slate-100">
                    <Edit3 className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-sm font-medium">Input your ideas on the left</p>
                  <p className="text-xs mt-1 leading-relaxed">Our AI will craft a high-engagement post tailored to your selected tone.</p>
                </div>
              )}
            </div>

            {post && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
                <div className="flex gap-3">
                  <button 
                    onClick={handleRegenerate}
                    className="flex-1 bg-white hover:bg-slate-50 text-slate-700 font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 border border-slate-200 shadow-sm"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Give it another go
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    className="flex-1 bg-brand-blue hover:bg-brand-blue-hover text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/20"
                  >
                    {copied ? <Check className="w-4 h-4 animate-bounce" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Copied to Clipboard' : 'Copy Content'}
                  </button>
                </div>

                <div className="pt-6 border-t border-slate-100/50">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Refine with Feedback</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      placeholder="e.g. Add more emojis or make it punchier"
                      className="flex-1 glass-input rounded-xl px-4 py-3 text-sm"
                    />
                    <button 
                      onClick={handleImprove}
                      disabled={!feedback || loading}
                      className="bg-slate-800 hover:bg-black text-white px-6 py-3 rounded-xl transition-all text-sm font-bold disabled:opacity-50 shadow-lg shadow-slate-200"
                    >
                      Refine
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-3 space-y-6">
          <div className="glass-card p-6 h-[600px] flex flex-col">
            <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
              <History className="w-5 h-5 text-brand-blue" />
              Vault
            </h2>
            <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
              {history.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
                    <History className="w-10 h-10 mb-2 stroke-1" />
                    <p className="text-xs font-medium">No saved drafts yet</p>
                </div>
              ) : (
                history.map((h, i) => (
                  <div 
                    key={i} 
                    className="p-4 bg-white/40 border border-white/60 rounded-xl hover:border-brand-blue/40 hover:bg-white transition-all cursor-pointer group relative overflow-hidden shadow-sm"
                    onClick={() => { setPost(h.content); setTopic(h.topic); setTone(h.tone); }}
                  >
                    <div className="absolute top-0 right-0 w-8 h-8 bg-brand-blue/5 rounded-bl-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Sparkles className="w-3 h-3 text-brand-blue" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 truncate mb-1 pr-6">{h.topic}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold bg-brand-blue/10 text-brand-blue px-2 py-0.5 rounded-md uppercase tracking-tight">
                        {h.tone}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed italic border-l-2 border-slate-100 pl-2">"{h.content}"</p>
                  </div>
                ))
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100/50">
                <p className="text-[10px] text-slate-400 text-center font-medium uppercase tracking-[0.2em]">Academic Project v1.0</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
