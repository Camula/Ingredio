FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/recipe-service ./services/recipe-service

RUN npm install

WORKDIR /app/services/recipe-service

EXPOSE 3003

CMD ["npm", "run", "dev"]
