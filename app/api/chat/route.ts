import { NextRequest, NextResponse } from 'next/server';
import { VectorStoreManager } from '@/src/vectorStore';
import { RAGChain } from '@/src/chains';
import { getEmbeddings } from '@/src/embeddings';
import { config } from '@/src/config';

// Initialize services (reuse across requests)
let vectorStoreManager: VectorStoreManager | null = null;
let ragChain: RAGChain | null = null;

async function initializeServices() {
  if (!vectorStoreManager || !ragChain) {
    const embeddings = getEmbeddings();
    vectorStoreManager = new VectorStoreManager(embeddings);

    // Load vector store
    const exists = await vectorStoreManager.exists();
    if (!exists) {
      throw new Error('Vector store not found. Please run ingestion first.');
    }

    await vectorStoreManager.load();
    ragChain = new RAGChain(vectorStoreManager);
  }

  return { vectorStoreManager, ragChain };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question, chatHistory = [] } = body;

    if (!question || typeof question !== 'string') {
      return NextResponse.json(
        { error: 'Question is required and must be a string' },
        { status: 400 }
      );
    }

    // Initialize services
    const { ragChain } = await initializeServices();

    // Query the RAG chain
    const result = await ragChain.query(question, chatHistory);

    // Extract source file names
    const sources = result.sourceDocuments.map((doc) => {
      return doc.metadata.fileName || doc.metadata.source || 'Unknown';
    });

    // Remove duplicates
    const uniqueSources = [...new Set(sources)];

    return NextResponse.json({
      answer: result.answer,
      sources: uniqueSources,
    });
  } catch (error: any) {
    console.error('Chat API error:', error);

    if (error.message?.includes('Vector store not found')) {
      return NextResponse.json(
        {
          error: 'Knowledge base not initialized. Please upload documents first.',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process question. Please try again.' },
      { status: 500 }
    );
  }
}

// Health check
export async function GET() {
  try {
    const embeddings = getEmbeddings();
    const vectorStoreManager = new VectorStoreManager(embeddings);
    const exists = await vectorStoreManager.exists();

    return NextResponse.json({
      status: exists ? 'ready' : 'not_initialized',
      message: exists
        ? 'Chat service is ready'
        : 'Please run document ingestion first',
    });
  } catch (error) {
    return NextResponse.json(
      { status: 'error', message: 'Failed to check status' },
      { status: 500 }
    );
  }
}
