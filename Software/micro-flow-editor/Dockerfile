# Development-mode image: runs the Vite dev server with hot reload.
# Source code is bind-mounted at runtime (see compose.yaml); the COPY
# below only seeds the image so `docker compose up` works before you've
# mounted anything, and so `npm install` can be cached in its own layer.
FROM node:24.19.0-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
