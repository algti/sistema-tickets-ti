import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  BookOpenIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  EyeIcon,
  TagIcon,
  QuestionMarkCircleIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

function KnowledgeBase() {
  const { user, isAdmin, isTechnician } = useAuth();
  const { classes } = useTheme();
  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFAQOnly, setShowFAQOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [viewingArticle, setViewingArticle] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    summary: '',
    tags: '',
    category_id: '',
    is_faq: false
  });

  // Mock data for demonstration
  const mockArticles = [
    {
      id: 1,
      title: 'Como resetar senha do Windows',
      content: `# Como resetar senha do Windows

## Método 1: Usando conta Microsoft
1. Acesse account.microsoft.com
2. Clique em "Entrar" e depois "Esqueci minha senha"
3. Digite seu email e siga as instruções

## Método 2: Usando disco de reset
1. Insira o disco de reset de senha
2. Na tela de login, clique em "Resetar senha"
3. Siga o assistente

## Método 3: Modo seguro (Admin)
1. Reinicie o computador
2. Pressione F8 durante a inicialização
3. Selecione "Modo Seguro"
4. Faça login como Administrador
5. Vá em Painel de Controle > Contas de Usuário`,
      summary: 'Guia completo para resetar senhas do Windows usando diferentes métodos',
      tags: 'windows, senha, reset, login',
      category_id: 1,
      author_id: 2,
      status: 'published',
      views_count: 245,
      helpful_count: 18,
      not_helpful_count: 2,
      is_faq: true,
      created_at: new Date().toISOString(),
      author: { full_name: 'João Silva' },
      category: { name: 'Windows' }
    },
    {
      id: 2,
      title: 'Configurar impressora de rede',
      content: `# Como configurar impressora de rede

## Pré-requisitos
- Impressora conectada à rede
- IP da impressora
- Drivers instalados

## Passo a passo
1. Vá em Configurações > Impressoras e scanners
2. Clique em "Adicionar impressora ou scanner"
3. Selecione "A impressora que eu quero não está na lista"
4. Escolha "Adicionar uma impressora usando endereço TCP/IP"
5. Digite o IP da impressora
6. Instale os drivers se necessário
7. Teste a impressão`,
      summary: 'Tutorial para adicionar impressoras de rede no Windows',
      tags: 'impressora, rede, configuração, ip',
      category_id: 2,
      author_id: 2,
      status: 'published',
      views_count: 156,
      helpful_count: 12,
      not_helpful_count: 1,
      is_faq: false,
      created_at: new Date().toISOString(),
      author: { full_name: 'João Silva' },
      category: { name: 'Hardware' }
    },
    {
      id: 3,
      title: 'Problemas comuns de conectividade',
      content: `# Solucionando problemas de rede

## Diagnóstico básico
1. Verifique os cabos de rede
2. Teste com outro dispositivo
3. Reinicie o roteador
4. Execute ipconfig /release e ipconfig /renew

## Comandos úteis
- ping google.com
- ipconfig /all
- nslookup
- tracert

## Problemas comuns
- IP duplicado
- DNS incorreto
- Firewall bloqueando
- Cabo defeituoso`,
      summary: 'Guia para diagnosticar e resolver problemas de conectividade de rede',
      tags: 'rede, conectividade, diagnóstico, ping',
      category_id: 3,
      author_id: 1,
      status: 'published',
      views_count: 89,
      helpful_count: 8,
      not_helpful_count: 0,
      is_faq: true,
      created_at: new Date().toISOString(),
      author: { full_name: 'Admin Sistema' },
      category: { name: 'Rede' }
    }
  ];

  const mockCategories = [
    { id: 1, name: 'Windows' },
    { id: 2, name: 'Hardware' },
    { id: 3, name: 'Rede' },
    { id: 4, name: 'Software' }
  ];

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, []);

  const loadArticles = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      setTimeout(() => {
        setArticles(mockArticles);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Erro ao carregar artigos:', error);
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      setCategories(mockCategories);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    // TODO: Implement search API call
  };

  const handleRateArticle = async (articleId, isHelpful) => {
    try {
      // TODO: Rate article API call
      console.log('Rating article:', articleId, isHelpful);
      // Update local state
      setArticles(articles.map(article => {
        if (article.id === articleId) {
          return {
            ...article,
            helpful_count: isHelpful ? article.helpful_count + 1 : article.helpful_count,
            not_helpful_count: !isHelpful ? article.not_helpful_count + 1 : article.not_helpful_count
          };
        }
        return article;
      }));
    } catch (error) {
      console.error('Erro ao avaliar artigo:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingArticle) {
        console.log('Updating article:', formData);
      } else {
        console.log('Creating article:', formData);
      }
      
      setShowModal(false);
      setEditingArticle(null);
      resetForm();
      loadArticles();
    } catch (error) {
      console.error('Erro ao salvar artigo:', error);
    }
  };

  const handleEdit = (article) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      summary: article.summary,
      tags: article.tags,
      category_id: article.category_id?.toString() || '',
      is_faq: article.is_faq
    });
    setShowModal(true);
  };

  const handleDelete = async (articleId) => {
    if (window.confirm('Tem certeza que deseja excluir este artigo?')) {
      try {
        console.log('Deleting article:', articleId);
        loadArticles();
      } catch (error) {
        console.error('Erro ao excluir artigo:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      summary: '',
      tags: '',
      category_id: '',
      is_faq: false
    });
  };

  const filteredArticles = articles.filter(article => {
    const matchesSearch = !searchTerm || 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.tags.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || article.category_id.toString() === selectedCategory;
    const matchesFAQ = !showFAQOnly || article.is_faq;
    
    return matchesSearch && matchesCategory && matchesFAQ;
  });

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${classes.text.primary}`}>
            Base de Conhecimento
          </h1>
          <p className={classes.text.secondary}>
            Artigos, tutoriais e soluções para problemas comuns
          </p>
        </div>
        {(isAdmin || isTechnician) && (
          <button
            onClick={() => setShowModal(true)}
            className={`inline-flex items-center px-4 py-2 ${classes.button.primary} border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Novo Artigo
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className={`${classes.bg.card} p-6 rounded-lg shadow-sm`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className={`absolute left-3 top-3 h-4 w-4 ${classes.text.tertiary}`} />
              <input
                type="text"
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className={`pl-10 w-full px-3 py-2 ${classes.input.base} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={`w-full px-3 py-2 ${classes.input.base} border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center">
            <input
              type="checkbox"
              id="faq-only"
              checked={showFAQOnly}
              onChange={(e) => setShowFAQOnly(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="faq-only" className={`ml-2 text-sm ${classes.text.primary}`}>
              Apenas FAQ
            </label>
          </div>
        </div>
      </div>

      {/* Articles List */}
      <div className="space-y-4">
        {filteredArticles.map((article) => (
          <div
            key={article.id}
            className={`${classes.bg.card} ${classes.border.primary} border rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  {article.is_faq && (
                    <QuestionMarkCircleIcon className="h-5 w-5 text-blue-500" />
                  )}
                  <h3 
                    className={`text-lg font-medium ${classes.text.primary} cursor-pointer hover:text-blue-600`}
                    onClick={() => setViewingArticle(article)}
                  >
                    {article.title}
                  </h3>
                </div>
                
                <p className={`text-sm ${classes.text.secondary} mb-3`}>
                  {article.summary}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center">
                    <EyeIcon className="h-4 w-4 mr-1" />
                    {article.views_count} visualizações
                  </div>
                  <div className="flex items-center">
                    <TagIcon className="h-4 w-4 mr-1" />
                    {article.category?.name}
                  </div>
                  <span>Por {article.author?.full_name}</span>
                </div>
                
                <div className="flex items-center space-x-2 mt-3">
                  <span className={`text-xs ${classes.text.tertiary}`}>
                    Este artigo foi útil?
                  </span>
                  <button
                    onClick={() => handleRateArticle(article.id, true)}
                    className="flex items-center text-green-600 hover:text-green-700 text-xs"
                  >
                    <HandThumbUpIcon className="h-4 w-4 mr-1" />
                    {article.helpful_count}
                  </button>
                  <button
                    onClick={() => handleRateArticle(article.id, false)}
                    className="flex items-center text-red-600 hover:text-red-700 text-xs"
                  >
                    <HandThumbDownIcon className="h-4 w-4 mr-1" />
                    {article.not_helpful_count}
                  </button>
                </div>
              </div>
              
              {(isAdmin || (isTechnician && article.author_id === user.id)) && (
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(article)}
                    className={`p-1 ${classes.text.secondary} hover:${classes.text.primary}`}
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(article.id)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredArticles.length === 0 && (
        <div className={`text-center py-12 ${classes.bg.card} rounded-lg`}>
          <BookOpenIcon className={`mx-auto h-12 w-12 ${classes.text.tertiary}`} />
          <h3 className={`mt-2 text-sm font-medium ${classes.text.primary}`}>
            Nenhum artigo encontrado
          </h3>
          <p className={`mt-1 text-sm ${classes.text.secondary}`}>
            {searchTerm ? 'Tente buscar com outros termos.' : 'Comece criando um novo artigo.'}
          </p>
        </div>
      )}

      {/* Article Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingArticle ? 'Editar Artigo' : 'Novo Artigo'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Título
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Categoria
                    </label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({...formData, category_id: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Resumo
                  </label>
                  <textarea
                    value={formData.summary}
                    onChange={(e) => setFormData({...formData, summary: e.target.value})}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Breve descrição do artigo"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Conteúdo (Markdown suportado)
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) => setFormData({...formData, content: e.target.value})}
                    rows={15}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="# Título do Artigo&#10;&#10;Conteúdo do artigo em Markdown..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) => setFormData({...formData, tags: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="windows, senha, reset, tutorial"
                  />
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_faq"
                    checked={formData.is_faq}
                    onChange={(e) => setFormData({...formData, is_faq: e.target.checked})}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_faq" className="ml-2 text-sm text-gray-700">
                    Marcar como FAQ
                  </label>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingArticle(null);
                      resetForm();
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {editingArticle ? 'Atualizar' : 'Publicar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Article View Modal */}
      {viewingArticle && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-11/12 md:w-4/5 lg:w-3/4 shadow-lg rounded-md bg-white max-h-screen overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {viewingArticle.title}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Por {viewingArticle.author?.full_name} • {viewingArticle.views_count} visualizações
                </p>
              </div>
              <button
                onClick={() => setViewingArticle(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="prose max-w-none">
              <pre className="whitespace-pre-wrap font-sans text-gray-800">
                {viewingArticle.content}
              </pre>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">Este artigo foi útil?</span>
                  <button
                    onClick={() => handleRateArticle(viewingArticle.id, true)}
                    className="flex items-center text-green-600 hover:text-green-700"
                  >
                    <HandThumbUpIcon className="h-5 w-5 mr-1" />
                    {viewingArticle.helpful_count}
                  </button>
                  <button
                    onClick={() => handleRateArticle(viewingArticle.id, false)}
                    className="flex items-center text-red-600 hover:text-red-700"
                  >
                    <HandThumbDownIcon className="h-5 w-5 mr-1" />
                    {viewingArticle.not_helpful_count}
                  </button>
                </div>
                
                <div className="text-sm text-gray-500">
                  Tags: {viewingArticle.tags}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default KnowledgeBase;
