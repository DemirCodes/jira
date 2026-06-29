/**
 * SECURE FILE UPLOAD MIDDLEWARE
 * * - Memory Storage ile diski yormaz.
 * - Sıkı Mime Type ve Boyut kısıtlaması içerir.
 */

import multer from 'multer';
import { Request } from 'express';
import { AppError, ErrorCodes } from '../utils/errorCodes';

// Diski yormamak için geçici olarak RAM'e alıyoruz
const storage = multer.memoryStorage();

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    // Kabul edilen dosya tipleri
    const allowedMimeTypes = [
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/pdf',
        'application/msword', // doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // docx
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
        return cb(new AppError(ErrorCodes.VALIDATION_FAILED, 'Unsupported file type'));
    }

    cb(null, true);
};

export const uploadMiddleware = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // Maksimum 5 MB limit
        files: 5 // Tek seferde en fazla 5 dosya yüklenebilir
    }
});

/**
 * ÖNEMLİ NOT:
 * Controller veya Service katmanında dosyayı S3'e yüklemeden ÖNCE
 * 'file-type' kütüphanesi ile dosyanın Buffer'ını analiz etmelisin.
 * Örnek kullanım:
 * * import { fileTypeFromBuffer } from 'file-type';
 * * const validateMagicBytes = async (buffer: Buffer) => {
 * const type = await fileTypeFromBuffer(buffer);
 * if (!type || !['jpg', 'png', 'webp', 'pdf', 'docx'].includes(type.ext)) {
 * throw new AppError(ErrorCodes.VALIDATION_FAILED, 'Malware suspected: File extension mismatch');
 * }
 * }
 */