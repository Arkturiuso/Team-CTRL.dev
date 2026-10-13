FROM node:22-alpine
WORKDIR /src
RUN corepack enable
ENV YARN_NODE_LINKER=node-modules
COPY package.json yarn.lock ./
RUN yarn install --immutable
COPY . .
CMD ["yarn", "dev", "--host", "0.0.0.0"]
