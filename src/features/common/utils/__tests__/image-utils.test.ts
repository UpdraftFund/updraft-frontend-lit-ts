import { expect } from '@open-wc/testing';
import { resizeImage, isValidImageFile, getDataUrlSize } from '../image-utils.js';

describe('Image Utils', () => {
  describe('isValidImageFile', () => {
    it('should return true for valid image types', () => {
      const jpegFile = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const pngFile = new File([''], 'test.png', { type: 'image/png' });
      const gifFile = new File([''], 'test.gif', { type: 'image/gif' });
      const webpFile = new File([''], 'test.webp', { type: 'image/webp' });

      expect(isValidImageFile(jpegFile)).to.be.true;
      expect(isValidImageFile(pngFile)).to.be.true;
      expect(isValidImageFile(gifFile)).to.be.true;
      expect(isValidImageFile(webpFile)).to.be.true;
    });

    it('should return false for invalid file types', () => {
      const textFile = new File([''], 'test.txt', { type: 'text/plain' });
      const pdfFile = new File([''], 'test.pdf', { type: 'application/pdf' });

      expect(isValidImageFile(textFile)).to.be.false;
      expect(isValidImageFile(pdfFile)).to.be.false;
    });
  });

  describe('getDataUrlSize', () => {
    it('should estimate data URL size correctly', () => {
      // Simple test data URL (1x1 pixel PNG)
      const dataUrl =
        'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
      const size = getDataUrlSize(dataUrl);

      // Should return a reasonable size estimate
      expect(size).to.be.greaterThan(0);
      expect(size).to.be.lessThan(1000); // Small image should be under 1KB
    });

    it('should handle empty data URL', () => {
      const dataUrl = 'data:image/png;base64,';
      const size = getDataUrlSize(dataUrl);

      expect(size).to.equal(0);
    });
  });

  describe('resizeImage', () => {
    // Create a simple test image programmatically
    function createTestImageFile(): Promise<File> {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d')!;

        // Draw a simple pattern
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 50, 50);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(50, 0, 50, 50);
        ctx.fillStyle = '#0000ff';
        ctx.fillRect(0, 50, 50, 50);
        ctx.fillStyle = '#ffff00';
        ctx.fillRect(50, 50, 50, 50);

        canvas.toBlob((blob) => {
          const file = new File([blob!], 'test.png', { type: 'image/png' });
          resolve(file);
        }, 'image/png');
      });
    }

    it('should resize image to specified dimensions', async () => {
      const testFile = await createTestImageFile();
      const resizedDataUrl = await resizeImage(testFile, 64, 64);

      // Should return a valid data URL
      expect(resizedDataUrl).to.include('data:image/');

      // Create an image to verify dimensions
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = resizedDataUrl;
      });

      // Should be resized to 64x64 (or smaller maintaining aspect ratio)
      expect(img.width).to.be.at.most(64);
      expect(img.height).to.be.at.most(64);
    });

    it('should maintain aspect ratio when resizing', async () => {
      const testFile = await createTestImageFile();
      // Test with non-square max dimensions
      const resizedDataUrl = await resizeImage(testFile, 32, 64);

      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = resizedDataUrl;
      });

      // Original is square (100x100), so resized should be square too (32x32)
      expect(img.width).to.equal(32);
      expect(img.height).to.equal(32);
    });

    it('should handle errors gracefully', async () => {
      // Create an invalid file
      const invalidFile = new File(['invalid image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      try {
        await resizeImage(invalidFile);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
      }
    });
  });
});
