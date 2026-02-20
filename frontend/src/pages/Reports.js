import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

function Reports() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 dias atrás
    end: new Date().toISOString().split('T')[0] // hoje
  });
  const [reportData, setReportData] = useState({
    summary: {},
    ticketsByStatus: [],
    ticketsByPriority: [],
    ticketsByCategory: [],
    technicianPerformance: [],
    monthlyTrends: []
  });

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Buscar dados reais da API
      const response = await dashboardService.getStats({ days: 365 });
      const stats = response.data;
      
      // Calcular totais e percentuais
      const total = stats.total_tickets || 0;
      const open = stats.open_tickets || 0;
      const inProgress = stats.in_progress_tickets || 0;
      const resolved = stats.resolved_tickets || 0;
      const closed = stats.closed_tickets || 0;
      
      // Converter dados da API para formato do relatório
      const reportStats = {
        summary: {
          total_tickets: total,
          open_tickets: open,
          in_progress_tickets: inProgress,
          resolved_tickets: resolved,
          closed_tickets: closed,
          avg_resolution_time: stats.avg_time_open 
            ? (stats.avg_time_open < 24 
                ? `${stats.avg_time_open.toFixed(1)}h`
                : `${(stats.avg_time_open / 24).toFixed(1)} dias`)
            : '0h',
          satisfaction_rate: stats.satisfaction_rate || '0%'
        },
        ticketsByStatus: [
          { status: 'OPEN', count: open, percentage: total > 0 ? (open / total * 100).toFixed(1) : 0 },
          { status: 'IN_PROGRESS', count: inProgress, percentage: total > 0 ? (inProgress / total * 100).toFixed(1) : 0 },
          { status: 'RESOLVED', count: resolved, percentage: total > 0 ? (resolved / total * 100).toFixed(1) : 0 },
          { status: 'CLOSED', count: closed, percentage: total > 0 ? (closed / total * 100).toFixed(1) : 0 }
        ],
        ticketsByPriority: Object.entries(stats.tickets_by_priority || {}).map(([priority, count]) => ({
          priority: priority.toUpperCase(),
          count,
          percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
        })),
        ticketsByCategory: Object.entries(stats.tickets_by_category || {}).map(([category, count]) => ({
          category,
          count,
          percentage: total > 0 ? (count / total * 100).toFixed(1) : 0
        })),
        technicianPerformance: stats.technician_performance || [],
        monthlyTrends: stats.monthly_trends || []
      };

      setReportData(reportStats);
    } catch (error) {
      console.error('Erro ao buscar dados do relatório:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    // Simulação de exportação
    alert(`Exportando relatório em formato ${format.toUpperCase()}...`);
  };

  const getStatusColor = (status) => {
    const colors = {
      'OPEN': 'bg-blue-500',
      'IN_PROGRESS': 'bg-yellow-500',
      'RESOLVED': 'bg-green-500',
      'CLOSED': 'bg-gray-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'LOW': 'bg-green-500',
      'MEDIUM': 'bg-yellow-500',
      'HIGH': 'bg-orange-500',
      'URGENT': 'bg-red-500'
    };
    return colors[priority] || 'bg-gray-500';
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do desempenho do suporte</p>
        </div>
        <div className="flex space-x-2">
          <Link
            to="/advanced-reports"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center"
          >
            <PresentationChartLineIcon className="h-5 w-5 mr-2" />
            Relatórios Avançados
            <ArrowRightIcon className="h-4 w-4 ml-2" />
          </Link>
          <button
            onClick={() => exportReport('pdf')}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
          >
            📄 Exportar PDF
          </button>
          <button
            onClick={() => exportReport('excel')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
          >
            📊 Exportar Excel
          </button>
        </div>
      </div>

      {/* Advanced Reports Card */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-2">Relatórios Avançados Disponíveis</h2>
            <p className="text-blue-100 mb-4">
              Acesse gráficos interativos, análise de SLA, métricas por técnico e exportação avançada
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Performance por Técnico
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Métricas por Departamento
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Timeline Interativa
              </div>
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Análise de SLA
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            <Link
              to="/advanced-reports"
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors inline-flex items-center"
            >
              Acessar Relatórios Avançados
              <ArrowRightIcon className="h-5 w-5 ml-2" />
            </Link>
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="flex items-center space-x-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="pt-6">
            <button
              onClick={fetchReportData}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium"
            >
              Atualizar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">T</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total de Tickets</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.total_tickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">✓</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Resolvidos</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.resolved_tickets}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">⏱</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.avg_resolution_time}</p>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">★</span>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Satisfação</p>
              <p className="text-2xl font-bold text-gray-900">{reportData.summary.satisfaction_rate}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Status */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets por Status</h3>
          <div className="space-y-3">
            {reportData.ticketsByStatus.map((item) => (
              <div key={item.status} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(item.status)} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tickets by Priority */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets por Prioridade</h3>
          <div className="space-y-3">
            {reportData.ticketsByPriority.map((item) => (
              <div key={item.priority} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(item.priority)} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.priority}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Categories and Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tickets by Category */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets por Categoria</h3>
          <div className="space-y-3">
            {reportData.ticketsByCategory.map((item, index) => (
              <div key={item.category} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full bg-blue-${(index + 1) * 100} mr-3`}></div>
                  <span className="text-sm font-medium text-gray-700">{item.category}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-900">{item.count}</span>
                  <span className="text-xs text-gray-500">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technician Performance */}
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Desempenho dos Técnicos</h3>
          <div className="space-y-4">
            {reportData.technicianPerformance.map((tech) => (
              <div key={tech.name} className="border-l-4 border-blue-500 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{tech.name}</p>
                    <p className="text-xs text-gray-500">
                      {tech.tickets_resolved} tickets • {tech.avg_time} • {tech.satisfaction}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${parseInt(tech.satisfaction)}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Tendências Mensais</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Mês
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Criados
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Resolvidos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taxa de Resolução
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.monthlyTrends.map((trend) => (
                <tr key={trend.month}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {trend.month}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.created}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {trend.resolved}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {Math.round((trend.resolved / trend.created) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Reports;
