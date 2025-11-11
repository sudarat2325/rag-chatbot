import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

export const config = {
  // Anthropic API configuration
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  claudeModel: process.env.CLAUDE_MODEL || 'claude-3-haiku-20240307',

  // Embeddings configuration
  embeddingsProvider: process.env.EMBEDDINGS_PROVIDER || '', // 'openai', 'voyage', or 'huggingface'
  openaiApiKey: process.env.OPENAI_API_KEY || '',
  openaiEmbeddingsModel: process.env.OPENAI_EMBEDDINGS_MODEL || 'text-embedding-3-small',
  voyageApiKey: process.env.VOYAGE_API_KEY || '',
  voyageEmbeddingsModel: process.env.VOYAGE_EMBEDDINGS_MODEL || 'voyage-2',
  huggingfaceModel: process.env.HUGGINGFACE_MODEL || 'Xenova/all-MiniLM-L6-v2',

  // Paths
  projectRoot: path.resolve(__dirname, '..'),
  docsPath: path.resolve(__dirname, '../docs'),
  pdfsPath: path.resolve(__dirname, '../docs/pdfs'),
  textsPath: path.resolve(__dirname, '../docs/texts'),
  docxPath: path.resolve(__dirname, '../docs/docx'),
  xlsxPath: path.resolve(__dirname, '../docs/xlsx'),
  pptxPath: path.resolve(__dirname, '../docs/pptx'),
  webCachePath: path.resolve(__dirname, '../docs/web-cache'),
  vectorStorePath: process.env.VECTOR_STORE_PATH || path.resolve(__dirname, '../data/vectorstore'),

  // RAG configuration
  chunkSize: parseInt(process.env.CHUNK_SIZE || '1000'),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '200'),
  retrievalK: parseInt(process.env.RETRIEVAL_K || '4'), // Number of relevant documents to retrieve
};

// Validate required configuration
if (!config.anthropicApiKey) {
  console.error('Error: ANTHROPIC_API_KEY is not set in .env file');
  console.error('Please copy .env.example to .env and add your API key');
  process.exit(1);
}
