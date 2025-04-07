FROM nginx:alpine

# Copy the Angular app you just built into Nginx
# ✅ NEW (for SSR structure):
COPY dist/student-course-frontend/browser /usr/share/nginx/html	

# Use custom Nginx config if needed (for Angular routing)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
