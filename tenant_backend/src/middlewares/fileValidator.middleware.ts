import { Request, Response, NextFunction } from 'express';
import { FileScannerService } from '../services/fileScanner.service';
import { AppError, ErrorCodes } from '../utils/errorCodes';
import { log } from '../utils/logger';

export const validateUploadedFiles = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Hem tek hem çoklu dosyayı topluyoruz kral
        const filesToScan: Express.Multer.File[] = [];

        if (req.file) filesToScan.push(req.file);
        
        if (req.files && Object.keys(req.files).length > 0) {
            if (Array.isArray(req.files)) {
                filesToScan.push(...req.files);
            } else {
                Object.values(req.files).forEach((fileArray: any) => {
                    filesToScan.push(...fileArray);
                });
            }
        }

        // Eğer yüklenecek hiç dosya yoksa sıradaki middleware veya controller adımına geç
        if (filesToScan.length === 0) {
            return next();
        }

        // Dosyaları paralel ve asenkron olarak süzgece gönderiyoruz
        const allValid = await Promise.allSettled(
            filesToScan.map(file => FileScannerService.scanBuffer(file.buffer, file.mimetype))
        );

        for (let i = 0; i < allValid.length; i++) {
            const originalFile = filesToScan[i]; // FIX: Scope hatası çözüldü, en başa alındı
            const scanResult = allValid[i];

            // 1. Durum: Promise teknik bir sebeple patladıysa (Rejected)
            if (scanResult.status === 'rejected') {
                log.error('File scan critical error', { 
                    filename: originalFile.originalname, 
                    error: scanResult.reason 
                });
                res.status(500).json({ error: 'Sunucu hatası: Dosya taramasında teknik hata' });
                return;
            }

            // 2. Durum: Promise başarıyla çözüldü (Fulfilled) - TypeScript artık kızamaz kral
            const result = scanResult.value;
            
            // Tarama güvenlik süzgecine takıldıysa (Zararlı dosya veya imza manipülasyonu)
            if (!result.isValid) {
                // FIX: Ezbere req.file bağımlılığı kaldırıldı, doğrudan patlayan dosyanın adı basılıyor
                log.warn(`Zararlı dosya engellendi: ${originalFile.originalname}`, { 
                    fileIndex: i, 
                    reason: result.reason 
                });
                
                res.status(422).json({
                    error: result.reason || 'Zararlı dosya tespiti nedeniyle yükleme reddedildi.',
                    code: ErrorCodes.VALIDATION_FAILED,
                    filename: originalFile.originalname
                });
                return; // Zinciri kır, yüklemeyi iptal et!
            }

            // 3. Durum: Her şey temizse, bizim o şanlı checksum değerini Multer nesnesine gömüyoruz
            if (result.checksum) {
                (originalFile as any).checksum = result.checksum; 
            }
        }

        // Bütün dosyalar tamamen temiz, geçiş serbest!
        next();
    } catch (error) {
        log.error('validateUploadedFiles global error', { error });
        next(error);
    }
};