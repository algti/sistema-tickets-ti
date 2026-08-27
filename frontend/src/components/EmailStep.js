import React, { useState } from 'react';
import { Mail } from 'lucide-react';

export default function EmailStep({ onSubmit, loading, error }) {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setEmailError('');

    if (!email.trim()) {
      setEmailError('Email é obrigatório');
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Email inválido');
      return;
    }

    onSubmit(email.toLowerCase());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Fazer Login</h2>
        <p className="text-slate-400">Insira seu email para receber um código de acesso</p>
      </div>

      {/* Email Input */}
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
          Email
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError('');
            }}
            placeholder="seu@email.com"
            disabled={loading}
            className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            autoFocus
          />
        </div>
        {emailError && (
          <p className="mt-2 text-sm text-red-400">{emailError}</p>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/50 rounded-lg">
          <p className="text-sm text-red-400">⚠️ {error}</p>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Enviando...
          </>
        ) : (
          <>
            <Mail className="w-4 h-4" />
            Enviar Código
          </>
        )}
      </button>

      {/* Info */}
      <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
        <p className="text-xs text-blue-300">
          ℹ️ Você receberá um código de 6 dígitos no seu email. O código expira em 8 minutos.
        </p>
      </div>
    </form>
  );
}
