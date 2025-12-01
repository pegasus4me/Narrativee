## Running the Project with Docker

This project is containerized using Docker and can be built and run using Docker Compose. Below are the specific instructions and requirements for this setup.

### Requirements
- **Node.js Version:** The Dockerfile uses `node:22.13.1-slim`. Ensure compatibility if extending or modifying the image.
- **Dependencies:** All dependencies are installed via `npm ci` for deterministic builds. Only production dependencies are included in the final image.

### Environment Variables
- The Docker setup supports environment variables via a `.env` file. Uncomment the `env_file: ./.env` line in `docker-compose.yml` to enable this. Ensure your `.env` file is present and contains all required variables for your application.

### Build and Run Instructions
1. **Build and Start the Service:**
   ```sh
   docker compose up --build
   ```
   This will build the Docker image and start the `ts-app` service.

   ```sh
   docker build --platform linux/amd64 -f apps/backend/Dockerfile -t safoantouil/narrative:latest .
   docker push safoantouil/narrative:latest
   ```
   
   ```sh
   sudo docker pull safoantouil/narrative:latest
   sudo docker rm -f narrative-backend
   sudo docker run -d --name narrative-backend --restart always -p 3002:3002 --env-file .env safoantouil/narrative:latest
   ```


2. **Environment Configuration:**

   - If your application requires environment variables, create a `.env` file in the project root and uncomment the `env_file` line in `docker-compose.yml`.

### Special Configuration
- The application runs as a non-root user (`appuser`) for improved security.
- The build process removes development dependencies and only includes production dependencies in the final image.
- No external services (e.g., databases) are configured by default. If needed, add them to `docker-compose.yml` under `services` and configure `depends_on` and `networks` as appropriate.

### Ports
- **No ports are exposed by default.**
  - If your application listens on a port, add the `ports:` section to the `ts-app` service in `docker-compose.yml`, e.g.:
    ```yaml
    ports:
      - "3000:3000"
    ```
  - Update this section based on your application's requirements.

- **Cross Subdomain Cookies:** REMOVE IT IN LOCAL DEVELOPMENT
    ```yaml
    crossSubDomainCookies: {
      enabled: true,
      domain: ".narrativee.com"
    },
    ```

*Update this section as your Docker setup evolves or if you add additional services or configuration.*