# OPSERA

**AI-Powered Operations Platform for Scheduling, Route Optimization, and Warehouse Management**

OPSERA is a full-stack operations platform designed to help logistics and warehouse teams manage scheduling, delivery routes, inventory, and AI-assisted operational decisions from a single system.

The platform currently consists of a web frontend, a TypeScript/Express backend, and several Python FastAPI microservices for AI and optimization workloads.

---

## Features

### Warehouse Management
- Product and inventory management
- Stock movement tracking
- Low-stock monitoring
- AI-assisted warehouse insights
- Demand / stock forecasting support

### Route Optimization
- Delivery route optimization
- Route recommendations
- Distance and route calculation
- Separate optimization microservice

### Smart Scheduling
- Operational task scheduling
- Conflict detection
- AI-assisted scheduling recommendations
- Alternative schedule suggestions
- Separate scheduling microservice

### Authentication
- User registration
- User login
- Protected application routes
- Backend authentication integration

---

## System Architecture

OPSERA uses a modular architecture where the main backend communicates with multiple independent AI/optimization services.

```text
┌────────────────────┐
│     Web Frontend   │
│   React + Vite     │
└─────────┬──────────┘
          │
          │ HTTP / REST
          ▼
┌────────────────────┐
│   Main Backend API │
│ Express + TypeScript│
│ Prisma + PostgreSQL │
└─────┬──────┬───────┘
      │      │
      │      ├───────────────────────┐
      │                              │
      ▼                              ▼
┌──────────────────┐       ┌──────────────────┐
│ Warehouse AI     │       │ Route Service    │
│ FastAPI          │       │ FastAPI          │
│ Port 8000        │       │ Port 8001        │
└──────────────────┘       └──────────────────┘
                                      │
                                      │
                                      ▼
                           ┌──────────────────┐
                           │ Scheduling       │
                           │ Service          │
                           │ FastAPI          │
                           │ Port 8002        │
                           └──────────────────┘
```

> Port assignments above follow the current development setup and can be changed through configuration if needed.

---

## Tech Stack

### Frontend
- React
- Vite
- React Router
- JavaScript / JSX
- CSS
- Lucide React

### Backend
- Node.js
- Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT-based authentication

### AI / Optimization Services
- Python
- FastAPI
- Uvicorn
- scikit-learn
- Route optimization components
- Scheduling recommendation components

---

## Project Structure

The repository is expected to follow a structure similar to:

```text
Compfest/
│
├── frontend/
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── ...
│
├── backend/
│   ├── src/
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   ├── package.json
│   └── ...
│
├── ai-service/
│   ├── main.py
│   ├── models/
│   ├── requirements.txt
│   └── ...
│
├── route-service/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── scheduling-service/
│   ├── main.py
│   ├── requirements.txt
│   └── ...
│
├── .gitignore
└── README.md
```

> The exact directory names should be adjusted to match the final repository version.

---

# Getting Started

## 1. Prerequisites

Install the following software before running OPSERA.

### Required

- **Git**
- **Node.js**
- **npm**
- **Python**
- **PostgreSQL**

Recommended versions:

```text
Node.js 20+
npm 10+
Python 3.11+
PostgreSQL 16+
```

For Python AI services, use the same Python and library versions used to train/export the machine-learning models whenever possible.

This is especially important for `scikit-learn`, because loading a model generated using a different scikit-learn version can cause compatibility warnings or runtime errors.

---

## 2. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd Compfest
```

---

# Environment Variables

Do **not** commit actual `.env` files to GitHub.

Create local `.env` files based on `.env.example`.

Example:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

---

## Backend Environment

Example:

```env
PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

JWT_SECRET="your-development-secret"
JWT_REFRESH_SECRET="your-refresh-secret"

AI_SERVICE_URL="http://127.0.0.1:8000"
ROUTE_SERVICE_URL="http://127.0.0.1:8001"
SCHEDULING_SERVICE_URL="http://127.0.0.1:8002"

CLIENT_ORIGIN="http://localhost:5173"
```

Never place production credentials directly inside the source code.

---

## Frontend Environment

Example:

```env
VITE_API_URL=http://localhost:5000
```

If additional services are accessed directly from the frontend, define them through environment variables rather than hardcoding URLs.

---

# Backend Setup

## 1. Enter the Backend Directory

```bash
cd backend
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment Variables

