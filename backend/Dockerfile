FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
COPY backend/package.json backend/package.json
RUN npm install
COPY backend backend
RUN npm run db:generate --workspace backend && npm run build --workspace backend
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/prisma ./backend/prisma
COPY package.json ./
COPY backend/package.json backend/package.json
CMD ["node", "backend/dist/server.js"]
