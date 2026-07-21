import { Injectable } from '@nestjs/common';
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from 'pdf-lib';

import type { PublicUserDto } from '../users/dto/public-user.dto';
import type { Contract } from '../contracts/schemas/contract.schema';
import type { Service } from '../services/schemas/service.schema';
import {
  SignatureFieldType,
  type DocumentSignatureEvent,
  type SignatureField,
} from './schemas/managed-document.schema';

@Injectable()
export class DocumentPdfService {
  async generateContractPdf(input: {
    documentId: string;
    contract: Contract;
    service: Service;
    requester: PublicUserDto;
    provider: PublicUserDto;
  }) {
    const pdf = await PDFDocument.create();
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([595.28, 841.89]);
    const margin = 54;
    let y = 790;

    page.drawText('CONNECTED NEIGHBOURS', {
      x: margin,
      y,
      size: 11,
      font: bold,
      color: rgb(0.04, 0.42, 0.3),
    });
    y -= 36;
    page.drawText('Contrat de service entre voisins', {
      x: margin,
      y,
      size: 22,
      font: bold,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 22;
    page.drawText(
      `Reference : CTR-${input.contract.serviceId.slice(-8).toUpperCase()}`,
      { x: margin, y, size: 10, font: regular, color: rgb(0.35, 0.39, 0.47) },
    );
    y -= 34;

    y = this.drawSection(
      page,
      regular,
      bold,
      'Service',
      [
        ['Intitule', input.service.title],
        ['Categorie', input.service.category],
        ['Description', input.service.description],
        ['Disponibilite', input.service.availability],
        ['Montant', `${input.contract.pricePoints} points`],
      ],
      margin,
      y,
    );
    y -= 18;
    y = this.drawSection(
      page,
      regular,
      bold,
      'Parties',
      [
        ['Demandeur', input.requester.displayName],
        ['Prestataire', input.provider.displayName],
      ],
      margin,
      y,
    );
    y -= 18;
    y = this.drawParagraph(
      page,
      regular,
      bold,
      'Conditions principales',
      'Le prestataire realise le service convenu. Les points sont reserves avant execution puis transferes apres validation, sauf litige. Les parties s engagent a utiliser les preuves et le suivi applicatif de bonne foi.',
      margin,
      y,
    );
    y -= 20;
    page.drawText(`Genere le ${this.formatDate(new Date())}`, {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: rgb(0.35, 0.39, 0.47),
    });
    y -= 14;
    page.drawText(`Document ${input.documentId}`, {
      x: margin,
      y,
      size: 9,
      font: regular,
      color: rgb(0.35, 0.39, 0.47),
    });
    y -= 32;
    page.drawText(
      'Signature applicative horodatee et scellee par empreinte SHA-256',
      { x: margin, y, size: 9, font: bold, color: rgb(0.15, 0.23, 0.34) },
    );

    const signatureY = 85;
    page.drawRectangle({
      x: margin,
      y: signatureY,
      width: 220,
      height: 76,
      borderWidth: 1,
      borderColor: rgb(0.75, 0.79, 0.84),
    });
    page.drawText('Signature du demandeur', {
      x: margin + 10,
      y: signatureY + 58,
      size: 9,
      font: bold,
    });
    page.drawRectangle({
      x: 321,
      y: signatureY,
      width: 220,
      height: 76,
      borderWidth: 1,
      borderColor: rgb(0.75, 0.79, 0.84),
    });
    page.drawText('Signature du prestataire', {
      x: 331,
      y: signatureY + 58,
      size: 9,
      font: bold,
    });

    return { bytes: await pdf.save(), pageCount: pdf.getPageCount() };
  }

  async inspect(buffer: Uint8Array) {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: false });
    return { pageCount: pdf.getPageCount() };
  }

