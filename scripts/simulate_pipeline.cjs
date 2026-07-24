const fs = require('fs');
const path = require('path');
const http = require('http');

const API_BASE = 'http://localhost:4000';

// 1. Resolve internal API key from backend/.env
const envPath = path.resolve(__dirname, '../../backend/.env');
let internalApiKey = 'your_internal_api_key';
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/INTERNAL_API_KEY\s*=\s*(.+)/);
  if (match) {
    internalApiKey = match[1].trim().replace(/['"]/g, '');
  }
}

console.log(`[SIMULATOR] Loaded internal API Key: "${internalApiKey}"`);

// Helper to make HTTP requests
const request = (method, urlPath, body = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, API_BASE);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'x-internal-api-key': internalApiKey,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (res.statusCode >= 400) {
            reject(new Error(parsed.error || parsed.message || `Status Code ${res.statusCode}`));
          } else {
            resolve(parsed);
          }
        } catch (e) {
          if (res.statusCode >= 400) {
            reject(new Error(`Status Code ${res.statusCode}: ${data}`));
          } else {
            resolve(data);
          }
        }
      });
    });

    req.on('error', (err) => reject(err));
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function getNextEligiblePhase(book) {
  const files = book.files || [];
  const fileTypes = files.map(f => f.file_type);

  if (book.current_stage === 'uploaded' && book.stage_status === 'pending') {
    return 'phase_1_intake_normalize';
  }
  if (book.current_stage === 'normalized' && book.stage_status === 'complete') {
    return 'phase_2_structure_metadata';
  }
  if (book.current_stage === 'structured' && book.stage_status === 'complete') {
    return 'phase_3_render';
  }
  if (book.current_stage === 'rendered' && book.text_status === 'approved' && !fileTypes.includes('approved_pdf')) {
    return 'phase_4_text_approval_copy';
  }
  if (book.text_status === 'approved' && book.cover_status === 'pending') {
    return 'phase_5_cover_generation';
  }
  if (book.current_stage === 'cover_review' && book.cover_status === 'approved' && !fileTypes.includes('approved_cover')) {
    return 'phase_6_cover_approval_copy';
  }
  if (book.current_stage === 'cover_approved' && book.text_status === 'approved' && book.cover_status === 'approved' && book.rights_status === 'verified') {
    return 'phase_8_final_assembly';
  }
  if (book.current_stage === 'assembled' && book.publication_status === 'published' && book.rights_status === 'verified') {
    return 'phase_10_data_packaging';
  }
  return null;
}

