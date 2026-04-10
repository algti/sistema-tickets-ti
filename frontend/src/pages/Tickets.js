import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsService, companiesService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { TrashIcon } from '@heroicons/react/24/outline';

function Tickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: [],
    priority: '',
    search: '',
    company_id: ''
  });
  const [companies, setCompanies] = useState([]);

  useEffect(() => {
    fetchTickets();
    fetchCompanies();
  }, [filters]);

  const fetchCompanies = async () => {
    try {
      const response = await companiesService.getCompanies({ is_active: true });
      setCompanies(response.data || []);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
    }
  };

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Converter array de status para string separada por vírgula
      const statusParam = filters.status.length > 0 ? filters.status.join(',') : '';
      
      const filtersWithCacheBust = {
        search: filters.search,
        status: statusParam,
        priority: filters.priority,
        company_id: filters.company_id,
        _t: Date.now()
      };
      
      console.log('🔍 DEBUG: Fazendo requisição de tickets...', filtersWithCacheBust);
      const response = await ticketsService.getTickets(filtersWithCacheBust);
      console.log('🔍 DEBUG: Resposta da API:', response);
      console.log('🔍 DEBUG: Dados dos tickets:', response.data);
      console.log('🔍 DEBUG: Quantidade de tickets:', response.data?.length);
      
      setTickets(response.data);
    } catch (error) {
      console.error('❌ Erro ao buscar tickets:', error);
      console.error('❌ Detalhes do erro:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTicket = async (ticketId, ticketTitle) => {
    if (!window.confirm(`Tem certeza que deseja excluir o ticket #${ticketId} - ${ticketTitle}?\n\nEsta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      console.log('Tentando excluir ticket:', ticketId);
      await ticketsService.deleteTicket(ticketId);
      
      // Remove ticket from local state immediately
      setTickets(prevTickets => prevTickets.filter(ticket => ticket.id !== ticketId));
      
      alert('Ticket excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
      console.error('Status do erro:', error.response?.status);
      console.error('Dados do erro:', error.response?.data);
      
      // Check if it's a permission error
      if (error.response?.status === 403) {
        alert('Acesso negado. Apenas administradores podem excluir tickets.');
      } else if (error.response?.status === 404) {
        alert('Ticket não encontrado.');
      } else {
        alert('Erro ao excluir ticket. Tente novamente.');
      }
    }
  };

  const isAdmin = () => {
    return user?.role?.toLowerCase() === 'admin';
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'badge-blue',
      'in_progress': 'badge-yellow',
      'waiting_user': 'badge-purple',
      'resolved': 'badge-green',
      'closed': 'badge-gray',
      'reopened': 'badge-red'
    };
    return colors[status] || 'badge-gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'badge-green',
      'medium': 'badge-yellow',
      'high': 'badge-red',
      'urgent': 'badge-red'
    };
    return colors[priority] || 'badge-gray';
  };

    const formatDate = (dateString) => {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'open': 'Aberto',
      'in_progress': 'Em Andamento',
      'waiting_user': 'Aguardando Usuário',
      'resolved': 'Resolvido',
      'closed': 'Fechado',
      'reopened': 'Reaberto'
    };
    return labels[status] || status;
  };

  const getPriorityLabel = (priority) => {
    const labels = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return labels[priority] || priority;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-primary">Tickets</h1>
        <button
          onClick={() => navigate('/tickets/new')}
          className="btn-primary"
        >
          + Novo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="input-field"
            />
          </div>
          <div>
            <select
              value={filters.company_id}
              onChange={(e) => setFilters({...filters, company_id: e.target.value})}
              className="input-field"
            >
              <option value="">Todas as Empresas</option>
              {companies.map(company => (
                <option key={company.id} value={company.id}>{company.name}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              multiple
              value={filters.status}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setFilters({...filters, status: selected});
              }}
              className="input-field"
              style={{ height: '42px', overflow: 'auto' }}
            >
              <option value="open">Aberto</option>
              <option value="in_progress">Em Andamento</option>
              <option value="waiting_user">Aguardando Usuário</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
              <option value="reopened">Reaberto</option>
            </select>
            <div className="text-xs text-secondary mt-1">Segure Ctrl para múltipla seleção</div>
          </div>
          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="input-field"
            >
              <option value="">Todas as Prioridades</option>
              <option value="low">Baixa</option>
              <option value="medium">Média</option>
              <option value="high">Alta</option>
              <option value="urgent">Urgente</option>
            </select>
          </div>
          <div>
            <button
              onClick={() => setFilters({status: [], priority: '', search: '', company_id: ''})}
              className="btn-secondary w-full"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-muted">
              <svg className="mx-auto h-12 w-12 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-primary">Nenhum ticket encontrado</h3>
              <p className="mt-1 text-sm text-secondary">Comece criando um novo ticket.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/tickets/new')}
                  className="btn-primary"
                >
                  + Criar Primeiro Ticket
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-dark">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Prioridade
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Criado em
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-secondary uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-subtle">
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-brand-hover transition-colors duration-200">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-primary">
                          #{ticket.id} - {ticket.title}
                        </div>
                        <div className="text-sm text-secondary">
                          {ticket.description?.substring(0, 100)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`badge ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="text-brand-primary hover:text-brand-active mr-4"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                        className="text-green-400 hover:text-green-300 mr-4"
                      >
                        Editar
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteTicket(ticket.id, ticket.title)}
                          className="text-red-400 hover:text-red-300 flex items-center"
                          title="Excluir ticket"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Excluir
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Tickets;
