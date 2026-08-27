import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, User, Building2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    department: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Se usuário já está logado, redirecionar para dashboard
  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }

    if (!formData.full_name.trim()) {
      errors.full_name = 'Nome completo é obrigatório';
    } else if (formData.full_name.trim().length < 3) {
      errors.full_name = 'Nome deve ter pelo menos 3 caracteres';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          full_name: formData.full_name.trim(),
          department: formData.department.trim() || null
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || 'Erro ao registrar');
      }

      toast.success('Registro realizado com sucesso! Faça login com seu email.');
      navigate('/otp-login');
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpar erro do campo
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
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
          <h1 className="text-3xl font-bold text-white mb-2">Criar Conta</h1>
          <p className="text-slate-400">Sistema de Tickets ALG</p>
        </div>

        {/* Card */}
        <div className="bg-slate-800 rounded-lg shadow-2xl p-8 border border-slate-700">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="seu@email.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  autoFocus
                />
              </div>
              {formErrors.email && (
                <p className="mt-2 text-sm text-red-400">{formErrors.email}</p>
              )}
            </div>

            {/* Full Name */}
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-slate-300 mb-2">
                Nome Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  id="full_name"
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  placeholder="Seu Nome Completo"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
              {formErrors.full_name && (
                <p className="mt-2 text-sm text-red-400">{formErrors.full_name}</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label htmlFor="department" className="block text-sm font-medium text-slate-300 mb-2">
                Departamento (Opcional)
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                <input
                  id="department"
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  placeholder="Ex: TI, Financeiro, RH"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                />
              </div>
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
                  Registrando...
                </>
              ) : (
                'Criar Conta'
              )}
            </button>

            {/* Info */}
            <div className="p-3 bg-blue-500/10 border border-blue-500/50 rounded-lg">
              <p className="text-xs text-blue-300">
                ℹ️ Após registrar, você poderá fazer login com seu email e receberá um código de acesso.
              </p>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <button
            onClick={() => navigate('/otp-login')}
            className="flex items-center justify-center gap-2 text-slate-400 hover:text-slate-300 font-medium transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
}
