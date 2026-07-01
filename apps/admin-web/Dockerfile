FROM node:24-alpine AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.32.1 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY apps/web/package.json apps/web/package.json
COPY apps/admin-web/package.json apps/admin-web/package.json

RUN pnpm install --frozen-lockfile

COPY apps/admin-web apps/admin-web

RUN pnpm --filter ./apps/admin-web run build

FROM nginx:1.27-alpine

COPY apps/admin-web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/admin-web/dist /usr/share/nginx/html

EXPOSE 80
