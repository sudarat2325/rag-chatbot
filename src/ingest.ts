import { Document } from '@langchain/core/documents';
import { PDFDocumentLoader, TextDocumentLoader, WebDocumentLoader, DocxLoader, XlsxLoader, PptxLoader } from './loaders/index';
import { VectorStoreManager } from './vectorStore';
import { getEmbeddings } from './embeddings';
import { config } from './config';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.warn('='.repeat(60));
  console.warn('📚 RAG Document Ingestion Tool');
  console.warn('='.repeat(60));
  console.warn();

  const allDocuments: Document[] = [];

  // Load PDF documents
  console.warn('📄 Loading PDF documents...');
  try {
    const pdfLoader = new PDFDocumentLoader();
    const pdfDocs = await pdfLoader.loadPDFsFromDirectory(config.pdfsPath);
    if (pdfDocs.length > 0) {
      allDocuments.push(...pdfDocs);
      console.warn(`✓ Loaded ${pdfDocs.length} chunks from PDFs`);
    }
  } catch (error) {
    console.warn('⚠ No PDFs found or error loading PDFs:', error);
  }
  console.warn();

  // Load text/markdown documents
  console.warn('📝 Loading text/markdown documents...');
  try {
    const textLoader = new TextDocumentLoader();
    const textDocs = await textLoader.loadTextsFromDirectory(config.textsPath);
    if (textDocs.length > 0) {
      allDocuments.push(...textDocs);
      console.warn(`✓ Loaded ${textDocs.length} chunks from text files`);
    }
  } catch (error) {
    console.warn('⚠ No text files found or error loading text files:', error);
  }
  console.warn();

  // Load DOCX documents
  console.warn('📄 Loading DOCX documents...');
  try {
    const docxLoader = new DocxLoader(config.docxPath);
    const docxDocs = await docxLoader.load();
    if (docxDocs.length > 0) {
      allDocuments.push(...docxDocs);
      console.warn(`✓ Loaded ${docxDocs.length} chunks from DOCX files`);
    }
  } catch (error) {
    console.warn('⚠ No DOCX files found or error loading DOCX files:', error);
  }
  console.warn();

  // Load Excel documents
  console.warn('📊 Loading Excel (XLSX/XLS) documents...');
  try {
    const xlsxLoader = new XlsxLoader(config.xlsxPath);
    const xlsxDocs = await xlsxLoader.load();
    if (xlsxDocs.length > 0) {
      allDocuments.push(...xlsxDocs);
      console.warn(`✓ Loaded ${xlsxDocs.length} chunks from Excel files`);
    }
  } catch (error) {
    console.warn('⚠ No Excel files found or error loading Excel files:', error);
  }
  console.warn();

  // Load PowerPoint documents
  console.warn('📊 Loading PowerPoint (PPTX) documents...');
  try {
    const pptxLoader = new PptxLoader(config.pptxPath);
    const pptxDocs = await pptxLoader.load();
    if (pptxDocs.length > 0) {
      allDocuments.push(...pptxDocs);
      console.warn(`✓ Loaded ${pptxDocs.length} chunks from PowerPoint files`);
    }
  } catch (error) {
    console.warn('⚠ No PowerPoint files found or error loading PowerPoint files:', error);
  }
  console.warn();

  // Optional: Load web documents
  console.warn('🌐 Web document loading');
  const loadWeb = await question('Do you want to load documents from URLs? (y/n): ');

  if (loadWeb.toLowerCase() === 'y') {
    const urlInput = await question('Enter URLs (comma-separated): ');
    const urls = urlInput.split(',').map(url => url.trim()).filter(url => url);

    if (urls.length > 0) {
      const webLoader = new WebDocumentLoader();
      const webDocs = await webLoader.loadURLs(urls);
      if (webDocs.length > 0) {
        allDocuments.push(...webDocs);
        console.warn(`✓ Loaded ${webDocs.length} chunks from web`);
      }
    }
  }
  console.warn();

  // Check if we have any documents
  if (allDocuments.length === 0) {
    console.error('❌ No documents found to ingest!');
    console.warn('\nPlease add documents to:');
    console.warn(`  - PDFs: ${config.pdfsPath}`);
    console.warn(`  - Text files: ${config.textsPath}`);
    console.warn(`  - DOCX files: ${config.docxPath}`);
    console.warn(`  - Excel files: ${config.xlsxPath}`);
    console.warn(`  - PowerPoint files: ${config.pptxPath}`);
    console.warn('  - Or provide URLs when prompted');
    rl.close();
    process.exit(1);
  }

  console.warn(`\n📊 Total documents loaded: ${allDocuments.length} chunks`);
  console.warn();

  // Create embeddings and vector store
  console.warn('🔄 Creating embeddings and vector store...');
  console.warn('⏳ This may take a few minutes...');
  const embeddings = getEmbeddings();
  const vectorStoreManager = new VectorStoreManager(embeddings);

  await vectorStoreManager.createFromDocuments(allDocuments);
  await vectorStoreManager.save();

  console.warn();
  console.warn('✅ Success! Documents have been ingested and saved.');
  console.warn(`📁 Vector store saved to: ${config.vectorStorePath}`);
  console.warn();
  console.warn('🚀 You can now run the chatbot with: npm run chat');
  console.warn('='.repeat(60));

  rl.close();
}

main().catch(error => {
  console.error('Error during ingestion:', error);
  rl.close();
  process.exit(1);
});
