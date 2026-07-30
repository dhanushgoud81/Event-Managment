import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { ApiError } from '../utils/api-error';

// Ensure directory exists
const uploadDir = path.resolve(config.upload.dir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    // Generate unique filename to prevent collisions and sanitise
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// File filter (whitelists and validations)
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (config.upload.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new ApiError(400, `Invalid file type. Allowed types: ${config.upload.allowedTypes.join(', ')}`));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

/**
 * Service to manage file uploads and deletions
 */
export class FileUploadService {
  /**
   * Delete a file from disk
   */
  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      if (!fileUrl) return false;

      // Extract filename from URL (handles absolute paths and relative server paths)
      const filename = path.basename(fileUrl);
      const filePath = path.join(uploadDir, filename);

      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Get public URL for uploaded file
   */
  getFileUrl(filename: string): string {
    return `${config.apiUrl}/uploads/${filename}`;
  }
}

export const fileUploadService = new FileUploadService();
