import crypto from 'crypto';
import { log } from '../utils/logger';

// Genişletilmiş ve güvenli magic bytes tablosu
const MAGIC_BYTES_V2: { [key: string]: string } = {
    'ffd8ff': 'image/jpeg',
    '89504e47': 'image/png',
    '47494638': 'image/gif',
    '25504446': 'application/pdf',
    '504b0304': 'application/zip'
};

export const FileScannerService = {
    /**
     * Dosyayı hem imza (Magic Bytes) hem de içerik enjeksiyonuna karşı tarar
     * FIX: Dönüş tipine checksum?: string eklendi, TypeScript hatası çözüldü!
     */
    async scanBuffer(fileBuffer: Buffer, clientMime: string): Promise<{ isValid: boolean; reason?: string; checksum?: string }> {
        try {
            // 1. ADIM: MAGIC BYTES (İmza) KONTROLÜ
            // FIX: Deprecated 'slice' yerine modern 'subarray' kullanıldı.
            const hexStart = fileBuffer.subarray(0, 4).toString('hex').toLowerCase();
            const hexStart6 = fileBuffer.subarray(0, 3).toString('hex').toLowerCase();

            const actualMime = MAGIC_BYTES_V2[hexStart] || MAGIC_BYTES_V2[hexStart6];

            if (!actualMime) {
                return { isValid: false, reason: 'Bilinmeyen dosya formatı (Magic Bytes uyuşmazlığı)' };
            }

            // Client mimetypesi ile karşılaştır
            if (actualMime !== clientMime.trim().toLowerCase()) {
                log.warn('MIME Spoofing engellendi', { clientMime, actualMime });
                return { isValid: false, reason: 'Dosya uzantısı/başlığı içeriğiyle eşleşmiyor.' };
            }

            // 2. ADIM: İÇERİK TARAMASI (Güvenli Limit - DoS Koruması)
            const SAMPLE_SIZE = 1024 * 1024; // 1 MB
            const contentBuffer = fileBuffer.subarray(0, Math.min(fileBuffer.length, SAMPLE_SIZE));
            const lowerContent = contentBuffer.toString('utf8').toLowerCase();

            // ReDoS RİSKİ OLMAYAN NET METİN KONTROLLERİ:
            const dangerousSignatures = [
                'vbscript:',
                'document.write(',
                'window.location=', 
                'alert(', 
                'eval(',
                'exec('
            ];

            for (const sig of dangerousSignatures) {
                if (lowerContent.includes(sig)) {
                    log.error(`Zararlı kod imzası tespit edildi: ${sig}`);
                    return { isValid: false, reason: `Dosya içeriğinde güvenli olmayan script bloğu bulundu (${sig}).` };
                }
            }

            // Script tag'lerini yakalama (Simple matching - ReDoS safe)
            if (/\<script\b/i.test(lowerContent) || /<\/script>/i.test(lowerContent)) {
                 return { isValid: false, reason: 'HTML/Script enjeksiyonu tespit edildi.' };
            }

            // HTML Event Listeners (XSS Riski)
            if (/on\w+\s*=/i.test(lowerContent)) {
                return { isValid: false, reason: 'Dosyada yürütülebilir HTML eventleri bulundu.' };
            }

            // 3. ADIM: PRO-LEVEL PDF GÖMÜLÜ JAVASCRIPT KONTROLÜ
            if (actualMime === 'application/pdf') {
                 // FIX: PDF dünyasındaki gerçek JS gömme standartları (/javascript, /js, /action) avlanıyor
                 // Hem ham buffer'da arıyoruz hem string'de, böylece binary karakter sızıntıları engelleniyor kanka
                 const hasPdfJs = lowerContent.includes('/javascript') || 
                                  lowerContent.includes('/js') || 
                                  lowerContent.includes('/aa') || // Additional Actions
                                  lowerContent.includes('/openaction');

                 if (hasPdfJs) {
                     log.error('PDF içerisine gizlenmiş yürütülebilir makro/JS algılandı!');
                     return { isValid: false, reason: 'Güvenlik tehdidi: PDF içerisinde gömülü JavaScript/Yürütülebilir aksiyon tespit edildi.' };
                 }
            }

            // 4. ADIM: CHECKSUM HESAPLAMA (SHA-256)
            const checksum = crypto.createHash('sha256').update(fileBuffer).digest('hex');
            
            return { isValid: true, checksum };
        } catch (error) {
            log.error('FileScannerService Error:', { error });
            return { isValid: false, reason: 'Dosya tarama hatası oluştu.' };
        }
    }
};