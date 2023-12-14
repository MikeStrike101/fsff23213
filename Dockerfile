FROM node:latest

WORKDIR /usr/src/app


COPY package*.json ./


RUN npm install

RUN apt-get update && apt-get install -y wget
RUN wget http://nz2.archive.ubuntu.com/ubuntu/pool/main/o/openssl/libssl1.1_1.1.1f-1ubuntu2.20_amd64.deb
RUN dpkg -i libssl1.1_1.1.1f-1ubuntu2.20_amd64.deb


COPY . .

EXPOSE 3001


CMD [ "npm", "run", "dev" ]
