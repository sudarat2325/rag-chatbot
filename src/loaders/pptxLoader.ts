import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';
import { parseString } from 'xml2js';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config';

/**
 * Load and process PowerPoint (PPTX) documents
 */
export class PptxLoader {
  private dirPath: string;

  constructor(dirPath: string) {
    this.dirPath = dirPath;
  }

  /**
   * Load all PPTX files from the directory
   */
  async load(): Promise<Document[]> {
    const documents: Document[] = [];

    if (!fs.existsSync(this.dirPath)) {
      console.log(`Directory ${this.dirPath} does not exist. Skipping PPTX loading.`);
      return documents;
    }

    const files = fs.readdirSync(this.dirPath);
    const pptxFiles = files.filter((file) =>
      file.toLowerCase().endsWith('.pptx') && !file.startsWith('~$')
    );

    console.log(`Found ${pptxFiles.length} PPTX files`);

    for (const file of pptxFiles) {
      const filePath = path.join(this.dirPath, file);
      try {
        const docs = await PptxLoader.loadFile(filePath);
        documents.push(...docs);
        console.log(`Loaded ${docs.length} chunks from ${file}`);
      } catch (error) {
        console.error(`Error loading PPTX file ${file}:`, error);
      }
    }

    return documents;
  }

  /**
   * Load a single PPTX file
   */
  static async loadFile(filePath: string): Promise<Document[]> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const zip = await JSZip.loadAsync(fileBuffer);

      let allText = '';
      const fileName = path.basename(filePath);

      // Extract text from slides
      const slideFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml')
      );

      for (const slideFile of slideFiles) {
        const slideContent = await zip.files[slideFile].async('string');
        const text = await PptxLoader.extractTextFromSlideXML(slideContent);
        if (text.trim()) {
          allText += text + '\n\n';
        }
      }

      // Extract text from notes
      const notesFiles = Object.keys(zip.files).filter(
        (name) => name.startsWith('ppt/notesSlides/notesSlide') && name.endsWith('.xml')
      );

      for (const notesFile of notesFiles) {
        const notesContent = await zip.files[notesFile].async('string');
        const text = await PptxLoader.extractTextFromSlideXML(notesContent);
        if (text.trim()) {
          allText += 'Notes: ' + text + '\n\n';
        }
      }

      if (!allText.trim()) {
        console.log(`No text extracted from ${fileName}`);
        return [];
      }

      // Split the text into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
      });

      const chunks = await splitter.splitText(allText);

      return chunks.map(
        (chunk, index) =>
          new Document({
            pageContent: chunk,
            metadata: {
              source: fileName,
              type: 'pptx',
              chunk: index,
              totalChunks: chunks.length,
            },
          })
      );
    } catch (error) {
      console.error(`Error loading PPTX file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Extract text from slide XML content
   */
  private static async extractTextFromSlideXML(xmlContent: string): Promise<string> {
    return new Promise((resolve, reject) => {
      parseString(xmlContent, (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        try {
          const textElements: string[] = [];

          // Recursive function to extract text from nested objects
          const extractText = (obj: any) => {
            if (!obj) return;

            if (typeof obj === 'string') {
              textElements.push(obj);
              return;
            }

            if (Array.isArray(obj)) {
              obj.forEach((item) => extractText(item));
              return;
            }

            if (typeof obj === 'object') {
              // Look for text elements
              if (obj['a:t']) {
                extractText(obj['a:t']);
              }

              // Recursively search all properties
              Object.values(obj).forEach((value) => extractText(value));
            }
          };

          extractText(result);
          resolve(textElements.join(' '));
        } catch (error) {
          reject(error);
        }
      });
    });
  }
}
