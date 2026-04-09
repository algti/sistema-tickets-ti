import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardService, reportsAPI, companiesService, usersService, categoriesAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ChartBarIcon,
  PresentationChartLineIcon,
  ArrowRightIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';

function Reports() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('summary');
  const [loading, setLoading] = useState(true);
  
  // Summary Tab States
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportData, setReportData] = useState({
    summary: {},
    ticketsByStatus: [],
    ticketsByPriority: [],
    ticketsByCategory: [],
    technicianPerformance: [],
    monthlyTrends: []
  });

  // Custom Reports Tab States
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [customReportData, setCustomReportData] = useState(null);
  const [error, setError] = useState('');
  
  const [companies, setCompanies] = useState([]);
  const [users, setUsers] = useState([]);
  const [categories, setCategories] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTechnician, setSelectedTechnician] = useState('');

  useEffect(() => {
    if (activeTab === 'summary') {
      fetchReportData();
    }
  }, [dateRange, activeTab]);

  useEffect(() => {
    if (activeTab === 'custom') {
      loadFilters();
      setDefaultDates();
    }
  }, [activeTab]);

  const setDefaultDates = () => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(firstDay.toISOString().split('T')[0]);
  };

  const loadFilters = async () => {
    try {
      const [companiesRes, usersRes, categoriesRes] = await Promise.all([
        companiesService.getAll(),
        usersService.getAll(),
        categoriesAPI.getAll()
      ]);
      
      setCompanies(companiesRes.data || []);
      setUsers(usersRes.data || []);
      setCategories(categoriesRes.data || []);
      
      const techList = (usersRes.data || []).filter(u => 
        u.role === 'technician' || u.role === 'admin'
      );
      setTechnicians(techList);
    } catch (err) {
      console.error('Erro ao carregar filtros:', err);
    }
  };

  const reportTypes = [
    { value: 'general', label: 'Relatório Geral de Tickets', filters: [] },
    { value: 'by-company', label: 'Relatório por Empresa', filters: ['company'] },
    { value: 'by-user', label: 'Relatório por Usuário', filters: ['user'] },
    { value: 'by-user-company', label: 'Relatório por Usuário x Empresa', filters: ['company', 'user'] },
    { value: 'by-category', label: 'Relatório por Categoria', filters: ['category'] },
    { value: 'performance', label: 'Relatório de Desempenho de Técnicos', filters: ['technician'] },
    { value: 'detailed', label: 'Relatório Detalhado (Empresa + Usuário + Timeline)', filters: ['company', 'user'] }
  ];

  const handleGenerateReport = async () => {
    if (!reportType) {
      setError('Selecione um tipo de relatório');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Selecione as datas inicial e final');
      return;
    }

    setLoading(true);
    setError('');
    setCustomReportData(null);

    try {
      let response;
      
      switch (reportType) {
        case 'general':
          response = await reportsAPI.getGeneralReport(startDate, endDate);
          break;
        case 'by-company':
          response = await reportsAPI.getReportByCompany(startDate, endDate, selectedCompany || null);
          break;
        case 'by-user':
          response = await reportsAPI.getReportByUser(startDate, endDate, selectedUser || null);
          break;
        case 'by-user-company':
          response = await reportsAPI.getReportByUserCompany(startDate, endDate, selectedCompany || null, selectedUser || null);
          break;
        case 'by-category':
          response = await reportsAPI.getReportByCategory(startDate, endDate, selectedCategory || null);
          break;
        case 'performance':
          response = await reportsAPI.getTechnicianPerformance(null, startDate, endDate, selectedTechnician || null);
          break;
        case 'detailed':
          response = await reportsAPI.getDetailedCompanyUserReport(startDate, endDate, selectedCompany || null, selectedUser || null);
          break;
        default:
          throw new Error('Tipo de relatório inválido');
      }
      
      setCustomReportData(response.data);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError('Erro ao gerar relatório. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!customReportData) return;

    const pdf = new jsPDF();
    const reportTypeLabel = reportTypes.find(r => r.value === reportType)?.label || 'Relatório';
    
    pdf.setFontSize(18);
    pdf.text(reportTypeLabel, 20, 20);
    pdf.setFontSize(11);
    pdf.text(`Período: ${startDate} até ${endDate}`, 20, 30);
    pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, 37);

    const fileName = `${reportType}_${startDate}_${endDate}.pdf`;
    pdf.save(fileName);
  };

  const exportToExcel = () => {
    if (!customReportData) return;

    const wb = XLSX.utils.book_new();
    const wsData = [['Relatório Customizado'], [`Período: ${startDate} até ${endDate}`], []];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    
    const fileName = `${reportType}_${startDate}_${endDate}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const response = await dashboardService.getStats({ days: 365 });
      const stats = response.data;
      
      const total = stats.total_tickets || 0;
      const open = stats.open_tickets || 0;
      const inProgress = stats.in_progress_tickets || 0;
      const resolved = stats.resolved_tickets || 0;
      const closed = stats.closed_tickets || 0;
      
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

  const selectedReportType = reportTypes.find(r => r.value === reportType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-1">Análise detalhada do desempenho do suporte</p>
        </div>
        <Link
          to="/advanced-reports"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium inline-flex items-center"
        >
          <PresentationChartLineIcon className="h-5 w-5 mr-2" />
          Relatórios Avançados
          <ArrowRightIcon className="h-4 w-4 ml-2" />
        </Link>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('summary')}
              className={`${
                activeTab === 'summary'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
            >
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Resumo Geral
            </button>
            <button
              onClick={() => setActiveTab('custom')}
              className={`${
                activeTab === 'custom'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm inline-flex items-center`}
            >
              <DocumentTextIcon className="h-5 w-5 mr-2" />
              Relatórios Customizados
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'summary' && (
            <div className="space-y-6">
              {/* Date Range Filter */}
              <div className="bg-gray-50 rounded-lg p-4">
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
                  <div className="pt-6 ml-auto flex space-x-2">
                    <button
                      onClick={() => exportReport('pdf')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      📄 PDF
                    </button>
                    <button
                      onClick={() => exportReport('excel')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                    >
                      📊 Excel
                    </button>
                  </div>
                </div>
              </div>

              {loading ? (
                <LoadingSpinner />
              ) : (
                <>
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
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

                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
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

                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
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

                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
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
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
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
                    <div className="bg-white shadow rounded-lg p-6 border border-gray-200">
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
                </>
              )}
            </div>
          )}

          {activeTab === 'custom' && (
            <div className="space-y-6">
              {/* Filters */}
              <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Report Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Relatório</label>
                    <select
                      value={reportType}
                      onChange={(e) => {
                        setReportType(e.target.value);
                        setCustomReportData(null);
                        setError('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione um tipo de relatório</option>
                      {reportTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Range */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Inicial</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Data Final</label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Conditional Filters */}
                {selectedReportType && selectedReportType.filters.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
                    {selectedReportType.filters.includes('company') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Empresa (opcional)</label>
                        <select
                          value={selectedCompany}
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todas as empresas</option>
                          {companies.map(company => (
                            <option key={company.id} value={company.id}>{company.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedReportType.filters.includes('user') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Usuário (opcional)</label>
                        <select
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todos os usuários</option>
                          {users.map(u => (
                            <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedReportType.filters.includes('category') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria (opcional)</label>
                        <select
                          value={selectedCategory}
                          onChange={(e) => setSelectedCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todas as categorias</option>
                          {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {selectedReportType.filters.includes('technician') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Técnico (opcional)</label>
                        <select
                          value={selectedTechnician}
                          onChange={(e) => setSelectedTechnician(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">Todos os técnicos</option>
                          {technicians.map(tech => (
                            <option key={tech.id} value={tech.id}>{tech.full_name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                )}

                {/* Generate Button */}
                <div className="flex items-center justify-between pt-4">
                  <button
                    onClick={handleGenerateReport}
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Gerando...' : 'Gerar Relatório'}
                  </button>

                  {customReportData && (
                    <div className="flex space-x-2">
                      <button
                        onClick={exportToPDF}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium"
                      >
                        📄 Exportar PDF
                      </button>
                      <button
                        onClick={exportToExcel}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium"
                      >
                        📊 Exportar Excel
                      </button>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                    {error}
                  </div>
                )}
              </div>

              {/* Report Data */}
              {customReportData && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold mb-4">Resultado do Relatório</h3>
                  <pre className="bg-gray-50 p-4 rounded overflow-auto text-sm">
                    {JSON.stringify(customReportData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
