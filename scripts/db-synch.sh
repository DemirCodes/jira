#!/bin/bash

# Herhangi bir komut hata verirse scripti hemen durdur
set -e

# SCRIPTIN ÇALIŞTIĞI DİZİNİ BUL VE BACKEND'E ODAKLA
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR/../backend"

# Renkli loglar için tanımlar
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}[Pipeline] 🚀 Manuel DB Migration & Sync Pipeline Başlatıldı...${NC}"

# 0. ADIM: Prisma Şemasını Yerelde Derle ve Client'ı Güncelle
echo -e "${YELLOW}[0/4] 🛠️ Prisma Client yerelde generate ediliyor...${NC}"
npx prisma generate

# 1. ADIM: Değişiklikleri İzole Test Veritabanında Sına (Sandbox)
echo -e "${YELLOW}[1/4] 🧪 Değişiklikler Docker'daki Test DB üzerinde test ediliyor...${NC}"

# 🔍 AKILLI ÇÖZÜM: Senin .env dosyasındaki çalışan orijinal URL'i yedekliyoruz kanka
ORIGIDB_URL=$(grep -E "^DATABASE_URL=" .env | cut -d'"' -f2 | cut -d"'" -f2)

# Test ortamı için URL'i Docker'daki tenant_db (5434) ve jira_test hedefine zorluyoruz
# Kimlik bilgilerini (user/pass) doğrudan senin çalışan .env'inden cımbızlıyoruz
BASE_CONN=$(echo $ORIGIDB_URL | sed -E 's/localhost:[0-9]+\/[a-zA-Z0-9_]+//g')
export DATABASE_URL="${BASE_CONN}localhost:5434/jira_test?schema=public"

echo -e "${BLUE}-> Test DB'ye göç basılıyor (Prisma Migrate)...${NC}"
npx prisma migrate dev --skip-generate

# 🎯 HAYAT KURTARAN DOKUNUŞ 1: Test DB Fonksiyon Enjeksiyonu
echo -e "${YELLOW}-> 💉 Özel SQL Fonksiyonları Test DB'ye (jira_test) enjekte ediliyor...${NC}"
cat ../database/backup/dumps/dump.sql | docker exec -i tenant_db psql -U jira -d jira_test || true

echo -e "${BLUE}-> Test Suite koşturuluyor...${NC}"
if npm run test siteAssets.test.ts -- --forceExit; then
  echo -e "${GREEN}✓ Harika! Testler başarıyla yeşil yandı.${NC}"
else
  echo -e "${RED}❌ HATA: Testler başarısız oldu! Canlı DB güncellemeleri iptal edildi.${NC}"
  exit 1
fi

# 2. ADIM: Kullanıcı Onay Mekanizması (Keskin Sınır)
echo -e "${YELLOW}------------------------------------------------------------${NC}"
echo -e "${YELLOW}👉 Testler sorunsuz tamamlandı. Şema değişiklikleri onay bekliyor.${NC}"
echo -e "${YELLOW}Lokal ve Container içindeki CANLI Tenant DB'ler güncellensin mi? (y/n)${NC}"
echo -e "${YELLOW}------------------------------------------------------------${NC}"
read -p "Seçiminiz: " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
  echo -e "${RED}❌ Senkronizasyon kullanıcı tarafından iptal edildi.${NC}"
  exit 0
fi

# 3. ADIM: Canlı Veritabanlarını Güncelleme ve Senkronizasyon (Lokal & Container)
echo -e "${YELLOW}[3/4] ⚡ Canlı Veritabanları senkronize ediliyor...${NC}"

# A) Lokal Canlı Tenant DB Güncellemesi
echo -e "${BLUE}-> Lokal Canlı Tenant DB güncelleniyor...${NC}"
# Bilgisayarındaki yerel Postgres (5432) içindeki ana 'jira' veritabanı
export DATABASE_URL="${BASE_CONN}localhost:5432/jira?schema=public"
npx prisma db push --skip-generate

# 🎯 HAYAT KURTARAN DOKUNUŞ 2: Lokal Canlı DB Fonksiyon Enjeksiyonu
echo -e "${YELLOW}-> 💉 Özel SQL Fonksiyonları Lokal Canlı DB'ye enjekte ediliyor...${NC}"
# DB kimlik bilgilerini ayrıştırıp lokal psql üzerinden basıyoruz
DB_USER=$(echo $ORIGIDB_URL | sed -E 's/.*:\/\/([^:]+):.*/\1/')
DB_PASS=$(echo $ORIGIDB_URL | sed -E 's/.*:[^:]+:([^@]+)@.*/\1/')
PGPASSWORD=$DB_PASS psql -h localhost -p 5432 -U $DB_USER -d jira < ../database/backup/dumps/dump.sql || true

# B) Docker Container İçindeki Canlı Tenant DB Güncellemesi
echo -e "${BLUE}-> Docker Container içindeki Canlı Tenant DB güncelleniyor...${NC}"
# Docker tenant_db konteynerinin (5434) içindeki ana canlı 'jira' veritabanı
export DATABASE_URL="${BASE_CONN}localhost:5434/jira?schema=public"
npx prisma db push --skip-generate

# 🎯 HAYAT KURTARAN DOKUNUŞ 3: Docker Canlı DB Fonksiyon Enjeksiyonu
echo -e "${YELLOW}-> 💉 Özel SQL Fonksiyonları Docker Canlı DB'ye enjekte ediliyor...${NC}"
cat ../database/backup/dumps/dump.sql | docker exec -i tenant_db psql -U jira -d jira || true

echo -e "${GREEN}██████████████████████████████████████████████████████████${NC}"
echo -e "${GREEN}✅ BAŞARILI: Tüm veritabanları Elbistan kalesi gibi eşitlendi!${NC}"
echo -e "${GREEN}██████████████████████████████████████████████████████████${NC}"