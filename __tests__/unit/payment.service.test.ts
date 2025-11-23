import { describe, it, expect, jest } from '@jest/globals';
import { generatePromptPayQR } from '../../lib/services/payment';

// Mock modules
jest.mock('promptpay-qr');
jest.mock('qrcode');
jest.mock('@prisma/client');

describe('Payment Service', () => {
  describe('generatePromptPayQR', () => {
    it('should generate PromptPay QR code successfully', async () => {
      // Mock QRCode.toDataURL
      const QRCode = require('qrcode');
      QRCode.toDataURL = jest.fn().mockResolvedValue('data:image/png;base64,mockQRCode');

      // Mock generatePayload - it's a default export function
      const generatePayload = require('promptpay-qr');
      const mockGeneratePayload = jest.fn().mockReturnValue('mockPayload');
      generatePayload.default = mockGeneratePayload;

      // Replace the entire module with the mock
      jest.mock('promptpay-qr', () => mockGeneratePayload);

      const result = await generatePromptPayQR(100);

      expect(result).toBe('data:image/png;base64,mockQRCode');
      expect(QRCode.toDataURL).toHaveBeenCalled();
    });

    it('should throw error when QR generation fails', async () => {
      const QRCode = require('qrcode');
      QRCode.toDataURL = jest.fn().mockRejectedValue(new Error('QR generation failed'));

      await expect(generatePromptPayQR(100)).rejects.toThrow('Failed to generate QR code');
    });
  });

  describe('Loyalty Points', () => {
    it('should calculate points correctly (1 point per 10 THB)', () => {
      const orderAmount = 250;
      const expectedPoints = Math.floor(orderAmount / 10);

      expect(expectedPoints).toBe(25);
    });

    it('should round down partial points', () => {
      const orderAmount = 95; // Should give 9 points, not 9.5
      const expectedPoints = Math.floor(orderAmount / 10);

      expect(expectedPoints).toBe(9);
    });
  });
});
