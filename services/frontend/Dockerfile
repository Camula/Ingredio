FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
COPY packages/shared ./packages/shared
COPY services/frontend ./services/frontend

RUN npm install

WORKDIR /app/services/frontend

# The monorepo setup will mount the source code, so we only need to start Vite.
# Since node_modules are mounted or installed outside, we just run the dev server.
CMD ["npm", "run", "dev"]