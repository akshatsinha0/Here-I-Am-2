# Step 1: Use official Node.js image
FROM node:20

# Step 2: Set working directory
WORKDIR /app

# Step 3: Copy package.json and package-lock.json
COPY package*.json ./

# Step 4: Install dependencies
RUN npm install

# Step 5: Copy the rest of the source code
COPY . .

# Step 6: Build TypeScript
RUN npm run build

# Step 7: Expose backend port
EXPOSE 5000

# Step 8: Start the server
CMD ["npm", "start"]
