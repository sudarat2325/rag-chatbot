import { NextResponse } from 'next/server';
import { PDFDocumentLoader, TextDocumentLoader, DocxLoader, XlsxLoader, PptxLoader } from '@/src/loaders';
import { VectorStoreManager } from '@/src/vectorStore';
import { getEmbeddings } from '@/src/embeddings';
import { config } from '@/src/config';
import { Document } from '@langchain/core/documents';

export async function POST() {
  try {
    console.log('Starting document ingestion...');

    const allDocuments: Document[] = [];

    // Load PDF documents
    console.log('Loading PDFs...');
    try {
      const pdfLoader = new PDFDocumentLoader();
      const pdfDocs = await pdfLoader.loadPDFsFromDirectory(config.pdfsPath);
      allDocuments.push(...pdfDocs);
      console.log(`Loaded ${pdfDocs.length} chunks from PDFs`);
    } catch (error) {
      console.warn('No PDFs found or error loading PDFs:', error);
    }

    // Load text/markdown documents
    console.log('Loading text files...');
    try {
      const textLoader = new TextDocumentLoader();
      const textDocs = await textLoader.loadTextsFromDirectory(config.textsPath);
      allDocuments.push(...textDocs);
      console.log(`Loaded ${textDocs.length} chunks from text files`);
    } catch (error) {
      console.warn('No text files found or error loading text files:', error);
    }

    // Load DOCX documents
    console.log('Loading DOCX files...');
    try {
      const docxLoader = new DocxLoader(config.docxPath);
      const docxDocs = await docxLoader.load();
      allDocuments.push(...docxDocs);
      console.log(`Loaded ${docxDocs.length} chunks from DOCX files`);
    } catch (error) {
      console.warn('No DOCX files found or error loading DOCX files:', error);
    }

    // Load Excel documents
    console.log('Loading Excel files...');
    try {
      const xlsxLoader = new XlsxLoader(config.xlsxPath);
      const xlsxDocs = await xlsxLoader.load();
      allDocuments.push(...xlsxDocs);
      console.log(`Loaded ${xlsxDocs.length} chunks from Excel files`);
    } catch (error) {
      console.warn('No Excel files found or error loading Excel files:', error);
    }

    // Load PowerPoint documents
    console.log('Loading PowerPoint files...');
    try {
      const pptxLoader = new PptxLoader(config.pptxPath);
      const pptxDocs = await pptxLoader.load();
      allDocuments.push(...pptxDocs);
      console.log(`Loaded ${pptxDocs.length} chunks from PowerPoint files`);
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

    console.log(`Total documents: ${allDocuments.length} chunks`);

    // Create embeddings and vector store
    console.log('Creating vector store...');
    const embeddings = getEmbeddings();
    const vectorStoreManager = new VectorStoreManager(embeddings);

    // Check if vector store already exists
    const vectorStoreExists = await vectorStoreManager.exists();

    if (vectorStoreExists) {
      // Append to existing vector store
      console.log('Loading existing vector store...');
      await vectorStoreManager.load();
      console.log('Adding new documents to existing vector store...');
      await vectorStoreManager.addDocuments(allDocuments);
      await vectorStoreManager.save();
      console.log('✓ Documents added to existing vector store!');
    } else {
      // Create new vector store
      console.log('Creating new vector store...');
      await vectorStoreManager.createFromDocuments(allDocuments);
      await vectorStoreManager.save();
      console.log('✓ New vector store created!');
    }

    console.log('Ingestion complete!');

    return NextResponse.json({
      message: 'Documents ingested successfully',
      documentsProcessed: allDocuments.length,
    });
  } catch (error: any) {
    console.error('Ingestion error:', error);
    return NextResponse.json(
      {
        error: 'Failed to ingest documents',
        details: error.message,
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
    return NextResponse.json(
      { status: 'error', message: 'Failed to check status' },
      { status: 500 }
    );
  }
}
