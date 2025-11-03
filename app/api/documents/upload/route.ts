import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { config } from '@/src/config';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      );
    }

    const uploadedFiles: string[] = [];

    for (const file of files) {
      const fileName = file.name;
      const fileExtension = path.extname(fileName).toLowerCase();

      // Determine target directory based on file type
      let targetDir: string;
      if (fileExtension === '.pdf') {
        targetDir = config.pdfsPath;
      } else if (['.txt', '.md', '.markdown'].includes(fileExtension)) {
        targetDir = config.textsPath;
      } else if (fileExtension === '.docx') {
        targetDir = config.docxPath;
      } else if (['.xlsx', '.xls'].includes(fileExtension)) {
        targetDir = config.xlsxPath;
      } else if (fileExtension === '.pptx') {
        targetDir = config.pptxPath;
      } else {
        console.warn(`Unsupported file type: ${fileName}`);
        continue;
      }

      // Ensure directory exists
      await fs.mkdir(targetDir, { recursive: true });

      // Save file
      const filePath = path.join(targetDir, fileName);
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      await fs.writeFile(filePath, buffer);
      uploadedFiles.push(fileName);
    }

    return NextResponse.json({
      message: `Successfully uploaded ${uploadedFiles.length} file(s)`,
      files: uploadedFiles,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
