import { Injectable } from '@nestjs/common';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'crypto';
import { promisify } from 'util';

const scrypt = promisify(scryptCallback);

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  async verify(password: string, storedHash: string): Promise<boolean> {
    const [salt, originalKeyHex] = storedHash.split(':');

    if (!salt || !originalKeyHex) {
      return false;
    }

    const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
    const originalKey = Buffer.from(originalKeyHex, 'hex');

    if (derivedKey.length !== originalKey.length) {
      return false;
    }

    return timingSafeEqual(derivedKey, originalKey);
  }
}
