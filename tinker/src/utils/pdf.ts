function escapePdfText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

function buildPdfTextPage(lines: string[]) {
  const commands = ["BT", "/F1 12 Tf", "40 780 Td"];
  lines.forEach((line, index) => {
    const safeLine = escapePdfText(line.slice(0, 110));
    if (index === 0) {
      commands.push(`(${safeLine}) Tj`);
    } else {
      commands.push("0 -16 Td");
      commands.push(`(${safeLine}) Tj`);
    }
  });
  commands.push("ET");
  return commands.join("\n");
}

export function buildSimplePdf(pages: string[][]) {
  const objects: string[] = [];
  const pageObjectIds = pages.map((_, index) => 3 + index * 3);

  objects[0] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[1] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`;

  pages.forEach((pageLines, index) => {
    const pageId = 3 + index * 3;
    const contentId = pageId + 1;
    const fontId = pageId + 2;
    const stream = buildPdfTextPage(pageLines);

    objects[pageId - 1] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId - 1] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
    objects[fontId - 1] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";
  });

  let pdf = "%PDF-1.4\n";
  const offsets = [0];

  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += "0000000000 65535 f \n";
  offsets.slice(1).forEach((offset) => {
    pdf += `${offset.toString().padStart(10, "0")} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

  return pdf;
}

export function downloadSimplePdf(filename: string, pages: string[][]) {
  const pdf = buildSimplePdf(pages);
  const blob = new Blob([pdf], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
