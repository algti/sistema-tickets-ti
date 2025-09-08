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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <img
            className="mx-auto h-24 w-auto"
            src="/logo-alg.png"
            alt="ALG Soluções em Tecnologia"
          />
          <div className="mt-6">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900">
              SISTEMA DE TICKETS
            </h2>
            <h3 className="mt-2 text-xl font-semibold text-gray-800">
              ALG Soluções em Tecnologia
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Faça login com suas credenciais
            </p>
          </div>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
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
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
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
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <div className="text-sm text-gray-600">
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
