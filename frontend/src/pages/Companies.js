import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Users,
  FileText,
  AlertCircle
} from 'lucide-react';
import { companiesService } from '../services/api';

const Companies = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');
  const [filterContract, setFilterContract] = useState('all');

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterActive !== 'all') {
        params.is_active = filterActive === 'active';
      }
      if (filterContract !== 'all') {
        params.has_contract = filterContract === 'contract';
      }
      if (searchTerm) {
        params.search = searchTerm;
      }
      
      const response = await companiesService.getCompanies(params);
      setCompanies(response.data);
    } catch (error) {
      console.error('Erro ao buscar empresas:', error);
      alert('Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCompanies();
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, filterActive, filterContract]);

  const handleDeactivate = async (id) => {
    if (!window.confirm('Deseja realmente desativar esta empresa?')) return;
    
    try {
      await companiesService.deactivateCompany(id);
      alert('Empresa desativada com sucesso!');
      fetchCompanies();
    } catch (error) {
      console.error('Erro ao desativar empresa:', error);
      alert('Erro ao desativar empresa');
    }
  };

  const handleActivate = async (id) => {
    try {
      await companiesService.activateCompany(id);
      alert('Empresa ativada com sucesso!');
      fetchCompanies();
    } catch (error) {
      console.error('Erro ao ativar empresa:', error);
      alert('Erro ao ativar empresa');
    }
  };

  const getContractStatusBadge = (company) => {
    if (!company.has_contract) {
      return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Sem Contrato</span>;
    }

    const status = company.contract_status;
    if (status === 'active') {
      return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Contrato Ativo</span>;
    } else if (status === 'expired') {
      return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">Contrato Vencido</span>;
    } else if (status === 'pending_renewal') {
      return <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Renovação Pendente</span>;
    }
    return null;
  };

  const formatCNPJ = (cnpj) => {
    if (!cnpj) return '';
    return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCurrency = (value) => {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gerencie as empresas atendidas</p>
        </div>
        <button
          onClick={() => navigate('/companies/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus size={20} />
          Nova Empresa
        </button>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todas as Empresas</option>
            <option value="active">Apenas Ativas</option>
            <option value="inactive">Apenas Inativas</option>
          </select>

          <select
            value={filterContract}
            onChange={(e) => setFilterContract(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Todos os Tipos</option>
            <option value="contract">Com Contrato</option>
            <option value="hourly">Sem Contrato (Por Hora)</option>
          </select>
        </div>
      </div>

      {/* Tabela */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <Building2 size={48} className="mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
          <p className="text-gray-600 mb-4">Comece cadastrando sua primeira empresa</p>
          <button
            onClick={() => navigate('/companies/new')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Cadastrar Empresa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Empresa
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  CNPJ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tipo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {companies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Building2 size={20} className="text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.legal_name}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCNPJ(company.cnpj)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.email}</div>
                    <div className="text-sm text-gray-500">{company.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getContractStatusBadge(company)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {company.has_contract 
                        ? formatCurrency(company.contract_value) + '/mês'
                        : formatCurrency(company.hourly_rate) + '/hora'
                      }
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.is_active ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <CheckCircle size={16} />
                        <span className="text-sm">Ativa</span>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-red-600">
                        <XCircle size={16} />
                        <span className="text-sm">Inativa</span>
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/companies/${company.id}/report`)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Relatório Financeiro"
                      >
                        <FileText size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/companies/${company.id}/users`)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Ver Usuários"
                      >
                        <Users size={18} />
                      </button>
                      <button
                        onClick={() => navigate(`/companies/${company.id}/edit`)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Editar"
                      >
                        <Edit size={18} />
                      </button>
                      {company.is_active ? (
                        <button
                          onClick={() => handleDeactivate(company.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Desativar"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => handleActivate(company.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Ativar"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Alertas de Contratos */}
      {companies.filter(c => c.contract_status === 'pending_renewal' || c.contract_status === 'expired').length > 0 && (
        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-yellow-600 flex-shrink-0 mt-0.5" size={20} />
            <div>
              <h3 className="text-sm font-semibold text-yellow-900 mb-1">Atenção: Contratos Pendentes</h3>
              <p className="text-sm text-yellow-800">
                Existem {companies.filter(c => c.contract_status === 'pending_renewal').length} contrato(s) próximo(s) do vencimento
                e {companies.filter(c => c.contract_status === 'expired').length} contrato(s) vencido(s).
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
