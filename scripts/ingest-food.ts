import dotenv from 'dotenv';
dotenv.config();

import { VectorStoreManager } from '../src/vectorStore';
import { getEmbeddings } from '../src/embeddings';
import { TextDocumentLoader } from '../src/loaders/textLoader';
import { config } from '../src/config';
import { Document } from '@langchain/core/documents';

async function main() {
  console.warn('============================================================');
  console.warn('📚 Food Delivery Documents Ingestion');
  console.warn('============================================================\n');

  const allDocuments: Document[] = [];

  // Load text/markdown documents
  console.warn('📝 Loading food menu documents...');
  try {
    const textLoader = new TextDocumentLoader();
    const textDocs = await textLoader.loadTextsFromDirectory(config.textsPath);

    if (textDocs.length > 0) {
      allDocuments.push(...textDocs);
      console.warn(`✓ Loaded ${textDocs.length} chunks from food documents`);
    }
  } catch (error) {
    console.warn('⚠ Error loading text files:', error);
  }
  console.warn();

  // Check if we have any documents
  if (allDocuments.length === 0) {
    console.error('❌ No documents found to ingest!');
    process.exit(1);
  }

  // Show summary
  console.warn('📊 Summary');
  console.warn('-----------------------------------------------------------');
  console.warn(`Total chunks: ${allDocuments.length}`);
  console.warn();

  // Create vector store
  console.warn('🔧 Creating vector store...');
  const embeddings = getEmbeddings();
  const vectorStore = new VectorStoreManager(embeddings);

  console.warn('💾 Saving to disk...');
  await vectorStore.createFromDocuments(allDocuments);
  console.warn(`✓ Vector store saved to: ${config.vectorStorePath}`);
  console.warn();

  console.warn('✅ Ingestion completed successfully!');
  console.warn('You can now use the chatbot to query these documents.');
}

main().catch((error) => {
  console.error('Error during ingestion:', error);
  process.exit(1);
});
