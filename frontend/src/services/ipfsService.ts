// IPFS service for handling file uploads (simulated for demo)
export interface IPFSUploadResult {
  success: boolean;
  hash?: string;
  url?: string;
  error?: string;
}

export interface IPFSFile {
  file: File;
  name: string;
  size: number;
  type: string;
}

class IPFSService {
  private readonly PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';
  
  /**
   * Upload file to IPFS (simulated)
   * In production, this would use Pinata, Infura, or your own IPFS node
   */
  async uploadFile(file: File): Promise<IPFSUploadResult> {
    try {
      console.log('IPFS: Uploading file:', file.name, 'Size:', file.size);
      
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
        };
      }

      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate a simulated IPFS hash
      const hash = this.generateSimulatedHash(file);
      const url = this.getIPFSUrl(hash);

      console.log('IPFS: File uploaded successfully:', hash);

      // In a real implementation, you would:
      /*
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PINATA_JWT_TOKEN}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`IPFS upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return {
        success: true,
        hash: result.IpfsHash,
        url: this.getIPFSUrl(result.IpfsHash),
      };
      */

      return {
        success: true,
        hash,
        url,
      };

    } catch (error: any) {
      console.error('IPFS upload error:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file to IPFS',
      };
    }
  }

  /**
   * Upload multiple files to IPFS
   */
  async uploadFiles(files: File[]): Promise<IPFSUploadResult[]> {
    const results: IPFSUploadResult[] = [];
    
    for (const file of files) {
      const result = await this.uploadFile(file);
      results.push(result);
    }
    
    return results;
  }

  /**
   * Get IPFS URL from hash
   */
  getIPFSUrl(hash: string): string {
    if (!hash) return '';
    if (hash.startsWith('http')) return hash; // Already a URL
    return `${this.PINATA_GATEWAY}${hash}`;
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File size must be less than 10MB',
      };
    }

    // Check file type (images only)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed',
      };
    }

    return { isValid: true };
  }

  /**
   * Generate simulated IPFS hash for demo using real test hashes
   */
  private generateSimulatedHash(file: File): string {
    // Use real IPFS test hashes for better compatibility
    const testHashes = [
      'QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG', // Real IPFS hash - Hello World
      'QmPZ9gcCEpqKTo6aq61g2nXGUhM4iCL3ewB6LDXZCtioEB', // Real IPFS hash - Test image
      'QmYjtig7VJQ6XsnUjqqJvj7QaMcCAwtrgNdahSiFofrE7o', // Real IPFS hash - Another test
      'QmNLei78zWmzUdbeRB3CiUfAizWUrbeeZh5K1rhAQKCh51', // Real IPFS hash - Test file
      'QmSsw6EcnwEiTT9c4rnAGeSENvsJMepNHmbrgi2S9bXNJr', // Real IPFS hash - Image test
      'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn', // Real IPFS hash - Demo image
    ];
    
    // Select hash based on file name for consistency
    const fileNameHash = Array.from(file.name).reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) & 0xffffffff;
    }, 0);
    
    const index = Math.abs(fileNameHash) % testHashes.length;
    return testHashes[index];
  }

  /**
   * Get file info for display
   */
  getFileInfo(file: File): IPFSFile {
    return {
      file,
      name: file.name,
      size: file.size,
      type: file.type,
    };
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Create preview URL for image files
   */
  createPreviewUrl(file: File): string {
    return URL.createObjectURL(file);
  }

  /**
   * Cleanup preview URL
   */
  revokePreviewUrl(url: string): void {
    URL.revokeObjectURL(url);
  }
}

export const ipfsService = new IPFSService();
