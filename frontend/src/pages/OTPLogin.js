import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import EmailStep from '../components/EmailStep';
import CodeStep from '../components/CodeStep';
import toast from 'react-hot-toast';

export default function OTPLogin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState('email'); // 'email' ou 'code'
  const [email, setEmail] = useState('');
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
  const handleRequestOTP = async (emailValue) => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch('/api/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailValue })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao solicitar código');
      }

      const data = await response.json();
      setEmail(emailValue);
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
  const handleVerifyOTP = async (codeValue) => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/v1/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: codeValue })
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
    setCode('');
    setError('');
    setTimeLeft(480);
    setAttempts(0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo/Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-cyan-500/20 rounded-full mb-4">
            <svg className="w-8 h-8 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Sistema de Tickets</h1>
          <p className="text-slate-400">ALG Soluções em Tecnologia</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          {step === 'email' ? (
            <EmailStep 
              onSubmit={handleRequestOTP}
              loading={loading}
              error={error}
            />
          ) : (
            <CodeStep
              email={email}
              onSubmit={handleVerifyOTP}
              onResend={handleResendOTP}
              onBack={handleBackToEmail}
              timeLeft={timeLeft}
              attempts={attempts}
              loading={loading}
              error={error}
            />
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-400 text-sm">
            Não tem conta?{' '}
            <button
              onClick={() => navigate('/register')}
              className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors"
            >
              Registre-se aqui
            </button>
          </p>
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
          <p className="text-slate-300 text-xs text-center">
            🔐 Seu código de acesso é enviado por email. Nunca compartilhe com ninguém.
          </p>
        </div>
      </div>
    </div>
  );
}
