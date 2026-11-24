/**
 * Abstract storage interface for file upload/download/delete.
 * Implementations: R2StorageAdapter (Cloudflare R2), LocalStorageAdapter (dev fallback).
 */
export interface PresignedUrlResult {
  url: string;
  key: string;
  expiresIn: number; // seconds
}

export interface StorageService {
  /**
   * Generate a presigned PUT URL for direct client upload.
   * @param key - Object key (path) in the bucket
   * @param contentType - MIME type of the file
   * @param maxSizeBytes - Maximum allowed file size
   * @param expiresIn - URL expiry in seconds (default: 120 = 2 mins)
   */
  generatePutUrl(
    key: string,
    contentType: string,
    maxSizeBytes: number,
    expiresIn?: number,
  ): Promise<PresignedUrlResult>;

  /**
   * Generate a presigned GET URL for temporary file access.
   * @param key - Object key to generate URL for
   * @param expiresIn - URL expiry in seconds (default: 120 = 2 mins)
   */
  generateGetUrl(key: string, expiresIn?: number): Promise<string>;

  /**
   * Permanently delete an object from storage.
   * @param key - Object key to delete
   */
  deleteObject(key: string): Promise<void>;
}
