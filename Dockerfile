# Production stage using Nginx
FROM nginx:stable-alpine

# Copy pre-compiled dist folder directly from workspace
COPY dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
