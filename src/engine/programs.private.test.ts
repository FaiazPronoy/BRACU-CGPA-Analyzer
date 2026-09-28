// Which program each real grade sheet in fixtures/private says it is.
import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { parsePages, TextCell } from './gradesheet';
import { detectProgram } from './programs';

const dir = path.resolve(__dirname, '../../fixtures/private');
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.toLowerCase().endsWith('.pdf')) : [];

describe.skipIf(!files.length)('program on real grade sheets', () => {
  it.each(files)('%s: names a program we know', async (file: string) => {
    const { getDocument } = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(path.join(dir, file))), verbosity: 0 }).promise;
    const content = await (await doc.getPage(1)).getTextContent();
    const cells: TextCell[] = content.items.filter((it) => 'str' in it).map((it: any) => ({ str: it.str, x: it.transform[4], y: it.transform[5] }));
    const sheet = parsePages([cells]);
    console.log(file, '->', sheet.program, '->', detectProgram(sheet.program)?.code);
    expect(detectProgram(sheet.program)).not.toBeNull();
  });
});
