import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { assetsService } from '../services/api';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ComputerDesktopIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

function Assets() {
  const { isAdmin, isTechnician } = useAuth();
  const { classes } = useTheme();
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('asset');
  const [editingItem, setEditingItem] = useState(null);
  // const [viewingAsset, setViewingAsset] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const companiesService = require('../services/api').companiesService;
      const [assetsResponse, categoriesResponse, companiesResponse] = await Promise.all([
        assetsService.getAssets({ in_maintenance: activeTab === 'maintenance' ? true : undefined }),
        assetsService.getCategories(),
        companiesService.getCompanies()
      ]);
      setAssets(assetsResponse.data || []);
      setCategories(categoriesResponse.data || []);
      setCompanies(companiesResponse.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      setAssets([]);
      setCategories([]);
      setCompanies([]);
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'maintenance': return 'text-yellow-600 bg-yellow-100';
      case 'retired': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return CheckCircleIcon;
      case 'maintenance': return WrenchScrewdriverIcon;
      case 'retired': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'maintenance': return 'Manutenção';
      case 'retired': return 'Desativado';
      default: return 'Desconhecido';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (modalType === 'asset') {
        if (editingItem) {
          await assetsService.updateAsset(editingItem.id, formData);
        } else {
          await assetsService.createAsset(formData);
        }
      } else if (modalType === 'category') {
        if (editingItem) {
          await assetsService.updateCategory(editingItem.id, formData);
        } else {
          await assetsService.createCategory(formData);
        }
      }
      setShowModal(false);
      setEditingItem(null);
      setFormData({});
      loadData();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar. Verifique os dados e tente novamente.');
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setModalType(type);
    if (type === 'asset') {
      setFormData({
        name: item.name,
        asset_tag: item.asset_tag,
        serial_number: item.serial_number,
        category_id: item.category_id?.toString() || '',
        company_id: item.company_id?.toString() || '',
        status: item.status,
        location: item.location || '',
        purchase_date: item.purchase_date,
        warranty_expiry: item.warranty_expiry,
        purchase_cost: item.purchase_cost,
        notes: item.notes || '',
        in_maintenance: item.in_maintenance || false
      });
    } else if (type === 'category') {
      setFormData({
        name: item.name,
        description: item.description || ''
      });
    }
    setShowModal(true);
  };

  const handleDelete = async (id, type) => {
    if (window.confirm(`Tem certeza que deseja excluir este ${type}?`)) {
      try {
        if (type === 'asset') {
          await assetsService.deleteAsset(id);
        } else if (type === 'category') {
          await assetsService.deleteCategory(id);
        }
        loadData();
      } catch (error) {
        console.error('Erro ao excluir:', error);
        alert('Erro ao excluir. Tente novamente.');
      }
    }
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = !searchTerm || 
      asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.asset_tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.serial_number.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || asset.category_id.toString() === selectedCategory;
    const matchesStatus = !statusFilter || asset.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${classes.text.primary}`}>
            Gestão de Ativos
          </h1>
          <p className={classes.text.secondary}>
            Controle de inventário e manutenção de equipamentos
          </p>
        </div>
        {(isAdmin || isTechnician) && (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setModalType('category');
                setShowModal(true);
              }}
              className={`inline-flex items-center px-4 py-2 ${classes.button.secondary} border border-gray-300 rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Nova Categoria
            </button>
            <button
              onClick={() => {
                setModalType('asset');
                setShowModal(true);
              }}
              className={`inline-flex items-center px-4 py-2 ${classes.button.primary} border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Novo Ativo
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={`${classes.bg.card} rounded-lg shadow-sm`}>
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'assets', name: 'Ativos', icon: ComputerDesktopIcon },
              { id: 'categories', name: 'Categorias', icon: DocumentTextIcon },
              { id: 'maintenance', name: 'Manutenção', icon: WrenchScrewdriverIcon }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Assets Tab */}
        {activeTab === 'assets' && (
          <div className="p-6">
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="md:col-span-2">
                <div className="relative">
                  <MagnifyingGlassIcon className={`absolute left-3 top-3 h-4 w-4 ${classes.text.tertiary}`} />
                  <input
                    type="text"
                    placeholder="Buscar ativos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`pl-10 w-full px-3 py-2 ${classes.input.base} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>
              </div>
              
              <div>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className={`w-full px-3 py-2 ${classes.input.base} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Todas as categorias</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`w-full px-3 py-2 ${classes.input.base} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                >
                  <option value="">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="retired">Desativado</option>
                </select>
              </div>
            </div>

            {/* Assets List */}
            <div className="space-y-4">
              {filteredAssets.map((asset) => {
                const StatusIcon = getStatusIcon(asset.status);
                return (
                  <div
                    key={asset.id}
                    className={`${classes.bg.card} ${classes.border.primary} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className={`text-lg font-medium ${classes.text.primary}`}>
                            {asset.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(asset.status)}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {getStatusText(asset.status)}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className={`font-medium ${classes.text.secondary}`}>Tag:</span>
                            <p className={classes.text.primary}>{asset.asset_tag}</p>
                          </div>
                          <div>
                            <span className={`font-medium ${classes.text.secondary}`}>Categoria:</span>
                            <p className={classes.text.primary}>{asset.category?.name}</p>
                          </div>
                          <div>
                            <span className={`font-medium ${classes.text.secondary}`}>Localização:</span>
                            <p className={classes.text.primary}>{asset.location}</p>
                          </div>
                          <div>
                            <span className={`font-medium ${classes.text.secondary}`}>Responsável:</span>
                            <p className={classes.text.primary}>
                              {asset.assigned_user?.full_name || 'Não atribuído'}
                            </p>
                          </div>
                        </div>
                        
                        {asset.warranty_expiry && (
                          <div className="mt-3">
                            <span className={`text-xs ${classes.text.tertiary}`}>
                              Garantia até: {new Date(asset.warranty_expiry).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {(isAdmin || isTechnician) && (
                        <div className="flex space-x-2 ml-4">
                          {/* <button
                            onClick={() => setViewingAsset(asset)}
                            className={`p-1 ${classes.text.secondary} hover:${classes.text.primary}`}
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button> */}
                          <button
                            onClick={() => handleEdit(asset, 'asset')}
                            className={`p-1 ${classes.text.secondary} hover:${classes.text.primary}`}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(asset.id, 'ativo')}
                            className="p-1 text-red-500 hover:text-red-700"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {filteredAssets.length === 0 && (
              <div className={`text-center py-12`}>
                <ComputerDesktopIcon className={`mx-auto h-12 w-12 ${classes.text.tertiary}`} />
                <h3 className={`mt-2 text-sm font-medium ${classes.text.primary}`}>
                  Nenhum ativo encontrado
                </h3>
                <p className={`mt-1 text-sm ${classes.text.secondary}`}>
                  {searchTerm ? 'Tente buscar com outros termos.' : 'Comece cadastrando um novo ativo.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className={`${classes.bg.card} ${classes.border.primary} border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-lg font-medium ${classes.text.primary} mb-2`}>
                        {category.name}
                      </h3>
                      <p className={`text-sm ${classes.text.secondary}`}>
                        {category.description}
                      </p>
                      <p className={`text-xs ${classes.text.tertiary} mt-2`}>
                        {assets.filter(a => a.category_id === category.id).length} ativos
                      </p>
                    </div>
                    
                    {(isAdmin || isTechnician) && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleEdit(category, 'category')}
                          className={`p-1 ${classes.text.secondary} hover:${classes.text.primary}`}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(category.id, 'categoria')}
                          className="p-1 text-red-500 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="p-6">
            <div className="space-y-4">
              {assets.flatMap(asset => 
                (asset.maintenance_records || []).map(record => (
                  <div
                    key={`${asset.id}-${record.id}`}
                    className={`${classes.bg.card} ${classes.border.primary} border rounded-lg p-4 shadow-sm`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <WrenchScrewdriverIcon className="h-5 w-5 text-blue-500" />
                          <h3 className={`text-lg font-medium ${classes.text.primary}`}>
                            {asset.name}
                          </h3>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            record.maintenance_type === 'preventive' ? 'text-blue-600 bg-blue-100' : 'text-orange-600 bg-orange-100'
                          }`}>
                            {record.maintenance_type === 'preventive' ? 'Preventiva' : 'Corretiva'}
                          </span>
                        </div>
                        
                        <p className={`text-sm ${classes.text.secondary} mb-2`}>
                          {record.description}
                        </p>
                        
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>Data: {new Date(record.performed_date).toLocaleDateString('pt-BR')}</span>
                          <span>Técnico: {record.technician?.full_name}</span>
                          {record.cost > 0 && (
                            <span>Custo: R$ {record.cost.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? 'Editar' : 'Novo'} {modalType === 'asset' ? 'Ativo' : 'Categoria'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {modalType === 'asset' ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Nome do Ativo
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name || ''}
                          onChange={(e) => setFormData({...formData, name: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Tag do Ativo
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.asset_tag || ''}
                          onChange={(e) => setFormData({...formData, asset_tag: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Categoria
                        </label>
                        <select
                          required
                          value={formData.category_id || ''}
                          onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Selecione uma categoria</option>
                          {categories.map(category => (
                            <option key={category.id} value={category.id}>{category.name}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Localização
                        </label>
                        <input
                          type="text"
                          value={formData.location || ''}
                          onChange={(e) => setFormData({...formData, location: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Ex: Sala 101, Prédio A"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Empresa
                      </label>
                      <select
                        required
                        value={formData.company_id || ''}
                        onChange={(e) => setFormData({...formData, company_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Selecione uma empresa</option>
                        {companies.map(company => (
                          <option key={company.id} value={company.id}>{company.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData.in_maintenance || false}
                          onChange={(e) => setFormData({...formData, in_maintenance: e.target.checked})}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-gray-700">
                          Em Manutenção
                        </span>
                      </label>
                      <p className="text-xs text-gray-500 mt-1 ml-6">
                        Marque esta opção se o ativo estiver atualmente em manutenção
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Observações
                      </label>
                      <textarea
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nome da Categoria
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descrição
                      </label>
                      <textarea
                        value={formData.description || ''}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingItem(null);
                      setFormData({});
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Assets;
