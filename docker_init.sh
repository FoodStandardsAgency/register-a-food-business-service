#!/bin/bash
npm config set -g proxy "${DOCKER_HTTP_PROXY}" && \
npm config set -g https-proxy "${DOCKER_HTTPS_PROXY}" && \
npm config set -g progress=false && \
npm config set -g strict-ssl false && \
npm config set -g cache /opt/npmcache && \
npm config set -g registry https://registry.npmjs.org/ && \
npm config set -g '//registry.npmjs.org/:_authToken' "${NPM_TOKEN}" && \
npm config ls --long

tail -f /dev/null