Create:

```text
backend/.env
```

Then configure at minimum:

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
AI_SERVICE_URL=http://127.0.0.1:8000
ROUTE_SERVICE_URL=http://127.0.0.1:8001
SCHEDULING_SERVICE_URL=http://127.0.0.1:8002
```

---

# Database Setup

OPSERA uses PostgreSQL through Prisma ORM.

## 1. Generate Prisma Client

```bash
npx prisma generate
```

## 2. Apply Database Migration

For development:

```bash
npx prisma migrate dev
```

If migrations already exist and only need to be applied:

```bash
npx prisma migrate deploy
```

## 3. Seed the Database

```bash
npx prisma db seed
```

If the seed script contains a default development account, do not reuse the same credentials in production.

---

## Optional: Open Prisma Studio

```bash
npx prisma studio
```

Prisma Studio can be used to inspect database records during development.

---

# Run the Backend

From:

```text
/backend
```

Run:

```bash
npm run dev
```

The backend should start on the configured backend port.

Example:

```text
http://localhost:5000
```

---

# Warehouse AI Service

The warehouse AI service handles warehouse-related AI functionality such as forecasting or inventory recommendations.

## 1. Open a New Terminal

```bash
cd ai-service
```

## 2. Create a Virtual Environment

Windows:

```bash
py -3.11 -m venv .venv
```

Linux/macOS:

```bash
python3 -m venv .venv
```

## 3. Activate the Environment

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Windows Command Prompt:

```cmd
.venv\Scripts\activate
```

Linux/macOS:

```bash
source .venv/bin/activate
```

## 4. Install Dependencies

```bash
pip install -r requirements.txt
```

## 5. Run the Service

Example:

```bash
uvicorn main:app --reload --port 8000
```

Service URL:

```text
http://127.0.0.1:8000
```

FastAPI documentation:

```text
http://127.0.0.1:8000/docs
```

---

# Route Optimization Service

Open another terminal:

```bash
cd route-service
```

Create and activate a virtual environment if one has not been created yet.

Windows:

```bash
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
uvicorn main:app --reload --port 8001
```

Service URL:

```text
http://127.0.0.1:8001
```

FastAPI documentation:

```text
http://127.0.0.1:8001/docs
```

---

# Scheduling Service

Open another terminal:

```bash
cd scheduling-service
```

Create a virtual environment:

```bash
py -3.11 -m venv .venv
```

Activate it:

```powershell
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run:

```bash
uvicorn main:app --reload --port 8002
```

Service URL:

```text
http://127.0.0.1:8002
```

FastAPI documentation:

```text
http://127.0.0.1:8002/docs
```

---

# Frontend Setup

Open another terminal.

Enter the frontend directory:

```bash
cd frontend
```

Install dependencies:

```bash
npm install
```

Create the frontend environment file if required:

```env
VITE_API_URL=http://localhost:5000
```

Start Vite:

```bash
npm run dev
```

The frontend will normally be available at:

```text
http://localhost:5173
```

---

# Recommended Startup Order

For local development, start the services in the following order:

```text
1. PostgreSQL
2. Warehouse AI Service       → port 8000
3. Route Optimization Service → port 8001
4. Scheduling Service         → port 8002
5. Main Backend               → port 5000
6. Frontend                   → port 5173
```

Running every component in a separate terminal makes logs easier to debug.

---

# Local Development URLs

| Service | URL |
|---|---|
| Frontend | `http://localhost:5173` |
| Backend API | `http://localhost:5000` |
| Warehouse AI | `http://127.0.0.1:8000` |
| Warehouse AI Docs | `http://127.0.0.1:8000/docs` |
| Route Service | `http://127.0.0.1:8001` |
| Route Service Docs | `http://127.0.0.1:8001/docs` |
| Scheduling Service | `http://127.0.0.1:8002` |
| Scheduling Service Docs | `http://127.0.0.1:8002/docs` |

---

# GitHub Safety

Before pushing the repository to GitHub, make sure sensitive files are excluded.

Recommended `.gitignore` entries:

