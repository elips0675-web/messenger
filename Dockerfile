FROM node:20-alpine AS frontend
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS server
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci
COPY server/ ./server/
COPY --from=frontend /app/dist ./dist
EXPOSE 3001
CMD ["node", "server/src/index.js"]
