import React, { useState, useEffect } from 'react';
import { reportsAPI, companiesService, usersService, categoriesAPI } from '../services/api';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CustomReports = () => {
  const [reportType, setReportType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
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
    loadFilters();
    setDefaultDates();
  }, []);

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
    setReportData(null);

    try {
      let response;
      
      switch (reportType) {
        case 'general':
          response = await reportsAPI.getGeneralReport(startDate, endDate);
          break;
        case 'by-company':
          response = await reportsAPI.getReportByCompany(
            startDate, 
            endDate, 
            selectedCompany || null
          );
          break;
        case 'by-user':
          response = await reportsAPI.getReportByUser(
            startDate, 
            endDate, 
            selectedUser || null
          );
          break;
        case 'by-user-company':
          response = await reportsAPI.getReportByUserCompany(
            startDate, 
            endDate, 
            selectedCompany || null,
            selectedUser || null
          );
          break;
        case 'by-category':
          response = await reportsAPI.getReportByCategory(
            startDate, 
            endDate, 
            selectedCategory || null
          );
          break;
        case 'performance':
          response = await reportsAPI.getTechnicianPerformance(
            null,
            selectedTechnician || null,
            startDate,
            endDate
          );
          break;
        case 'detailed':
          response = await reportsAPI.getDetailedCompanyUserReport(
            startDate, 
            endDate, 
            selectedCompany || null,
            selectedUser || null
          );
          break;
        default:
          throw new Error('Tipo de relatório inválido');
      }

      setReportData(response.data);
    } catch (err) {
      console.error('Erro ao gerar relatório:', err);
      setError(err.response?.data?.detail || 'Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    if (!reportData) return;

    const doc = new jsPDF();
    const selectedReport = reportTypes.find(r => r.value === reportType);
    
    doc.setFontSize(16);
    doc.text(selectedReport.label, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Período: ${startDate} até ${endDate}`, 14, 30);
    doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 36);

    let yPos = 45;

    if (reportType === 'general') {
      doc.text(`Total de Tickets: ${reportData.summary.total_tickets}`, 14, yPos);
      yPos += 6;
      doc.text(`Tickets Resolvidos: ${reportData.summary.resolved_tickets}`, 14, yPos);
      yPos += 6;
      doc.text(`Horas Totais: ${reportData.summary.total_hours_spent}h`, 14, yPos);
      yPos += 10;

      if (reportData.tickets_by_status) {
        const statusData = Object.entries(reportData.tickets_by_status).map(([k, v]) => [k, v]);
        doc.autoTable({
          startY: yPos,
          head: [['Status', 'Quantidade']],
          body: statusData
        });
      }
    } else if (reportType === 'by-company' && reportData.companies) {
      const companyData = reportData.companies.map(c => [
        c.company_name,
        c.total_tickets,
        c.total_hours
      ]);
      doc.autoTable({
        startY: yPos,
        head: [['Empresa', 'Total Tickets', 'Horas']],
        body: companyData
      });
    } else if (reportType === 'by-user' && reportData.users) {
      const userData = reportData.users.map(u => [
        u.user_name,
        u.user_email,
        u.total_tickets
      ]);
      doc.autoTable({
        startY: yPos,
        head: [['Usuário', 'Email', 'Total Tickets']],
        body: userData
      });
    } else if (reportType === 'by-category' && reportData.categories) {
      const categoryData = reportData.categories.map(c => [
        c.category_name,
        c.total_tickets
      ]);
      doc.autoTable({
        startY: yPos,
        head: [['Categoria', 'Total Tickets']],
        body: categoryData
      });
    } else if (reportType === 'performance' && reportData.technicians) {
      const techData = reportData.technicians.map(t => [
        t.full_name,
        t.total_tickets,
        t.resolved_tickets,
        `${t.resolution_rate}%`,
        t.avg_rating ? t.avg_rating.toFixed(1) : 'N/A'
      ]);
      doc.autoTable({
        startY: yPos,
        head: [['Técnico', 'Total', 'Resolvidos', 'Taxa', 'Avaliação']],
        body: techData
      });
    } else if (reportType === 'detailed' && reportData.tickets) {
      const detailedData = reportData.tickets.map(t => [
        `#${t.ticket_id}`,
        t.company?.name || 'N/A',
        t.user?.name || 'N/A',
        new Date(t.timeline.opened_at).toLocaleString('pt-BR'),
        t.timeline.closed_at ? new Date(t.timeline.closed_at).toLocaleString('pt-BR') : 'Aberto'
      ]);
      doc.autoTable({
        startY: yPos,
        head: [['Ticket', 'Empresa', 'Usuário', 'Abertura', 'Fechamento']],
        body: detailedData
      });
    }

    doc.save(`relatorio_${reportType}_${startDate}_${endDate}.pdf`);
  };

  const exportToExcel = () => {
    if (!reportData) return;

    let worksheetData = [];
    const selectedReport = reportTypes.find(r => r.value === reportType);

    if (reportType === 'general') {
      worksheetData = [
        ['Relatório Geral de Tickets'],
        [`Período: ${startDate} até ${endDate}`],
        [],
        ['Métrica', 'Valor'],
        ['Total de Tickets', reportData.summary.total_tickets],
        ['Tickets Resolvidos', reportData.summary.resolved_tickets],
        ['Horas Totais', reportData.summary.total_hours_spent],
        [],
        ['Status', 'Quantidade'],
        ...Object.entries(reportData.tickets_by_status || {})
      ];
    } else if (reportType === 'by-company' && reportData.companies) {
      worksheetData = [
        [selectedReport.label],
        [`Período: ${startDate} até ${endDate}`],
        [],
        ['Empresa', 'Total Tickets', 'Horas Totais'],
        ...reportData.companies.map(c => [c.company_name, c.total_tickets, c.total_hours])
      ];
    } else if (reportType === 'by-user' && reportData.users) {
      worksheetData = [
        [selectedReport.label],
        [`Período: ${startDate} até ${endDate}`],
        [],
        ['Usuário', 'Email', 'Departamento', 'Total Tickets'],
        ...reportData.users.map(u => [u.user_name, u.user_email, u.department || 'N/A', u.total_tickets])
      ];
    } else if (reportType === 'by-category' && reportData.categories) {
      worksheetData = [
        [selectedReport.label],
        [`Período: ${startDate} até ${endDate}`],
        [],
        ['Categoria', 'Total Tickets'],
        ...reportData.categories.map(c => [c.category_name, c.total_tickets])
      ];
    } else if (reportType === 'performance' && reportData.technicians) {
      worksheetData = [
        [selectedReport.label],
        [`Período: ${startDate} até ${endDate}`],
        [],
        ['Técnico', 'Total Tickets', 'Resolvidos', 'Taxa Resolução', 'Avaliação Média'],
        ...reportData.technicians.map(t => [
          t.full_name,
          t.total_tickets,
          t.resolved_tickets,
          `${t.resolution_rate}%`,
          t.avg_rating ? t.avg_rating.toFixed(1) : 'N/A'
        ])
      ];
    } else if (reportType === 'detailed' && reportData.tickets) {
      worksheetData = [
        [selectedReport.label],
        [`Período: ${startDate} até ${endDate}`],
        [],
        ['Ticket ID', 'Título', 'Empresa', 'Usuário', 'Técnico', 'Categoria', 'Prioridade', 'Status', 'Abertura', 'Fechamento', 'Descrição', 'Solução'],
        ...reportData.tickets.map(t => [
          `#${t.ticket_id}`,
          t.title,
          t.company?.name || 'N/A',
          t.user?.name || 'N/A',
          t.technician?.name || 'N/A',
          t.category || 'N/A',
          t.priority,
          t.status,
          new Date(t.timeline.opened_at).toLocaleString('pt-BR'),
          t.timeline.closed_at ? new Date(t.timeline.closed_at).toLocaleString('pt-BR') : 'Aberto',
          t.details.description,
          t.details.solution || 'N/A'
        ])
      ];
    }

    const ws = XLSX.utils.aoa_to_sheet(worksheetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
    XLSX.writeFile(wb, `relatorio_${reportType}_${startDate}_${endDate}.xlsx`);
  };

  const renderFilters = () => {
    const selected = reportTypes.find(r => r.value === reportType);
    if (!selected || !selected.filters.length) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        {selected.filters.includes('company') && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Empresa (opcional)
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as empresas</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {selected.filters.includes('user') && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Usuário (opcional)
            </label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os usuários</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.full_name} ({u.email})</option>
              ))}
            </select>
          </div>
        )}

        {selected.filters.includes('category') && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Categoria (opcional)
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        )}

        {selected.filters.includes('technician') && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Técnico (opcional)
            </label>
            <select
              value={selectedTechnician}
              onChange={(e) => setSelectedTechnician(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos os técnicos</option>
              {technicians.map(t => (
                <option key={t.id} value={t.id}>{t.full_name}</option>
              ))}
            </select>
          </div>
        )}
      </div>
    );
  };

  const renderReportData = () => {
    if (!reportData) return null;

    return (
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Resultado do Relatório</h3>
          <div className="flex gap-2">
            <button
              onClick={exportToPDF}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              📄 Exportar PDF
            </button>
            <button
              onClick={exportToExcel}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              📊 Exportar Excel
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {/* Período */}
          {reportData.period && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">📅 Período do Relatório</h4>
              <p>De <strong>{reportData.period.start_date}</strong> até <strong>{reportData.period.end_date}</strong></p>
            </div>
          )}

          {/* Resumo Geral */}
          {reportData.summary && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Total de Tickets</p>
                <p className="text-3xl font-bold">{reportData.summary.total_tickets}</p>
              </div>
              <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Resolvidos</p>
                <p className="text-3xl font-bold">{reportData.summary.resolved_tickets}</p>
              </div>
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Horas Totais</p>
                <p className="text-3xl font-bold">{reportData.summary.total_hours_spent}h</p>
              </div>
              <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                <p className="text-sm opacity-90">Média Resolução</p>
                <p className="text-3xl font-bold">
                  {reportData.summary.avg_resolution_hours ? `${reportData.summary.avg_resolution_hours.toFixed(1)}h` : 'N/A'}
                </p>
              </div>
            </div>
          )}

          {/* Tabela de Empresas */}
          {reportData.companies && reportData.companies.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold mb-3">🏢 Relatório por Empresa</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tickets</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horas</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.companies.map((company, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">{company.company_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{company.total_tickets}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{company.total_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela de Usuários */}
          {reportData.users && reportData.users.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold mb-3">👤 Relatório por Usuário</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Departamento</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tickets</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.users.map((user, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">{user.user_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.user_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.department || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.total_tickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela de Categorias */}
          {reportData.categories && reportData.categories.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold mb-3">📂 Relatório por Categoria</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Tickets</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.categories.map((category, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center">
                          <span 
                            className="w-3 h-3 rounded-full mr-2" 
                            style={{ backgroundColor: category.category_color }}
                          ></span>
                          {category.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{category.total_tickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela de Técnicos */}
          {reportData.technicians && reportData.technicians.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold mb-3">👨‍💻 Performance de Técnicos</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Técnico</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Resolvidos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Taxa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avaliação</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.technicians.map((tech, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">{tech.full_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{tech.total_tickets}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{tech.resolved_tickets}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          {tech.resolution_rate}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tech.avg_rating ? (
                          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                            ⭐ {tech.avg_rating.toFixed(1)}
                          </span>
                        ) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Tabela Detalhada de Tickets */}
          {reportData.tickets && reportData.tickets.length > 0 && (
            <div className="overflow-x-auto">
              <h4 className="font-semibold mb-3">🎫 Tickets Detalhados</h4>
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Título</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Empresa</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abertura</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fechamento</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reportData.tickets.map((ticket, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap">#{ticket.ticket_id}</td>
                      <td className="px-6 py-4">{ticket.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{ticket.company?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{ticket.user?.name || 'N/A'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs ${
                          ticket.status === 'closed' ? 'bg-gray-100 text-gray-800' :
                          ticket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                          ticket.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(ticket.timeline.opened_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {ticket.timeline.closed_at ? new Date(ticket.timeline.closed_at).toLocaleString('pt-BR') : 'Aberto'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Gráficos de Status e Prioridade */}
          {(reportData.tickets_by_status || reportData.tickets_by_priority) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reportData.tickets_by_status && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">📊 Por Status</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.tickets_by_status).map(([status, count]) => (
                      <div key={status} className="flex justify-between items-center">
                        <span className="capitalize">{status.replace('_', ' ')}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {reportData.tickets_by_priority && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-3">🔥 Por Prioridade</h4>
                  <div className="space-y-2">
                    {Object.entries(reportData.tickets_by_priority).map(([priority, count]) => (
                      <div key={priority} className="flex justify-between items-center">
                        <span className="capitalize">{priority}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Relatórios Customizados</h1>
        <p className="text-gray-600 mt-2">
          Gere relatórios personalizados com filtros de data e exportação em PDF/Excel
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Tipo de Relatório *
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Selecione um relatório</option>
              {reportTypes.map(rt => (
                <option key={rt.value} value={rt.value}>{rt.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Data Inicial *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Data Final *
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {renderFilters()}

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="mt-6">
          <button
            onClick={handleGenerateReport}
            disabled={loading}
            className="w-full md:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Gerando relatório...' : '🔍 Gerar Relatório'}
          </button>
        </div>
      </div>

      {renderReportData()}
    </div>
  );
};

export default CustomReports;
