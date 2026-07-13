# Vacuul Admin Dashboard - Technical Documentation

Welcome to the Vacuul Admin Dashboard technical documentation. This documentation provides comprehensive information about the architecture, components, and development practices for the admin panel.

## Documentation Index

| Document | Description |
|----------|-------------|
| [Overview](./01-overview.md) | Project overview and key features |
| [Technology Stack](./02-technology-stack.md) | Technologies and dependencies |
| [Project Structure](./03-project-structure.md) | Directory organization |
| [Architecture](./04-architecture.md) | Application architecture and patterns |
| [Data Models](./05-data-models.md) | TypeScript interfaces and Firestore schemas |
| [Authentication & Authorization](./06-authentication.md) | Auth flow and RBAC |
| [API Integration](./07-api-integration.md) | Firebase and backend services |
| [Components & Hooks](./08-components-hooks.md) | Reusable components and custom hooks |
| [Routing](./09-routing.md) | Route structure and navigation |
| [Search Integration](./10-search.md) | Algolia search implementation |
| [File Management](./11-file-management.md) | Firebase Storage usage |
| [Development Guide](./12-development-guide.md) | Setup and development workflow |
| [Deployment](./13-deployment.md) | Build and deployment process |
| [Environment Configuration](./14-environment.md) | Environment variables |

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

## Project Overview

**Vacuul Admin Dashboard** is a full-stack React application serving as the administrative management system for the Vacuul platform. It provides tools for managing:

- Users and roles
- IoT machines
- Session bookings
- Pricing and gift cards
- Content and firmware updates
- System monitoring

## Tech Stack Summary

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS
- **Backend**: Firebase (Auth, Firestore, Storage, Functions)
- **Search**: Algolia
- **Region**: europe-west6

## Support

For issues and feature requests, please contact the development team.
