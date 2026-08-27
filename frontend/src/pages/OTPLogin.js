import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

export default function OTPLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('email'); // 'email' ou 'code'
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [timeLeft, setTimeLeft] = useState(480); // 8 minutos em segundos
  const [attempts, setAttempts] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);

  // Se usuário já está logado, redirecionar para dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  // Timer de expiração
  useEffect(() => {
    if (step === 'code' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    if (step === 'code' && timeLeft === 0) {
      setError('Código expirado. Solicite um novo código.');
      setStep('email');
    }
  }, [timeLeft, step]);

  // Solicitar OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Digite seu email');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailInput })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao solicitar código');
      }

      const data = await response.json();
      setEmail(emailInput);
      setExpiresIn(data.expires_in);
      setTimeLeft(data.expires_in);
      setAttempts(0);
      setCode('');
      setStep('code');
      toast.success('Código enviado para seu email!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Verificar OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Digite o código');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code })
      });

      if (!response.ok) {
        const data = await response.json();
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= 5) {
          setError('Máximo de tentativas atingido. Solicite um novo código.');
          setStep('email');
        } else {
          setError(`${data.detail} (Tentativa ${newAttempts}/5)`);
        }
        throw new Error(data.detail);
      }

      const data = await response.json();
      
      // Salvar token
      localStorage.setItem('token', data.access_token);
      
      // Recarregar página para atualizar AuthContext
      window.location.href = '/dashboard';
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reenviar OTP
  const handleResendOTP = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/v1/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao reenviar código');
      }

      const data = await response.json();
      setTimeLeft(data.expires_in);
      setAttempts(0);
      setCode('');
      setError('');
      toast.success('Novo código enviado!');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Voltar para email
  const handleBackToEmail = () => {
    setStep('email');
    setEmailInput('');
    setCode('');
    setError('');
    setTimeLeft(480);
    setAttempts(0);
  };

  // Formatar tempo
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4" style={{
      backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(0, 255, 255, 0.1) 0%, transparent 50%)'
    }}>
      <style>{`
        @keyframes glow {
          0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5), 0 0 40px rgba(0, 255, 255, 0.3); }
          50% { box-shadow: 0 0 30px rgba(0, 255, 255, 0.8), 0 0 60px rgba(0, 255, 255, 0.5); }
        }
        .glow-box {
          animation: glow 3s ease-in-out infinite;
        }
      `}</style>
      
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logo-alg.png" alt="ALG" className="w-20 h-20 mx-auto mb-4" />
        </div>

        {/* Título com glow */}
        <div className="text-center mb-8">
          <div className="glow-box border-2 border-cyan-400 rounded-lg py-4 px-6 mb-4">
            <h1 className="text-3xl font-mono font-bold text-white tracking-wider">SISTEMA DE TICKETS</h1>
          </div>
          <p className="text-cyan-400 text-lg font-semibold mb-2">ALG Soluções em Tecnologia</p>
          <p className="text-gray-400 text-sm">Faça login com suas credenciais</p>
        </div>

        {/* Card */}
        <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 mb-8">
          {step === 'email' ? (
            // Email Step
            <form onSubmit={handleRequestOTP} className="space-y-6">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  placeholder="Digite seu email"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors"
                  disabled={loading}
                />
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-black font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Enviando...' : 'Entrar'}
              </button>
            </form>
          ) : (
            // Code Step
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="text-center mb-4">
                <p className="text-gray-400 text-sm">Código enviado para:</p>
                <p className="text-white font-medium">{email}</p>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Código OTP</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-400 transition-colors text-center text-2xl tracking-widest font-mono"
                  disabled={loading}
                />
              </div>

              <div className="text-center">
                <p className="text-cyan-400 text-sm">
                  Expira em: <span className="font-mono font-bold">{formatTime(timeLeft)}</span>
                </p>
                {attempts > 0 && (
                  <p className="text-yellow-400 text-xs mt-1">Tentativa {attempts}/5</p>
                )}
              </div>

              {error && (
                <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-gray-600 text-black font-bold py-3 rounded-lg transition-colors"
              >
                {loading ? 'Verificando...' : 'Verificar'}
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleBackToEmail}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  Voltar
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium py-2 rounded-lg transition-colors text-sm"
                >
                  Reenviar
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Info */}
        <div className="text-center p-4 bg-gray-800/50 rounded-lg border border-gray-700">
          <p className="text-gray-400 text-xs">
            🔐 Seu código de acesso é enviado por email. Nunca compartilhe com ninguém.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Desenvolvido por: ALG Soluções em Tecnologia
          </p>
        </div>
      </div>
    </div>
  );
}
