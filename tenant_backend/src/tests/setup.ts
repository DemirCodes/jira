import dotenv from 'dotenv';
import path from 'path';

// .env.test dosyasını yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.test') });

// Global test setup
beforeAll(() => {
    console.log('🧪 Starting tests...');
});

afterAll(() => {
    console.log('✅ Tests completed');
});