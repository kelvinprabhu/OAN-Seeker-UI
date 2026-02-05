# Stage 1: Build the React application
FROM node:18-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy all source files
COPY . .

# Build arguments for environment variables
ARG VITE_WEATHER_API_URL
ARG VITE_AIBOT_API_URL
ARG VITE_SEARCH_API_URL
ARG VITE_TRANSCRIBE_API_URL
ARG VITE_TTS_API_URL
ARG VITE_STATES_API_URL
ARG VITE_DISTRICTS_API_URL
ARG VITE_MANDI_API_URL
ARG VITE_MANDI_GOV_API_URL
ARG VITE_WAREHOUSE_API_URL

# Set environment variables for build
ENV VITE_WEATHER_API_URL=$VITE_WEATHER_API_URL
ENV VITE_AIBOT_API_URL=$VITE_AIBOT_API_URL
ENV VITE_SEARCH_API_URL=$VITE_SEARCH_API_URL
ENV VITE_TRANSCRIBE_API_URL=$VITE_TRANSCRIBE_API_URL
ENV VITE_TTS_API_URL=$VITE_TTS_API_URL
ENV VITE_STATES_API_URL=$VITE_STATES_API_URL
ENV VITE_DISTRICTS_API_URL=$VITE_DISTRICTS_API_URL
ENV VITE_MANDI_API_URL=$VITE_MANDI_API_URL
ENV VITE_MANDI_GOV_API_URL=$VITE_MANDI_GOV_API_URL
ENV VITE_WAREHOUSE_API_URL=$VITE_WAREHOUSE_API_URL

# Build the application
RUN npm run build

# Stage 2: Serve the application with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built files from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
# testing