FROM node:22-alpine

# Prisma'nın Alpine üzerinde mızmızlanmaması için openssl kuruyoruz
RUN apk add --no-cache openssl

WORKDIR /app

# Tüm bağımlılıkları kur (dev dahil)
COPY package*.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# Şemanın adını ve yolunu açıkça belirterek Alpine motorunu indiriyoruz
RUN npx prisma generate --schema=./prisma/platform.schema.prisma

RUN npx prisma generate --schema=./prisma/tenant.schema.prisma

# TypeScript compile
RUN npm run build

# Production bağımlılıkları için temizle ve yeniden kur
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/index.js"]