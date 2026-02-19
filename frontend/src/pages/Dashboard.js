import React, { useState, useEffect } from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService, evaluationsAPI, usersService } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import TutorialModal from '../components/TutorialModal';
import {
  TicketIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  StarIcon,
  FaceSmileIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, isTechnician } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialMode, setTutorialMode] = useState('video'); // 'video' or 'options'
  
  // Check if user should see tutorial on first login
  useEffect(() => {
    if (user && user.tutorial_viewed === false) {
      setShowTutorial(true);
      setTutorialMode('video');
    }
  }, [user]);

  // Get current month name in PT-BR
  const getCurrentMonthName = () => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    return months[new Date().getMonth()];
  };
  
  const { data: stats, isLoading } = useQuery(
    ['dashboard-stats'],
    () => dashboardService.getStats({ days: 365 }), // Get all tickets, not just last 30 days
    {
      select: (response) => response.data,
      refetchInterval: 30000, // Refresh every 30 seconds
    }
  );

  // Fetch satisfaction metrics for technicians and admins
  const { data: satisfactionMetrics, isLoading: isLoadingMetrics } = useQuery(
    ['satisfaction-metrics'],
    () => evaluationsAPI.getSatisfactionMetrics(30), // Last 30 days
    {
      select: (response) => response.data,
      enabled: isTechnician || user?.role === 'admin' || user?.role === 'ADMIN',
      refetchInterval: 60000, // Refresh every minute
    }
  );

  const handleCloseTutorial = async () => {
    setShowTutorial(false);
    
    // Mark tutorial as viewed if it's first login
    if (user && user.tutorial_viewed === false) {
      try {
        await usersService.markTutorialViewed();
        // Update user context
        if (window.location) {
          window.location.reload();
        }
      } catch (error) {
        console.error('Error marking tutorial as viewed:', error);
      }
    }
  };

  const handleOpenTutorial = () => {
    setShowTutorial(true);
    setTutorialMode('options');
  };

  if (isLoading) {
    return <LoadingSpinner text="Carregando dashboard..." />;
  }

  const statCards = [
    {
      name: 'Total de Tickets',
      value: stats?.total_tickets || 0,
      icon: TicketIcon,
      color: 'bg-blue-500',
      textColor: 'text-blue-600'
    },
    {
      name: 'Abertos',
      value: stats?.open_tickets || 0,
      icon: ExclamationTriangleIcon,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      name: 'Em Andamento',
      value: stats?.in_progress_tickets || 0,
      icon: ClockIcon,
      color: 'bg-orange-500',
      textColor: 'text-orange-600'
    },
    {
      name: 'Resolvidos',
      value: (stats?.resolved_tickets || 0) + (stats?.closed_tickets || 0),
      icon: CheckCircleIcon,
      color: 'bg-green-500',
      textColor: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-primary">
            Olá, {user?.full_name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-secondary">
            Bem-vindo ao sistema de tickets. Aqui está um resumo das atividades.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenTutorial}
            className="btn-secondary flex items-center"
          >
            <AcademicCapIcon className="h-5 w-5 mr-2" />
            Tutorial do Sistema
          </button>
          <Link
            to="/tickets/new"
            className="btn-primary flex items-center"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Novo Ticket
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-secondary">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.textColor}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Time Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-orange-500">
              <ClockIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-primary">Tempo Médio de Atendimento</h3>
              <p className="text-sm text-secondary">Da abertura ao fechamento</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {stats?.avg_time_open !== null && stats?.avg_time_open !== undefined
              ? (stats.avg_time_open < 24 
                  ? `${stats.avg_time_open.toFixed(1)}h`
                  : `${(stats.avg_time_open / 24).toFixed(1)}d`)
              : '0.0h'
            }
          </div>
        </div>
        
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <div className="p-3 rounded-lg bg-green-500">
              <CheckCircleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-primary">Fechados no Mês</h3>
              <p className="text-sm text-secondary">{getCurrentMonthName()}</p>
            </div>
          </div>
          <div className="text-3xl font-bold text-green-600">
            {stats?.closed_this_month ?? 0}
          </div>
        </div>
      </div>

      {/* Priority Distribution - Only for technicians and admins */}
      {(isTechnician || user?.role === 'admin') && stats?.tickets_by_priority && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-primary mb-4">
            Distribuição por Prioridade
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(stats.tickets_by_priority)
              .filter(([priority]) => ['low', 'medium', 'high', 'urgent'].includes(priority))
              .map(([priority, count]) => {
                const priorityColors = {
                  low: 'bg-green-100 text-green-800',
                  medium: 'bg-yellow-100 text-yellow-800',
                  high: 'bg-orange-100 text-orange-800',
                  urgent: 'bg-red-100 text-red-800'
                };
                
                const priorityLabels = {
                  low: 'Baixa',
                  medium: 'Média',
                  high: 'Alta',
                  urgent: 'Urgente'
                };

                return (
                  <div key={priority} className="text-center">
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${priorityColors[priority]}`}>
                      {priorityLabels[priority]}
                    </div>
                    <p className="mt-2 text-2xl font-bold text-primary">{count}</p>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* Satisfaction Metrics */}
      {(isTechnician || user?.role === 'admin' || user?.role === 'ADMIN') && satisfactionMetrics && !isLoadingMetrics && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Overall Satisfaction */}
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-lg bg-purple-500">
                <FaceSmileIcon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-primary">Satisfação Geral</h3>
                <p className="text-sm text-secondary">Últimos 30 dias</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Avaliação Média</span>
                <div className="flex items-center">
                  <StarIcon className="h-5 w-5 text-yellow-400 fill-current" />
                  <span className="ml-1 text-lg font-semibold text-primary">
                    {satisfactionMetrics.average_rating ? satisfactionMetrics.average_rating.toFixed(1) : 'N/A'}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Total de Avaliações</span>
                <span className="text-lg font-semibold text-primary">
                  {satisfactionMetrics.total_evaluations || 0}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-secondary">Taxa de Satisfação</span>
                <span className="text-lg font-semibold text-green-600">
                  {satisfactionMetrics.satisfaction_percentage ? `${satisfactionMetrics.satisfaction_percentage.toFixed(1)}%` : '0%'}
                </span>
              </div>
            </div>
          </div>

          {/* Rating Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-primary mb-4">
              Distribuição de Avaliações
            </h3>
            
            {satisfactionMetrics.rating_distribution && (
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((rating) => {
                  const count = satisfactionMetrics.rating_distribution[rating] || 0;
                  const percentage = satisfactionMetrics.total_evaluations > 0 
                    ? (count / satisfactionMetrics.total_evaluations) * 100 
                    : 0;
                  
                  return (
                    <div key={rating} className="flex items-center">
                      <div className="flex items-center w-16">
                        <span className="text-sm text-secondary mr-1">{rating}</span>
                        <StarIcon className="h-4 w-4 text-yellow-400 fill-current" />
                      </div>
                      <div className="flex-1 mx-3">
                        <div className="bg-bg-overlay rounded-full h-2">
                          <div 
                            className="bg-brand-primary h-2 rounded-full transition-all duration-300 neon-glow"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="w-12 text-right">
                        <span className="text-sm text-primary">{count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            {(!satisfactionMetrics.rating_distribution || satisfactionMetrics.total_evaluations === 0) && (
              <div className="text-center py-8">
                <FaceSmileIcon className="h-12 w-12 text-muted mx-auto mb-2" />
                <p className="text-muted">Nenhuma avaliação ainda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Category Distribution */}
      {stats?.tickets_by_category && Object.keys(stats.tickets_by_category).length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-primary mb-4">
            Tickets por Categoria
          </h3>
          <div className="space-y-3">
            {Object.entries(stats.tickets_by_category)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 5)
              .map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm text-secondary">{category}</span>
                  <span className="text-sm font-medium text-primary">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Recent Activities */}
      {isTechnician && stats?.recent_activities && stats.recent_activities.length > 0 && (
        <div className="card p-6">
          <h3 className="text-lg font-medium text-primary mb-4">
            Atividades Recentes
          </h3>
          <div className="space-y-3">
            {stats.recent_activities.slice(0, 5).map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 rounded-full bg-bg-overlay flex items-center justify-center">
                    <span className="text-xs font-medium text-primary">
                      {activity.user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-primary">
                    <span className="font-medium">{activity.user?.full_name}</span>
                    {' '}{activity.description}
                  </p>
                  <p className="text-xs text-muted">
                    {new Date(activity.created_at).toLocaleString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-primary mb-4">
          Ações Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/tickets/new"
            className="flex items-center p-4 border border-subtle rounded-lg hover:bg-brand-hover transition-colors"
          >
            <PlusIcon className="h-8 w-8 text-brand-primary mr-3" />
            <div>
              <p className="font-medium text-primary">Criar Ticket</p>
              <p className="text-sm text-secondary">Abrir um novo chamado</p>
            </div>
          </Link>
          
          <Link
            to="/tickets?status=open"
            className="flex items-center p-4 border border-subtle rounded-lg hover:bg-brand-hover transition-colors"
          >
            <TicketIcon className="h-8 w-8 text-yellow-400 mr-3" />
            <div>
              <p className="font-medium text-primary">Tickets Abertos</p>
              <p className="text-sm text-secondary">Ver chamados pendentes</p>
            </div>
          </Link>
          
          <Link
            to="/tickets"
            className="flex items-center p-4 border border-subtle rounded-lg hover:bg-brand-hover transition-colors"
          >
            <ClockIcon className="h-8 w-8 text-blue-400 mr-3" />
            <div>
              <p className="font-medium text-primary">Meus Tickets</p>
              <p className="text-sm text-secondary">Ver todos os chamados</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal
        isOpen={showTutorial}
        onClose={handleCloseTutorial}
        showVideo={tutorialMode === 'video'}
      />
    </div>
  );
};

export default Dashboard;