  async applySignature(input: {
    source: Uint8Array;
    fields: SignatureField[];
    signerName: string;
    signatureText: string;
    signedAt: Date;
    reference: string;
  }) {
    const pdf = await PDFDocument.load(input.source);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    for (const field of input.fields) {
      const page = pdf.getPage(field.pageNumber - 1);
      if (!page) continue;
      const { width: pageWidth, height: pageHeight } = page.getSize();
      const x = field.x * pageWidth;
      const width = field.width * pageWidth;
      const height = field.height * pageHeight;
      const y = pageHeight - (field.y + field.height) * pageHeight;
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: rgb(0.96, 0.99, 0.98),
        borderColor: rgb(0.1, 0.55, 0.4),
        borderWidth: 0.8,
      });
      const label = field.label ?? this.fieldLabel(field.type);
      page.drawText(this.clean(label), {
        x: x + 5,
        y: y + height - 11,
        size: 7,
        font: bold,
        color: rgb(0.25, 0.35, 0.4),
      });
      const value = this.fieldValue(field, input.signatureText, input.signedAt);
      page.drawText(this.clean(value).slice(0, 90), {
        x: x + 5,
        y: y + Math.max(6, height / 2 - 4),
        size: Math.min(12, Math.max(7, height / 4)),
        font: field.type === SignatureFieldType.SIGNATURE ? bold : regular,
        color: rgb(0.04, 0.16, 0.13),
        maxWidth: Math.max(10, width - 10),
      });
      if (field.type === SignatureFieldType.SIGNATURE) {
        page.drawText(
          this.clean(
            `${input.signerName} - ${this.formatDate(input.signedAt)} - ${input.reference}`,
          ),
          {
            x: x + 5,
            y: y + 5,
            size: 5.8,
            font: regular,
            color: rgb(0.35, 0.39, 0.47),
            maxWidth: Math.max(10, width - 10),
          },
        );
      }
    }
    return pdf.save();
  }

  async finalize(input: {
    source: Uint8Array;
    documentId: string;
    signatures: DocumentSignatureEvent[];
    signedRevisionSha256: string;
    finalizedAt: Date;
    signerNames: Map<string, string>;
  }) {
    const pdf = await PDFDocument.load(input.source);
    const regular = await pdf.embedFont(StandardFonts.Helvetica);
    const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([595.28, 841.89]);
    const margin = 54;
    let y = 780;
    page.drawText('Preuve d integrite applicative', {
      x: margin,
      y,
      size: 22,
      font: bold,
      color: rgb(0.06, 0.09, 0.16),
    });
    y -= 40;
    y = this.drawKeyValue(
      page,
      regular,
      bold,
      'Document',
      input.documentId,
      margin,
      y,
    );
    y = this.drawKeyValue(
      page,
      regular,
      bold,
      'Finalisation',
      this.formatDate(input.finalizedAt),
      margin,
      y,
    );
    y -= 12;
    page.drawText('Signataires', { x: margin, y, size: 12, font: bold });
    y -= 22;
    for (const signature of input.signatures) {
      const signer =
        input.signerNames.get(signature.signerId) ?? 'Partie au contrat';
      page.drawText(
        this.clean(
          `${signer} - ${this.formatDate(signature.signedAt)} - ${signature.auditReference}`,
        ),
        { x: margin, y, size: 9, font: regular },
      );
      y -= 18;
    }
    y -= 18;
    page.drawText('Empreinte SHA-256 de la derniere revision signee', {
      x: margin,
      y,
      size: 10,
      font: bold,
    });
    y -= 20;
    this.drawWrapped(
      page,
      regular,
      input.signedRevisionSha256,
      margin,
      y,
      487,
      9,
      14,
    );
    y -= 54;
    page.drawText('Nature du scellement', {
      x: margin,
      y,
      size: 10,
      font: bold,
    });
    y -= 20;
    this.drawWrapped(
      page,
      regular,
      'Signature applicative horodatee et scellee par empreinte SHA-256. Ce mecanisme ne constitue pas une signature electronique qualifiee ou certifiee.',
      margin,
      y,
      487,
      10,
      15,
    );
    return pdf.save();
  }

  private drawSection(
    page: PDFPage,
    regular: PDFFont,
    bold: PDFFont,
    title: string,
    rows: Array<[string, string]>,
    x: number,
    y: number,
  ) {
    page.drawText(title, {
      x,
      y,
      size: 13,
      font: bold,
      color: rgb(0.04, 0.42, 0.3),
    });
    y -= 22;
    for (const [label, rawValue] of rows) {
      page.drawText(this.clean(label), { x, y, size: 9, font: bold });
      const value = this.clean(rawValue || 'Non renseigne');
      const used = this.drawWrapped(
        page,
        regular,
        value,
        x + 105,
        y,
        380,
        9,
        13,
      );
      y -= Math.max(18, used);
    }
    return y;
  }

  private drawParagraph(
    page: PDFPage,
    regular: PDFFont,
    bold: PDFFont,
    title: string,
    text: string,
    x: number,
    y: number,
  ) {
    page.drawText(title, {
      x,
      y,
      size: 13,
      font: bold,
      color: rgb(0.04, 0.42, 0.3),
    });
    y -= 22;
    return (
      y - this.drawWrapped(page, regular, this.clean(text), x, y, 487, 9, 14)
    );
  }

  private drawKeyValue(
    page: PDFPage,
    regular: PDFFont,
    bold: PDFFont,
    label: string,
    value: string,
    x: number,
    y: number,
  ) {
    page.drawText(label, { x, y, size: 10, font: bold });
    page.drawText(this.clean(value), {
      x: x + 110,
      y,
      size: 10,
      font: regular,
    });
    return y - 24;
  }

  private drawWrapped(
    page: PDFPage,
    font: PDFFont,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    size: number,
    lineHeight: number,
  ) {
    const words = text.split(/\s+/);
    let line = '';
    let lines = 0;
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        page.drawText(line, { x, y: y - lines * lineHeight, size, font });
        lines += 1;
        line = word;
      } else line = candidate;
    }
    if (line) {
      page.drawText(line, { x, y: y - lines * lineHeight, size, font });
      lines += 1;
    }
    return lines * lineHeight;
  }

  private fieldValue(
    field: SignatureField,
    signatureText: string,
    signedAt: Date,
  ) {
    if (field.type === SignatureFieldType.DATE)
      return this.formatDate(signedAt);
    if (field.type === SignatureFieldType.CHECKBOX)
      return field.value === true ? '[X]' : '[ ]';
    return typeof field.value === 'string' && field.value
      ? field.value
      : signatureText;
  }

  private fieldLabel(type: SignatureFieldType) {
    return type === SignatureFieldType.SIGNATURE
      ? 'Signature'
      : type === SignatureFieldType.INITIALS
        ? 'Initiales'
        : type === SignatureFieldType.DATE
          ? 'Date'
          : type === SignatureFieldType.CHECKBOX
            ? 'Confirmation'
            : 'Texte';
  }

  private formatDate(value: Date) {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Europe/Paris',
    }).format(value);
  }

  private clean(value: string) {
    return value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[’‘]/g, "'")
      .replace(/[–—]/g, '-')
      .replace(/[^\x20-\x7E]/g, ' ');
  }
}
