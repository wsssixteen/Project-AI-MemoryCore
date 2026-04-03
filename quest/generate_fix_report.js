/**
 * Keiro Workflow — Bug Fix Report Generator
 * Edit the DATA section below, then run: node generate_fix_report.js
 */

const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, BorderStyle, WidthType, ShadingType, AlignmentType,
  convertInchesToTwip,
} = require("docx");
const fs = require("fs");
const path = require("path");

// ════════════════════════════════════════════════════════════════════════════
// DATA — Edit this section for each report
// ════════════════════════════════════════════════════════════════════════════

const TASK_FOLDER = `C:\\Users\\Ridhwan\\OneDrive - Pymsoft Sdn Bhd\\1. Tasks\\Melaka\\5. 253 419 - FAT - PSBS - AWAM - Borang Permohonan tidak papar maklumat untuk Kategori Kegunaan Tanah`;

const QA_NUMBER = "253419";
const QA_TITLE  = "PSBS Borang Permohonan \u2014 Kategori Kegunaan Tanah tidak dipapar";
const MODULE    = "Pelupusan (PLU)";
const ENV       = "FAT";
const URUSAN    = "PSBS";
const DATE      = "2 April 2026";
const ASSIGNEE  = "Ahmad Ridhwan Anuar";
const OUTPUT    = `${TASK_FOLDER}\\QA${QA_NUMBER}_Fix_Report.docx`;

// Screenshots — full path string, or null for placeholder
const SHOTS = {
  ticket:    `${TASK_FOLDER}\\0. Resources\\Ticket 253419.png`,
  issue:     `${TASK_FOLDER}\\0. Resources\\QA #253419 - ID Hakmilik - Carian Pintas.png`,
  rootCause: [null],
  fix:       [null],
};

const S1_CAPTION =
  `Redmine QA #${QA_NUMBER} \u2014 assigned to ${ASSIGNEE}, Priority: Medium`;

const S2_TEXT =
  `In PSBS (AWAM) urusan, the Borang Permohonan document (PSBS-001) does not display the ` +
  `Kategori Kegunaan Tanah field \u2014 it renders as \u201c-\u201d. ` +
  `Test data: ID Hakmilik 040102GRN00019085 (No. Hakmilik: 19085, Lot 767, Mukim Ayer Molek). ` +
  `The field also appears empty (highlighted red) in the Maklumat Hakmilik screen.`;
const S2_CAPTION =
  `Maklumat Hakmilik screen \u2014 Kategori Kegunaan Tanah field empty (highlighted red) for GRN 19085`;

const S3_TEXT =
  `The CC tag "kegunaan" is handled by populateKegunaan() in PelupusanWordCCMethodConstant.java ` +
  `(line 11124). The method defaults to HYPHEN ("-") and only has a condition for URS_PRU (line 11131). ` +
  `No branch exists for URS_PSBS \u2014 always returns HYPHEN regardless of data. ` +
  `DB investigation confirmed: kegunaan_tnh on umm_a_hkmlk is empty for all rows of this hakmilik. ` +
  `kat_id = 852 was also checked but resolves to kod=KATETAX (Kategori Tax), not Kategori Kegunaan Tanah. ` +
  `Data for this specific hakmilik is genuinely absent \u2014 consistent with Maklumat Hakmilik screen showing the field red.`;
const S3_CAPTIONS = [
  "populateKegunaan() \u2014 only handles URS_PRU; PSBS falls through to HYPHEN default",
];

const S4_TEXT =
  `Add an else-if branch for URS_PSBS in populateKegunaan() after line 11145: ` +
  `else if (URS_PSBS.equals(parameter.kodUrusan.get())) { ` +
  `if (!CollectionUtils.isEmpty(parameter.ahList) && StringUtils.isNotBlank(parameter.ahList.get(0).getKegunaanTanah())) { ` +
  `kegunaan = parameter.ahList.get(0).getKegunaanTanah(); } }. ` +
  `getKegunaanTanah() returns String (kegunaan_tnh is varchar \u2014 no join needed). ` +
  `For this test hakmilik, result remains "-" as data is genuinely absent \u2014 this is correct behaviour.`;
