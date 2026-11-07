import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { hashPassword, comparePassword } from '../../src/shared/utils/password.js';

describe('Password Utilities', () => {
  it('should hash a password', async () => {
    const password = 'testpassword123';
    const hash = await hashPassword(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);
  });

  it('should compare a password with its hash', async () => {
    const password = 'testpassword123';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(password, hash);
    expect(isValid).toBe(true);
  });

  it('should return false for incorrect password', async () => {
    const password = 'testpassword123';
    const wrongPassword = 'wrongpassword123';
    const hash = await hashPassword(password);

    const isValid = await comparePassword(wrongPassword, hash);
    expect(isValid).toBe(false);
  });

  it('should generate different hashes for same password', async () => {
    const password = 'testpassword123';
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);

    // But both should validate correctly
    const isValid1 = await comparePassword(password, hash1);
    const isValid2 = await comparePassword(password, hash2);
    expect(isValid1).toBe(true);
    expect(isValid2).toBe(true);
  });
});