# Beautty Trading Dashboard

A professional trading dashboard built with React, Vite, and Tailwind CSS. Connects to Rust microservices for real-time signal processing and analytics.

## Tech Stack
- Vite 6 + React 19
- TypeScript strict
- Tailwind CSS 4 + shadcn/ui
- React Router v7
- @tanstack/react-query v5
- Recharts + Lucide React

## Prerequisites
- Node.js 22
- Docker & Docker Compose

## Quick Start (Development)
```bash
npm install
npm run dev
```

## Docker Build (Production)
```bash
docker compose up --build
```

## Project Structure
```
ui-dashboard/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   ├── signals/
│   │   └── ui/
│   ├── hooks/
│   ├── pages/
│   ├── App.tsx
│   └── main.tsx
├── public/
├── Dockerfile
├── nginx.conf
└── docker-compose.yml
```

## Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| VITE_RUST_API_URL | Main Rust Backend API | http://localhost:8081 |
| VITE_SSE_URL | Server-Sent Events Endpoint | http://localhost:8089 |
| VITE_MSG_API_URL | Message Ingestion API | http://localhost:8001 |
| VITE_TOKENIZER_API_URL | Tokenizer NLP Engine | http://localhost:8002 |

## API Integration Notes
The frontend connects to the rust-app for core data and SSE events. Use the `/events` endpoint for live signal updates.

## Screenshots
*(Add screenshots here)*
