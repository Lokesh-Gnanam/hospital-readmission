# Build stage
FROM node:20-alpine AS build

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .
RUN cp .env.example .env || true && sed -i '/VITE_API_URL/d' .env || true
RUN npm run build

# Nginx production stage
FROM nginx:alpine
COPY --from=build /workspace/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
