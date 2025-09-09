import React, { useState, useEffect } from 'react';
import { usersAPI, settingsService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { 
  PencilIcon, 
  TrashIcon, 
  UserPlusIcon,
  ServerIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';

function Users() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    role: '',
    is_active: '',
    search: ''
  });
  
  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showLdapModal, setShowLdapModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

    // User form data
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    full_name: '',
    department: '',
    phone: '',
    role: 'user',
    password: '',
    is_active: true
  });
  
  // LDAP configuration
  const [ldapConfig, setLdapConfig] = useState({
    server: '',
    base_dn: '',
    bind_dn: '',
    bind_password: '',
    user_search_base: '',
    group_search_base: '',
    enabled: false
  });
  
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await usersAPI.getUsers(filters);
      setUsers(response.data);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      if (currentStatus) {
        await usersAPI.deactivateUser(userId);
      } else {
        await usersAPI.activateUser(userId);
      }
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error('Erro ao alterar status do usuário:', error);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'user': 'bg-blue-100 text-blue-800',
      'technician': 'bg-green-100 text-green-800',
      'admin': 'bg-purple-100 text-purple-800'
    };
    return colors[role?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getRoleLabel = (role) => {
    const labels = {
      'user': 'Usuário',
      'technician': 'Técnico',
      'admin': 'Administrador'
    };
    return labels[role?.toLowerCase()] || role;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // User management functions
  const openUserModal = (userToEdit = null) => {
    if (userToEdit) {
      setEditingUser(userToEdit);
      setUserForm({
        username: userToEdit.username || '',
        email: userToEdit.email || '',
        full_name: userToEdit.full_name || '',
        department: userToEdit.department || '',
        phone: userToEdit.phone || '',
        role: userToEdit.role || 'user',
        password: '',
        is_active: userToEdit.is_active !== undefined ? userToEdit.is_active : true
      });
    } else {
      setEditingUser(null);
      setUserForm({
        username: '',
        email: '',
        full_name: '',
        department: '',
        phone: '',
        role: 'user',
        password: '',
        is_active: true
      });
    }
    setShowUserModal(true);
  };

  const closeUserModal = () => {
    setShowUserModal(false);
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      full_name: '',
      department: '',
      phone: '',
      role: 'user',
      password: '',
      is_active: true
    });
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    
    try {
      if (editingUser) {
        // Update user
        const updateData = { ...userForm };
        if (!updateData.password) {
          delete updateData.password; // Don't send empty password
        }
        await usersAPI.updateUser(editingUser.id, updateData);
      } else {
        // Create user
        await usersAPI.createUser(userForm);
      }
      
      closeUserModal();
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar usuário:', error);
      alert('Erro ao salvar usuário. Verifique os dados e tente novamente.');
    } finally {
      setModalLoading(false);
    }
  };

  const deleteUser = async (userId) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        await usersAPI.deleteUser(userId);
        fetchUsers();
      } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        alert('Erro ao excluir usuário.');
      }
    }
  };

  // LDAP configuration functions
  const openLdapModal = async () => {
    try {
      const response = await settingsService.getSettings();
      const ldapSettings = response.data.ldap || {};
      setLdapConfig({
        server: ldapSettings.server || '',
        base_dn: ldapSettings.base_dn || '',
        bind_dn: ldapSettings.bind_dn || '',
        bind_password: ldapSettings.bind_password || '',
        user_search_base: ldapSettings.user_search_base || '',
        group_search_base: ldapSettings.group_search_base || '',
        enabled: ldapSettings.enabled || false
      });
    } catch (error) {
      console.error('Erro ao carregar configurações LDAP:', error);
    }
    setShowLdapModal(true);
  };

  const closeLdapModal = () => {
    setShowLdapModal(false);
  };

  const handleLdapSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);
    
    try {
      await settingsService.saveSettings({
        ldap: ldapConfig
      });
      
      closeLdapModal();
      alert('Configurações LDAP salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações LDAP:', error);
      alert('Erro ao salvar configurações LDAP.');
    } finally {
      setModalLoading(false);
    }
  };

  const testLdapConnection = async () => {
    setModalLoading(true);
    try {
      // Implement LDAP test connection API call
      alert('Teste de conexão LDAP em desenvolvimento');
    } catch (error) {
      console.error('Erro ao testar conexão LDAP:', error);
      alert('Erro ao testar conexão LDAP.');
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  // Check if user has admin permissions
  if (user?.role?.toLowerCase() !== 'admin') {
    return (
      <div className="space-y-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-center">
            <div className="text-red-500">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.232 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Acesso Negado</h3>
              <p className="mt-1 text-sm text-gray-500">Você não tem permissão para acessar esta página.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Usuários</h1>
        <div className="flex space-x-3">
          <button
            onClick={openLdapModal}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2"
          >
            <ServerIcon className="h-5 w-5" />
            <span>Configurar LDAP</span>
          </button>
          <button
            onClick={() => openUserModal()}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium flex items-center space-x-2"
          >
            <UserPlusIcon className="h-5 w-5" />
            <span>Novo Usuário</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar usuários..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filters.role}
              onChange={(e) => setFilters({...filters, role: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Perfis</option>
              <option value="user">Usuário</option>
              <option value="technician">Técnico</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <div>
            <select
              value={filters.is_active}
              onChange={(e) => setFilters({...filters, is_active: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Status</option>
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => setFilters({role: '', is_active: '', search: ''})}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {users.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Ajuste os filtros ou crie um novo usuário.</p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Perfil
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userItem) => (
                  <tr key={userItem.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-blue-500 flex items-center justify-center">
                            <span className="text-sm font-medium text-white">
                              {userItem.full_name?.charAt(0).toUpperCase() || userItem.username?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.full_name || userItem.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {userItem.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(userItem.role)}`}>
                        {getRoleLabel(userItem.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        userItem.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userItem.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(userItem.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        <button
                          onClick={() => openUserModal(userItem)}
                          className="text-blue-600 hover:text-blue-900 flex items-center"
                          title="Editar usuário"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => toggleUserStatus(userItem.id, userItem.is_active)}
                          className={`flex items-center ${
                            userItem.is_active 
                              ? 'text-red-600 hover:text-red-900' 
                              : 'text-green-600 hover:text-green-900'
                          }`}
                          title={userItem.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                        >
                          {userItem.is_active ? (
                            <XMarkIcon className="h-4 w-4" />
                          ) : (
                            <CheckIcon className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => deleteUser(userItem.id)}
                          className="text-red-600 hover:text-red-900 flex items-center"
                          title="Excluir usuário"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h3>
                <button
                  onClick={closeUserModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleUserSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome de Usuário *
                    </label>
                    <input
                      type="text"
                      required
                      value={userForm.username}
                      onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={editingUser} // Username can't be changed
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={userForm.email}
                      onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo
                    </label>
                    <input
                      type="text"
                      value={userForm.full_name}
                      onChange={(e) => setUserForm({...userForm, full_name: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Departamento
                    </label>
                    <input
                      type="text"
                      value={userForm.department}
                      onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="text"
                      value={userForm.phone}
                      onChange={(e) => setUserForm({...userForm, phone: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Perfil *
                    </label>
                    <select
                      required
                      value={userForm.role}
                      onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="user">Usuário</option>
                      <option value="technician">Técnico</option>
                      <option value="admin">Administrador</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {editingUser ? 'Nova Senha (deixe em branco para manter a atual)' : 'Senha *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required={!editingUser}
                      value={userForm.password}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={userForm.is_active}
                    onChange={(e) => setUserForm({...userForm, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Usuário ativo
                  </label>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeUserModal}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {modalLoading ? 'Salvando...' : (editingUser ? 'Atualizar' : 'Criar')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* LDAP Configuration Modal */}
      {showLdapModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center">
                  <ServerIcon className="h-6 w-6 mr-2" />
                  Configuração LDAP/Active Directory
                </h3>
                <button
                  onClick={closeLdapModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              
              <form onSubmit={handleLdapSubmit} className="space-y-4">
                <div className="flex items-center mb-4">
                  <input
                    type="checkbox"
                    id="ldap_enabled"
                    checked={ldapConfig.enabled}
                    onChange={(e) => setLdapConfig({...ldapConfig, enabled: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="ldap_enabled" className="ml-2 block text-sm font-medium text-gray-900">
                    Habilitar autenticação LDAP
                  </label>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Servidor LDAP *
                    </label>
                    <input
                      type="text"
                      placeholder="ldap://seu-servidor.local:389"
                      value={ldapConfig.server}
                      onChange={(e) => setLdapConfig({...ldapConfig, server: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={ldapConfig.enabled}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base DN *
                    </label>
                    <input
                      type="text"
                      placeholder="DC=empresa,DC=local"
                      value={ldapConfig.base_dn}
                      onChange={(e) => setLdapConfig({...ldapConfig, base_dn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={ldapConfig.enabled}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bind DN (Conta de Serviço) *
                    </label>
                    <input
                      type="text"
                      placeholder="CN=service-account,OU=Users,DC=empresa,DC=local"
                      value={ldapConfig.bind_dn}
                      onChange={(e) => setLdapConfig({...ldapConfig, bind_dn: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={ldapConfig.enabled}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha da Conta de Serviço *
                    </label>
                    <input
                      type="password"
                      value={ldapConfig.bind_password}
                      onChange={(e) => setLdapConfig({...ldapConfig, bind_password: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required={ldapConfig.enabled}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base de Busca de Usuários
                    </label>
                    <input
                      type="text"
                      placeholder="OU=Users,DC=empresa,DC=local"
                      value={ldapConfig.user_search_base}
                      onChange={(e) => setLdapConfig({...ldapConfig, user_search_base: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Base de Busca de Grupos
                    </label>
                    <input
                      type="text"
                      placeholder="OU=Groups,DC=empresa,DC=local"
                      value={ldapConfig.group_search_base}
                      onChange={(e) => setLdapConfig({...ldapConfig, group_search_base: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">
                        Importante
                      </h3>
                      <div className="mt-2 text-sm text-yellow-700">
                        <p>
                          Configure essas informações com seu administrador de rede. 
                          A autenticação LDAP permitirá que os usuários façam login com suas credenciais do Active Directory.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between pt-4">
                  <button
                    type="button"
                    onClick={testLdapConnection}
                    disabled={modalLoading || !ldapConfig.enabled}
                    className="px-4 py-2 bg-yellow-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
                  >
                    Testar Conexão
                  </button>
                  
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={closeLdapModal}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={modalLoading}
                      className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {modalLoading ? 'Salvando...' : 'Salvar Configurações'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Users;
