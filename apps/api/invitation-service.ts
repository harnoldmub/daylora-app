import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";

export interface InvitationData {
  id: number;
  firstName: string;
  lastName: string;
  tableNumber: number | null;
  type?: '19' | '21';
}

// Coordinates for text placement on the PDF template (306x1451 points - tall mobile format)
// Name goes just below "Mme, Mlle, M., Couple" placeholder
const POS_NAME_Y = 1355; // 40 pts below header line
// Table goes just below "Votre table" line
const POS_TABLE_Y = 680; // 40 pts below table header

export async function generateInvitationPDF(
  data: InvitationData
): Promise<Buffer> {
  try {
    // Load the template PDF
    const templatePath = path.join(process.cwd(), "templates", "invitation.pdf");
    const templateBytes = fs.readFileSync(templatePath);
    const pdfDoc = await PDFDocument.load(templateBytes);
    
    // Embed fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Get the first page
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    console.log(`PDF dimensions: ${width}x${height}`);
    
    // Full name
    const fullName = `${data.firstName} ${data.lastName.toUpperCase()}`;
    
    // Draw the guest name (centered) at top placeholder area
    const nameSize = 14;
    const nameWidth = helveticaBoldFont.widthOfTextAtSize(fullName, nameSize);
    firstPage.drawText(fullName, {
      x: (width - nameWidth) / 2,
      y: POS_NAME_Y,
      size: nameSize,
      font: helveticaBoldFont,
      color: rgb(0.545, 0.451, 0.333), // Gold/brown color #8b7355
    });
    
    // Table number or "à communiquer"
    const tableText = data.tableNumber 
      ? `Table ${data.tableNumber}` 
      : "Table à communiquer";
    
    const tableSize = 13;
    const tableWidth = helveticaFont.widthOfTextAtSize(tableText, tableSize);
    firstPage.drawText(tableText, {
      x: (width - tableWidth) / 2,
      y: POS_TABLE_Y,
      size: tableSize,
      font: helveticaFont,
      color: rgb(0.545, 0.451, 0.333), // Gold/brown color
    });
    
    // Save the PDF
    const pdfBytes = await pdfDoc.save({
      useObjectStreams: true,
    });
    
    // Compress using ghostscript
    const tempInput = `/tmp/invitation_${data.id}_temp.pdf`;
    const tempOutput = `/tmp/invitation_${data.id}_compressed.pdf`;
    
    fs.writeFileSync(tempInput, pdfBytes);
    
    try {
      // Use ghostscript to compress with screen quality (72dpi)
      execSync(`gs -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=/ebook -dNOPAUSE -dQUIET -dBATCH -sOutputFile=${tempOutput} ${tempInput}`, {
        timeout: 30000,
      });
      
      const compressedBytes = fs.readFileSync(tempOutput);
      
      // Cleanup temp files
      fs.unlinkSync(tempInput);
      fs.unlinkSync(tempOutput);
      
      console.log(`PDF compressed: ${pdfBytes.length} -> ${compressedBytes.length} bytes`);
      return compressedBytes;
    } catch (gsError) {
      console.error("Ghostscript compression failed, returning uncompressed PDF:", gsError);
      fs.unlinkSync(tempInput);
      return Buffer.from(pdfBytes);
    }
  } catch (error) {
    console.error("Error generating invitation PDF:", error);
    throw error;
  }
}
