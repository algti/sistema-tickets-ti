import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ticketsService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { TrashIcon } from '@heroicons/react/24/outline';

function Tickets() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    search: ''
  });

  useEffect(() => {
    fetchTickets();
  }, [filters]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      // Add cache busting parameter
      const filtersWithCacheBust = {
        ...filters,
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
      'open': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'waiting_user': 'bg-purple-100 text-purple-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'reopened': 'bg-orange-100 text-orange-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'low': 'bg-green-100 text-green-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'high': 'bg-orange-100 text-orange-800',
      'urgent': 'bg-red-100 text-red-800'
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h1 className="text-2xl font-bold text-gray-900">Tickets</h1>
        <button
          onClick={() => navigate('/tickets/new')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
        >
          + Novo Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <input
              type="text"
              placeholder="Buscar tickets..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os Status</option>
              <option value="open">Aberto</option>
              <option value="in_progress">Em Andamento</option>
              <option value="waiting_user">Aguardando Usuário</option>
              <option value="resolved">Resolvido</option>
              <option value="closed">Fechado</option>
              <option value="reopened">Reaberto</option>
            </select>
          </div>
          <div>
            <select
              value={filters.priority}
              onChange={(e) => setFilters({...filters, priority: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              onClick={() => setFilters({status: '', priority: '', search: ''})}
              className="w-full px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {tickets.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum ticket encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">Comece criando um novo ticket.</p>
              <div className="mt-6">
                <button
                  onClick={() => navigate('/tickets/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
                >
                  + Criar Primeiro Ticket
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Prioridade
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
                {tickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          #{ticket.id} - {ticket.title}
                        </div>
                        <div className="text-sm text-gray-500">
                          {ticket.description?.substring(0, 100)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(ticket.status)}`}>
                        {getStatusLabel(ticket.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(ticket.priority)}`}>
                        {getPriorityLabel(ticket.priority)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}`)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Ver
                      </button>
                      <button
                        onClick={() => navigate(`/tickets/${ticket.id}/edit`)}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Editar
                      </button>
                      {isAdmin() && (
                        <button
                          onClick={() => handleDeleteTicket(ticket.id, ticket.title)}
                          className="text-red-600 hover:text-red-900 flex items-center"
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
