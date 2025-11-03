import * as fs from 'fs';
import * as path from 'path';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config';
import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';

/**
 * PDF Document Loader using pdfjs-dist
 */
export class PDFDocumentLoader {
  /**
   * Load a single PDF file
   */
  async loadPDF(pdfPath: string): Promise<Document[]> {
    try {
      console.log(`Loading PDF: ${pdfPath}`);

      // Read PDF file as buffer
      const dataBuffer = fs.readFileSync(pdfPath);
      const uint8Array = new Uint8Array(dataBuffer);

      // Load PDF document
      const loadingTask = pdfjs.getDocument({
        data: uint8Array,
        useSystemFonts: true,
      });

      const pdfDocument = await loadingTask.promise;
      const numPages = pdfDocument.numPages;

      let fullText = '';

      // Extract text from each page
      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdfDocument.getPage(pageNum);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');

        fullText += pageText + '\n\n';
      }

      if (!fullText.trim()) {
        console.log(`No text extracted from ${path.basename(pdfPath)}`);
        return [];
      }

      // Split into chunks
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: config.chunkSize,
        chunkOverlap: config.chunkOverlap,
      });

      const chunks = await splitter.splitText(fullText);
      const fileName = path.basename(pdfPath);

      const documents = chunks.map(
        (chunk, index) =>
          new Document({
            pageContent: chunk,
            metadata: {
              source: fileName,
              type: 'pdf',
              chunk: index,
              totalChunks: chunks.length,
              totalPages: numPages,
            },
          })
      );

      console.log(`✓ Loaded ${documents.length} chunks from ${fileName}`);
      return documents;
    } catch (error) {
      console.error(`Error loading PDF ${pdfPath}:`, error);
      throw error;
    }
  }

  /**
   * Load all PDFs from a directory
   */
  async loadPDFsFromDirectory(dirPath: string): Promise<Document[]> {
    const allDocuments: Document[] = [];

    if (!fs.existsSync(dirPath)) {
      console.log(`Directory ${dirPath} does not exist`);
      return allDocuments;
    }

    const files = fs.readdirSync(dirPath);
    const pdfFiles = files.filter((file) => file.toLowerCase().endsWith('.pdf'));

    console.log(`Found ${pdfFiles.length} PDF file(s)`);

    for (const file of pdfFiles) {
      const filePath = path.join(dirPath, file);
      try {
        const docs = await this.loadPDF(filePath);
        allDocuments.push(...docs);
      } catch (error) {
        console.error(`Error loading PDF ${file}:`, error);
      }
    }

    return allDocuments;
  }
}
