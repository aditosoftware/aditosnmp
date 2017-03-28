FROM node:7.7.4-alpine

COPY libs/ /aditosnmp/libs/
COPY app.js /aditosnmp/
COPY package.json /aditosnmp/
COPY run.sh /run.sh

RUN cd /aditosnmp \
    && npm i \
    && chmod +x /run.sh

CMD ["/run.sh"]