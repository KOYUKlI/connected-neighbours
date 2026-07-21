import { BadRequestException, ConflictException } from '@nestjs/common';

import { randomUUID } from 'crypto';
import { ContractStatus } from '../contracts/schemas/contract.schema';
import { DocumentsService } from './documents.service';
import type { SignDocumentDto } from './dto/sign-document.dto';
import type { DocumentFieldDto } from './dto/update-document-fields.dto';
import {
  SignatureFieldType,
  type SignatureField,
} from './schemas/managed-document.schema';

type DocumentRules = {
  normalizeAndValidateFields(
    input: DocumentFieldDto[],
    document: { pageCount: number },
    contract: { requesterId: string; providerId: string },
  ): SignatureField[];
  resolveSignedFields(
    fields: SignatureField[],
    dto: SignDocumentDto,
  ): SignatureField[];
  assertRequiredSignatureFields(
    fields: SignatureField[],
    contract: { requesterId: string; providerId: string },
  ): void;
  assertContractDocumentAllowed(contract: {
    status: ContractStatus;
    activeDisputeId?: string | null;
  }): void;
};

describe('DocumentsService document rules', () => {
  const service = new DocumentsService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  const rules = service as unknown as DocumentRules;
  const contract = {
    requesterId: '507f1f77bcf86cd799439011',
    providerId: '507f1f77bcf86cd799439012',
  };

  it('normalizes valid fields and rejects a field outside the page', () => {
    const valid = field({
      assignedToUserId: contract.requesterId,
      x: 0.1,
      width: 0.3,
    });

    const [normalized] = rules.normalizeAndValidateFields(
      [valid],
      { pageCount: 1 },
      contract,
    );

    expect(normalized.id).toBeTruthy();
    expect(normalized.signedAt).toBeNull();

    expect(() =>
      rules.normalizeAndValidateFields(
        [field({ assignedToUserId: contract.requesterId, x: 0.9, width: 0.2 })],
        { pageCount: 1 },
        contract,
      ),
    ).toThrow(BadRequestException);
  });

  it('rejects a field assigned to a contract outsider', () => {
    expect(() =>
      rules.normalizeAndValidateFields(
        [field({ assignedToUserId: '507f1f77bcf86cd799439099' })],
        { pageCount: 1 },
        contract,
      ),
    ).toThrow(BadRequestException);
  });

  it('requires one mandatory signature field for each party', () => {
    const requesterField = signatureField(contract.requesterId);

    expect(() =>
      rules.assertRequiredSignatureFields([requesterField], contract),
    ).toThrow(BadRequestException);

    expect(() =>
      rules.assertRequiredSignatureFields(
        [requesterField, signatureField(contract.providerId)],
        contract,
      ),
    ).not.toThrow();
  });

  it('signs assigned fields once and keeps signed fields immutable', () => {
    const unsigned = signatureField(contract.requesterId);
    const signed = rules.resolveSignedFields([unsigned], {
      consent: true,
      signatureText: 'Alice Martin',
      values: [{ fieldId: unsigned.id, value: 'Alice Martin' }],
    });

    expect(signed[0].value).toBe('Alice Martin');
    expect(signed[0].signedAt).toBeInstanceOf(Date);
    expect(signed[0].signatureId).toBeTruthy();

    expect(() =>
      rules.resolveSignedFields(signed, {
        consent: true,
        signatureText: 'Alice Martin',
        values: [{ fieldId: signed[0].id, value: 'Alice Martin' }],
      }),
    ).toThrow(ConflictException);
  });

  it('blocks document operations while the contract is disputed', () => {
    expect(() =>
      rules.assertContractDocumentAllowed({
        status: ContractStatus.DISPUTED,
        activeDisputeId: '507f1f77bcf86cd799439099',
      }),
    ).toThrow(ConflictException);

    expect(() =>
      rules.assertContractDocumentAllowed({
        status: ContractStatus.SENT,
        activeDisputeId: null,
      }),
    ).not.toThrow();
  });
});

function field(overrides: Partial<DocumentFieldDto> = {}): DocumentFieldDto {
  return {
    type: SignatureFieldType.SIGNATURE,
    pageNumber: 1,
    x: 0.1,
    y: 0.7,
    width: 0.3,
    height: 0.08,
    assignedToUserId: '507f1f77bcf86cd799439011',
    required: true,
    ...overrides,
  };
}

function signatureField(userId: string): SignatureField {
  return {
    id: randomUUID(),
    type: SignatureFieldType.SIGNATURE,
    pageNumber: 1,
    x: userId.endsWith('11') ? 0.1 : 0.55,
    y: 0.75,
    width: 0.3,
    height: 0.08,
    assignedToUserId: userId,
    required: true,
    label: 'Signature',
    signedAt: null,
    value: null,
    signatureId: null,
  };
}
