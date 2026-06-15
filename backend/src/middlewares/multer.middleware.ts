import multer from 'multer';
import { AppError, ErrorCodes } from '../utils/errorCodes';

// Dosyaları disk yerine doğrudan RAM'de (Buffer) tutmak için memoryStorage kullanıyoruz
const storage = multer.memoryStorage();

// Temel dosya uzantısı/tipi kontrolü (İlk filtre)
const fileFilter = (req: any, file: Express.Multer.File, callback: multer.FileFilterCallback) => {
    const allowedMimeTypes = [
        'image/jpeg', 
        'image/png', 
        'image/gif', 
        'application/pdf',
        'application/zip',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'     // xlsx
    ];

    if (allowedMimeTypes.includes(file.mimetype)) {
        callback(null, true); // İzin ver
    } else {
        callback(new AppError(ErrorCodes.VALIDATION_FAILED, 'Desteklenmeyen dosya formatı!')); 
    }
};

export const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // Maksimum 5 MB dosya boyutu
    },
    fileFilter: fileFilter
});