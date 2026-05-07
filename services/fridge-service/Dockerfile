FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/fridge-service ./services/fridge-service

RUN npm install

WORKDIR /app/services/fridge-service

EXPOSE 3002

CMD ["npm", "run", "dev"]
