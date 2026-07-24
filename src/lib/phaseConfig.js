export const PHASE_CONFIG = {
  "1": {
    number: 1,
    routeSlug: "1",
    canonicalPhase: "phase_1_intake_normalize",
    runParam: "1",
    title: "Phase 1: Ingestion & Normalization",
    shortLabel: "P1: Ingest & Normalize",
    description: "Cleans line endings and character encodings, removes Project Gutenberg header boilerplate, and generates clean plain text."
  },
  "2": {
    number: 2,
    routeSlug: "2",
    canonicalPhase: "phase_2_structure_metadata",
    runParam: "2",
    title: "Phase 2: Structure & Metadata",
    shortLabel: "P2: Structure Parsing",
    description: "Parses normalized text into structured book data, chapters, metadata, and parser QC."
  },
  "3": {
    number: 3,
    routeSlug: "3",
    canonicalPhase: "phase_3_render",
    runParam: "3",
    title: "Phase 3: Layout Render",
    shortLabel: "P3: Layout Render",
    description: "Renders structured book data into HTML, PDF, DOCX, EPUB, and render QC."
  },
  "4": {
    number: 4,
    routeSlug: "4",
    canonicalPhase: "phase_4_text_approval_copy",
    runParam: "4",
    title: "Phase 4: Copy Approved Text",
    shortLabel: "P4: Approved Text Copy",
    description: "Copies approved rendered PDF, DOCX, and EPUB files into the approved book folder."
  },
  "5": {
    number: 5,
    routeSlug: "5",
    canonicalPhase: "phase_5_cover_generation",
    runParam: "5",
    title: "Phase 5: Cover Generation",
    shortLabel: "P5: Cover Generation",
    description: "Generates cover candidates after text approval."
  },
  "6": {
    number: 6,
    routeSlug: "6",
    canonicalPhase: "phase_6_cover_approval_copy",
    runParam: "6",
    title: "Phase 6: Copy Approved Cover",
    shortLabel: "P6: Approved Cover Copy",
    description: "Copies the selected approved cover into the approved cover folder."
  },
  "8": {
    number: 8,
    routeSlug: "8",
    canonicalPhase: "phase_8_final_assembly",
    runParam: "8",
    title: "Phase 8: Final Assembly",
    shortLabel: "P8: Final Assembly",
    description: "Assembles approved text files, approved cover, metadata, and manifest into the completed package."
  },
  "10": {
    number: 10,
    routeSlug: "10",
    canonicalPhase: "phase_10_data_packaging",
    runParam: "10",
    title: "Phase 10: Data Packaging",
    shortLabel: "P10: Data Packaging",
    description: "Creates AI-ready data package files and optional book chunks."
  }
};

export function getPhaseConfig(param) {
  const normalized = String(param || "").toLowerCase();

  const aliases = {
    "1": "1",
    "phase-1": "1",
    "phase_1_intake_normalize": "1",
    "uploaded": "1",

    "2": "2",
    "phase-2": "2",
    "phase_2_structure_metadata": "2",
    "normalized": "2",

    "3": "3",
    "phase-3": "3",
    "phase_3_render": "3",
    "structured": "3",

    "4": "4",
    "phase-4": "4",
    "phase_4_text_approval_copy": "4",
    "text-approved-copy": "4",
    "rendered": "4", // map old stage name as well for fallback support

    "5": "5",
    "phase-5": "5",
    "phase_5_cover_generation": "5",
    "cover-generation": "5",
    "cover_generation": "5",

    "6": "6",
    "phase-6": "6",
    "phase_6_cover_approval_copy": "6",
    "cover-approved-copy": "6",
    "cover_review": "6",

    "8": "8",
    "phase-8": "8",
    "phase_8_final_assembly": "8",
    "assembly": "8",
    "assembled": "8",

    "10": "10",
    "phase-10": "10",
    "phase_10_data_packaging": "10",
    "data-packaging": "10",
    "data_packaged": "10"
  };

  const key = aliases[normalized];

  if (!key) return null;

  return PHASE_CONFIG[key];
}
