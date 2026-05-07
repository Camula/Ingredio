FROM node:20-alpine

WORKDIR /app

# Copy root package.json and lockfile
COPY package*.json ./

# Copy shared package
COPY packages/shared ./packages/shared

# Copy auth-service package
COPY services/auth-service ./services/auth-service

# Install dependencies for the whole monorepo
RUN npm install

WORKDIR /app/services/auth-service

EXPOSE 3001

CMD ["npm", "run", "dev"]
