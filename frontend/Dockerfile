# Build stage
FROM node:20-alpine AS build

WORKDIR /workspace

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx production stage
FROM nginx:alpine
COPY --from=build /workspace/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
