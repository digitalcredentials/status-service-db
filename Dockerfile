# Stage 1 - Gather dependencies
#FROM node:19 AS deps
#COPY . .
#RUN npm ci

# Stage 2 - Runner
#FROM node:20-alpine as runner
FROM node:20
# RUN git config --global url."https://github.com/".insteadOf 'git@github.com:'
# RUN git config --global url."https://github.com/".insteadOf git@github.com:
# RUN git config --global url."https://".insteadOf git://
#RUN git config --global url."https://github.com/".insteadOf ssh://git@github.com
# RUN git config --global url."https://github.com".insteadOf "ssh://git@github.com"
# NOTE to self: I got this to work (i.e., fixed the problem with the docker build
# not being able to pull the status dependency -
# digitalcredentials/credential-status-manager-db#initial-implementation 
# from git ) by instead pulling in the dependency locally so it gets copied
# directly into the docker build as part of copying in all of the local node_modules.  
# I also therefore had to remove node_moduels from the dockerignore
WORKDIR /app
COPY . .
CMD ["node", "server.js"]
EXPOSE 4008
