# Use an official Node runtime as a parent image
#FROM node:14

# Set the working directory to /app
#WORKDIR /app

# Copy the current directory contents into the container at /app
#COPY . /app/front

# Install any needed packages specified in package.json
#RUN npm install

# Make port 3000 available to the world outside this container
#EXPOSE 3000

# Run action.js when the container launches
#CMD ["node", "front/actionScript.js"]

# Use a python image
FROM python:3.11

WORKDIR /front

COPY ./front /front

# Let available the default http
EXPOSE 8080

# run a http server, once we have just static pages
ENTRYPOINT ["python", "-m", "http.server", "8080"]
