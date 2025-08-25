import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  DocumentDuplicateIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

function Templates() {
  const { isAdmin, isTechnician } = useAuth();
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category_id: '',
    fields: '',
    is_active: true
  });

  // Mock data
  const mockTemplates = [
    {
      id: 1,
      name: 'Problema de Hardware',
      description: 'Template para problemas relacionados a hardware',
      category_id: 2,
      fields: JSON.stringify([
        { name: 'Equipamento', type: 'text', required: true },
        { name: 'Sintomas', type: 'textarea', required: true },
        { name: 'Urgência', type: 'select', options: ['Baixa', 'Média', 'Alta'], required: true }
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      category: { name: 'Hardware' }
    },
    {
      id: 2,
      name: 'Solicitação de Software',
      description: 'Template para instalação de software',
      category_id: 4,
      fields: JSON.stringify([
        { name: 'Software Solicitado', type: 'text', required: true },
        { name: 'Justificativa', type: 'textarea', required: true },
        { name: 'Licença Disponível', type: 'select', options: ['Sim', 'Não', 'Não sei'], required: true }
      ]),
      is_active: true,
      created_at: new Date().toISOString(),
      category: { name: 'Software' }
    }
  ];

  const mockCategories = [
    { id: 1, name: 'Windows' },
    { id: 2, name: 'Hardware' },
    { id: 3, name: 'Rede' },
    { id: 4, name: 'Software' }
  ];

  useEffect(() => {
    loadTemplates();
    loadCategories();
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setTemplates(mockTemplates);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(mockCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTemplate) {
        console.log('Updating template:', formData);
      } else {
        console.log('Creating template:', formData);
      }
      
      setShowModal(false);
      setEditingTemplate(null);
      resetForm();
      loadTemplates();
    } catch (error) {
      console.error('Erro ao salvar template:', error);
    }
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description,
      category_id: template.category_id?.toString() || '',
      fields: template.fields,
      is_active: template.is_active
    });
    setShowModal(true);
  };

  const handleDelete = async (templateId) => {
    if (window.confirm('Tem certeza que deseja excluir este template?')) {
      try {
        console.log('Deleting template:', templateId);
        loadTemplates();
      } catch (error) {
        console.error('Erro ao excluir template:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category_id: '',
      fields: '',
      is_active: true
    });
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchTerm || 
      template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || template.category_id.toString() === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Templates de Tickets
          </h1>
          <p className="text-gray-600">
            Gerencie templates para criação rápida de tickets
          </p>
        </div>
        {(isAdmin || isTechnician) && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white border border-transparent rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Template
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Templates List */}
      <div className="space-y-4">
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <DocumentDuplicateIcon className="h-5 w-5 text-blue-500" />
                  <h3 className="text-lg font-medium text-gray-900">
                    {template.name}
                  </h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.is_active ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'
                  }`}>
                    {template.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">
                  {template.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Categoria: {template.category?.name}</span>
                  <span>Campos: {JSON.parse(template.fields).length}</span>
                </div>
              </div>
              
              {(isAdmin || isTechnician) && (
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(template)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
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

      {filteredTemplates.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg">
          <DocumentDuplicateIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            Nenhum template encontrado
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm ? 'Tente buscar com outros termos.' : 'Comece criando um novo template.'}
          </p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-2/3 lg:w-1/2 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingTemplate ? 'Editar Template' : 'Novo Template'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Template
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                    Template ativo
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingTemplate ? 'Atualizar' : 'Criar'}
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

export default Templates;
