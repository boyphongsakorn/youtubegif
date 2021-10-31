FROM python:3
FROM node:alpine
WORKDIR '/app'
COPY package*.json ./
RUN apk add  --no-cache ffmpeg
RUN npm install
COPY . .
CMD ["npm","run","dev"]
