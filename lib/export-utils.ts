import jsPDF from 'jspdf';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

export const exportToJSON = (messages: Message[]) => {
  const dataStr = JSON.stringify(messages, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-history-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToMarkdown = (messages: Message[]) => {
  let markdown = `# RAG Chatbot Conversation\n\n`;
  markdown += `**Date:** ${new Date().toLocaleString()}\n\n---\n\n`;

  messages.forEach((message, index) => {
    const role = message.role === 'user' ? '👤 User' : '🤖 Assistant';
    markdown += `## ${role}\n\n`;
    markdown += `${message.content}\n\n`;

    if (message.sources && message.sources.length > 0) {
      markdown += `**Sources:**\n`;
      message.sources.forEach((source) => {
        markdown += `- ${source}\n`;
      });
      markdown += '\n';
    }

    markdown += '---\n\n';
  });

  const dataBlob = new Blob([markdown], { type: 'text/markdown' });
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `chat-history-${new Date().toISOString().split('T')[0]}.md`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToPDF = (messages: Message[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RAG Chatbot Conversation', margin, yPosition);
  yPosition += 10;

  // Date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Date: ${new Date().toLocaleString()}`, margin, yPosition);
  yPosition += 15;

  // Messages
  messages.forEach((message, index) => {
    // Check if we need a new page
    if (yPosition > pageHeight - 40) {
      doc.addPage();
      yPosition = margin;
    }

    // Role header
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const roleText = message.role === 'user' ? 'User' : 'Assistant';
    doc.text(roleText, margin, yPosition);
    yPosition += 7;

    // Message content
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(message.content, maxWidth);

    lines.forEach((line: string) => {
      if (yPosition > pageHeight - 20) {
        doc.addPage();
        yPosition = margin;
      }
      doc.text(line, margin, yPosition);
      yPosition += 5;
    });

    // Sources
    if (message.sources && message.sources.length > 0) {
      yPosition += 5;
      doc.setFont('helvetica', 'italic');
      doc.text('Sources:', margin, yPosition);
      yPosition += 5;

      message.sources.forEach((source) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = margin;
        }
        const sourceLines = doc.splitTextToSize(`- ${source}`, maxWidth - 5);
        sourceLines.forEach((line: string) => {
          doc.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
      });
    }

    // Separator
    yPosition += 5;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPosition, pageWidth - margin, yPosition);
    yPosition += 10;
  });

  doc.save(`chat-history-${new Date().toISOString().split('T')[0]}.pdf`);
};
