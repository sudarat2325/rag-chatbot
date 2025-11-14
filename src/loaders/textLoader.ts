import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export class TextDocumentLoader {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
  }

  /**
   * Load a single text or markdown file
   */
  async loadTextFile(filePath: string): Promise<Document[]> {
    try {
      console.warn(`Loading text file: ${filePath}`);

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Create document
      const doc = new Document({
        pageContent: content,
        metadata: {
          source: filePath,
          fileName: path.basename(filePath),
        },
      });

      // Split documents into chunks
      const splitDocs = await this.textSplitter.splitDocuments([doc]);

      console.warn(`✓ Loaded ${splitDocs.length} chunks from ${path.basename(filePath)}`);
      return splitDocs;
    } catch (error) {
      console.error(`Error loading text file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Load all text and markdown files from a directory
   */
  async loadTextsFromDirectory(dirPath: string): Promise<Document[]> {
    try {
      const files = await fs.readdir(dirPath);
      const textFiles = files.filter(file => {
        const ext = file.toLowerCase();
        return ext.endsWith('.txt') || ext.endsWith('.md') || ext.endsWith('.markdown');
      });

      if (textFiles.length === 0) {
        console.warn(`No text files found in ${dirPath}`);
        return [];
      }

      console.warn(`Found ${textFiles.length} text file(s)`);

      const allDocs: Document[] = [];
      for (const file of textFiles) {
        const filePath = path.join(dirPath, file);
        const docs = await this.loadTextFile(filePath);
        allDocs.push(...docs);
      }

      return allDocs;
    } catch (error) {
      console.error(`Error loading text files from directory ${dirPath}:`, error);
      throw error;
    }
  }
}
