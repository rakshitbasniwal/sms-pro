# 🌊 Student Management System (SMS Pro) - Application Flow

This document outlines the core architecture, data flow, and user journeys within the SMS Pro application.

## 1. System Architecture Overview

The system follows a robust MERN (MongoDB, Express, React, Node.js) stack architecture.

```mermaid
graph LR
    A[React Frontend (Vite)] <-->|Axios / REST API| B(Express Backend)
    B <-->|Mongoose| C[(MongoDB)]
```

- **Frontend (`/frontend`)**: A React SPA built with Vite. It handles the UI, client-side routing (React Router), state management (React Context API), and styling.
- **Backend (`/backend`)**: A Node.js and Express REST API that handles business logic, security, routing, and database interactions.
- **Database**: MongoDB stores unstructured JSON-like documents. 

---

## 2. Core Modules & Data Models

The application is structured around several key domain entities, each with corresponding Mongoose models, Express routes, and React pages:

- **Users & Roles**: `User` model. Handles authentication and authorization.
- **Academics**: `Student`, `Teacher`, `Class`, `Section`, `Subject` models. Core academic entities.
- **Attendance**: `Attendance` model. Tracks student and teacher presence.
- **Timetable**: `Timetable` model. Manages scheduling for classes.
- **Examinations**: `Exam`, `Result` models. Manages exam schedules and student performance.
- **Finance**: `Fee`, `Payment`, `Salary` models. Handles student fee collection and teacher payroll.
- **Miscellaneous**: `Activity` model for tracking miscellaneous actions or logs.

---

## 3. Authentication Flow

Authentication uses **JSON Web Tokens (JWT)**.

1. **Login Request:** The user submits their email and password from the `Auth` module.
2. **Backend Verification:** `authController.js` hashes the password and checks it against the `User` collection.
3. **Token Generation:** If successful, the backend generates a signed JWT containing the user's `id` and `role`.
4. **Token Storage:** The frontend receives the JWT and stores it locally (e.g., `localStorage`).
5. **Context Update:** The `AuthContext` decodes the token, extracts the `role`, and sets the global `user` state.
6. **Protected Routes:** For every subsequent API request, an Axios interceptor automatically injects the token into the `Authorization: Bearer <token>` header.
7. **Backend Validation:** The backend `authMiddleware.js` verifies the token using the `protect` middleware on protected routes. Role-based checks are handled by the `authorize` middleware.

---

## 4. User Journeys & Role-Based Access Control (RBAC)

The UI dynamically adapts based on the `role` stored in the AuthContext.

### Admin Flow
- **Dashboard:** Sees global system statistics (Total Students, Teachers, Revenue, etc.).
- **Access:** Has full access to all modules including Students, Teachers, Classes, Subjects, Attendance, Exams, Results, Fees, Payroll, and comprehensive Reports.
- **Capabilities:** Unrestricted CRUD (Create, Read, Update, Delete) capabilities across the entire system.

### Teacher Flow
- **Dashboard:** Sees teacher-specific statistics (My Classes, Upcoming Exams, etc.).
- **Access:** Restricted access. Can access My Classes, Mark Attendance, Timetable, Exams, and Results. Cannot access global finance or payroll modules.
- **Capabilities:** Can view assigned students, mark daily attendance, and upload/manage exam results.

### Student Flow
- **Dashboard:** Sees personal statistics (My Attendance, Pending Fees, Upcoming Exams).
- **Access:** Highly restricted access. Can only view their own Profile, Timetable, Attendance records, Results, and Fee payment status.
- **Capabilities:** Read-only access to their own data.

---

## 5. Typical Data Fetching Lifecycle

Here is exactly what happens when a user navigates to a data-driven page (e.g., "Timetable"):

1. **Navigation:** React Router changes the URL to `/timetable` and mounts the `Timetable` component.
2. **Component Mount:** The `useEffect` hook in the component triggers a data fetch function.
3. **API Request:** Axios sends a `GET` request to `http://localhost:5000/api/timetable` (with the JWT token attached).
4. **Backend Processing:** 
   - `server.js` routes the request to `timetableRoutes.js`.
   - The route validates the token and calls the appropriate method in the controller.
   - The controller queries MongoDB via the Mongoose model (`Timetable.find()`).
5. **API Response:** The backend sends back a JSON response.
6. **State Update:** The React component receives the data and updates its local state.
7. **Render:** React re-renders the component to display the data in the UI (e.g., in a table or grid).
