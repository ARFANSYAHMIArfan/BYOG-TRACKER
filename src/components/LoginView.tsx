import React, { useState } from 'react';
import { Lock, School, ShieldCheck, KeyRound, AlertCircle, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';
import { SchoolLogo } from './SchoolLogo';

interface LoginViewProps {
  onLoginSuccess: (kodSekolah: string) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [kodSekolah, setKodSekolah] = useState('');
  const [kataLaluan, setKataLaluan] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const DEFAULT_KOD = 'MEE2141';
  const DEFAULT_PASS = 'BersikapMembina-MOZAC';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const inputKod = kodSekolah.trim();
      const inputPass = kataLaluan.trim();

      if (inputKod === DEFAULT_KOD && inputPass === DEFAULT_PASS) {
        localStorage.setItem('mozac_byog_session', JSON.stringify({
          kodSekolah: DEFAULT_KOD,
          schoolName: 'SM SAINS MUZAFFAR SYAH',
          authenticatedAt: new Date().toISOString(),
        }));
        onLoginSuccess(DEFAULT_KOD);
      } else {
        setIsSubmitting(false);
        setErrorMsg('Kod Sekolah atau Kata Laluan tidak sah. Sila semak maklumat log masuk anda.');
      }
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-950 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.35),rgba(255,255,255,0))] flex flex-col justify-center items-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-md">
        {/* School Crest & Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-2.5 bg-white rounded-2xl shadow-xl shadow-blue-900/20 mb-4 border-2 border-amber-400">
            <SchoolLogo className="w-16 h-16 sm:w-20 sm:h-20" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SM SAINS MUZAFFAR SYAH
          </h1>
          <p className="text-xs font-bold tracking-widest uppercase text-amber-400 mt-1">
            "BERSIKAP MEMBINA"
          </p>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-950/80 border border-blue-800/60 rounded-full text-xs font-medium text-blue-200 mt-3">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Sistem Pengurusan & Jejaki Peranti BYOG</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 backdrop-blur-md">
          <div className="mb-6 pb-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-amber-400" />
              Log Masuk Pentadbir
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Sila masukkan Kod Sekolah dan Kata Laluan rasmi sekolah untuk mengakses sistem peranti.
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="mb-5 p-3.5 bg-rose-500/15 border border-rose-500/30 rounded-xl flex items-start gap-2.5 text-xs text-rose-200">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Kod Sekolah */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Kod Sekolah</span>
                <span className="text-[10px] text-slate-500 font-mono">Rasmi Sekolah</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <School className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  value={kodSekolah}
                  onChange={(e) => setKodSekolah(e.target.value)}
                  placeholder="Contoh: MEE2141"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white rounded-xl text-sm font-mono placeholder:text-slate-600 transition-all"
                />
              </div>
            </div>

            {/* Kata Laluan */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>Kata Laluan</span>
                <span className="text-[10px] text-slate-500 font-mono">Laluan Rasmi</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={kataLaluan}
                  onChange={(e) => setKataLaluan(e.target.value)}
                  placeholder="Masukkan kata laluan..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 text-white rounded-xl text-sm font-sans placeholder:text-slate-600 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !kodSekolah.trim() || !kataLaluan.trim()}
              className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengesahkan Hak Akses...</span>
                </>
              ) : (
                <>
                  <span>Log Masuk Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} SM SAINS MUZAFFAR SYAH, MELAKA (MOZAC)</p>
          <p className="mt-1 text-[11px] text-slate-600">Hak Cipta Terpelihara • Unit Teknologi Maklumat</p>
        </div>
      </div>
    </div>
  );
};
