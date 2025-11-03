import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { config } from '@/src/config';

interface DocumentInfo {
  name: string;
  type: string;
  size: number;
  path: string;
}

async function getDocuments(dirPath: string, type: string): Promise<DocumentInfo[]> {
  try {
    const files = await fs.readdir(dirPath);
    const documents: DocumentInfo[] = [];

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (stats.isFile()) {
        documents.push({
          name: file,
          type,
          size: stats.size,
          path: filePath,
        });
      }
    }

    return documents;
  } catch (error) {
    console.error(`Error reading ${dirPath}:`, error);
    return [];
  }
}

export async function GET() {
  try {
    // Get documents from all directories
    const [pdfs, texts, docx, xlsx, pptx] = await Promise.all([
      getDocuments(config.pdfsPath, 'PDF'),
      getDocuments(config.textsPath, 'TEXT'),
      getDocuments(config.docxPath, 'DOCX'),
      getDocuments(config.xlsxPath, 'XLSX'),
      getDocuments(config.pptxPath, 'PPTX'),
    ]);

    const allDocuments = [...pdfs, ...texts, ...docx, ...xlsx, ...pptx];

    return NextResponse.json({
      documents: allDocuments,
      total: allDocuments.length,
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { path: filePath } = body;

    if (!filePath) {
      return NextResponse.json(
        { error: 'File path is required' },
        { status: 400 }
      );
    }

    // Security check: ensure the file is within allowed directories
    const normalizedPath = path.normalize(filePath);
    const isInPdfs = normalizedPath.startsWith(config.pdfsPath);
    const isInTexts = normalizedPath.startsWith(config.textsPath);
    const isInDocx = normalizedPath.startsWith(config.docxPath);
    const isInXlsx = normalizedPath.startsWith(config.xlsxPath);
    const isInPptx = normalizedPath.startsWith(config.pptxPath);

    if (!isInPdfs && !isInTexts && !isInDocx && !isInXlsx && !isInPptx) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 403 }
      );
    }

    // Delete the file
    await fs.unlink(filePath);

    return NextResponse.json({
      message: 'Document deleted successfully',
    });
  } catch (error: any) {
    console.error('Error deleting document:', error);

    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Document not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}
