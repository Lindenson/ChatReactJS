FROM node:20-alpine

# Рабочая директория
WORKDIR /app

# Устанавливаем зависимости
COPY package*.json ./
RUN npm install --production

# Копируем исходники
COPY server.js ./

# Порт приложения
EXPOSE 3000

# Запуск сервера
CMD ["node", "server.js"]
