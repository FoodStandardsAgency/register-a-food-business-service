#!/bin/bash
npm config set -g progress=false && \
npm config set -g strict-ssl false && \
npm config set -g cache /opt/npmcache && \
npm config set -g registry https://registry.npmjs.org/ && \
npm config set -g '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}" && \
npm config ls --long

npm run start:docker