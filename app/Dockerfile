# Use the official Node.js 14 image as a parent image
FROM node:14

# Set the working directory inside the container to /app
WORKDIR /app

# Copy the package.json and package-lock.json files into the working directory
COPY ./package*.json ./

# Install dependencies, including the specific version of vm2
RUN npm install && npm install vm2@3.9.17

# Copy the rest of your application's code into the working directory
COPY ./app.js ./
COPY ./static/. ./static/

# Make port 3000 available outside of this container
EXPOSE 3000

# Run the command to start your app
CMD ["node", "app.js"]