# 🎓 Student Management System (SMS Pro)

A full-stack web application designed to manage student data, track attendance, handle fee collections, and publish exam results. Built with a modern, dynamic React frontend and a robust Node.js/Express backend.

## 🚀 Tech Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS v4 & PostCSS
- **Routing:** React Router v6
- **HTTP Client:** Axios
- **State Management:** React Context API

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MongoDB & Mongoose
- **Authentication:** JSON Web Tokens (JWT) & bcryptjs

## 🌟 Key Features

1. **Role-Based Access Control (RBAC):**
   - **Admin:** Full access. Can manage students, teachers, global reports, and collect fees.
   - **Teacher:** Restricted access. Can mark attendance and view their timetable.
   - **Student:** Restricted access. Can view their own attendance, timetable, results, and pending fees.
2. **Dashboard Overview:** Dynamic statistics and quick actions tailored to the logged-in user's role.
3. **Authentication:** Secure login and registration flows with encoded JWT roles.
4. **Timetable Management:** Fetch class schedules and assignments.
5. **Results & Fees:** Dedicated portals for grade publishing and fee tracking.

## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB running locally on port `27017`

### 1. Backend Setup
1. Open a terminal and navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `backend` directory (already configured for this environment):
   ```env
   PORT=5001
   MONGO_URI=mongodb://127.0.0.1:27017/sms-db
   JWT_SECRET=supersecretjwtkeyforstudentmanagementsystem
   NODE_ENV=development
   ```
4. Start the backend development server:
   ```bash
   npm run dev
   ```
   *The backend will run on `http://localhost:5001`.*

### 2. Frontend Setup
1. Open a new terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies (including Tailwind v4 integration):
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`.*

## 🔒 Default API Endpoints (Port 5001)
- `POST /api/auth/register` - Create a new user (requires name, email, password, role)
- `POST /api/auth/login` - Authenticate user and receive JWT
- `GET /api/health` - Check backend server health
- `GET /api/students` - Retrieve student list
- `GET /api/teachers` - Retrieve teacher list
- `GET /api/timetable` - Retrieve timetable (filterable by className)
- `GET /api/results` - Retrieve exam results
- `GET /api/fees` - Retrieve fee collections

## 🚀 Production Deployment

### Frontend (Vercel, Netlify, Render)
1. Set the build command to `npm run build` and output directory to `dist`.
2. Add the following environment variable to your hosting provider settings:
   - `VITE_API_URL=https://your-backend-api.com/api`

### Backend (Render, Heroku, AWS)
1. Add the following environment variables to your hosting provider settings:
   - `MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/sms-db`
   - `JWT_SECRET=your_super_strong_random_secret`
   - `NODE_ENV=production`
   - `CLIENT_URL=https://your-frontend-url.com` (Crucial for CORS security)
2. The backend uses `helmet` for secure HTTP headers and `express-rate-limit` to prevent brute-force attacks automatically when deployed.

## 💡 Troubleshooting
- **ERR_CONNECTION_REFUSED:** If the frontend cannot reach the backend, ensure the backend `.env` is set to `PORT=5001` and `frontend/src/api/axios.js` is targeting `http://localhost:5001/api`. (Port 5000 is often taken by Windows System processes).
- **Blank Tables / Crash on Login:** Ensure the API responses are properly returning `{ data: [...] }` and that the frontend components are parsing `res.data.data`.