```gitignore
# Environment variables
.env
.env.*
!.env.example

# Node
node_modules/
dist/
build/

# Vite
.vite/

# Python
.venv/
venv/
__pycache__/
*.py[cod]
.pytest_cache/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Prisma / Local databases
*.db
*.db-journal

# Secrets / credentials
*.pem
*.key
credentials.json
service-account.json

# ML temporary/cache files
.cache/
```

Do not commit:

- Database passwords
- JWT secrets
- API keys
- Firebase credentials
- Google Maps API keys
- Cloud provider credentials
- Production `.env`
- Private certificates
- Service-account JSON
- Personal access tokens

---

# `.env.example`

Instead of uploading `.env`, create an example file containing only variable names and safe development defaults.

Example:

```env
PORT=5000

DATABASE_URL=

JWT_SECRET=
JWT_REFRESH_SECRET=

AI_SERVICE_URL=http://127.0.0.1:8000
ROUTE_SERVICE_URL=http://127.0.0.1:8001
SCHEDULING_SERVICE_URL=http://127.0.0.1:8002

CLIENT_ORIGIN=http://localhost:5173
```

---

# Important Note for Machine Learning Models

Some OPSERA services load trained machine-learning model files.

A model serialized with one version of `scikit-learn` may not load correctly using a significantly different version.

For example:

```text
Model trained/exported using scikit-learn 1.6.x
Runtime using scikit-learn 1.0.x
```

may produce compatibility warnings or errors.

For reproducible setup, pin Python dependencies inside:

```text
requirements.txt
```

Example:

```text
scikit-learn==<MODEL_COMPATIBLE_VERSION>
```

The exact version should match the version used by the final model.

---

# Troubleshooting

## PowerShell Blocks npm Scripts

If PowerShell returns:

```text
running scripts is disabled on this system
```

run:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

Then restart PowerShell.

Alternatively, run npm commands through Command Prompt.

---

## Port Already in Use

If a service cannot start because a port is already occupied, check the running process or change the service port.

Windows:

```powershell
netstat -ano | findstr :8000
```

Then identify the corresponding PID.

---

## Prisma Client Error

Run:

```bash
npx prisma generate
```

If the database schema changed:

```bash
npx prisma migrate dev
```

---

## Database Connection Error

Check:

```env
DATABASE_URL
```

Make sure:

- PostgreSQL is running.
- The database exists.
- Username and password are correct.
- The configured port is correct.

---

## AI Service Cannot Be Reached

Confirm that all Python services are running:

```text
8000 → Warehouse AI
8001 → Route Optimization
8002 → Scheduling
```

Then verify the backend `.env` service URLs.

---

## scikit-learn Model Compatibility Warning

Check the model's original scikit-learn version and install the compatible version inside the service's virtual environment.

Avoid blindly loading a model created using a newer scikit-learn release into a much older runtime.

---

# Development Workflow

Recommended workflow:

```bash
git checkout -b feature/<feature-name>
```

After making changes:

```bash
git add .
git commit -m "feat: describe your changes"
git push origin feature/<feature-name>
```

Merge changes through a Pull Request when collaborating with multiple team members.

---

# Security Checklist Before Push

Before every public GitHub push:

```bash
git status
```

Then verify that no `.env`, credentials, secrets, large local environments, or private data are staged.

You can also inspect staged files with:

```bash
git diff --cached --name-only
```

For an existing repository, remember that adding a file to `.gitignore` does **not** remove it from Git history if it has already been committed.

Example:

```bash
git rm --cached .env
```

Then rotate any secret that has already been committed.

---

# Current Development Ports

```text
Frontend             : 5173
Backend              : 5000
Warehouse AI Service : 8000
Route Service        : 8001
Scheduling Service   : 8002
```

---

# Future Improvements

Planned improvements include:

- Improved AI forecasting
- More advanced scheduling recommendations
- Dynamic route re-optimization
- Real-time notification system
- Reporting and analytics
- Production deployment configuration
- Automated integration tests
- CI/CD pipeline
- Dockerized local development

---

# Team


OPSERA was developed as an AI-powered operations platform for the COMPfest project.

---

## License

This repository is intended for project and competition development.

Add the appropriate open-source license before making the repository publicly reusable.
