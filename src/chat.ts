import readline from 'readline';
import { VectorStoreManager } from './vectorStore';
import { RAGChain } from './chains/index';
import { getEmbeddings } from './embeddings';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  prompt: '\n🤔 You: ',
});

async function main() {
  console.warn('='.repeat(60));
  console.warn('🤖 RAG Chatbot powered by Claude AI');
  console.warn('='.repeat(60));
  console.warn();

  // Check if vector store exists
  const embeddings = getEmbeddings();
  const vectorStoreManager = new VectorStoreManager(embeddings);

  const exists = await vectorStoreManager.exists();
  if (!exists) {
    console.error('❌ Vector store not found!');
    console.warn('\nPlease run the ingestion process first:');
    console.warn('  npm run ingest');
    console.warn();
    process.exit(1);
  }

  // Load vector store
  console.warn('📂 Loading knowledge base...');
  try {
    await vectorStoreManager.load();
  } catch (error) {
    console.error('❌ Failed to load vector store:', error);
    process.exit(1);
  }

  // Initialize RAG chain
  const ragChain = new RAGChain(vectorStoreManager);

  console.warn('✅ Chatbot ready!');
  console.warn();
  console.warn('💡 Tips:');
  console.warn('  - Ask questions about your documents');
  console.warn('  - Type "exit", "quit", or "bye" to end the conversation');
  console.warn('  - Type "clear" to clear chat history');
  console.warn('='.repeat(60));

  const chatHistory: string[] = [];

  rl.prompt();

  rl.on('line', async (input: string) => {
    const question = input.trim();

    // Check for exit commands
    if (['exit', 'quit', 'bye', 'q'].includes(question.toLowerCase())) {
      console.warn('\n👋 Goodbye! Thanks for chatting!');
      rl.close();
      process.exit(0);
    }

    // Check for clear command
    if (question.toLowerCase() === 'clear') {
      chatHistory.length = 0;
      console.warn('\n🗑️  Chat history cleared!');
      rl.prompt();
      return;
    }

    // Skip empty questions
    if (!question) {
      rl.prompt();
      return;
    }

    try {
      // Add question to history
      chatHistory.push(question);

      // Show thinking indicator
      process.stdout.write('\n🤖 Claude: ');

      // Query the RAG chain with streaming
      let answer = '';
      for await (const chunk of ragChain.streamQuery(question, chatHistory)) {
        process.stdout.write(chunk);
        answer += chunk;
      }

      console.warn('\n');

      // Add answer to history
      chatHistory.push(answer);

      // Show sources
      const result = await ragChain.query(question, chatHistory.slice(0, -2));
      if (result.sourceDocuments.length > 0) {
        console.warn('📚 Sources:');
        result.sourceDocuments.forEach((doc, index) => {
          const source = doc.metadata.source || doc.metadata.fileName || 'Unknown';
          console.warn(`  ${index + 1}. ${source}`);
        });
      }
    } catch (error) {
      console.error('\n❌ Error:', error);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    console.warn('\n👋 Goodbye!');
    process.exit(0);
  });
}

main().catch(error => {
  console.error('Error starting chatbot:', error);
  process.exit(1);
});
