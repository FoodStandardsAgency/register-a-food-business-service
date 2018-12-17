# base build
FROM node:8.9.4 as base

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY . /usr/src/app
ARG NPM_TOKEN

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc && \
    npm install --production && \
    rm -f .npmrc

# second build
FROM node:8.9.4
COPY --from=base . .
EXPOSE 4000
USER node