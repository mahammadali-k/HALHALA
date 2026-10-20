# Build the storefront, then run the API + static server on a slim Node image (Node 24 has built-in SQLite).
FROM node:24-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production DATA_DIR=/data PORT=8787
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=build /app/dist ./dist
COPY server ./server
COPY src/data/catalog.json ./src/data/catalog.json
VOLUME /data
EXPOSE 8787
CMD ["node", "--no-warnings", "server/index.mjs"]
