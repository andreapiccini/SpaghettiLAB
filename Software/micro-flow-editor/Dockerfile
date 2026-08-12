# Development-mode image: runs the Vite dev server (packages/app) with hot reload.
# Source code is bind-mounted at runtime (see compose.yaml); the COPY below only
# seeds the image so `docker compose up` works before you've mounted anything, and
# so `npm install` can be cached in its own layer, keyed on package.json files only.
FROM node:24.19.0-alpine

WORKDIR /app

COPY package.json ./
COPY packages/domain/package.json packages/domain/package.json
COPY packages/protocol-sdk/package.json packages/protocol-sdk/package.json
COPY packages/project-store/package.json packages/project-store/package.json
COPY packages/react-flow-adapter/package.json packages/react-flow-adapter/package.json
COPY packages/app/package.json packages/app/package.json
RUN npm install

COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev"]