async function run() {
  console.log('\n======================================================');
  console.log('[SIMULATOR] Arche Archives Ingestion Pipeline Simulator');
  console.log('======================================================\n');

  try {
    // Fetch books list
    console.log('[SIMULATOR] Querying books catalog from server...');
    const books = await request('GET', '/api/admin/books');
    if (!books || books.length === 0) {
      console.log('[SIMULATOR] Catalog is empty. Please register a book first.');
      return;
    }

    let simulatedCount = 0;

    for (const summary of books) {
      // Get detailed book data
      const book = await request('GET', `/api/admin/books/${summary.book_id}`);
      const phase = getNextEligiblePhase(book);

      if (!phase) {
        console.log(`[-] Book "${book.title}" in stage "${book.current_stage}" (${book.stage_status}) is not currently waiting for any automated phase.`);
        continue;
      }

      console.log(`\n[*] Book found: "${book.title}" (ID: ${book.book_id})`);
      console.log(`    Current: stage="${book.current_stage}", status="${book.stage_status}", text="${book.text_status}", cover="${book.cover_status}", rights="${book.rights_status}"`);
      console.log(`    Action: Triggering automation phase "${phase}"...`);

      simulatedCount++;

      // 1. Start Job
      console.log('    -> Starting job...');
      const startRes = await request('POST', `/api/internal/pipeline/books/${book.book_id}/jobs/start`, {
        phase,
        n8n_workflow_id: 'simulated_workflow_123',
        n8n_execution_id: `sim_exec_${Date.now()}`,
        input: {}
      });
      const runId = startRes.run_id;
      console.log(`    -> Job started. Run ID: ${runId}`);

      await delay(1000);

      // 2. Complete Phase
      console.log('    -> Processing phase work & compiling formats...');
      
      let completePath = '';
      let payload = { run_id: runId };

      switch (phase) {
        case 'phase_1_intake_normalize':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-1/complete`;
          payload.book = { slug: book.slug, checksum: 'sim_checksum_intake_normalize_123' };
          payload.files = [
            { file_type: 'normalized_text', storage_path: `normalized/${book.slug}_normalized.txt` },
            { file_type: 'normalization_report', storage_path: `normalized/${book.slug}_normalization_report.json` }
          ];
          payload.qc = { phase: 'phase_1_intake_normalize', report_path: `normalized/${book.slug}_normalization_report.json` };
          break;

        case 'phase_2_structure_metadata':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-2/complete`;
          payload.book = { word_count: 42350, work_type: 'fiction' };
          payload.files = [
            { file_type: 'metadata_json', storage_path: `structured/${book.slug}_metadata.json` },
            { file_type: 'metadata_csv', storage_path: `structured/${book.slug}_metadata.csv` },
            { file_type: 'structured_json', storage_path: `structured/${book.slug}_structured.json` },
            { file_type: 'parser_qc', storage_path: `structured/${book.slug}_parser_qc.json` }
          ];
          payload.qc = { phase: 'phase_2_structure_metadata', parser_qc_status: 'complete' };
          payload.metadata = { title: book.title, author: book.author, year: 1912 };
          payload.chapters = [
            { title: 'Chapter 1: Arrival', word_count: 5200 },
            { title: 'Chapter 2: Discoveries', word_count: 4800 }
          ];
          break;

        case 'phase_3_render':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-3/complete`;
          payload.book = { current_folder: `rendered/${book.slug}` };
          payload.files = [
            { file_type: 'html', storage_path: `rendered/${book.slug}/index.html` },
            { file_type: 'docx', storage_path: `rendered/${book.slug}/${book.slug}.docx` },
            { file_type: 'pdf', storage_path: `rendered/${book.slug}/${book.slug}.pdf` },
            { file_type: 'epub', storage_path: `rendered/${book.slug}/${book.slug}.epub` },
            { file_type: 'render_qc', storage_path: `rendered/${book.slug}/render_qc.json` }
          ];
          payload.render_report = {
            render_qc_status: 'pass',
            render_quality: 'high',
            html_char_count: 15200,
            body_html_char_count: 14800,
            render_block_count: 54,
            render_warnings: []
          };
          break;

        case 'phase_4_text_approval_copy':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-4/complete`;
          payload.files = [
            { file_type: 'approved_pdf', storage_path: `approved/${book.slug}/${book.slug}.pdf` },
            { file_type: 'approved_docx', storage_path: `approved/${book.slug}/${book.slug}.docx` },
            { file_type: 'approved_epub', storage_path: `approved/${book.slug}/${book.slug}.epub` }
          ];
          break;

        case 'phase_5_cover_generation':
          completePath = `/api/internal/pipeline/books/${book.book_id}/covers/options`;
          payload.options = [
            { option_number: 1, storage_path: `covers/candidates/${book.slug}/option_1.jpg` },
            { option_number: 2, storage_path: `covers/candidates/${book.slug}/option_2.jpg` },
            { option_number: 3, storage_path: `covers/candidates/${book.slug}/option_3.jpg` }
          ];
          break;

        case 'phase_6_cover_approval_copy':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-6/complete`;
          payload.files = [
            { file_type: 'approved_cover', storage_path: `approved/${book.slug}/cover.jpg` }
          ];
          break;

        case 'phase_8_final_assembly':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-8/complete`;
          payload.files = [
            { file_type: 'completed_pdf', storage_path: `assembled/${book.slug}/${book.slug}.pdf` },
            { file_type: 'completed_epub', storage_path: `assembled/${book.slug}/${book.slug}.epub` },
            { file_type: 'completed_docx', storage_path: `assembled/${book.slug}/${book.slug}.docx` },
            { file_type: 'completed_cover', storage_path: `assembled/${book.slug}/cover.jpg` },
            { file_type: 'manifest', storage_path: `assembled/${book.slug}/manifest.json` }
          ];
          break;

        case 'phase_10_data_packaging':
          completePath = `/api/internal/pipeline/books/${book.book_id}/phases/phase-10/complete`;
          payload.files = [
            { file_type: 'data_package', storage_path: `packages/${book.slug}_package.zip` }
          ];
          break;
      }

      await request('POST', completePath, payload);
      console.log(`[+] Success: Completed phase "${phase}" for "${book.title}"!`);
    }

    if (simulatedCount === 0) {
      console.log('\n[SIMULATOR] No books required automated pipeline runs. If a book is waiting for human approvals (Text, Cover, Rights), approve them in the dashboard UI first.');
    } else {
      console.log(`\n[SIMULATOR] Finished simulation run. Processed ${simulatedCount} books stage transitions.`);
    }

  } catch (err) {
    console.error(`\n[ERROR] Simulation failed: ${err.message}`);
  }
}

run();
