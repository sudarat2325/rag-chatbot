import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { config } from '../config';

/**
 * Load and process Excel (XLSX, XLS) documents
 */
export class XlsxLoader {
  private dirPath: string;

  constructor(dirPath: string) {
    this.dirPath = dirPath;
  }

  /**
   * Load all Excel files from the directory
   */
  async load(): Promise<Document[]> {
    const documents: Document[] = [];

    if (!fs.existsSync(this.dirPath)) {
      console.warn(`Directory ${this.dirPath} does not exist. Skipping Excel loading.`);
      return documents;
    }

    const files = fs.readdirSync(this.dirPath);
    const excelFiles = files.filter((file) => {
      const lower = file.toLowerCase();
      return (lower.endsWith('.xlsx') || lower.endsWith('.xls')) && !file.startsWith('~$');
    });

    console.warn(`Found ${excelFiles.length} Excel files`);

    for (const file of excelFiles) {
      const filePath = path.join(this.dirPath, file);
      try {
        const docs = await XlsxLoader.loadFile(filePath);
        documents.push(...docs);
        console.warn(`Loaded ${docs.length} chunks from ${file}`);
      } catch (error) {
        console.error(`Error loading Excel file ${file}:`, error);
      }
    }

    return documents;
  }

  /**
   * Load a single Excel file
   */
  static async loadFile(filePath: string): Promise<Document[]> {
    try {
      const workbook = XLSX.readFile(filePath);
      const fileName = path.basename(filePath);
      const allDocuments: Document[] = [];

      // Process each sheet in the workbook
      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        // Convert sheet to JSON for easier processing
        const jsonData = XLSX.utils.sheet_to_json<unknown[]>(worksheet, { header: 1 });

        // Convert to text format
        let text = `Sheet: ${sheetName}\n\n`;

        // Get headers (first row)
        const headers = Array.isArray(jsonData[0]) ? jsonData[0] : [];
        if (headers.length > 0) {
          text += headers.map((header) => String(header ?? '')).join(' | ') + '\n';
          text += headers.map(() => '---').join(' | ') + '\n';
        }

        // Add data rows
        for (let i = 1; i < jsonData.length; i++) {
          const row = jsonData[i];
          if (Array.isArray(row) && row.length > 0) {
            text += row.map((cell) => String(cell ?? '')).join(' | ') + '\n';
          }
        }

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
                  source: fileName,
                  sheet: sheetName,
                  type: 'xlsx',
                  chunk: index,
                  totalChunks: chunks.length,
                },
              })
          );

          allDocuments.push(...docs);
        }
      }

      return allDocuments;
    } catch (error) {
      console.error(`Error loading Excel file ${filePath}:`, error);
      return [];
    }
  }

  /**
   * Extract text summary from Excel file (alternative format)
   */
  static extractSummary(filePath: string): string {
    try {
      const workbook = XLSX.readFile(filePath);
      let summary = '';

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(worksheet);
        summary += `\n--- Sheet: ${sheetName} ---\n${csv}\n`;
      }

      return summary;
    } catch (error) {
      console.error(`Error extracting Excel summary from ${filePath}:`, error);
      return '';
    }
  }
}
