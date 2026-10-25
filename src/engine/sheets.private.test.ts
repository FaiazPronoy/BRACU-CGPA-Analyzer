import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { timeline } from './grades';
import { checkSheet, parsePages, TextCell } from './gradesheet';

const dir = path.resolve(__dirname, '../../fixtures/private');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf')) : [];
const expectedPath = path.join(dir, 'expected.json');
const expected: Record<string, { lists?: Record<string, string | null> }> = fs.existsSync(expectedPath) ? JSON.parse(fs.readFileSync(expectedPath, 'utf8')) : {};

async function pagesOf(file: string): Promise<TextCell[][]> {
  const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, file))) }).promise;
  const pages: TextCell[][] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    pages.push(content.items.filter((it) => 'str' in it).map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5] })));
  }
  return pages;
}

describe.skipIf(!files.length)('real grade sheets', () => {
  it.each(files)('%s: every semester matches what the sheet prints', async (file: string) => {
    const sheet = parsePages(await pagesOf(file));
    const checks = checkSheet(sheet);
    expect(checks.length).toBeGreaterThan(0);
    const wrong = checks.filter((c) => !c.ok).map((c) => ({ semester: c.semester, figures: c.figures }));
    expect(wrong).toEqual([]);
    const lists = expected[file]?.lists;
    if (lists) {
      const ours = Object.fromEntries(timeline(sheet.attempts).map((r) => [r.semester, r.list]));
      expect(ours).toEqual(lists);
    }
  });
});
