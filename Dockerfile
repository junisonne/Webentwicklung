# Node.js Alpine als Basis
FROM node:20-alpine

# Arbeitsverzeichnis setzen
WORKDIR /app

# package.json und package-lock.json kopieren und Abhängigkeiten installieren
COPY package.json package-lock.json* ./
RUN npm install --production

# Backend und Frontend kopieren
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY index.html ./
COPY *.html ./

# Port für Express-Server
EXPOSE 8500

# Startbefehl
CMD ["node", "backend/server.js"]
