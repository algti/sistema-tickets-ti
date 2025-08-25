import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BuildingOfficeIcon,
  LockClosedIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    department: ''
  });
  const [originalData, setOriginalData] = useState({});

  useEffect(() => {
    if (user) {
      const userData = {
        full_name: user.full_name || '',
        email: user.email || '',
        phone: user.phone || '',
        department: user.department || ''
      };
      setFormData(userData);
      setOriginalData(userData);
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      
      // Only send changed fields
      const changedFields = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== originalData[key]) {
          changedFields[key] = formData[key];
        }
      });

      if (Object.keys(changedFields).length === 0) {
        setEditing(false);
        return;
      }

      console.log('Sending profile update:', changedFields);
      const response = await usersService.updateProfile(changedFields);
      console.log('Full response object:', response);
      console.log('Response data:', response.data);
      console.log('Response status:', response.status);
      
      // Check if response is successful
      if (response.status === 200 && response.data) {
        console.log('User data from response:', response.data.user);
        
        // Update auth context with new user data
        if (response.data.user) {
          updateUser(response.data.user);
          setOriginalData(formData);
          setEditing(false);
          alert('Perfil atualizado com sucesso!');
        } else {
          console.error('No user data in response:', response.data);
          alert('Erro: dados do usuário não encontrados na resposta.');
        }
      } else {
        console.error('Invalid response status or data:', response);
        alert('Erro na resposta do servidor.');
      }
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response,
        status: error.response?.status,
        data: error.response?.data
      });
      alert('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(originalData);
    setEditing(false);
  };

  const getRoleLabel = (role) => {
    const labels = {
      'admin': 'Administrador',
      'technician': 'Técnico',
      'user': 'Usuário'
    };
    return labels[role?.toLowerCase()] || role;
  };

  if (!user) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Perfil do Usuário</h1>
        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
          >
            Editar Perfil
          </button>
        ) : (
          <div className="flex space-x-2">
            <button
              onClick={handleSave}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium flex items-center disabled:opacity-50"
            >
              <CheckIcon className="h-4 w-4 mr-1" />
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
            <button
              onClick={handleCancel}
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium flex items-center"
            >
              <XMarkIcon className="h-4 w-4 mr-1" />
              Cancelar
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Informações Pessoais</h2>
          <p className="text-sm text-gray-600">Gerencie suas informações de perfil</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome Completo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Nome Completo
              </label>
              {editing ? (
                <input
                  type="text"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite seu nome completo"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.full_name || 'Não informado'}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <EnvelopeIcon className="h-4 w-4 inline mr-1" />
                Email
              </label>
              {editing ? (
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite seu email"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.email || 'Não informado'}</p>
              )}
            </div>

            {/* Telefone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <PhoneIcon className="h-4 w-4 inline mr-1" />
                Telefone
              </label>
              {editing ? (
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite seu telefone"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.phone || 'Não informado'}</p>
              )}
            </div>

            {/* Departamento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BuildingOfficeIcon className="h-4 w-4 inline mr-1" />
                Departamento
              </label>
              {editing ? (
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Digite seu departamento"
                />
              ) : (
                <p className="text-gray-900 py-2">{user.department || 'Não informado'}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Account Information (Read-only) */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Informações da Conta</h2>
          <p className="text-sm text-gray-600">Informações controladas pelo sistema LDAP/AD</p>
        </div>

        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <LockClosedIcon className="h-4 w-4 inline mr-1" />
                Nome de Usuário
              </label>
              <div className="flex items-center">
                <p className="text-gray-900 py-2">{user.username}</p>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Controlado pelo LDAP/AD
                </span>
              </div>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <UserIcon className="h-4 w-4 inline mr-1" />
                Perfil de Acesso
              </label>
              <div className="flex items-center">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.role?.toLowerCase() === 'admin' ? 'bg-red-100 text-red-800' :
                  user.role?.toLowerCase() === 'technician' ? 'bg-blue-100 text-blue-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {getRoleLabel(user.role)}
                </span>
                <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  Controlado pelo sistema
                </span>
              </div>
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status da Conta
              </label>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.is_active ? 'Ativa' : 'Inativa'}
              </span>
            </div>

            {/* Created Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conta Criada em
              </label>
              <p className="text-gray-900 py-2">
                {user.created_at ? new Date(user.created_at).toLocaleDateString('pt-BR') : 'Não informado'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex">
          <LockClosedIcon className="h-5 w-5 text-yellow-400 mr-2" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Informações de Segurança
            </h3>
            <p className="text-sm text-yellow-700 mt-1">
              O nome de usuário e senha são controlados pelo servidor Active Directory (LDAP). 
              Para alterações nessas informações, entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
