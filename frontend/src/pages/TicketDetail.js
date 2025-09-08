import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ticketsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import TicketEvaluation from '../components/TicketEvaluation';

function TicketDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [addingComment, setAddingComment] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [technicians, setTechnicians] = useState([]);
  const [assigningTechnician, setAssigningTechnician] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
      fetchComments();
      fetchTechnicians();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      const response = await ticketsAPI.getTicket(id);
      setTicket(response.data);
      // Set attachments from ticket data
      if (response.data.attachments) {
        setAttachments(response.data.attachments);
      }
    } catch (error) {
      console.error('Erro ao buscar ticket:', error);
      navigate('/tickets');
    }
  };

  const fetchComments = async () => {
    try {
      const response = await ticketsAPI.getTicketComments(id);
      setComments(response.data);
    } catch (error) {
      console.error('Erro ao buscar comentários:', error);
    } finally {
      setLoading(false);
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

    const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setAddingComment(true);
    try {
      await ticketsAPI.addComment(id, { content: newComment });
      setNewComment('');
      await fetchComments();
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
    } finally {
      setAddingComment(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await ticketsAPI.updateTicket(id, { status: newStatus });
      fetchTicket();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignTechnician = async (technicianId) => {
    setAssigningTechnician(true);
    try {
      await ticketsAPI.updateTicket(id, { assigned_to_id: technicianId });
      setShowAssignModal(false);
      fetchTicket();
    } catch (error) {
      console.error('Erro ao atribuir técnico:', error);
    } finally {
      setAssigningTechnician(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'open': 'bg-blue-100 text-blue-800',
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'resolved': 'bg-green-100 text-green-800',
      'closed': 'bg-gray-100 text-gray-800',
      'waiting_user': 'bg-purple-100 text-purple-800'
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

  const getStatusText = (status) => {
    const statusMap = {
      'open': 'Aberto',
      'in_progress': 'Em Andamento',
      'waiting_user': 'Aguardando Usuário',
      'resolved': 'Resolvido',
      'closed': 'Fechado',
      'reopened': 'Reaberto'
    };
    return statusMap[status] || status;
  };

  const getPriorityText = (priority) => {
    const priorityMap = {
      'low': 'Baixa',
      'medium': 'Média',
      'high': 'Alta',
      'urgent': 'Urgente'
    };
    return priorityMap[priority] || priority;
  };

  const downloadAttachment = async (attachmentId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const url = `[http://127.0.0.1](http://127.0.0.1):8000/api/v1/tickets/${id}/attachments/${attachmentId}/download?token=${token}`;
      
      // Use window.open for more reliable download
      const newWindow = window.open(url, '_blank');
      
      // If popup blocked, fallback to direct navigation
      if (!newWindow) {
        window.location.href = url;
      }
      
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      alert('Erro ao baixar arquivo. Tente novamente.');
    }
  };

  const calculateTimeOpen = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays}d ${diffHours}h`;
    } else if (diffHours > 0) {
      return `${diffHours}h`;
    } else {
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return `${diffMinutes}m`;
    }
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

  const canUpdateStatus = () => {
    return user?.role?.toLowerCase() === 'admin' || user?.role?.toLowerCase() === 'technician' || ticket?.created_by === user?.id;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Ticket não encontrado</h2>
        <button
          onClick={() => navigate('/tickets')}
          className="mt-4 text-blue-600 hover:text-blue-800"
        >
          ← Voltar para tickets
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Compact Header */}
      <div className="bg-white shadow rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/tickets')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Voltar
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ticket #{ticket.id}
                </h1>
                <p className="text-gray-600 mt-1">{ticket.title}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(ticket.status)}`}>
                {getStatusText(ticket.status)}
              </span>
              <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(ticket.priority)}`}>
                {getPriorityText(ticket.priority)}
              </span>
            </div>
          </div>
          {/* Compact Information Grid - Similar to Image 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Solicitante */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-blue-900">Solicitante</h3>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-gray-900">
                  {ticket.created_by?.full_name || 'Usuário Comum'}
                </p>
                <p className="text-xs text-gray-600">
                  @{ticket.created_by?.username || 'usuario'}
                </p>
                <p className="text-xs text-blue-600">
                  📧 {ticket.created_by?.email || 'usuario@empresa.local'}
                </p>
                {ticket.created_by?.department && (
                  <p className="text-xs text-gray-600">
                    🏢 {ticket.created_by.department}
                  </p>
                )}
                {ticket.created_by?.phone && (
                  <p className="text-xs text-gray-600">
                    📞 {ticket.created_by.phone}
                  </p>
                )}
              </div>
            </div>

            {/* Técnico Responsável */}
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-green-900">Técnico Responsável</h3>
              </div>
              <div className="space-y-1">
                {ticket.assigned_to ? (
                  <>
                    <p className="text-sm font-semibold text-gray-900">
                      {ticket.assigned_to.full_name || ticket.assigned_to.username}
                    </p>
                    <p className="text-xs text-gray-600">
                      @{ticket.assigned_to.username}
                    </p>
                    <p className="text-xs text-green-600">
                      📧 {ticket.assigned_to.email || 'N/A'}
                    </p>
                    {ticket.assigned_to.department && (
                      <p className="text-xs text-gray-600">
                        🏢 {ticket.assigned_to.department}
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic">Não atribuído</p>
                )}
              </div>
            </div>

            {/* Categoria & Datas */}
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-yellow-900">Categoria & Datas</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {ticket.category?.name || 'Hardware'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {ticket.category?.description || 'Problemas com equipamentos físicos'}
                  </p>
                </div>
                <div className="pt-1">
                  <p className="text-xs text-yellow-600">
                    📅 Criado: {formatDate(ticket.created_at)}, {new Date(ticket.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  {ticket.updated_at && (
                    <p className="text-xs text-gray-500">
                      🔄 Atualizado: {formatDate(ticket.updated_at)}, {new Date(ticket.updated_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Estatísticas */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center mb-2">
                <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center mr-2">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-purple-900">Estatísticas</h3>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">💬 {comments.length} comentário(s)</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">📎 {attachments.length} anexo(s)</span>
                </div>
                <div className="pt-1">
                  <span className="text-xs text-gray-500">⏱️ Tempo aberto:</span>
                  <p className="text-sm font-semibold text-purple-600">
                    {calculateTimeOpen(ticket.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Description and Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description - Compact Style */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Descrição Completa do Problema</h3>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-blue-500">
              <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                {ticket.description || 'Nenhuma descrição fornecida.'}
              </p>
            </div>
            
            {ticket.solution && (
              <div className="mt-6">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center mr-3">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h4 className="text-lg font-semibold text-green-700">Solução Aplicada</h4>
                </div>
                <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-500">
                  <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">
                    {ticket.solution}
                  </p>
                </div>
              </div>
            )}

            {/* Ticket Evaluation Section */}
            {ticket.status === 'resolved' && user && ticket.created_by && user.id === ticket.created_by.id && (
              <div className="mt-6">
                <TicketEvaluation 
                  ticketId={ticket.id} 
                  onEvaluationSubmitted={() => {
                    // Refresh ticket data to show updated evaluation
                    fetchTicket();
                  }}
                />
              </div>
            )}
          </div>

          {/* Simplified Attachments Section */}
          {attachments && attachments.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Anexos ({attachments.length})</h3>
              </div>
                
              {/* All Attachments as Download Links */}
              <div className="space-y-3">
                {attachments.map((attachment) => {
                  const fileSize = attachment.file_size ? (attachment.file_size / 1024).toFixed(1) + ' KB' : 'N/A';
                  const getFileIcon = (contentType) => {
                    if (contentType?.startsWith('image/')) return '🖼️';
                    if (contentType?.includes('pdf')) return '📄';
                    if (contentType?.includes('word')) return '📝';
                    if (contentType?.includes('excel') || contentType?.includes('spreadsheet')) return '📊';
                    if (contentType?.includes('text')) return '📃';
                    return '📁';
                  };
                  
                  return (
                    <div key={attachment.id} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getFileIcon(attachment.content_type)}</div>
                        <div className="flex-1 min-w-0">
                          <button
                            onClick={() => downloadAttachment(attachment.id, attachment.original_filename)}
                            className="text-sm font-medium text-blue-600 hover:text-blue-800 block truncate hover:underline text-left bg-transparent border-none cursor-pointer p-0"
                            title={`Baixar ${attachment.original_filename}`}
                          >
                            📎 {attachment.original_filename}
                          </button>
                          <div className="text-xs text-gray-500 mt-1">
                            {fileSize} • {attachment.content_type || 'Tipo desconhecido'}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          Clique para baixar
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Comments Section - Compact Style */}
          <div className="bg-white shadow rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Histórico de Comunicação ({comments.length})
              </h3>
            </div>

            {/* Add Comment Form - Compact */}
            <form onSubmit={handleAddComment} className="mb-4">
              <div className="flex space-x-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicione um comentário..."
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                  rows={2}
                  required
                />
                <button
                  type="submit"
                  disabled={addingComment || !newComment.trim()}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {addingComment ? 'Enviando...' : 'Comentar'}
                </button>
              </div>
            </form>

            {/* Comments List - Compact Style */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">Nenhum comentário ainda</p>
                  <p className="text-xs text-gray-400">Seja o primeiro a comentar neste ticket!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="border-l-4 border-gray-200 pl-4 py-2">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                          {comment.user?.username?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user?.full_name || comment.user?.username || 'Usuário'}
                        </span>
                        {comment.user?.role && (
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                            comment.user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            comment.user.role === 'technician' ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }`}>
                            {comment.user.role === 'admin' ? 'Admin' :
                             comment.user.role === 'technician' ? 'Técnico' :
                             'Usuário'}
                          </span>
                        )}
                      </div>
                      <span className="text
