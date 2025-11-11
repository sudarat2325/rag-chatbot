import { Embeddings } from '@langchain/core/embeddings';
import { OpenAIEmbeddings } from '@langchain/openai';
import { VoyageEmbeddings } from '@langchain/community/embeddings/voyage';
import { HuggingFaceTransformersEmbeddings } from '@langchain/community/embeddings/hf_transformers';
import { config } from './config';

/**
 * Embeddings Provider Types
 * Configure via EMBEDDINGS_PROVIDER environment variable
 */
export type EmbeddingsProvider = 'openai' | 'voyage' | 'huggingface';

/**
 * Get embeddings instance based on configuration
 * Supports multiple providers for flexibility and performance
 *
 * Priority order (if EMBEDDINGS_PROVIDER not set):
 * 1. OpenAI (if OPENAI_API_KEY exists)
 * 2. Voyage AI (if VOYAGE_API_KEY exists)
 * 3. HuggingFace (local, free, no API key needed)
 */
export function getEmbeddings(): Embeddings {
  const provider = (config.embeddingsProvider || '').toLowerCase() as EmbeddingsProvider;

  try {
    // Explicit provider selection
    if (provider === 'openai' && config.openaiApiKey) {
      return new OpenAIEmbeddings({
        openAIApiKey: config.openaiApiKey,
        modelName: config.openaiEmbeddingsModel,
        batchSize: 512, // Batch for better performance
        stripNewLines: true,
      });
    }

    if (provider === 'voyage' && config.voyageApiKey) {
      return new VoyageEmbeddings({
        apiKey: config.voyageApiKey,
        modelName: config.voyageEmbeddingsModel,
        batchSize: 128,
      });
    }

    if (provider === 'huggingface') {
      return new HuggingFaceTransformersEmbeddings({
        modelName: config.huggingfaceModel,
      });
    }

    // Auto-detect based on available API keys
    if (config.openaiApiKey) {
      console.warn('📊 Using OpenAI embeddings (text-embedding-3-small)');
      return new OpenAIEmbeddings({
        openAIApiKey: config.openaiApiKey,
        modelName: config.openaiEmbeddingsModel,
        batchSize: 512,
        stripNewLines: true,
      });
    }

    if (config.voyageApiKey) {
      console.warn('📊 Using Voyage AI embeddings (voyage-2)');
      return new VoyageEmbeddings({
        apiKey: config.voyageApiKey,
        modelName: config.voyageEmbeddingsModel,
        batchSize: 128,
      });
    }

    // Fallback to local HuggingFace (free, no API key needed)
    console.warn('📊 Using HuggingFace embeddings (local, free)');
    console.warn('💡 For better performance, set OPENAI_API_KEY or VOYAGE_API_KEY in .env');
    return new HuggingFaceTransformersEmbeddings({
      modelName: config.huggingfaceModel,
    });

  } catch (error) {
    console.error('❌ Error initializing embeddings:', error);
    console.warn('⚠️  Falling back to HuggingFace embeddings...');
    return new HuggingFaceTransformersEmbeddings({
      modelName: 'Xenova/all-MiniLM-L6-v2',
    });
  }
}

/**
 * Get embeddings dimensions based on provider
 */
export function getEmbeddingsDimensions(): number {
  const provider = (config.embeddingsProvider || '').toLowerCase();

  if (provider === 'openai' || config.openaiApiKey) {
    return 1536; // text-embedding-3-small
  }

  if (provider === 'voyage' || config.voyageApiKey) {
    return 1024; // voyage-2
  }

  return 384; // HuggingFace all-MiniLM-L6-v2
}