const S4_CAPTIONS = [];
const S4_NOTE =
  `parameter.ahList = List<AppHakmilik> (PelupusanTemplateReportMethodParameter.java:130,342). ` +
  `kegunaan_tnh confirmed varchar \u2014 getKegunaanTanah() returns String. ` +
  `kat_id ruled out \u2014 it is Kategori Tax (KATETAX), not land use category.`;

const S5_ROWS = [
  ["Status",         "Code bug confirmed \u2014 fix ready for implementation"],
  ["File to change", "PelupusanWordCCMethodConstant.java \u2014 populateKegunaan() ~line 11145"],
  ["Affected scope", "PSBS \u2014 Borang Permohonan (AWAM), Kategori Kegunaan Tanah CC tag"],
  ["Risk",           "Low \u2014 isolated else-if addition, no change to existing PRU logic"],
];

// ════════════════════════════════════════════════════════════════════════════
// COLOURS (hex strings for docx API)
// ════════════════════════════════════════════════════════════════════════════

const C = {
  DARK_BLUE : "1F497D",
  MID_BLUE  : "4072C4",
  HDG_BLUE  : "2F5496",
  RULE_BLUE : "4472C4",
  GRAY      : "595659",
  WHITE     : "FFFFFF",
  TBL_HDR   : "1F3664",
  TBL_ALT   : "D9E2F3",
  RULE_GRAY : "BFBFBF",
  PLACEHOLDER: "BFBFBF",
};

const FS  = (n) => n * 2;            // font size: points → half-points (docx unit)
const SP  = (n) => n * 20;           // spacing:   points → twips (docx unit)
const IN  = (n) => convertInchesToTwip(n);

// ════════════════════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════════════════════

function hrule(color = C.RULE_GRAY) {
  return new Paragraph({
    spacing: { before: 0, after: 0 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 6, color, space: 1 },
    },
    children: [],
  });
}

function spacer(before = 0, after = 60) {
  return new Paragraph({ spacing: { before, after }, children: [] });
}

function titleBlock() {
  return [
    new Paragraph({
      spacing: { before: 0, after: SP(6) },
      children: [
        new TextRun({
          text: "Bug Fix Report",
          bold: true,
          size: FS(26),
          color: C.DARK_BLUE,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: SP(2) },
      children: [
        new TextRun({
          text: `QA #${QA_NUMBER}  \u2014  ${QA_TITLE}`,
          size: FS(11),
          color: C.DARK_BLUE,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 0, after: SP(6) },
      children: [
        new TextRun({
          text: `Module: ${MODULE}  \u00B7  Env: ${ENV}  \u00B7  Urusan: ${URUSAN}  \u00B7  ${DATE}`,
          size: FS(10),
          color: C.MID_BLUE,
        }),
      ],
    }),
    hrule(C.RULE_GRAY),
  ];
}

function sectionHead(n, title) {
  return new Paragraph({
    spacing: { before: SP(14), after: SP(4) },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.RULE_BLUE, space: 1 },
    },
    children: [
      new TextRun({
        text: `${n}. ${title}`,
        bold: true,
        size: FS(13),
        color: C.HDG_BLUE,
      }),
    ],
  });
}

function bodyText(text) {
  return new Paragraph({
    spacing: { before: 0, after: SP(6) },
    children: [new TextRun({ text, size: FS(11) })],
  });
}

function caption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: SP(2), after: SP(8) },
    children: [
      new TextRun({ text, italics: true, size: FS(9), color: C.GRAY }),
    ],
  });
}

