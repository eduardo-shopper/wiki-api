FROM public.ecr.aws/k9x5n2l5/shopper-node-22-alpine:latest

RUN mkdir -p /opt/service
WORKDIR /opt/service

RUN echo "### Kernel version: " && \
    uname -mr && \
    echo "### Node Version: " && \
    node --version

RUN apk add --no-cache make gcc g++ python3 tzdata yarn
RUN cp /usr/share/zoneinfo/Brazil/East /etc/localtime
RUN echo "Brazil/East" > /etc/timezone

COPY . /opt/service
RUN yarn install --ignore-scripts --legacy-peer-deps
RUN yarn build
