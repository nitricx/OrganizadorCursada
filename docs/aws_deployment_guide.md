# ☁️ AWS Deployment Guide - OrganizadorCursada

This document provides complete instructions for deploying the **OrganizadorCursada** web application to Amazon Web Services (AWS) using **S3 + CloudFront CDN** and **AWS Cognito User Pool**.

---

## 🏗️ Architecture Overview

- **Storage**: Amazon S3 bucket for static single-page application (SPA) assets.
- **CDN & SSL**: Amazon CloudFront distribution with Origin Access Control (OAC) enforcing encrypted traffic and handling client-side SPA routing (`index.html` fallback).
- **Authentication**: AWS Cognito User Pool & App Client integrated via `@aws-amplify/auth`.
- **CI/CD Pipeline**: GitHub Actions workflow automatically building and deploying to S3/CloudFront upon pushing to the `main` branch.

---

## 📋 Prerequisites

1. An active [AWS Account](https://aws.amazon.com/).
2. [AWS CLI v2](https://aws.amazon.com/cli/) installed and configured (`aws configure`).
3. Admin access to your GitHub Repository settings.

---

## 🛠️ Step 1: Deploy Infrastructure with CloudFormation

We provide an Infrastructure-as-Code template at [`aws/cloudformation-template.yml`](file:///d:/Repositories/OrganizadorCursada/aws/cloudformation-template.yml).

Run the following command in your terminal to create all required AWS resources:

```bash
aws cloudformation create-stack \
  --stack-name organizador-cursada-prod \
  --template-body file://aws/cloudformation-template.yml \
  --parameters ParameterKey=AppName,ParameterValue=organizador-cursada ParameterKey=Environment,ParameterValue=production \
  --capabilities CAPABILITY_IAM \
  --region us-east-1
```

To wait for stack creation to complete:

```bash
aws cloudformation wait stack-create-complete \
  --stack-name organizador-cursada-prod \
  --region us-east-1
```

Retrieve the stack outputs (Bucket Name, CloudFront ID, Cognito IDs):

```bash
aws cloudformation describe-stacks \
  --stack-name organizador-cursada-prod \
  --region us-east-1 \
  --query "Stacks[0].Outputs"
```

---

## 🔐 Step 2: Configure GitHub Repository Secrets

In your GitHub repository, go to **Settings > Secrets and variables > Actions > New repository secret** and add the following keys:

| Secret Key | Description / Value Source |
| :--- | :--- |
| `AWS_ACCESS_KEY_ID` | IAM deployment user Access Key |
| `AWS_SECRET_ACCESS_KEY` | IAM deployment user Secret Key |
| `AWS_REGION` | AWS region (e.g. `us-east-1`) |
| `AWS_S3_BUCKET` | Value of `S3BucketName` output |
| `CLOUDFRONT_DISTRIBUTION_ID` | Value of `CloudFrontDistributionId` output |
| `AWS_USER_POOL_ID` | Value of `UserPoolId` output |
| `AWS_USER_POOL_WEB_CLIENT_ID` | Value of `UserPoolClientId` output |
| `AWS_COGNITO_OAUTH_DOMAIN` | Cognito Auth Domain URL (if enabled) |
| `AWS_REDIRECT_SIGN_IN` | Production web URL (e.g., `https://dxxxxx.cloudfront.net/`) |
| `AWS_REDIRECT_SIGN_OUT` | Production web URL (e.g., `https://dxxxxx.cloudfront.net/`) |
| `AWS_API_ENDPOINT` | Your API Gateway endpoint URL |

---

## 🚀 Step 3: Trigger Automated Deployment

Push your commits to the `main` branch:

```bash
git add .
git commit -m "feat(aws): add cloudformation template and deploy workflow"
git push origin main
```

The GitHub Actions workflow defined in [`.github/workflows/deploy.yml`](file:///d:/Repositories/OrganizadorCursada/.github/workflows/deploy.yml) will automatically:
1. Build the production Angular application (`npm run build`).
2. Sync compiled assets to your S3 bucket (`aws s3 sync`).
3. Invalidate CloudFront CDN cache (`aws cloudfront create-invalidation`).

---

## 🐳 Alternative Container Deployment (AWS App Runner / ECS)

If you prefer deploying a Docker container rather than S3 static hosting:
1. Build the production image:
   ```bash
   docker build -t organizador-cursada:latest .
   ```
2. Test locally on port 4200:
   ```bash
   docker run -p 4200:80 organizador-cursada:latest
   ```
3. Push to AWS Elastic Container Registry (ECR) and deploy to **AWS App Runner** or **Amazon ECS (Fargate)** using the hardened [`nginx.conf`](file:///d:/Repositories/OrganizadorCursada/nginx.conf).

---

## 🧪 Verification & Troubleshooting

- **SPA Routing Check**: Navigate directly to `/home`, `/myWeek`, `/requisites`, `/academicCalendar`, or `/workshop` in your browser. CloudFront handles custom 403/404 rewrites to `index.html` seamlessly.
- **Cache Verification**: Hard refresh (`Ctrl + Shift + R`) to test CloudFront CDN invalidations.
