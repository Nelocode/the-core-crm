# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Declare Build Arguments for Easypanel / Docker build
ARG VITE_N8N_SCAN_CARD_URL
ARG VITE_N8N_INVESTIGATE_URL
ARG VITE_CORE_ENGINE_URL

# Expose them as environment variables during build time for Vite
ENV VITE_N8N_SCAN_CARD_URL=$VITE_N8N_SCAN_CARD_URL
ENV VITE_N8N_INVESTIGATE_URL=$VITE_N8N_INVESTIGATE_URL
ENV VITE_CORE_ENGINE_URL=$VITE_CORE_ENGINE_URL

# Run vite build to generate static bundle
RUN npx vite build

# Production stage
FROM nginx:stable-alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
