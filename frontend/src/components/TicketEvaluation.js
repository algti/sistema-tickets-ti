import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { evaluationsAPI } from '../services/api';

const TicketEvaluation = ({ ticket, onEvaluationSubmitted, onClose }) => {
  const [evaluation, setEvaluation] = useState(null);
  const [formData, setFormData] = useState({
    rating: 0,
    feedback: '',
    resolution_quality: 0,
    response_time_rating: 0,
    technician_rating: 0
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (ticket?.id) {
      loadExistingEvaluation();
    }
  }, [ticket?.id]);

  const loadExistingEvaluation = async () => {
    if (!ticket?.id) return;
    
    try {
      setLoading(true);
      const response = await evaluationsAPI.getEvaluation(ticket.id);
      setEvaluation(response.data);
      setFormData({
        rating: response.data.rating,
        feedback: response.data.feedback || '',
        resolution_quality: response.data.resolution_quality || 0,
        response_time_rating: response.data.response_time_rating || 0,
        technician_rating: response.data.technician_rating || 0
      });
    } catch (error) {
      if (error.response?.status !== 404) {
        console.error('Error loading evaluation:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleStarClick = (field, rating) => {
    setFormData(prev => ({
      ...prev,
      [field]: rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.rating === 0) {
      setError('Por favor, selecione uma avaliação geral');
      return;
    }

    if (!ticket?.id) {
      setError('Ticket não encontrado');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const evaluationData = {
        rating: formData.rating,
        feedback: formData.feedback.trim() || null,
        resolution_quality: formData.resolution_quality || null,
        response_time_rating: formData.response_time_rating || null,
        technician_rating: formData.technician_rating || null
      };

      if (evaluation) {
        await evaluationsAPI.updateEvaluation(ticket.id, evaluationData);
      } else {
        await evaluationsAPI.createEvaluation(ticket.id, evaluationData);
      }

      if (onEvaluationSubmitted) {
        onEvaluationSubmitted();
      }
      
      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting evaluation:', error);
      setError(error.response?.data?.detail || 'Erro ao enviar avaliação');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label, required = false }) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
          >
            {star <= value ? (
              <StarIcon className="h-8 w-8 text-yellow-400 hover:text-yellow-500" />
            ) : (
              <StarOutlineIcon className="h-8 w-8 text-gray-300 hover:text-yellow-400" />
            )}
          </button>
        ))}
        <span className="ml-2 text-sm text-gray-600">
          {value > 0 ? `${value}/5` : 'Não avaliado'}
        </span>
      </div>
    </div>
  );

  const getRatingText = (rating) => {
    const texts = {
      1: 'Muito insatisfeito',
      2: 'Insatisfeito', 
      3: 'Neutro',
      4: 'Satisfeito',
      5: 'Muito satisfeito'
    };
    return texts[rating] || '';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando avaliação...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {evaluation ? 'Editar Avaliação' : 'Avaliar Ticket'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Ticket Info */}
        {ticket && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Ticket #{ticket.id}</h3>
            <p className="text-sm text-gray-600 mb-2">{ticket.title}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>Status: {ticket.status}</span>
              {ticket.assigned_to && (
                <span>Técnico: {ticket.assigned_to.full_name || ticket.assigned_to.username}</span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Overall Rating */}
          <StarRating
            value={formData.rating}
            onChange={(rating) => handleStarClick('rating', rating)}
            label="Avaliação Geral"
            required
          />
          {formData.rating > 0 && (
            <p className="text-sm text-gray-600 -mt-2">
              {getRatingText(formData.rating)}
            </p>
          )}

          {/* Detailed Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StarRating
              value={formData.resolution_quality}
              onChange={(rating) => handleStarClick('resolution_quality', rating)}
              label="Qualidade da Resolução"
            />
            
            <StarRating
              value={formData.response_time_rating}
              onChange={(rating) => handleStarClick('response_time_rating', rating)}
              label="Tempo de Resposta"
            />
            
            {ticket.assigned_to && (
              <StarRating
                value={formData.technician_rating}
                onChange={(rating) => handleStarClick('technician_rating', rating)}
                label="Atendimento do Técnico"
              />
            )}
          </div>

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Comentários e Sugestões
            </label>
            <textarea
              value={formData.feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Compartilhe sua experiência, sugestões de melhoria ou comentários adicionais..."
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.feedback.length}/1000 caracteres
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || formData.rating === 0}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Enviando...' : (evaluation ? 'Atualizar Avaliação' : 'Enviar Avaliação')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketEvaluation;
