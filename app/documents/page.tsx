'use client';

import { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, RefreshCw, Loader2 } from 'lucide-react';
import { Navigation } from '@/components/navigation';
import { Footer } from '@/components/footer';

interface Document {
  name: string;
  type: string;
  size: number;
  path: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isIngesting, setIsIngesting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await fetch('/api/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    Array.from(files).forEach((file) => {
      formData.append('files', file);
    });

    try {
      setUploadProgress('Uploading files...');
      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setUploadProgress('Upload successful!');
        loadDocuments();
        setTimeout(() => setUploadProgress(''), 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress('Upload failed. Please try again.');
      setTimeout(() => setUploadProgress(''), 3000);
    }
  };

  const handleIngest = async () => {
    if (!confirm('This will reindex all documents. Continue?')) return;

    setIsIngesting(true);
    try {
      const response = await fetch('/api/ingest', {
        method: 'POST',
      });

      if (response.ok) {
        alert('Documents ingested successfully!');
      } else {
        throw new Error('Ingestion failed');
      }
    } catch (error) {
      console.error('Ingestion error:', error);
      alert('Failed to ingest documents. Check console for details.');
    } finally {
      setIsIngesting(false);
    }
  };

  const handleDelete = async (path: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch('/api/documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path }),
      });

      if (response.ok) {
        loadDocuments();
      } else {
        throw new Error('Delete failed');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete document.');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      {/* Navigation */}
      <Navigation />

      {/* Action Bar */}
      <div className="border-b bg-white/80 backdrop-blur-sm dark:bg-gray-900/80">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Document Management
          </h2>
          <button
            onClick={handleIngest}
            disabled={isIngesting || documents.length === 0}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {isIngesting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Ingesting...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4" />
                Ingest Documents
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-8">
          <p className="text-gray-600 dark:text-gray-400">
            Upload and manage your documents for the RAG chatbot
          </p>
        </div>

        {/* Upload Area */}
        <div className="mb-8 rounded-xl border-2 border-dashed border-gray-300 bg-white p-8 text-center dark:border-gray-700 dark:bg-gray-800">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
            Upload Documents
          </h3>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Supports PDF, DOCX, XLSX, PPTX, TXT, MD files
          </p>
          <label className="mt-4 inline-block">
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.md,.markdown,.docx,.xlsx,.xls,.pptx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <span className="cursor-pointer rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 transition inline-block">
              Choose Files
            </span>
          </label>
          {uploadProgress && (
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-400">
              {uploadProgress}
            </p>
          )}
        </div>

        {/* Documents List */}
        <div className="rounded-xl bg-white p-6 shadow-sm dark:bg-gray-800">
          <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
            Documents ({documents.length})
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : documents.length === 0 ? (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                No documents yet. Upload some to get started!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700/50 transition"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-8 w-8 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {doc.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {doc.type.toUpperCase()} • {formatFileSize(doc.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(doc.path)}
                    className="rounded-lg p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-8 rounded-xl bg-blue-50 p-6 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100">
            📖 Instructions
          </h3>
          <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-200">
            <li>1. Upload your PDF, TXT, or MD files using the upload button</li>
            <li>2. Click "Ingest Documents" to process and index them</li>
            <li>3. Return to chat and start asking questions about your documents</li>
            <li>4. You can delete documents and re-ingest anytime</li>
          </ul>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}
