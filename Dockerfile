FROM node:7.5.0

# Create app directory
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

# Install app dependencies
COPY ./package.json /usr/src/app/
RUN npm install @angular/cli -g
RUN npm install supervisor -g

RUN npm install

COPY . /usr/src/app

EXPOSE 4200 3000 6379
CMD [ "npm", "start" ]
