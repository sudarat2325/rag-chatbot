import dotenv from 'dotenv';
dotenv.config();

import { VectorStoreManager } from '../src/vectorStore';
import { getEmbeddings } from '../src/embeddings';
import { TextDocumentLoader } from '../src/loaders/textLoader';
import { config } from '../src/config';

async function main() {
  console.log('============================================================');
  console.log('📚 Food Delivery Documents Ingestion');
  console.log('============================================================\n');

  const allDocuments: any[] = [];

  // Load text/markdown documents
  console.log('📝 Loading food menu documents...');
  try {
    const textLoader = new TextDocumentLoader();
    const textDocs = await textLoader.loadTextsFromDirectory(config.textsPath);

    if (textDocs.length > 0) {
      allDocuments.push(...textDocs);
      console.log(`✓ Loaded ${textDocs.length} chunks from food documents`);
    }
  } catch (error) {
    console.log('⚠ Error loading text files:', error);
  }
  console.log();

  // Check if we have any documents
  if (allDocuments.length === 0) {
    console.error('❌ No documents found to ingest!');
    process.exit(1);
  }

  // Show summary
  console.log('📊 Summary');
  console.log('-----------------------------------------------------------');
  console.log(`Total chunks: ${allDocuments.length}`);
  console.log();

  // Create vector store
  console.log('🔧 Creating vector store...');
  const embeddings = getEmbeddings();
  const vectorStore = new VectorStoreManager(embeddings);

  console.log('💾 Saving to disk...');
  await vectorStore.createFromDocuments(allDocuments);
  console.log(`✓ Vector store saved to: ${config.vectorStorePath}`);
  console.log();

  console.log('✅ Ingestion completed successfully!');
  console.log('You can now use the chatbot to query these documents.');
}

main().catch((error) => {
  console.error('Error during ingestion:', error);
  process.exit(1);
});
