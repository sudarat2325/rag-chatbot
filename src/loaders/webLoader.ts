import { CheerioWebBaseLoader } from '@langchain/community/document_loaders/web/cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
import fs from 'fs/promises';
import path from 'path';
import { config } from '../config';

export class WebDocumentLoader {
  private textSplitter: RecursiveCharacterTextSplitter;

  constructor() {
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: config.chunkSize,
      chunkOverlap: config.chunkOverlap,
    });
  }

  /**
   * Load content from a single URL
   */
  async loadURL(url: string): Promise<Document[]> {
    try {
      console.warn(`Loading URL: ${url}`);
      const loader = new CheerioWebBaseLoader(url);
      const docs = await loader.load();

      // Add metadata
      docs.forEach((doc: Document) => {
        doc.metadata.source = url;
        doc.metadata.sourceType = 'web';
      });

      // Split documents into chunks
      const splitDocs = await this.textSplitter.splitDocuments(docs);

      console.warn(`✓ Loaded ${splitDocs.length} chunks from ${url}`);
      return splitDocs;
    } catch (error) {
      console.error(`Error loading URL ${url}:`, error);
      throw error;
    }
  }

  /**
   * Load content from multiple URLs
   */
  async loadURLs(urls: string[]): Promise<Document[]> {
    console.warn(`Loading ${urls.length} URL(s)...`);

    const allDocs: Document[] = [];
    for (const url of urls) {
      try {
        const docs = await this.loadURL(url);
        allDocs.push(...docs);
      } catch (error) {
        console.error(`Skipping ${url} due to error`, error);
      }
    }

    return allDocs;
  }

  /**
   * Load URLs from a text file (one URL per line)
   */
  async loadURLsFromFile(filePath: string): Promise<Document[]> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const urls = content
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#') && line.startsWith('http'));

      if (urls.length === 0) {
        console.warn(`No valid URLs found in ${filePath}`);
        return [];
      }

      return await this.loadURLs(urls);
    } catch (error) {
      console.error(`Error loading URLs from file ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Cache web content to local file
   */
  async cacheWebContent(url: string, content: string): Promise<void> {
    try {
      const fileName = url.replace(/[^a-z0-9]/gi, '_').substring(0, 100) + '.txt';
      const filePath = path.join(config.webCachePath, fileName);

      await fs.mkdir(config.webCachePath, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');

      console.warn(`✓ Cached content to ${fileName}`);
    } catch (error) {
      console.error('Error caching web content:', error);
    }
  }
}
