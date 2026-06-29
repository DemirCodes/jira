FROM node:22-alpine

WORKDIR /app

# Tüm bağımlılıkları kur (dev dahil)
COPY package*.json ./
RUN npm install

# Kaynak kodları kopyala
COPY . .

# TypeScript compile
RUN npm run build

# Production bağımlılıkları için temizle ve yeniden kur
RUN npm prune --production

EXPOSE 3001

CMD ["node", "dist/index.js"]