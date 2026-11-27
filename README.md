# ANAN — Commerce Platform

ANAN is a mobile-first, bilingual (Bangla/English) multi-vendor commerce platform for Bangladesh.

## Development approach

This repository will be developed incrementally, feature by feature. Each feature should include responsive UI, API contracts, persistence, validation, security, tests, and documentation before it is considered complete.

## Planned architecture

- `apps/web`: Next.js + TypeScript customer experience and future seller/admin surfaces
- `apps/api`: NestJS + TypeScript REST API
- `packages`: shared types, UI primitives, configuration, and utilities
- PostgreSQL for transactional data
- AWS deployment target: ECS Fargate, RDS, S3, CloudFront, and SQS

## Current status

Repository foundation is being established. No production services or cloud infrastructure have been deployed yet.

## Principles

- Mobile-first and accessible responsive design
- Secure-by-default configuration; secrets stay out of Git
- Environment parity and reproducible local development
- Automated checks before merging to `main`
- Small, reviewable feature branches and pull requests

## Getting started

Setup instructions will be added as the development environment is implemented.
