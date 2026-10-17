# Collaborative Task Manager

A role-aware task management application with a React frontend, Express API, MongoDB persistence, and real-time task events over Socket.IO.

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-API-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-Realtime-010101?logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![JWT](https://img.shields.io/badge/JWT-Authentication-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

## Links

- **Live demo:** https://collaborative-task-manager-drab.vercel.app/
- **GitHub repository:** [Joy-Saha-22/Collaborative-Task-Manager](https://github.com/Joy-Saha-22/Collaborative-Task-Manager)

## Features

### Admin

- Register as an admin when a valid admin invite token is supplied; otherwise, registration creates a member account.
- View dashboard task totals, overdue-task count, task status and priority charts, and the ten most recently created tasks.
- Create, view, update, and delete tasks; set priority, due date, assignees, checklist items, and attachment links.
- Browse all tasks, filter by status, and page through results.
- View the member directory with per-member task counts (pending, in progress, completed).
- Download Excel reports for tasks and users' assigned-task counts.
- See task creation, updates, deletion, status changes, and checklist changes appear live on every view, with toast notifications for changes made by other users. Your own actions don’t trigger toasts.
- When editing a task, an alert appears if someone else changes that same task, with a one-click reload. This prevents overwriting unsaved input.

### Member

- Register and log in with an email and password; optionally upload a profile image during registration.
- View a dashboard and task list scoped to tasks assigned to the signed-in member.
- Filter and paginate assigned tasks, inspect task details, and tick off checklist items on assigned tasks.
- See checklist completion reflected in task progress and status.
- Receive real-time task updates for assigned tasks.

### Shared and server behavior

- JWT bearer-token authentication for protected API routes. Tokens expire after seven days.
- API role checks for routes marked admin-only.
- Avatar images are uploaded to Cloudinary; task attachments are stored as links supplied in the task form.
- Socket.IO connections are authenticated with the same JWT, and events are routed to per-user rooms plus a shared admins room.
- Rate limiting: auth routes allow 10 failed attempts per 15 minutes per IP and email; other API routes allow 200 requests per 15 minutes per IP.

## Tech stack

| Area | Technologies |
| --- | --- |
| Frontend | React 19, Vite, React Router, Axios, Tailwind CSS 4, Recharts, Socket.IO Client |
| Backend | Node.js, Express 5, Mongoose, JWT (`jsonwebtoken`), `bcryptjs`, Socket.IO |
| Database | MongoDB |
| File and report services | Cloudinary via Multer storage; ExcelJS for `.xlsx` report generation |
| Deployment | Vercel (frontend), Render (backend), MongoDB Atlas (database), Cloudinary (images) |

## Architecture

```text
Backend/
├── config/
│   └── db.js
├── controllers/
│   ├── authController.js
│   ├── reportController.js
│   ├── taskController.js
│   └── userController.js
├── middlewares/
│   ├── authMiddleware.js
│   ├── rateLimiter.js
│   └── uploadMiddleware.js
├── models/
│   ├── Task.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   ├── reportRoutes.js
│   ├── taskRoutes.js
│   └── userRoutes.js      
├── package.json
└── server.js

Frontend/
├── public/
├── src/
│   ├── assets/
│   ├── components/
│   │   ├── Cards/
│   │   ├── Charts/
│   │   ├── Inputs/
│   │   └── layouts/
│   ├── context/
│   ├── hooks/
│   ├── pages/
│   │   ├── Admin/
│   │   ├── Auth/
│   │   └── User/
│   ├── routes/
│   ├── utils/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── package.json
├── vercel.json
└── vite.config.js
```

The frontend calls the REST API using Axios and sends the stored JWT as a bearer token in the `Authorization` header. Express mounts route modules under `/api/auth`, `/api/users`, `/api/tasks`, and `/api/reports`. The `protect` middleware verifies the JWT and loads the user; `adminOnly` permits only users whose role is `admin`. Socket.IO runs on the same HTTP server, verifies the handshake token, and broadcasts task events to per-user rooms and, for admins, the shared `admins` room.

## API reference

All paths below are mounted by `Backend/server.js`. “Authenticated” means the route uses `protect`; “Admin only” means it uses both `protect` and `adminOnly`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Register a member, or an admin when the configured invite token matches. |
| `POST` | `/api/auth/login` | Public | Verify credentials and return a JWT and user details. |
| `GET` | `/api/auth/profile` | Authenticated | Return the signed-in user's profile. |
| `PUT` | `/api/auth/profile` | Authenticated | Update the signed-in user's profile. |
| `POST` | `/api/auth/upload-image` | Public | Upload a `jpeg`, `jpg`, or `png` image to Cloudinary and return its URL. |
| `GET` | `/api/users` | Admin only | List member accounts with counts by task status. |
| `GET` | `/api/users/:id` | Authenticated | Get a user by ID. |
| `GET` | `/api/tasks/dashboard-data` | Authenticated | Return overall task statistics, distributions, priority counts, and recent tasks. |
| `GET` | `/api/tasks/user-dashboard-data` | Authenticated | Return dashboard data for tasks assigned to the signed-in user. |
| `GET` | `/api/tasks` | Authenticated | List all tasks for admins or assigned tasks for members; accepts `status`, `page`, and `limit` query parameters. |
| `GET` | `/api/tasks/:id` | Authenticated | Get task details by ID. |
| `POST` | `/api/tasks` | Admin only | Create a task. |
| `PUT` | `/api/tasks/:id` | Admin Only | Update task fields, including assignees, checklist, and attachment links. |
| `DELETE` | `/api/tasks/:id` | Admin only | Delete a task. |
| `PUT` | `/api/tasks/:id/status` | Authenticated | Update task status; the controller allows admins or assigned members. |
| `PUT` | `/api/tasks/:id/todo` | Authenticated | Update the task checklist and recalculate progress and status; the controller allows admins or assigned members. |
| `GET` | `/api/reports/export/tasks` | Admin only | Download an Excel workbook of tasks and assignees. |
| `GET` | `/api/reports/export/users` | Admin only | Download an Excel workbook of users' assigned-task totals by status. |

## Environment variables

Create `Backend/.env` for the backend values. Vite reads its variable from `Frontend/.env` (or another Vite-supported environment file). Do not commit real credentials; the root `.gitignore` excludes `.env` and `.env.local`.

| Variable | Application | Purpose | Example |
| --- | --- | --- | --- |
| `PORT` | Backend | HTTP and Socket.IO server port; defaults to `8000` when unset. | `8000` |
| `MONGO_URI` | Backend | MongoDB connection string used by Mongoose. | `mongodb://127.0.0.1:27017/collaborative_task_manager` |
| `JWT_SECRET` | Backend | Secret used to sign and verify API and Socket.IO JWTs. | `replace-with-a-long-random-secret` |
| `ADMIN_INVITE_TOKEN` | Backend | Token a registrant must provide to receive the `admin` role. | `replace-with-an-invite-token` |
| `CLIENT_URL` | Backend | Allowed frontend origin for Express CORS and Socket.IO CORS; defaults to `*` when unset. | `http://localhost:5173` |
| `CLOUDINARY_CLOUD_NAME` | Backend | Cloudinary cloud name for avatar image uploads. | `your-cloud-name` |
| `CLOUDINARY_API_KEY` | Backend | Cloudinary API key for avatar image uploads. | `your-cloudinary-api-key` |
| `CLOUDINARY_API_SECRET` | Backend | Cloudinary API secret for avatar image uploads. | `replace-with-your-cloudinary-secret` |
| `VITE_API_URL` | Frontend | Base URL used for REST API and Socket.IO connections; defaults to `http://localhost:8000`. | `http://localhost:8000` |

## Getting started

### Prerequisites

- Node.js and npm.
- A MongoDB instance and its connection URI.
- Cloudinary credentials if you want profile-image uploads.

### Clone and install

```bash
git clone https://github.com/Joy-Saha-22/Collaborative-Task-Manager.git
cd Collaborative-Task-Manager

cd Backend
npm install

cd ../Frontend
npm install
```

Create the backend and frontend environment files described above. The frontend can use the default API URL when the backend is running locally on port `8000`.

### Run the backend

From `Backend/`:

```bash
npm run dev
```

The development script runs `nodemon server.js`. To run the non-watch server:

```bash
npm start
```

### Run the frontend

From `Frontend/`, in a separate terminal:

```bash
npm run dev
```

The Vite development server prints its local URL when it starts.

### Other frontend scripts

Run these from `Frontend/`:

```bash
npm run build
npm run preview
npm run lint
```

`build` creates the production frontend bundle, `preview` serves that bundle locally, and `lint` runs ESLint.

## Deployment notes

- `Frontend/vercel.json` rewrites all paths to `/index.html`, supporting the React Router single-page application on Vercel. The Vite production build output is `Frontend/dist`.
- The frontend is deployed on Vercel, the backend on Render, and the database on MongoDB Atlas. On Render, set the backend environment variables listed above, including CLIENT_URL set to the Vercel frontend URL.
- Set `VITE_API_URL` at frontend build time to the deployed backend base URL. The same base URL is used for REST and Socket.IO connections.
- Avatar uploads use Cloudinary storage configured by the backend.

## Author

- Joy Saha, [joysaha22.dev@gmail.com](https://mail.google.com/mail/?view=cm&to=joysaha22.dev@gmail.com) | [LinkedIn](https://www.linkedin.com/in/devjoysaha/)
