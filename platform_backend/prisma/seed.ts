import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Tohumlama (Seeding) işlemi başlatılıyor...');

    // Çevre değişkenlerinden alıyoruz, yoksa varsayılan değerler atıyoruz
    // (Güvenlik için canlı ortamda mutlaka .env dosyasından çekilmelidir)
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@elbistan.local';
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'DevAdmin123!';

    try {
        // Zaten bir super_admin var mı diye kontrol edelim
        const existingAdmin = await prisma.platform_users.findFirst({
            where: { role: 'super_admin' }
        });

        if (existingAdmin) {
            console.log(`⚠️ Sistemde zaten bir super_admin mevcut (${existingAdmin.email}). Tohumlama atlandı.`);
            return;
        }

        console.log('🔒 Şifre hashleniyor...');
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

        console.log('👑 Super Admin hesabı oluşturuluyor...');
        const newAdmin = await prisma.platform_users.create({
            data: {
                email: adminEmail,
                password_hash: passwordHash,
                role: 'super_admin',
                is_active: true,
            }
        });

        console.log(`✅ Başarılı! Super Admin oluşturuldu:`);
        console.log(`   📧 Email: ${newAdmin.email}`);
        console.log(`   🔑 Şifre: ${adminPassword} (Lütfen ilk girişte değiştirin!)`);
        console.log(`   🆔 ID: ${newAdmin.platform_user_id}`);

    } catch (error) {
        console.error('❌ Tohumlama sırasında bir hata oluştu:', error);
        process.exit(1);
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });