# Uses node 22
FROM node:22

# Create directory app
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install app dependencies
RUN npm Install

# Copy the rest of the app into container
COPY . .

# Compile TypeScript to JavaScript
RUN npm run build

# Expose port
EXPOSE 5000

# Run the app
CMD ["npm", "start"]