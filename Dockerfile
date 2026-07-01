FROM node:22-slim
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist/ dist/
COPY bin/ bin/
EXPOSE 3141
CMD ["node", "dist/index.js", "serve", "--port", "3141"]
