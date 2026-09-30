# Build stage: compile the React app into static files.
FROM node:24-alpine AS build

WORKDIR /app

# Install dependencies first so this layer is cached between code changes.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite writes the backend URL into the bundle at build time, so it is a build argument.
ARG VITE_API_URL=http://localhost:8080
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Run stage: serve the static files with nginx, as a non-root user (listens on 8080).
FROM nginxinc/nginx-unprivileged:alpine

COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 8080
