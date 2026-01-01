FROM node:23-alpine AS build
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

COPY . .
RUN pnpm install --frozen-lockfile && pnpm build

CMD ["node", "dist/index.js"]
