import { Embeddings } from '@langchain/core/embeddings';
import { ChatAnthropic } from '@langchain/anthropic';
import { config } from './config';

/**
 * Simple embeddings implementation using Claude's API
 * This creates embeddings by using Claude to generate semantic representations
 */
export class SimpleEmbeddings extends Embeddings {
  private model: ChatAnthropic;

  constructor() {
    super({});
    this.model = new ChatAnthropic({
      anthropicApiKey: config.anthropicApiKey,
      modelName: 'claude-3-haiku-20240307', // Using Haiku for faster/cheaper embeddings
      temperature: 0,
    });
  }

  /**
   * Generate embeddings for a list of documents
   */
  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];

    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      embeddings.push(embedding);
    }

    return embeddings;
  }

  /**
   * Generate embedding for a single query
   */
  async embedQuery(text: string): Promise<number[]> {
    // Create a simple hash-based embedding for demo purposes
    // In production, you should use proper embeddings like:
    // - Voyage AI (Anthropic's recommended embeddings)
    // - OpenAI embeddings
    // - HuggingFace transformers

    // For now, we'll create a simple fixed-size vector based on text characteristics
    const embedding = new Array(384).fill(0);

    // Simple feature extraction
    const words = text.toLowerCase().split(/\s+/);
    const chars = text.split('');

    // Distribute values across the embedding space based on text features
    for (let i = 0; i < words.length && i < 100; i++) {
      const word = words[i];
      const hash = this.simpleHash(word);
      embedding[hash % 384] += 1 / Math.sqrt(words.length);
    }

    // Character-level features
    for (let i = 0; i < chars.length && i < 200; i++) {
      const charCode = chars[i].charCodeAt(0);
      embedding[(charCode + i * 7) % 384] += 0.1 / Math.sqrt(chars.length);
    }

    // Normalize the embedding
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
    return embedding.map(val => magnitude > 0 ? val / magnitude : 0);
  }

  /**
   * Simple hash function for strings
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
}

/**
 * Get embeddings instance
 * You can replace this with better embeddings like:
 * - VoyageEmbeddings (requires Voyage API key)
 * - OpenAIEmbeddings (requires OpenAI API key)
 * - HuggingFaceTransformersEmbeddings (local, free)
 */
export function getEmbeddings(): Embeddings {
  // Using simple embeddings for demo
  // For production, consider using:
  // return new VoyageEmbeddings({ apiKey: process.env.VOYAGE_API_KEY });
  // or
  // return new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });

  return new SimpleEmbeddings();
}

/**
 * Instructions for better embeddings:
 *
 * 1. Voyage AI (Recommended for Claude):
 *    npm install @langchain/community
 *    import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
 *    return new VoyageEmbeddings({ apiKey: process.env.VOYAGE_API_KEY });
 *
 * 2. OpenAI Embeddings:
 *    npm install @langchain/openai
 *    import { OpenAIEmbeddings } from '@langchain/openai';
 *    return new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY });
 *
 * 3. HuggingFace (Local, Free):
 *    npm install @xenova/transformers
 *    Use HuggingFaceTransformersEmbeddings from @langchain/community
 */
