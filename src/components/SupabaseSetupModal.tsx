import React, { useState } from 'react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  SUPABASE_SQL_SETUP,
} from '../lib/supabase';
import {
  X,
  Database,
  Key,
  Copy,
  Check,
  ExternalLink,
  ShieldCheck,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfigChanged: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onConfigChanged,
}) => {
  const currentConfig = getSupabaseConfig();
  const [url, setUrl] = useState(currentConfig.url);
  const [anonKey, setAnonKey] = useState(currentConfig.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'oauth'>('config');

  if (!isOpen) return null;

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SETUP);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || !anonKey.trim()) return;

    saveSupabaseConfig(url.trim(), anonKey.trim());
    setSaveSuccess(true);
    onConfigChanged();
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleClear = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    onConfigChanged();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-6 max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <span>Supabase & Google Auth Integration Hub</span>
              {currentConfig.isConfigured ? (
                <span className="text-[11px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full font-semibold">
                  Connected
                </span>
              ) : (
                <span className="text-[11px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-semibold">
                  Setup Available
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400">
              PostgreSQL database, Row Level Security, and Google OAuth setup
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2 mt-4 mb-3 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveTab('config')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'config'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Credentials & Status
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'sql'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            PostgreSQL Schema (SQL)
          </button>
          <button
            onClick={() => setActiveTab('oauth')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              activeTab === 'oauth'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Google OAuth Guide
          </button>
        </div>

        {/* Tab 1: Configuration Form */}
        {activeTab === 'config' && (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2 mb-1 text-emerald-400 font-semibold">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>Instant Play & Persistent Sync</span>
              </div>
              Chess Arena runs a built-in authoritative real-time WebSocket game engine so you can play immediately with friends from any browser or device. Connecting Supabase links PostgreSQL match records, official Google Auth, and Row Level Security.
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://your-project.supabase.co"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-sm text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-400"
                />
              </div>

              {saveSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0" />
                  <span>Credentials updated successfully!</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition-colors"
                >
                  Save & Connect Supabase
                </button>

                {currentConfig.isConfigured && (
                  <button
                    type="button"
                    onClick={handleClear}
                    className="py-2.5 px-3 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-red-400 transition-colors"
                  >
                    Reset
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: SQL Schema Script */}
        {activeTab === 'sql' && (
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Run this in your <strong>Supabase Dashboard → SQL Editor</strong>:
              </span>
              <button
                onClick={handleCopySql}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-colors"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'SQL Copied!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
              {SUPABASE_SQL_SETUP}
            </pre>
          </div>
        )}

        {/* Tab 3: Google OAuth Guide */}
        {activeTab === 'oauth' && (
          <div className="flex-1 overflow-y-auto space-y-3.5 text-xs text-slate-300 pr-1 leading-relaxed">
            <div className="p-3 rounded-xl bg-blue-950/20 border border-blue-500/30 text-blue-200">
              <span className="font-bold block mb-1">Google OAuth Provider Steps:</span>
              Follow these simple steps in Google Cloud Console & Supabase:
            </div>

            <ol className="list-decimal list-inside space-y-2.5 pl-1">
              <li>
                <strong className="text-white">Google Cloud Console:</strong> Open{' '}
                <a
                  href="https://console.cloud.google.com/apis/credentials"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 underline inline-flex items-center gap-0.5"
                >
                  APIs & Credentials <ExternalLink className="w-3 h-3 inline" />
                </a>
              </li>
              <li>
                Click <strong className="text-white">Create Credentials → OAuth client ID</strong>.
                Choose <strong className="text-white">Web application</strong>.
              </li>
              <li>
                Under <strong className="text-white">Authorized redirect URIs</strong>, add:
                <code className="block mt-1 p-2 rounded bg-slate-950 font-mono text-[11px] text-amber-300 break-all select-all border border-slate-800">
                  {url ? `${url}/auth/v1/callback` : 'https://<your-project-ref>.supabase.co/auth/v1/callback'}
                </code>
              </li>
              <li>
                Copy the generated <strong className="text-white">Client ID</strong> and{' '}
                <strong className="text-white">Client Secret</strong>.
              </li>
              <li>
                In your{' '}
                <strong className="text-white">Supabase Dashboard → Authentication → Providers → Google</strong>:
                Toggle Google ON, paste the Client ID and Secret, and click Save.
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
};
