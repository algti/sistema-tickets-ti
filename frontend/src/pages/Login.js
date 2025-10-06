import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      navigate('/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-primary py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-24 w-auto"
            src="/logo-alg.png"
            alt="ALG Soluções em Tecnologia"
          />
          <div className="mt-6">
            <h2 className="text-3xl font-bold tracking-tight text-primary neon-glow">
              SISTEMA DE TICKETS
            </h2>
            <h3 className="mt-2 text-xl font-semibold text-secondary">
              ALG Soluções em Tecnologia
            </h3>
            <p className="mt-2 text-sm text-secondary">
              Faça login com suas credenciais
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6 card p-8" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-secondary">
                Usuário
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="mt-1 input-field"
                placeholder="Digite seu usuário"
                value={formData.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-secondary">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="mt-1 input-field"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="spinner mr-2"></div>
                  Entrando...
                </div>
              ) : (
                'Entrar'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-muted">
              <p>Desenvolvido por:</p>
              <p className="font-mono text-xs mt-1">
                <strong></strong> ALG Soluções em Tecnologia
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
