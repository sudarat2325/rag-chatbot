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
  chunkSize: 1000,
  chunkOverlap: 200,
  retrievalK: 4, // Number of relevant documents to retrieve
};

// Validate required configuration
if (!config.anthropicApiKey) {
  console.error('Error: ANTHROPIC_API_KEY is not set in .env file');
  console.error('Please copy .env.example to .env and add your API key');
  process.exit(1);
}
