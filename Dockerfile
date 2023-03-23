FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY index.js .

RUN npm ci

ENTRYPOINT ["npm", "start"]