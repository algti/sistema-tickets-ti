import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsAPI, categoriesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';

function CreateTicket() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    category_id: '',
    assigned_to: ''
  });
  const [files, setFiles] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  useEffect(() => {
    fetchCategories();
    if (user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'technician') {
      fetchTechnicians();
    }
  }, [user]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.filter(cat => cat.is_active));
    } catch (error) {
      console.error('Erro ao buscar categorias:', error);
    }
  };

  const fetchTechnicians = async () => {
    try {
      const response = await ticketsAPI.getTechnicians();
      setTechnicians(response.data);
    } catch (error) {
      console.error('Erro ao buscar técnicos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Create ticket
      const ticketData = {
        ...formData,
        category_id: formData.category_id ? parseInt(formData.category_id) : null,
        assigned_to_id: formData.assigned_to ? parseInt(formData.assigned_to) : null
      };
      
      // Remove assigned_to field (we use assigned_to_id)
      delete ticketData.assigned_to;

      const response = await ticketsAPI.createTicket(ticketData);
      const ticketId = response.data.id;

      // Upload files if any
      if (files.length > 0) {
        for (const file of files) {
          const fileFormData = new FormData();
          fileFormData.append('file', file);
          await ticketsAPI.uploadAttachment(ticketId, fileFormData);
        }
      }

      // Redirect to ticket details
      navigate(`/tickets/${ticketId}`);
    } catch (error) {
      console.error('Erro ao criar ticket:', error);
      alert('Erro ao criar ticket. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'text-green-600',
      'medium': 'text-yellow-600',
      'high': 'text-orange-600',
      'urgent': 'text-red-600'
    };
    return colors[priority] || 'text-gray-600';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">Criar Novo Ticket</h1>
          <p className="text-secondary mt-1">Descreva o problema ou solicitação detalhadamente</p>
        </div>
        <button
          onClick={() => navigate('/tickets')}
          className="text-secondary hover:text-primary"
        >
          ← Voltar
        </button>
      </div>

      {/* Form */}
      <div className="card">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Título *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="input-field"
              placeholder="Resuma o problema em poucas palavras"
            />
          </div>

          {/* Priority and Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Prioridade *
              </label>
              <select
                required
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
                className="input-field"
              >
                <option value="low" className="text-green-600">• Baixa</option>
                <option value="medium" className="text-yellow-600">• Média</option>
                <option value="high" className="text-orange-600">• Alta</option>
                <option value="urgent" className="text-red-600">• Urgente</option>
              </select>
              <p className="text-xs text-muted mt-1">
                <span className={getPriorityColor(formData.priority)}>•</span>
                {formData.priority === 'low' && ' Pode aguardar'}
                {formData.priority === 'medium' && ' Resolver em alguns dias'}
                {formData.priority === 'high' && ' Resolver hoje'}
                {formData.priority === 'urgent' && ' Resolver imediatamente'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Categoria *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                className="input-field"
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Assign to Technician (Admin/Technician only) */}
          {(user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'technician') && (
            <div>
              <label className="block text-sm font-medium text-secondary mb-2">
                Atribuir para Técnico
              </label>
              <select
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
                className="input-field"
              >
                <option value="">Selecionar depois</option>
                {technicians.map((tech) => (
                  <option key={tech.id} value={tech.id}>
                    {tech.full_name || tech.username}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Descrição *
            </label>
            <textarea
              required
              rows={6}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="input-field"
              placeholder="Descreva o problema detalhadamente:

- O que aconteceu?
- Quando começou?
- Quais passos já foram tentados?
- Mensagens de erro (se houver)"
            />
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-secondary mb-2">
              Anexos (opcional)
            </label>
            <div className="border-2 border-dashed border-subtle rounded-lg p-4 bg-bg-overlay">
              <input
                type="file"
                multiple
                onChange={handleFileChange}
                className="w-full text-primary"
                accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.gif"
              />
              <p className="text-xs text-muted mt-2">
                Formatos aceitos: PDF, DOC, DOCX, TXT, PNG, JPG, JPEG, GIF (máx. 10MB cada)
              </p>
            </div>

            {/* Selected Files */}
            {files.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-secondary mb-2">Arquivos selecionados:</h4>
                <div className="space-y-2">
                  {files.map((file, index) => (
                    <div key={index} className="flex items-center justify-between bg-bg-overlay p-2 rounded">
                      <span className="text-sm text-primary">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4 pt-4 border-t border-subtle">
            <button
              type="button"
              onClick={() => navigate('/tickets')}
              className="btn-secondary"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary disabled:opacity-50"
            >
              {loading ? 'Criando...' : 'Criar Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateTicket;
