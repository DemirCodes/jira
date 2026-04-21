backend/
├── src/
│   ├── config/          # Environment vars, constants
│   ├── controllers/     # İstekleri karşılayan fonksiyonlar
│   ├── db/              # Database connection pool
│   ├── middlewares/     # Auth, logger, error handler
│   ├── routes/          # API endpoint'leri
│   ├── services/        # İş mantığı (database fonksiyonlarını çağırır)
│   ├── types/           # TypeScript tipleri
│   └── utils/           # Yardımcı fonksiyonlar
├── package.json
├── tsconfig.json
├── .env
└── Dockerfile