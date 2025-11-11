import { NextResponse } from 'next/server';
import { PDFDocumentLoader, TextDocumentLoader, DocxLoader, XlsxLoader, PptxLoader } from '@/src/loaders';
import { VectorStoreManager } from '@/src/vectorStore';
import { getEmbeddings } from '@/src/embeddings';
import { config } from '@/src/config';
import { Document } from '@langchain/core/documents';

export async function POST() {
  try {
    console.warn('Starting document ingestion...');

    const allDocuments: Document[] = [];

    // Load PDF documents
    console.warn('Loading PDFs...');
    try {
      const pdfLoader = new PDFDocumentLoader();
      const pdfDocs = await pdfLoader.loadPDFsFromDirectory(config.pdfsPath);
      allDocuments.push(...pdfDocs);
      console.warn(`Loaded ${pdfDocs.length} chunks from PDFs`);
    } catch (error) {
      console.warn('No PDFs found or error loading PDFs:', error);
    }

    // Load text/markdown documents
    console.warn('Loading text files...');
    try {
      const textLoader = new TextDocumentLoader();
      const textDocs = await textLoader.loadTextsFromDirectory(config.textsPath);
      allDocuments.push(...textDocs);
      console.warn(`Loaded ${textDocs.length} chunks from text files`);
    } catch (error) {
      console.warn('No text files found or error loading text files:', error);
    }

    // Load DOCX documents
    console.warn('Loading DOCX files...');
    try {
      const docxLoader = new DocxLoader(config.docxPath);
      const docxDocs = await docxLoader.load();
      allDocuments.push(...docxDocs);
      console.warn(`Loaded ${docxDocs.length} chunks from DOCX files`);
    } catch (error) {
      console.warn('No DOCX files found or error loading DOCX files:', error);
    }

    // Load Excel documents
    console.warn('Loading Excel files...');
    try {
      const xlsxLoader = new XlsxLoader(config.xlsxPath);
      const xlsxDocs = await xlsxLoader.load();
      allDocuments.push(...xlsxDocs);
      console.warn(`Loaded ${xlsxDocs.length} chunks from Excel files`);
    } catch (error) {
      console.warn('No Excel files found or error loading Excel files:', error);
    }

    // Load PowerPoint documents
    console.warn('Loading PowerPoint files...');
    try {
      const pptxLoader = new PptxLoader(config.pptxPath);
      const pptxDocs = await pptxLoader.load();
      allDocuments.push(...pptxDocs);
      console.warn(`Loaded ${pptxDocs.length} chunks from PowerPoint files`);
    } catch (error) {
      console.warn('No PowerPoint files found or error loading PowerPoint files:', error);
    }

    // Check if we have any documents
    if (allDocuments.length === 0) {
      return NextResponse.json(
        {
          error: 'No documents found to ingest',
          message: 'Please upload documents first',
        },
        { status: 400 }
      );
    }

    console.warn(`Total documents: ${allDocuments.length} chunks`);

    // Create embeddings and vector store
    console.warn('Creating vector store...');
    const embeddings = getEmbeddings();
    const vectorStoreManager = new VectorStoreManager(embeddings);

    // Check if vector store already exists
    const vectorStoreExists = await vectorStoreManager.exists();

    if (vectorStoreExists) {
      // Append to existing vector store
      console.warn('Loading existing vector store...');
      await vectorStoreManager.load();
      console.warn('Adding new documents to existing vector store...');
      await vectorStoreManager.addDocuments(allDocuments);
      await vectorStoreManager.save();
      console.warn('✓ Documents added to existing vector store!');
    } else {
      // Create new vector store
      console.warn('Creating new vector store...');
      await vectorStoreManager.createFromDocuments(allDocuments);
      await vectorStoreManager.save();
      console.warn('✓ New vector store created!');
    }

    console.warn('Ingestion complete!');

    return NextResponse.json({
      message: 'Documents ingested successfully',
      documentsProcessed: allDocuments.length,
    });
  } catch (error) {
    console.error('Ingestion error:', error);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Failed to ingest documents',
        details,
      },
      { status: 500 }
    );
  }
}

// Get ingestion status
export async function GET() {
  try {
    const embeddings = getEmbeddings();
    const vectorStoreManager = new VectorStoreManager(embeddings);
    const exists = await vectorStoreManager.exists();

    return NextResponse.json({
      status: exists ? 'ready' : 'not_initialized',
      message: exists
        ? 'Vector store is ready'
        : 'No documents ingested yet',
    });
  } catch (error) {
    console.error('Failed to fetch ingestion status:', error);
    return NextResponse.json(
      { status: 'error', message: 'Failed to check status' },
      { status: 500 }
    );
  }
}
