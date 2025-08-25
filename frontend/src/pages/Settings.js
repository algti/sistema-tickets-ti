import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { settingsService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState({
    general: {
      system_name: 'Sistema de Tickets TI',
      company_name: 'Empresa LTDA',
      support_email: 'suporte@empresa.com',
      max_file_size: 10,
      allowed_file_types: '.pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif'
    },
    sla: {
      low_priority_hours: 72,
      medium_priority_hours: 24,
      high_priority_hours: 8,
      urgent_priority_hours: 2,
      auto_escalation: true,
      escalation_hours: 2
    },
    permissions: {
      user_can_view_all_tickets: false,
      user_can_edit_own_tickets: true,
      technician_can_view_reports: true,
      auto_assign_tickets: true,
      require_category: true
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsService.getSettings();
      setSettings(response.data);
    } catch (error) {
      console.error('Erro ao carregar configurações:', error);
      // Keep default settings if API fails
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsService.updateSettings(settings);
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar configurações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Tem certeza que deseja resetar todas as configurações para os valores padrão?')) {
      try {
        setSaving(true);
        await settingsService.resetSettings();
        await loadSettings(); // Reload settings after reset
        alert('Configurações resetadas com sucesso!');
      } catch (error) {
        console.error('Erro ao resetar:', error);
        alert('Erro ao resetar configurações.');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleTestEmail = async () => {
    try {
      setSaving(true);
      await settingsService.testEmail();
      alert('Email de teste enviado com sucesso!');
    } catch (error) {
      console.error('Erro ao testar email:', error);
      alert('Erro ao enviar email de teste: ' + (error.response?.data?.detail || 'Erro desconhecido'));
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const tabs = [
    { id: 'general', name: 'Geral', icon: '⚙️' },
    { id: 'sla', name: 'SLA', icon: '⏱️' },
    { id: 'permissions', name: 'Permissões', icon: '🔐' }
  ];

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configurações do Sistema</h1>
          <p className="text-gray-600 mt-1">Gerencie configurações e parâmetros do sistema</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleReset}
            disabled={saving}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 font-medium"
          >
            Resetar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
          >
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg">
        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* General Settings */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações Gerais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Sistema
                  </label>
                  <input
                    type="text"
                    value={settings.general.system_name}
                    onChange={(e) => updateSetting('general', 'system_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome da Empresa
                  </label>
                  <input
                    type="text"
                    value={settings.general.company_name}
                    onChange={(e) => updateSetting('general', 'company_name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email de Suporte
                  </label>
                  <input
                    type="email"
                    value={settings.general.support_email}
                    onChange={(e) => updateSetting('general', 'support_email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tamanho Máximo de Arquivo (MB)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.general.max_file_size}
                    onChange={(e) => updateSetting('general', 'max_file_size', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* SLA Settings */}
          {activeTab === 'sla' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações de SLA</h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
                <p className="text-sm text-blue-700">
                  Configure os tempos máximos de resposta para cada prioridade de ticket.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA Prioridade Baixa (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla.low_priority_hours}
                    onChange={(e) => updateSetting('sla', 'low_priority_hours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA Prioridade Média (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla.medium_priority_hours}
                    onChange={(e) => updateSetting('sla', 'medium_priority_hours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA Prioridade Alta (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla.high_priority_hours}
                    onChange={(e) => updateSetting('sla', 'high_priority_hours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SLA Prioridade Urgente (horas)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={settings.sla.urgent_priority_hours}
                    onChange={(e) => updateSetting('sla', 'urgent_priority_hours', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="auto_escalation"
                    checked={settings.sla.auto_escalation}
                    onChange={(e) => updateSetting('sla', 'auto_escalation', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="auto_escalation" className="ml-2 block text-sm text-gray-900">
                    Ativar escalação automática de tickets
                  </label>
                </div>

                {settings.sla.auto_escalation && (
                  <div className="ml-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Escalar após (horas sem resposta)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={settings.sla.escalation_hours}
                      onChange={(e) => updateSetting('sla', 'escalation_hours', parseInt(e.target.value))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Permissions Settings */}
          {activeTab === 'permissions' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-gray-900">Configurações de Permissões</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Permissões de Usuários</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="user_can_view_all_tickets"
                        checked={settings.permissions.user_can_view_all_tickets}
                        onChange={(e) => updateSetting('permissions', 'user_can_view_all_tickets', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="user_can_view_all_tickets" className="ml-2 block text-sm text-gray-700">
                        Usuários podem ver todos os tickets (não apenas os próprios)
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="user_can_edit_own_tickets"
                        checked={settings.permissions.user_can_edit_own_tickets}
                        onChange={(e) => updateSetting('permissions', 'user_can_edit_own_tickets', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="user_can_edit_own_tickets" className="ml-2 block text-sm text-gray-700">
                        Usuários podem editar seus próprios tickets
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-md font-medium text-gray-800 mb-3">Configurações Gerais</h4>
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="auto_assign_tickets"
                        checked={settings.permissions.auto_assign_tickets}
                        onChange={(e) => updateSetting('permissions', 'auto_assign_tickets', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="auto_assign_tickets" className="ml-2 block text-sm text-gray-700">
                        Atribuição automática de tickets
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="require_category"
                        checked={settings.permissions.require_category}
                        onChange={(e) => updateSetting('permissions', 'require_category', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="require_category" className="ml-2 block text-sm text-gray-700">
                        Categoria obrigatória na criação de tickets
                      </label>
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="technician_can_view_reports"
                        checked={settings.permissions.technician_can_view_reports}
                        onChange={(e) => updateSetting('permissions', 'technician_can_view_reports', e.target.checked)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label htmlFor="technician_can_view_reports" className="ml-2 block text-sm text-gray-700">
                        Técnicos podem acessar relatórios
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Settings;