function imageParagraph(shotPath) {
  if (shotPath && fs.existsSync(shotPath)) {
    const data = fs.readFileSync(shotPath);
    const ext  = path.extname(shotPath).toLowerCase().replace(".", "");
    const type = (ext === "jpg" || ext === "jpeg") ? "jpg" : ext === "gif" ? "gif" : "png";
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: SP(4), after: SP(2) },
      children: [new ImageRun({ data, transformation: { width: 540, height: 300 }, type })],
    });
  }
  // Placeholder
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: SP(8), after: SP(4) },
    border: {
      top:    { style: BorderStyle.SINGLE, size: 4, color: C.PLACEHOLDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: C.PLACEHOLDER },
      left:   { style: BorderStyle.SINGLE, size: 4, color: C.PLACEHOLDER },
      right:  { style: BorderStyle.SINGLE, size: 4, color: C.PLACEHOLDER },
    },
    children: [
      new TextRun({ text: "[ Screenshot Placeholder ]", size: FS(10), color: C.PLACEHOLDER }),
    ],
  });
}

function imageBlock(shotPath, captionText) {
  return [imageParagraph(shotPath), caption(captionText)];
}

function impactTable(rows) {
  const headerRow = new TableRow({
    children: ["Item", "Detail"].map((txt) =>
      new TableCell({
        width: { size: txt === "Item" ? IN(2.0) : IN(4.2), type: WidthType.DXA },
        shading: { fill: C.TBL_HDR, type: ShadingType.CLEAR, color: "auto" },
        children: [
          new Paragraph({
            spacing: { before: SP(3), after: SP(3) },
            children: [
              new TextRun({ text: txt, bold: true, size: FS(11), color: C.WHITE }),
            ],
          }),
        ],
      })
    ),
  });

  const dataRows = rows.map(([item, detail], i) => {
    const shade = i % 2 === 1
      ? { fill: C.TBL_ALT, type: ShadingType.CLEAR, color: "auto" }
      : undefined;
    return new TableRow({
      children: [
        new TableCell({
          width: { size: IN(2.0), type: WidthType.DXA },
          shading: shade,
          children: [
            new Paragraph({
              spacing: { before: SP(3), after: SP(3) },
              children: [new TextRun({ text: item, bold: true, size: FS(11) })],
            }),
          ],
        }),
        new TableCell({
          width: { size: IN(4.2), type: WidthType.DXA },
          shading: shade,
          children: [
            new Paragraph({
              spacing: { before: SP(3), after: SP(3) },
              children: [new TextRun({ text: detail, size: FS(11) })],
            }),
          ],
        }),
      ],
    });
  });

  return new Table({
    width: { size: IN(6.2), type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

function footerBlock() {
  return [
    spacer(SP(8), 0),
    hrule(C.RULE_GRAY),
    new Paragraph({
      spacing: { before: SP(4), after: 0 },
      children: [
        new TextRun({
          text: `${MODULE}  \u00B7  Melaka  \u00B7  ${DATE}  \u00B7  ${ASSIGNEE}`,
          size: FS(9),
          color: C.GRAY,
        }),
      ],
    }),
  ];
}

// ════════════════════════════════════════════════════════════════════════════
// BUILD
// ════════════════════════════════════════════════════════════════════════════

async function build() {
  const children = [
    ...titleBlock(),

    // 1. Ticket
    sectionHead(1, "Ticket"),
    ...imageBlock(SHOTS.ticket, S1_CAPTION),

    // 2. Issue
    sectionHead(2, "Issue"),
    bodyText(S2_TEXT),
    ...imageBlock(SHOTS.issue, S2_CAPTION),

    // 3. Root Cause
    sectionHead(3, "Root Cause"),
    bodyText(S3_TEXT),
    ...SHOTS.rootCause.flatMap((img, i) =>
      imageBlock(img, S3_CAPTIONS[i] ?? "")
    ),

    // 4. Fix
    sectionHead(4, "Fix"),
    bodyText(S4_TEXT),
    ...SHOTS.fix.flatMap((img, i) =>
      imageBlock(img, S4_CAPTIONS[i] ?? "")
    ),
    bodyText(S4_NOTE),

    // 5. Impact & Safety
    sectionHead(5, "Impact & Safety"),
    impactTable(S5_ROWS),

    ...footerBlock(),
  ];

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          margin: {
            top: IN(1), bottom: IN(1), left: IN(1), right: IN(1),
          },
        },
      },
      children,
    }],
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`\u2713 Saved: ${OUTPUT}`);
}

build().catch(console.error);
