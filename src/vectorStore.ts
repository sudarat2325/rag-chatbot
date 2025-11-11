import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { Document } from '@langchain/core/documents';
import { Embeddings } from '@langchain/core/embeddings';
import fs from 'fs/promises';
import { config } from './config';

export class VectorStoreManager {
  private vectorStore: FaissStore | null = null;
  private embeddings: Embeddings;

  constructor(embeddings: Embeddings) {
    this.embeddings = embeddings;
  }

  /**
   * Create a new vector store from documents
   */
  async createFromDocuments(documents: Document[]): Promise<FaissStore> {
    if (documents.length === 0) {
      throw new Error('No documents provided to create vector store');
    }

    console.warn(`Creating vector store from ${documents.length} documents...`);
    this.vectorStore = await FaissStore.fromDocuments(documents, this.embeddings);
    console.warn('✓ Vector store created successfully');

    return this.vectorStore;
  }

  /**
   * Add documents to existing vector store
   */
  async addDocuments(documents: Document[]): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized. Create it first or load from disk.');
    }

    if (documents.length === 0) {
      console.warn('No documents to add');
      return;
    }

    console.warn(`Adding ${documents.length} documents to vector store...`);
    await this.vectorStore.addDocuments(documents);
    console.warn('✓ Documents added successfully');
  }

  /**
   * Save vector store to disk
   */
  async save(directory: string = config.vectorStorePath): Promise<void> {
    if (!this.vectorStore) {
      throw new Error('No vector store to save');
    }

    console.warn(`Saving vector store to ${directory}...`);

    // Create directory if it doesn't exist
    await fs.mkdir(directory, { recursive: true });

    await this.vectorStore.save(directory);
    console.warn('✓ Vector store saved successfully');
  }

  /**
   * Load vector store from disk
   */
  async load(directory: string = config.vectorStorePath): Promise<FaissStore> {
    try {
      console.warn(`Loading vector store from ${directory}...`);
      this.vectorStore = await FaissStore.load(directory, this.embeddings);
      console.warn('✓ Vector store loaded successfully');
      return this.vectorStore;
    } catch (error) {
      console.error('Error loading vector store:', error);
      throw new Error('Failed to load vector store. You may need to ingest documents first.');
    }
  }

  /**
   * Check if vector store exists on disk
   */
  async exists(directory: string = config.vectorStorePath): Promise<boolean> {
    try {
      await fs.access(directory);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Search for similar documents
   */
  async similaritySearch(query: string, k: number = config.retrievalK): Promise<Document[]> {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    return await this.vectorStore.similaritySearch(query, k);
  }

  /**
   * Get the vector store instance
   */
  getVectorStore(): FaissStore {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }
    return this.vectorStore;
  }

  /**
   * Get vector store as retriever
   */
  asRetriever(k: number = config.retrievalK) {
    if (!this.vectorStore) {
      throw new Error('Vector store not initialized');
    }

    return this.vectorStore.asRetriever({
      k,
      searchType: 'similarity',
    });
  }
}
