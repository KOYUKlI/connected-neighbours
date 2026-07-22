import { PDFDocument } from 'pdf-lib';

import { DocumentPdfService } from './document-pdf.service';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { ServiceStatus, ServiceType } from '../services/schemas/service.schema';
import { SignatureFieldType } from './schemas/managed-document.schema';

describe('DocumentPdfService', () => {
  const service = new DocumentPdfService();

  it('generates a readable contract PDF without private contact data', async () => {
    const result = await service.generateContractPdf({
      documentId: 'document-demo-01',
      contract: {
        serviceId: 'service-demo-01',
        applicationId: 'application-demo-01',
        requesterId: 'requester-demo-01',
        providerId: 'provider-demo-01',
        payerId: 'requester-demo-01',
        receiverId: 'provider-demo-01',
        pricePoints: 25,
        status: ContractStatus.SENT,
        signedByIds: [],
        signedAt: null,
        completedAt: null,
        activeDisputeId: null,
        documentId: null,
        finalizedDocumentFileId: null,
        documentFinalSha256: null,
      },
      service: {
        title: 'Aide pour monter un meuble',
        description: 'Montage d une armoire dans le quartier.',
        type: ServiceType.REQUEST,
        category: 'Bricolage',
        availability: 'Samedi matin',
        status: ServiceStatus.AWAITING_SIGNATURES,
        ownerId: 'requester-demo-01',
        neighborhoodId: 'neighborhood-demo-01',
        isPaid: true,
        pricePoints: 25,
      } as never,
      requester: publicProfile('requester-demo-01', 'Alice Martin'),
      provider: publicProfile('provider-demo-01', 'Bob Dupont'),
    });

    expect(Buffer.from(result.bytes).subarray(0, 5).toString('ascii')).toBe(
      '%PDF-',
    );
    expect(result.pageCount).toBe(1);
    await expect(PDFDocument.load(result.bytes)).resolves.toBeDefined();
  });

  it('creates immutable revisions and a separate integrity page', async () => {
    const source = await PDFDocument.create();
    source.addPage([595, 842]);
    const original = await source.save();
    const signedAt = new Date('2026-07-21T10:00:00.000Z');
    const revised = await service.applySignature({
      source: original,
      fields: [
        {
          id: 'field-1',
          type: SignatureFieldType.SIGNATURE,
          pageNumber: 1,
          x: 0.1,
          y: 0.7,
          width: 0.35,
          height: 0.1,
          assignedToUserId: 'requester-demo-01',
          required: true,
          label: 'Signature du demandeur',
          value: 'Alice Martin',
          signedAt,
          signatureId: 'signature-1',
        },
      ],
      signerName: 'Alice Martin',
      signatureText: 'Alice Martin',
      signedAt,
      reference: 'SIG-DEMO01',
    });
    const finalized = await service.finalize({
      source: revised,
      documentId: 'document-demo-01',
      signatures: [
        {
          id: 'signature-1',
          signerId: 'requester-demo-01',
          fieldIds: ['field-1'],
          signedAt,
          sourceSha256: 'a'.repeat(64),
          resultSha256: 'b'.repeat(64),
          documentVersion: 2,
          consentVersion: 'signature-applicative-v1',
          auditReference: 'SIG-DEMO01',
        },
      ],
      signedRevisionSha256: 'b'.repeat(64),
      finalizedAt: signedAt,
      signerNames: new Map([['requester-demo-01', 'Alice Martin']]),
    });

    expect(Buffer.from(original)).not.toEqual(Buffer.from(revised));
    expect(Buffer.from(revised)).not.toEqual(Buffer.from(finalized));
    expect((await PDFDocument.load(finalized)).getPageCount()).toBe(2);
  });
});

function publicProfile(id: string, displayName: string) {
  return {
    id,
    displayName,
    avatarUrl: null,
    neighborhoodId: 'neighborhood-demo-01',
    reputationScore: null,
    averageRating: null,
    reviewCount: 0,
    completedServicesCount: 0,
  };
}
