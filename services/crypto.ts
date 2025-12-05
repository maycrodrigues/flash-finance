import { Transaction, EncryptedTransaction } from '../types';

// AES-GCM Configuration
const ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // Standard for GCM
const STORAGE_KEY = 'flashfinance_master_key';

class CryptoService {
  private static instance: CryptoService;
  private key: CryptoKey | null = null;

  private constructor() {
    this.init();
  }

  public static getInstance(): CryptoService {
    if (!CryptoService.instance) {
      CryptoService.instance = new CryptoService();
    }
    return CryptoService.instance;
  }

  // Initialize or retrieve key
  private async init() {
    try {
      const storedKey = localStorage.getItem(STORAGE_KEY);
      if (storedKey) {
        this.key = await this.importKey(storedKey);
      } else {
        this.key = await this.generateKey();
        const exported = await this.exportKey(this.key);
        localStorage.setItem(STORAGE_KEY, exported);
      }
    } catch (e) {
      console.error('Crypto Init Failed:', e);
    }
  }

  private async generateKey(): Promise<CryptoKey> {
    return window.crypto.subtle.generateKey(
      { name: ALGORITHM, length: KEY_LENGTH },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey('jwk', key);
    return JSON.stringify(exported);
  }

  private async importKey(jsonKey: string): Promise<CryptoKey> {
    const jwk = JSON.parse(jsonKey);
    return window.crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: ALGORITHM },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private async ensureInitialized() {
    if (!this.key) await this.init();
    if (!this.key) throw new Error('Crypto Key not available');
  }

  // Encrypt string data
  private async encrypt(data: string): Promise<string> {
    await this.ensureInitialized();
    const encoder = new TextEncoder();
    const encoded = encoder.encode(data);
    const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const encryptedContent = await window.crypto.subtle.encrypt(
      { name: ALGORITHM, iv },
      this.key!,
      encoded
    );

    // Combine IV and Content for storage: IV:CONTENT (base64)
    const ivBase64 = this.arrayBufferToBase64(iv.buffer as ArrayBuffer);
    const contentBase64 = this.arrayBufferToBase64(encryptedContent);
    return `${ivBase64}:${contentBase64}`;
  }

  // Decrypt string data
  private async decrypt(cipherText: string): Promise<string> {
    await this.ensureInitialized();
    try {
        const [ivBase64, contentBase64] = cipherText.split(':');
        if (!ivBase64 || !contentBase64) return ''; // Fallback or throw

        const iv = this.base64ToArrayBuffer(ivBase64);
        const content = this.base64ToArrayBuffer(contentBase64);

        const decryptedContent = await window.crypto.subtle.decrypt(
            { name: ALGORITHM, iv: new Uint8Array(iv) },
            this.key!,
            content
        );

        const decoder = new TextDecoder();
        return decoder.decode(decryptedContent);
    } catch (e) {
        console.error('Decryption failed', e);
        return '***'; // Fallback for UI
    }
  }

  // Utilities
  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binary_string = window.atob(base64);
    const len = binary_string.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
  }

  // --- Domain Methods ---

  public async encryptTransaction(tx: Transaction): Promise<EncryptedTransaction> {
    const encryptedAmount = await this.encrypt(tx.amount.toString());
    const encryptedDesc = await this.encrypt(tx.description);

    // Return object with same structure but encrypted sensitive fields
    return {
        ...tx,
        amount: encryptedAmount,
        description: encryptedDesc,
        isEncrypted: true
    };
  }

  public async decryptTransaction(tx: EncryptedTransaction | Transaction): Promise<Transaction> {
    // Check if it's already decrypted (legacy data support)
    if (!(tx as any).isEncrypted) {
        return tx as Transaction;
    }

    const encTx = tx as EncryptedTransaction;
    const decryptedAmount = await this.decrypt(encTx.amount);
    const decryptedDesc = await this.decrypt(encTx.description);

    return {
        ...encTx,
        amount: parseFloat(decryptedAmount) || 0,
        description: decryptedDesc,
    } as Transaction;
  }
}

export const cryptoService = CryptoService.getInstance();
