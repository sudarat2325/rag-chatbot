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
  console.log('='.repeat(60));
  console.log('📚 RAG Document Ingestion Tool');
  console.log('='.repeat(60));
  console.log();

  const allDocuments: Document[] = [];

  // Load PDF documents
  console.log('📄 Loading PDF documents...');
  try {
    const pdfLoader = new PDFDocumentLoader();
    const pdfDocs = await pdfLoader.loadPDFsFromDirectory(config.pdfsPath);
    if (pdfDocs.length > 0) {
      allDocuments.push(...pdfDocs);
      console.log(`✓ Loaded ${pdfDocs.length} chunks from PDFs`);
    }
  } catch (error) {
    console.log('⚠ No PDFs found or error loading PDFs');
  }
  console.log();

  // Load text/markdown documents
  console.log('📝 Loading text/markdown documents...');
  try {
    const textLoader = new TextDocumentLoader();
    const textDocs = await textLoader.loadTextsFromDirectory(config.textsPath);
    if (textDocs.length > 0) {
      allDocuments.push(...textDocs);
      console.log(`✓ Loaded ${textDocs.length} chunks from text files`);
    }
  } catch (error) {
    console.log('⚠ No text files found or error loading text files');
  }
  console.log();

  // Load DOCX documents
  console.log('📄 Loading DOCX documents...');
  try {
    const docxLoader = new DocxLoader(config.docxPath);
    const docxDocs = await docxLoader.load();
    if (docxDocs.length > 0) {
      allDocuments.push(...docxDocs);
      console.log(`✓ Loaded ${docxDocs.length} chunks from DOCX files`);
    }
  } catch (error) {
    console.log('⚠ No DOCX files found or error loading DOCX files');
  }
  console.log();

  // Load Excel documents
  console.log('📊 Loading Excel (XLSX/XLS) documents...');
  try {
    const xlsxLoader = new XlsxLoader(config.xlsxPath);
    const xlsxDocs = await xlsxLoader.load();
    if (xlsxDocs.length > 0) {
      allDocuments.push(...xlsxDocs);
      console.log(`✓ Loaded ${xlsxDocs.length} chunks from Excel files`);
    }
  } catch (error) {
    console.log('⚠ No Excel files found or error loading Excel files');
  }
  console.log();

  // Load PowerPoint documents
  console.log('📊 Loading PowerPoint (PPTX) documents...');
  try {
    const pptxLoader = new PptxLoader(config.pptxPath);
    const pptxDocs = await pptxLoader.load();
    if (pptxDocs.length > 0) {
      allDocuments.push(...pptxDocs);
      console.log(`✓ Loaded ${pptxDocs.length} chunks from PowerPoint files`);
    }
  } catch (error) {
    console.log('⚠ No PowerPoint files found or error loading PowerPoint files');
  }
  console.log();

  // Optional: Load web documents
  console.log('🌐 Web document loading');
  const loadWeb = await question('Do you want to load documents from URLs? (y/n): ');

  if (loadWeb.toLowerCase() === 'y') {
    const urlInput = await question('Enter URLs (comma-separated): ');
    const urls = urlInput.split(',').map(url => url.trim()).filter(url => url);

    if (urls.length > 0) {
      const webLoader = new WebDocumentLoader();
      const webDocs = await webLoader.loadURLs(urls);
      if (webDocs.length > 0) {
        allDocuments.push(...webDocs);
        console.log(`✓ Loaded ${webDocs.length} chunks from web`);
      }
    }
  }
  console.log();

  // Check if we have any documents
  if (allDocuments.length === 0) {
    console.error('❌ No documents found to ingest!');
    console.log('\nPlease add documents to:');
    console.log(`  - PDFs: ${config.pdfsPath}`);
    console.log(`  - Text files: ${config.textsPath}`);
    console.log(`  - DOCX files: ${config.docxPath}`);
    console.log(`  - Excel files: ${config.xlsxPath}`);
    console.log(`  - PowerPoint files: ${config.pptxPath}`);
    console.log('  - Or provide URLs when prompted');
    rl.close();
    process.exit(1);
  }

  console.log(`\n📊 Total documents loaded: ${allDocuments.length} chunks`);
  console.log();

  // Create embeddings and vector store
  console.log('🔄 Creating embeddings and vector store...');
  console.log('⏳ This may take a few minutes...');
  const embeddings = getEmbeddings();
  const vectorStoreManager = new VectorStoreManager(embeddings);

  await vectorStoreManager.createFromDocuments(allDocuments);
  await vectorStoreManager.save();

  console.log();
  console.log('✅ Success! Documents have been ingested and saved.');
  console.log(`📁 Vector store saved to: ${config.vectorStorePath}`);
  console.log();
  console.log('🚀 You can now run the chatbot with: npm run chat');
  console.log('='.repeat(60));

  rl.close();
}

main().catch(error => {
  console.error('Error during ingestion:', error);
  rl.close();
  process.exit(1);
});
