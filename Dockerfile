FROM node:latest

WORKDIR /app

COPY package*.json ./
COPY index.js .
COPY ./voices/ .

RUN npm ci

ENTRYPOINT ["npm", "start"]