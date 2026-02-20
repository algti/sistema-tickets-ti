import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  DollarSign, 
  Clock, 
  CheckCircle,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { companiesService } from '../services/api';

const CompanyFinancialReport = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [company, setCompany] = useState(null);
  const [report, setReport] = useState(null);
  
  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);

  const months = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Março' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentDate.getFullYear() - i);

  useEffect(() => {
    fetchCompany();
  }, [id]);

  useEffect(() => {
    if (company) {
      fetchReport();
    }
  }, [selectedYear, selectedMonth, company]);

  const fetchCompany = async () => {
    try {
      const response = await companiesService.getCompany(id);
      setCompany(response.data);
    } catch (error) {
      console.error('Erro ao buscar empresa:', error);
      alert('Erro ao carregar dados da empresa');
      navigate('/companies');
    }
  };

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await companiesService.getFinancialReport(id, selectedYear, selectedMonth);
      setReport(response.data);
    } catch (error) {
      console.error('Erro ao buscar relatório:', error);
      alert('Erro ao carregar relatório financeiro');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    if (!value && value !== 0) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  if (!company) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <button
          onClick={() => navigate('/companies')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={20} />
          Voltar para Empresas
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Building2 size={24} className="text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatório Financeiro</h1>
              <p className="text-gray-600">{company.name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Informações da Empresa */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações da Empresa</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600">Razão Social</p>
            <p className="font-medium text-gray-900">{company.legal_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">CNPJ</p>
            <p className="font-medium text-gray-900">{formatCNPJ(company.cnpj)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Tipo de Cobrança</p>
            <p className="font-medium text-gray-900">
              {company.has_contract ? 'Contrato Mensal' : 'Por Hora'}
            </p>
          </div>
        </div>
      </div>

      {/* Filtros de Período */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <Calendar size={20} className="text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Período do Relatório</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mês</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {months.map(month => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {years.map(year => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : report ? (
        <>
          {/* Cards de Métricas */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Total de Chamados</p>
                <FileText size={20} className="text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{report.metrics.total_tickets}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Chamados Fechados</p>
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{report.metrics.closed_tickets}</p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                <Clock size={20} className="text-purple-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {report.metrics.total_hours_spent}h
              </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-gray-600">Valor a Cobrar</p>
                <DollarSign size={20} className="text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">
                {formatCurrency(report.financial.monthly_value)}
              </p>
            </div>
          </div>

          {/* Detalhes Financeiros */}
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Detalhes Financeiros</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Tipo de Cobrança</span>
                <span className="font-medium text-gray-900">
                  {report.financial.billing_type === 'contract' ? 'Contrato Mensal' : 'Por Hora'}
                </span>
              </div>

              {report.financial.billing_type === 'contract' ? (
                <div className="flex justify-between items-center py-3 border-b border-gray-200">
                  <span className="text-gray-600">Valor do Contrato</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(report.financial.monthly_value)}
                  </span>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Valor Hora</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(report.financial.hourly_rate)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Horas Trabalhadas</span>
                    <span className="font-medium text-gray-900">
                      {report.financial.hours_worked}h
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-3 border-b border-gray-200">
                    <span className="text-gray-600">Cálculo</span>
                    <span className="font-medium text-gray-900">
                      {report.financial.hours_worked}h × {formatCurrency(report.financial.hourly_rate)}
                    </span>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center py-3 bg-green-50 rounded-lg px-4">
                <span className="text-lg font-semibold text-gray-900">Total a Cobrar</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.financial.monthly_value)}
                </span>
              </div>
            </div>
          </div>

          {/* Estatísticas de Atendimento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chamados por Prioridade</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Urgente</span>
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                    {report.tickets_by_priority.urgent}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Alta</span>
                  <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm font-medium">
                    {report.tickets_by_priority.high}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Média</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {report.tickets_by_priority.medium}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Baixa</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {report.tickets_by_priority.low}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Chamados por Status</h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Abertos</span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {report.tickets_by_status.open}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Em Progresso</span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {report.tickets_by_status.in_progress}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Aguardando Usuário</span>
                  <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                    {report.tickets_by_status.waiting_user}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Resolvidos</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {report.tickets_by_status.resolved}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Fechados</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium">
                    {report.tickets_by_status.closed}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tempo Médio de Resolução */}
          {report.metrics.avg_resolution_hours && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp size={20} className="text-blue-600" />
                <h2 className="text-lg font-semibold text-gray-900">Tempo Médio de Resolução</h2>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {report.metrics.avg_resolution_hours.toFixed(1)} horas
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Tempo médio desde a abertura até o fechamento dos chamados
              </p>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum dado disponível</h3>
          <p className="text-gray-600">
            Não há chamados registrados para esta empresa no período selecionado.
          </p>
        </div>
      )}
    </div>
  );
};

export default CompanyFinancialReport;
