FROM node:alpine
ENV PYTHONUNBUFFERED=1
RUN apk add --update --no-cache python3 && ln -sf python3 /usr/bin/python
RUN python3 -m ensurepip
RUN pip3 install --no-cache --upgrade pip setuptools
WORKDIR '/app'
COPY package*.json ./
RUN apk add  --no-cache ffmpeg
RUN npm install
COPY . .
CMD ["npm","run","dev"]
