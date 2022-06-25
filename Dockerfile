FROM node:17-alpine

RUN apk add --update --no-cache git make gcc g++ curl py-pip

WORKDIR /usr/src/app

COPY package*.json ./

RUN yarn

COPY . .
