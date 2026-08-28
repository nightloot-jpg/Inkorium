// Compatibility layer for existing imports.
// Hetzner Object Storage is the canonical persistent media backend.
// New code should import from ./storage instead.
export type { StorageFolder as R2Folder } from './storage';

export {
  createStorageUploadTicket as createR2UploadTicket,
  uploadToPresignedUrl,
  deleteStorageObject as deleteR2Object,
  getStorageSignedUrl as getR2SignedUrl,
} from './storage';
