---
name: devops-amplify
description: Infrastructure configuration, Docker & Nginx containerization, and AWS Amplify v6, Cognito, and API Gateway synchronization for OrganizadorCursada. Trigger when managing environment variables, containers, AWS services, production builds, or CI/CD pipelines. Triggers: devops, docker, docker-compose, aws, amplify, cognito, api gateway, cloudformation, nginx, build, deploy, environment variables, set-env.
---

# DevOps, Docker & AWS Amplify Skill

This skill defines the procedures for containerization, environment variable management, and serverless cloud synchronization with **AWS Amplify** in **OrganizadorCursada**.

---

## 1. Cloud Architecture & Synchronization

The backend infrastructure is serverless, defined via CloudFormation (`aws/cloudformation-template.yml`):

```
+--------------------------+
|   Angular Web Client     |
|   - AuthService          |
|   - AwsSyncService       |
+------------+-------------+
             |
             | JWT Authentication
             v
+--------------------------+
|       AWS Cognito        |  (User Pool & Identity Pool)
+------------+-------------+
             |
             | Authorized Token
             v
+--------------------------+
|     AWS API Gateway      |  (REST Endpoints: /plans, /sync)
+------------+-------------+
             |
             v
+--------------------------+
|      AWS DynamoDB        |  (Encrypted User Career State Documents)
+--------------------------+
```

### Key Services

- **`AuthService` (`src/app/services/auth.service.ts`)**: Manages session lifecycles with AWS Cognito (sign-in, registration, tokens).
- **`AwsSyncService` (`src/app/services/aws-sync.service.ts`)**: Manages authenticated reads and writes of the user career state document (`UserCareerStateDoc`) via API Gateway.

---

## 2. Environment Configuration & Pre-Build Script

The project uses a dynamic pre-build script to generate Angular environment files:

```bash
# Defined in package.json:
"config:env": "node scripts/set-env.js"
"build": "npm run config:env && ng build"
```

### Environment Variable Rules

1. `scripts/set-env.js` injects runtime variables into Angular environment configs from system variables or `.env`.
2. **Never** commit production API keys, secrets, or Cognito client secrets to version control.
3. When adding new endpoints or AWS services, define required keys in `scripts/set-env.js` with safe defaults for local development.

---

## 3. Docker Containerization

The project supports containerized execution for development and production using Docker Compose:

### Docker Commands

| Target                            | Command                                                   |
| :-------------------------------- | :-------------------------------------------------------- |
| **Start development environment** | `npm run docker:up` (uses `docker-compose.yml`)           |
| **Start production environment**  | `npm run docker:up:prod` (uses `docker-compose.prod.yml`) |
| **Stop containers**               | `npm run docker:down`                                     |
| **Rebuild container images**      | `npm run docker:build`                                    |

### Production Multi-Stage `Dockerfile`

1. **Stage 1: Build Stage**:
   - Base image: `node:22-alpine`
   - Installs dependencies using `npm ci`
   - Compiles production bundle with `npm run build` outputting to `dist/organizador-cursada/browser/`
2. **Stage 2: Web Server Stage**:
   - Base image: `nginx:alpine`
   - Copies static build artifacts to `/usr/share/nginx/html`
   - Configures `nginx.conf` for Single Page Applications (SPA):
     ```nginx
     location / {
       try_files $uri $uri/ /index.html;
     }
     ```

---

## 4. DevOps Pre-Deployment Checklist

- [ ] Was `npm run config:env` executed successfully without missing variable errors?
- [ ] Does the production build (`npm run build`) compile without budget warnings?
- [ ] Does the Docker image build cleanly (`npm run docker:build`)?
- [ ] Does Nginx properly route deep links (preventing 404 errors on page reload at `/myWeek` or `/workshop`)?
- [ ] Are API Gateway and Cognito configured with appropriate CORS headers for the production domain?
