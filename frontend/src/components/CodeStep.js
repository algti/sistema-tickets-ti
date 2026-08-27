import React, { useState } from 'react';
import { Lock, ArrowLeft, RotateCcw } from 'lucide-react';

export default function CodeStep({
  email,
  onSubmit,
  onResend,
  onBack,
  timeLeft,
  attempts,
  loading,
  error
}) {
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [resendLoading, setResendLoading] = useState(false);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCodeChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setCode(value);
    setCodeError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setCodeError('');

    if (!code.trim()) {
      setCodeError('Código é obrigatório');
      return;
    }

    if (code.length !== 6) {
      setCodeError('Código deve ter 6 dígitos');
      return;
    }

    onSubmit(code);
  };

  const handleResend = async () => {
    setResendLoading(true);
    try {
      await onResend();
      setCode('');
      setCodeError('');
    } finally {
      setResendLoading(false);
    }
  };

  const isExpired = timeLeft === 0;
  const isAlmostExpired = timeLeft < 60;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-slate-300 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </button>
        <h2 className="text-2xl font-bold text-white mb-2">Verificar Código</h2>
        <p className="text-slate-400">Insira o código de 6 dígitos enviado para</p>
        <p className="text-cyan-400 font-medium">{email}</p>
      </div>

      {/* Code Input */}
      <div>
        <label htmlFor="code" className="block text-sm font-medium text-slate-300 mb-2">
          Código de Acesso
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            id="code"
            type="text"
            value={code}
            onChange={handleCodeChange}
            placeholder="000000"
            disabled={loading || isExpired}
            maxLength="6"
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-center text-2xl tracking-widest font-mono"
            autoFocus
          />
        </div>
        {codeError && (
          <p className="mt-2 text-sm text-red-400">{codeError}</p>
        )}
      </div>

      {/* Timer */}
      <div className={`p-3 rounded-lg border ${
        isExpired
          ? 'bg-red-500/10 border-red-500/50'
          : isAlmostExpired
          ? 'bg-yellow-500/10 border-yellow-500/50'
          : 'bg-blue-500/10 border-blue-500/50'
      }`}>
        <div className="flex items-center justify-between">
          <span className={`text-sm font-medium ${
            isExpired
              ? 'text-red-400'
              : isAlmostExpired
              ? 'text-yellow-400'
              : 'text-blue-300'
          }`}>
            ⏱️ Tempo restante
          </span>
          <span className={`text-lg font-bold font-mono ${
            isExpired
              ? 'text-red-400'
              : isAlmostExpired
              ? 'text-yellow-400'
              : 'text-blue-400'
          }`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      {/* Attempts */}
      <div className="p-3 bg-slate-700/50 border border-slate-600 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-300">Tentativas restantes</span>
          <div className="flex gap-1">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < (5 - attempts) ? 'bg-cyan-500' : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <span className="text-sm font-medium text-slate-300">
            {5 - attempts}/5
          </span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* Expired Message */}
      {isExpired && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">
            ❌ Código expirado. Solicite um novo código.
          </p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || isExpired || code.length !== 6}
        className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Verificando...
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            Verificar Código
          </>
        )}
      </button>

      {/* Resend Button */}
      <button
        type="button"
        onClick={handleResend}
        disabled={resendLoading || loading}
        className="w-full py-2 px-4 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {resendLoading ? (
          <>
            <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
            Reenviando...
          </>
        ) : (
          <>
            <RotateCcw className="w-4 h-4" />
            Reenviar Código
          </>
        )}
      </button>
    </form>
  );
}
