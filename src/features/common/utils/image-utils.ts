/**
 * Image processing utilities for resizing and optimizing images
 */

/**
 * Resizes an image file to the specified dimensions while maintaining aspect ratio
 * and returns it as a data URL
 *
 * @param file - The image file to resize
 * @param maxWidth - Maximum width in pixels (default: 64)
 * @param maxHeight - Maximum height in pixels (default: 64)
 * @param quality - JPEG quality from 0 to 1 (default: 0.8)
 * @returns Promise that resolves to a data URL string of the resized image
 */
export function resizeImage(
  file: File,
  maxWidth: number = 64,
  maxHeight: number = 64,
  quality: number = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    // Create an image element to load the file
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width: newWidth, height: newHeight } = calculateDimensions(
          img.width,
          img.height,
          maxWidth,
          maxHeight
        );

        // Create canvas for resizing
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }

        // Set canvas dimensions
        canvas.width = newWidth;
        canvas.height = newHeight;

        // Draw the resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Convert to data URL
        // Use JPEG for better compression, PNG for images with transparency
        const mimeType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);

        resolve(dataUrl);
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Calculates new dimensions for an image while maintaining aspect ratio
 *
 * @param originalWidth - Original image width
 * @param originalHeight - Original image height
 * @param maxWidth - Maximum allowed width
 * @param maxHeight - Maximum allowed height
 * @returns Object with new width and height
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  // If image is already smaller than max dimensions, return original size
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // Calculate scaling ratios
  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;

  // Use the smaller ratio to maintain aspect ratio
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Validates if a file is a supported image type
 *
 * @param file - File to validate
 * @returns true if file is a supported image type
 */
export function isValidImageFile(file: File): boolean {
  const supportedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
  ];

  return supportedTypes.includes(file.type);
}

/**
 * Gets the estimated size of a data URL in bytes
 *
 * @param dataUrl - Data URL string
 * @returns Estimated size in bytes
 */
export function getDataUrlSize(dataUrl: string): number {
  // Remove data URL prefix to get just the base64 data
  const base64Data = dataUrl.split(',')[1] || '';

  // Base64 encoding increases size by ~33%, so we can estimate original size
  // Each base64 character represents 6 bits, so 4 chars = 3 bytes
  return Math.round((base64Data.length * 3) / 4);
}
