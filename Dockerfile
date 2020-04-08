FROM node:12.16.0

ARG NPM_TOKEN
ARG http_proxy
ARG https_proxy
RUN echo $http_proxy

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app

ENV PATH="//usr/local/bin:${PATH}"

EXPOSE 4000
USER node
