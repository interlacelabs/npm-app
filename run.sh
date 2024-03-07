#!/bin/bash

cd app
docker build -t nodejs-demo .
docker stop nodejs-demo >/dev/null 2>&1 || echo "docker not running"
docker run -d --rm --name nodejs-demo -p 3000:3000 nodejs-demo