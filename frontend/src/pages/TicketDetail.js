  const downloadAttachment = async (attachmentId, filename) => {
    try {
      const token = localStorage.getItem('token');
      const url = `http://127.0.0.1:8000/api/v1/tickets/${id}/attachments/${attachmentId}/download?token=${token}`;
      
      // Use window.open for more reliable download
      const newWindow = window.open(url, '_blank');
      
      // If popup blocked, fallback to direct navigation
      if (!newWindow) {
        window.location.href = url;
      }
      
    } catch (error) {
      console.error('Erro ao baixar anexo:', error);
      alert('Erro ao baixar arquivo. Tente novamente.');
    }
  };
