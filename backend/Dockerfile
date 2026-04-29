FROM node:22-alpine

WORKDIR /app

# Bağımlılıkları kopyala
COPY package*.json ./
RUN npm ci --only=production

# Kaynak kodları kopyala
COPY . .

# TypeScript compile
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/index.js"]