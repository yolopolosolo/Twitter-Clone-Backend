FROM ubuntu

RUN apt-get update
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_18.x | bash -
RUN apt-get install -y nodejs

COPY  . .
RUN npm install
RUN npm run build
RUN npx prisma migrate dev
#RUN sudo npm install pm2 -g
#RUN pm2 start build/index.js
ENTRYPOINT [ "node","build/index.js" ]