import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence, RunnablePassthrough } from '@langchain/core/runnables';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { Document } from '@langchain/core/documents';
import { config } from '../config';
import { VectorStoreManager } from '../vectorStore';

export interface RAGChainInput {
  question: string;
  chatHistory?: string[];
}

export interface RAGChainOutput {
  answer: string;
  sourceDocuments: Document[];
}

export class RAGChain {
  private model: ChatAnthropic;
  private vectorStore: VectorStoreManager;
  private chain: RunnableSequence;

  constructor(vectorStore: VectorStoreManager) {
    this.vectorStore = vectorStore;

    // Initialize Claude model
    this.model = new ChatAnthropic({
      anthropicApiKey: config.anthropicApiKey,
      modelName: config.claudeModel,
      temperature: 0.7,
      maxTokens: 2048,
    });

    // Create the RAG chain
    this.chain = this.createChain();
  }

  /**
   * Create the RAG chain
   */
  private createChain(): RunnableSequence {
    // Define the prompt template
    const promptTemplate = PromptTemplate.fromTemplate(`
คุณเป็น AI Assistant ที่ชำนาญในการตอบคำถามจากเอกสารที่มีให้

ใช้บริบท (Context) ด้านล่างเพื่อตอบคำถามของผู้ใช้ หากคุณไม่พบคำตอบในบริบทที่มีให้ ให้บอกว่า "ฉันไม่พบข้อมูลนี้ในเอกสารที่มี"

บริบท (Context):
{context}

ประวัติการสนทนา (Chat History):
{chatHistory}

คำถาม: {question}

คำตอบ (ตอบเป็นภาษาไทยหรือภาษาอังกฤษตามภาษาของคำถาม):
`);

    // Create the chain
    const chain = RunnableSequence.from([
      {
        question: (input: RAGChainInput) => input.question,
        context: async (input: RAGChainInput) => {
          const docs = await this.vectorStore.similaritySearch(
            input.question,
            config.retrievalK
          );
          return this.formatDocuments(docs);
        },
        chatHistory: (input: RAGChainInput) =>
          input.chatHistory ? this.formatChatHistory(input.chatHistory) : 'ไม่มี',
      },
      promptTemplate,
      this.model,
      new StringOutputParser(),
    ]);

    return chain;
  }

  /**
   * Format documents into a readable string
   */
  private formatDocuments(docs: Document[]): string {
    if (docs.length === 0) {
      return 'ไม่พบเอกสารที่เกี่ยวข้อง';
    }

    return docs
      .map((doc, index) => {
        const source = doc.metadata.source || doc.metadata.fileName || 'Unknown';
        return `[เอกสาร ${index + 1}] (จาก: ${source})\n${doc.pageContent}\n`;
      })
      .join('\n---\n\n');
  }

  /**
   * Format chat history
   */
  private formatChatHistory(history: string[]): string {
    if (history.length === 0) return 'ไม่มี';

    return history
      .slice(-6) // Keep only last 6 messages
      .map((msg, i) => `${i % 2 === 0 ? 'User' : 'Assistant'}: ${msg}`)
      .join('\n');
  }

  /**
   * Ask a question and get an answer with sources
   */
  async query(question: string, chatHistory: string[] = []): Promise<RAGChainOutput> {
    try {
      // Get relevant documents
      const sourceDocuments = await this.vectorStore.similaritySearch(
        question,
        config.retrievalK
      );

      // Generate answer using the chain
      const answer = await this.chain.invoke({
        question,
        chatHistory,
      });

      return {
        answer: answer.trim(),
        sourceDocuments,
      };
    } catch (error) {
      console.error('Error in RAG query:', error);
      throw error;
    }
  }

  /**
   * Stream the answer (for real-time display)
   */
  async *streamQuery(
    question: string,
    chatHistory: string[] = []
  ): AsyncGenerator<string, void, unknown> {
    try {
      const stream = await this.chain.stream({
        question,
        chatHistory,
      });

      for await (const chunk of stream) {
        yield chunk;
      }
    } catch (error) {
      console.error('Error in RAG stream query:', error);
      throw error;
    }
  }
}
