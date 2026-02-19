import React from 'react';
import { XMarkIcon, PlayCircleIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

const TutorialModal = ({ isOpen, onClose, showVideo = true, onVideoEnd }) => {
  if (!isOpen) return null;

  const videoId = 'OBmu0RXk61Y';
  const pdfUrl = '/tutorial-sistema.pdf';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div 
          className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
          onClick={onClose}
        ></div>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-white flex items-center">
                {showVideo ? (
                  <>
                    <PlayCircleIcon className="h-6 w-6 mr-2" />
                    Tutorial do Sistema
                  </>
                ) : (
                  <>
                    <DocumentArrowDownIcon className="h-6 w-6 mr-2" />
                    Tutorial do Sistema
                  </>
                )}
              </h3>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-6">
            {showVideo ? (
              <>
                <p className="text-gray-600 mb-4">
                  Assista ao vídeo tutorial para conhecer as principais funcionalidades do sistema.
                </p>
                
                {/* YouTube Player */}
                <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
                  <iframe
                    className="absolute top-0 left-0 w-full h-full rounded-lg"
                    src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
                    title="Tutorial do Sistema"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onEnded={onVideoEnd}
                  ></iframe>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <a
                    href={pdfUrl}
                    download="Tutorial-Sistema-Tickets.pdf"
                    className="text-cyan-600 hover:text-cyan-700 flex items-center text-sm font-medium"
                  >
                    <DocumentArrowDownIcon className="h-5 w-5 mr-1" />
                    Baixar manual em PDF
                  </a>
                  <button
                    onClick={onClose}
                    className="btn-primary"
                  >
                    Entendi
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-gray-600 mb-6">
                  Escolha como deseja acessar o tutorial do sistema:
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Vídeo Tutorial */}
                  <button
                    onClick={() => window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank')}
                    className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-cyan-500 hover:bg-cyan-50 transition-all group"
                  >
                    <PlayCircleIcon className="h-16 w-16 text-cyan-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Assistir Vídeo</h4>
                    <p className="text-sm text-gray-600 text-center">
                      Tutorial em vídeo com demonstração prática
                    </p>
                  </button>

                  {/* PDF Manual */}
                  <a
                    href={pdfUrl}
                    download="Tutorial-Sistema-Tickets.pdf"
                    className="flex flex-col items-center p-6 border-2 border-gray-200 rounded-lg hover:border-teal-500 hover:bg-teal-50 transition-all group"
                  >
                    <DocumentArrowDownIcon className="h-16 w-16 text-teal-600 mb-3 group-hover:scale-110 transition-transform" />
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">Baixar Manual PDF</h4>
                    <p className="text-sm text-gray-600 text-center">
                      Manual completo para consulta offline
                    </p>
                  </a>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={onClose}
                    className="btn-secondary"
                  >
                    Fechar
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialModal;
