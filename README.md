# Claims Processing — Protection Policies

A sample web application for processing insurance claims against Protection policies
(Life Cover, Critical Illness, Income Protection, Terminal Illness). Built as reference
source code for automated test-case generation from a BRD (Business Requirements Document).

## Stack

- **Backend:** Node.js + Express, REST API, in-memory data store (`backend/src/data/seed.js`)
- **Frontend:** React 18 + React Router, Vite dev server, plain CSS

## Features

- Login with role-based access: **handler**, **adjudicator**, **admin**
- Policy search by policy number or holder name
- File a new claim against an active policy (with validation: active policy, amount within
  sum assured, required fields)
- Claims list with search/filter by status and claim type
- Claim details view with status history and attached documents
- Adjudication workflow: `Submitted → Under Review → (Additional Info Requested) → Approved → Paid`,
  or `Rejected` at review/info-requested stages
- Dashboard with claim counts by status and total claimed/approved amounts

## Demo accounts

| Username      | Password         | Role         |
|---------------|------------------|--------------|
| `handler`     | `handler123`     | handler      |
| `adjudicator` | `adjudicator123` | adjudicator  |
| `admin`       | `admin123`       | admin        |

## Running locally

### Backend

```bash
cd backend
npm install
npm start
# API listens on http://localhost:4000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173 and proxies /api to the backend
```

## API overview

| Method | Path                        | Description                                  | Auth               |
|--------|------------------------------|-----------------------------------------------|---------------------|
| POST   | `/api/auth/login`            | Log in, returns token + user                  | none                |
| GET    | `/api/auth/me`                | Get current user                              | any                 |
| GET    | `/api/policies?query=`       | Search policies                               | any                 |
| GET    | `/api/policies/:id`          | Get policy detail                             | any                 |
| GET    | `/api/claims?status=&query=` | List/filter claims                            | any                 |
| GET    | `/api/claims/:id`            | Get claim detail                              | any                 |
| POST   | `/api/claims`                | Submit a new claim                            | handler, admin      |
| PATCH  | `/api/claims/:id/status`     | Transition claim status                       | adjudicator, admin  |
| POST   | `/api/claims/:id/documents`  | Attach a document                             | any                 |
| GET    | `/api/stats/dashboard`       | Claim counts and totals                       | any                 |

## UI test hooks

Interactive elements expose `data-testid` attributes (e.g. `login-button`, `claim-type-select`,
`submit-claim-button`, `status-badge-approved`) to support automated UI testing (e.g. Playwright).

## Project structure

```
Claimsprocessing/
├── backend/
│   ├── server.js
│   └── src/
│       ├── data/seed.js
│       ├── middleware/{auth,errorHandler}.js
│       └── routes/{auth,policies,claims,stats}.js
└── frontend/
    ├── index.html
    └── src/
        ├── api/client.js
        ├── context/AuthContext.jsx
        ├── components/
        └── pages/
```
