import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { reportsAPI } from '../services/api';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ChartBarIcon,
  ArrowDownTrayIcon,
  CalendarIcon,
  UserGroupIcon,
  ClockIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const AdvancedReports = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('performance');
  const [timeRange, setTimeRange] = useState(30);
  const [interval, setInterval] = useState('daily');
  
  // Data states
  const [performanceData, setPerformanceData] = useState(null);
  const [departmentData, setDepartmentData] = useState(null);
  const [timelineData, setTimelineData] = useState(null);
  const [slaData, setSlaData] = useState(null);

  const tabs = [
    { id: 'performance', name: 'Performance', icon: ChartBarIcon },
    { id: 'department', name: 'Departamentos', icon: UserGroupIcon },
    { id: 'timeline', name: 'Timeline', icon: CalendarIcon },
    { id: 'sla', name: 'SLA', icon: ClockIcon }
  ];

  const timeRanges = [
    { value: 7, label: '7 dias' },
    { value: 30, label: '30 dias' },
    { value: 90, label: '90 dias' },
    { value: 180, label: '6 meses' },
    { value: 365, label: '1 ano' }
  ];

  const intervals = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' }
  ];

  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#F97316'];

  useEffect(() => {
    loadData();
  }, [timeRange, interval]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [performance, department, timeline, sla] = await Promise.all([
        reportsAPI.getTechnicianPerformance(timeRange),
        reportsAPI.getDepartmentMetrics(timeRange),
        reportsAPI.getTimelineMetrics(timeRange, interval),
        reportsAPI.getSLAAnalysis(timeRange)
      ]);

      setPerformanceData(performance.data);
      setDepartmentData(department.data);
      setTimelineData(timeline.data);
      setSlaData(sla.data);
    } catch (error) {
      console.error('Error loading reports data:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async (reportType) => {
    const pdf = new jsPDF();
    const currentDate = new Date().toLocaleDateString('pt-BR');
    
    // Header
    pdf.setFontSize(20);
    pdf.text('Sistema de Tickets - Relatório Avançado', 20, 20);
    pdf.setFontSize(12);
    pdf.text(`Tipo: ${reportType}`, 20, 30);
    pdf.text(`Período: ${timeRange} dias`, 20, 40);
    pdf.text(`Gerado em: ${currentDate}`, 20, 50);

    let yPosition = 70;

    if (reportType === 'performance' && performanceData) {
      pdf.setFontSize(16);
      pdf.text('Performance dos Técnicos', 20, yPosition);
      yPosition += 20;

      const tableData = performanceData.technicians.map(tech => [
        tech.name,
        tech.total_tickets.toString(),
        tech.resolved_tickets.toString(),
        `${tech.resolution_rate}%`,
        `${tech.avg_resolution_time_hours}h`,
        tech.avg_rating.toString()
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Técnico', 'Total', 'Resolvidos', 'Taxa', 'Tempo Médio', 'Avaliação']],
        body: tableData,
        theme: 'grid'
      });
    }

    if (reportType === 'department' && departmentData) {
      pdf.setFontSize(16);
      pdf.text('Métricas por Departamento', 20, yPosition);
      yPosition += 20;

      const tableData = departmentData.departments.map(dept => [
        dept.department,
        dept.total_tickets.toString(),
        dept.open_tickets.toString(),
        dept.resolved_tickets.toString(),
        `${dept.resolution_rate}%`,
        `${dept.avg_resolution_time_hours}h`
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Departamento', 'Total', 'Abertos', 'Resolvidos', 'Taxa', 'Tempo Médio']],
        body: tableData,
        theme: 'grid'
      });
    }

    if (reportType === 'sla' && slaData) {
      pdf.setFontSize(16);
      pdf.text('Análise de SLA', 20, yPosition);
      yPosition += 20;

      const tableData = slaData.priority_analysis.map(priority => [
        priority.priority,
        `${priority.target_hours}h`,
        priority.total_tickets.toString(),
        priority.within_sla.toString(),
        `${priority.sla_compliance_percent}%`,
        `${priority.avg_resolution_time_hours}h`
      ]);

      pdf.autoTable({
        startY: yPosition,
        head: [['Prioridade', 'Meta SLA', 'Total', 'Dentro SLA', 'Compliance', 'Tempo Médio']],
        body: tableData,
        theme: 'grid'
      });
    }

    pdf.save(`relatorio-${reportType}-${currentDate}.pdf`);
  };

  const exportToExcel = async (reportType) => {
    const wb = XLSX.utils.book_new();
    
    if (reportType === 'performance' && performanceData) {
      const ws = XLSX.utils.json_to_sheet(performanceData.technicians);
      XLSX.utils.book_append_sheet(wb, ws, 'Performance');
    }

    if (reportType === 'department' && departmentData) {
      const ws = XLSX.utils.json_to_sheet(departmentData.departments);
      XLSX.utils.book_append_sheet(wb, ws, 'Departamentos');
    }

    if (reportType === 'timeline' && timelineData) {
      const ws = XLSX.utils.json_to_sheet(timelineData.timeline);
      XLSX.utils.book_append_sheet(wb, ws, 'Timeline');
    }

    if (reportType === 'sla' && slaData) {
      const ws = XLSX.utils.json_to_sheet(slaData.priority_analysis);
      XLSX.utils.book_append_sheet(wb, ws, 'SLA');
    }

    const currentDate = new Date().toLocaleDateString('pt-BR');
    XLSX.writeFile(wb, `relatorio-${reportType}-${currentDate}.xlsx`);
  };

  const renderPerformanceCharts = () => {
    if (!performanceData || !performanceData.technicians) return null;

    return (
      <div className="space-y-8">
        {/* Performance Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Performance dos Técnicos</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={performanceData.technicians}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_tickets" fill="#3B82F6" name="Total de Tickets" />
              <Bar dataKey="resolved_tickets" fill="#10B981" name="Resolvidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Resolution Rate */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Taxa de Resolução</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.technicians}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Taxa de Resolução']} />
              <Bar dataKey="resolution_rate" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Average Rating */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Avaliação Média</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.technicians}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 5]} />
              <Tooltip formatter={(value) => [value, 'Avaliação']} />
              <Bar dataKey="avg_rating" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderDepartmentCharts = () => {
    if (!departmentData || !departmentData.departments) return null;

    return (
      <div className="space-y-8">
        {/* Department Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tickets por Departamento</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={departmentData.departments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="total_tickets" fill="#3B82F6" name="Total" />
              <Bar dataKey="open_tickets" fill="#EF4444" name="Abertos" />
              <Bar dataKey="resolved_tickets" fill="#10B981" name="Resolvidos" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Priority Distribution */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição de Prioridade</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={departmentData.departments}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="urgent_tickets" fill="#EF4444" name="Urgente" />
              <Bar dataKey="high_tickets" fill="#F59E0B" name="Alta" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderTimelineCharts = () => {
    if (!timelineData || !timelineData.timeline) return null;

    return (
      <div className="space-y-8">
        {/* Timeline Overview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Evolução dos Tickets</h3>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={timelineData.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="created_tickets" stroke="#3B82F6" name="Criados" />
              <Line type="monotone" dataKey="resolved_tickets" stroke="#10B981" name="Resolvidos" />
              <Line type="monotone" dataKey="urgent_tickets" stroke="#EF4444" name="Urgentes" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Area Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Volume de Tickets</h3>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={timelineData.timeline}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area type="monotone" dataKey="created_tickets" stackId="1" stroke="#3B82F6" fill="#3B82F6" />
              <Area type="monotone" dataKey="resolved_tickets" stackId="1" stroke="#10B981" fill="#10B981" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderSLACharts = () => {
    if (!slaData || !slaData.priority_analysis) return null;

    return (
      <div className="space-y-8">
        {/* SLA Compliance */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Compliance de SLA por Prioridade</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={slaData.priority_analysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, 'Compliance']} />
              <Bar dataKey="sla_compliance_percent" fill="#10B981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA vs Reality */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">SLA Target vs Tempo Real</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={slaData.priority_analysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="priority" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}h`, 'Horas']} />
              <Legend />
              <Bar dataKey="target_hours" fill="#3B82F6" name="Meta SLA" />
              <Bar dataKey="avg_resolution_time_hours" fill="#EF4444" name="Tempo Real" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* SLA Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Distribuição de Tickets por SLA</h3>
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie
                data={slaData.priority_analysis}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ priority, sla_compliance_percent }) => `${priority}: ${sla_compliance_percent}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="total_tickets"
              >
                {slaData.priority_analysis.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    switch (activeTab) {
      case 'performance':
        return renderPerformanceCharts();
      case 'department':
        return renderDepartmentCharts();
      case 'timeline':
        return renderTimelineCharts();
      case 'sla':
        return renderSLACharts();
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Relatórios Avançados</h1>
              <p className="mt-1 text-sm text-gray-600">
                Análise detalhada de performance e métricas do sistema
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Time Range Selector */}
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(parseInt(e.target.value))}
                className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {timeRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {/* Interval Selector for Timeline */}
              {activeTab === 'timeline' && (
                <select
                  value={interval}
                  onChange={(e) => setInterval(e.target.value)}
                  className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  {intervals.map(int => (
                    <option key={int.value} value={int.value}>
                      {int.label}
                    </option>
                  ))}
                </select>
              )}

              {/* Export Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => exportToPDF(activeTab)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button
                  onClick={() => exportToExcel(activeTab)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6" aria-label="Tabs">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <tab.icon className="h-5 w-5 mr-2" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AdvancedReports;
