import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config';

/**
 * Load and process DOCX documents
 */
export class DocxLoader {
  private dirPath: string;

  constructor(dirPath: string) {
    this.dirPath = dirPath;
  }

  /**
   * Load all DOCX files from the directory
   */
  async load(): Promise<Document[]> {
    const documents: Document[] = [];

    if (!fs.existsSync(this.dirPath)) {
      console.warn(`Directory ${this.dirPath} does not exist. Skipping DOCX loading.`);
      return documents;
    }

    const files = fs.readdirSync(this.dirPath);
    const docxFiles = files.filter((file) =>
      file.toLowerCase().endsWith('.docx') && !file.startsWith('~$')
    );

    console.warn(`Found ${docxFiles.length} DOCX files`);

    for (const file of docxFiles) {
      const filePath = path.join(this.dirPath, file);
      try {
        const fileBuffer = fs.readFileSync(filePath);
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        const text = result.value;

        if (text.trim()) {
          // Split the text into chunks
          const splitter = new RecursiveCharacterTextSplitter({
            chunkSize: config.chunkSize,
            chunkOverlap: config.chunkOverlap,
          });

          const chunks = await splitter.splitText(text);

          // Create documents for each chunk
          const docs = chunks.map(
            (chunk, index) =>
              new Document({
                pageContent: chunk,
                metadata: {
                  source: file,
                  type: 'docx',
                  chunk: index,
                  totalChunks: chunks.length,
                },
              })
          );

          documents.push(...docs);
          console.warn(`Loaded ${docs.length} chunks from ${file}`);
        } else {
          console.warn(`Skipping empty DOCX file: ${file}`);
        }
      } catch (error) {
        console.error(`Error loading DOCX file ${file}:`, error);
      }
    }

    return documents;
  }

  /**
   * Load a single DOCX file
   */
  static async loadFile(filePath: string): Promise<Document[]> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const result = await mammoth.extractRawText({ buffer: fileBuffer });
      const text = result.value;

      if (!text.trim()) {
        return [];
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
      });

      const chunks = await splitter.splitText(text);
      const fileName = path.basename(filePath);

      return chunks.map(
        (chunk, index) =>
          new Document({
            pageContent: chunk,
            metadata: {
              source: fileName,
              type: 'docx',
              chunk: index,
              totalChunks: chunks.length,
            },
          })
      );
    } catch (error) {
      console.error(`Error loading DOCX file ${filePath}:`, error);
      return [];
    }
  }
}
