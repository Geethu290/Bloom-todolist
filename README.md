# 🌸 Bloom — Your Gentle To-Do List

> *"tend to your little list"*

A gentle, feminine, and aesthetic full-stack To-Do List web application featuring **Multi-User Authentication and Private Gardens**, built for the **Web Application Development (WAD)** curriculum. Bloom combines a calming visual sanctuary with full-stack engineering: an interactive HTML5/CSS3/jQuery frontend, an asynchronous Node.js & Express REST API, server-side session management with MongoDB persistence, bcrypt password hashing, and Mongoose ODM.

---

## 📖 Table of Contents

1. [Project Overview & Objectives](#-project-overview--objectives)
2. [WAD Syllabus Topics Demonstrated](#-wad-syllabus-topics-demonstrated)
3. [Design System & Aesthetics](#-design-system--aesthetics)
4. [Key Features & Multi-User Architecture](#-key-features--multi-user-architecture)
5. [System Architecture & File Organization](#-system-architecture--file-organization)
   - [Database Schemas (User & Task)](#database-schemas-user--task)
   - [Session Management & Cookie Security](#session-management--cookie-security)
   - [Legacy Data Migration Guarantee](#legacy-data-migration-guarantee)
6. [Technology Stack & Justification](#-technology-stack--justification)
7. [Installation & Setup Guide](#-installation--setup-guide)
8. [REST API Documentation](#-rest-api-documentation)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Task Management Endpoints](#task-management-endpoints)
9. [How It Works: Technical Walkthrough](#-how-it-works-technical-walkthrough)
   - [How AJAX Connects Frontend to Express](#how-ajax-connects-frontend-to-express)
   - [How Passwords Are Hashed with Bcrypt](#how-passwords-are-hashed-with-bcrypt)
   - [How Private Task Isolation Works](#how-private-task-isolation-works)
   - [Timezone-Safe Date Handling](#timezone-safe-date-handling)
10. [Automated Verification Test Suite](#-automated-verification-test-suite)
11. [College Viva & Presentation Guide](#-college-viva--presentation-guide)

---

## 🌸 Project Overview & Objectives

Traditional task management apps often feel clinical, corporate, and stressful. **Bloom** reimagines productivity through a softer, feminine lens — treating tasks not as chores to dread, but as gentle seeds in a personal garden that you nurture over time.

### Primary Objectives:
- **Multi-User Privacy:** Enable multiple users to register, log in, and maintain their own completely private task gardens without cross-user leakage.
- **Syllabus Mastery:** Implement a real-world, full-stack web application adhering strictly to standard college WAD technologies (no heavy external frontend frameworks like React or Tailwind).
- **Persistent CRUD & Sessions:** Store user profiles, hashed credentials, server-side sessions, and tasks persistently in MongoDB.
- **Asynchronous User Experience:** Use jQuery AJAX for seamless network communication, loading states, and live dashboard metrics updates without full-page reloads.
- **Thoughtful UI/UX:** Deliver a polished, responsive, and accessible user interface featuring a blush-pink and warm-cream palette, dark brown typography, smooth transitions, and gentle floral touches.

---

## 🎓 WAD Syllabus Topics Demonstrated

This project is tailored specifically for the **Web Application Development (WAD)** syllabus for B.Tech Information Technology:

| Syllabus Topic | How It Is Implemented in Bloom |
|---|---|
| **HTML5 & Semantic Structure** | Semantic layout with `<header>`, `<main>`, `<aside>`, `<nav>`, `<section>`, `<article>`, form controls, and accessible ARIA attributes. |
| **CSS3 & Responsive Design** | CSS custom variables (`:root`), Flexbox, CSS Grid, media queries for laptops, tablets, and mobile phones, keyframe animations (`@keyframes`), and smooth transitions. |
| **Vanilla JavaScript & ES6+** | `const`/`let`, arrow functions, template literals, destructuring, array methods (`map`, `filter`, `forEach`, `sort`), and `async`/`await`. |
| **DOM Manipulation** | Dynamic task card generation, modal dialog control, live stat recalculations, and empty-state switching. |
| **Event Handling** | Form submit events (`e.preventDefault()`), delegated click listeners for edit/delete buttons, keyboard event listeners (`Escape` key), and real-time search `input` events. |
| **jQuery & AJAX** | jQuery selectors, event binding, and asynchronous HTTP calls using `$.ajax()` with `GET`, `POST`, `PUT`, `PATCH`, and `DELETE`. |
| **User Authentication & Security** | Server-side sessions with `express-session`, salted password hashing with `bcryptjs`, session cookies with `HttpOnly` and `SameSite=lax`. |
| **Node.js Runtime** | Asynchronous JavaScript runtime executing the Express backend server and managing dependencies via `npm`. |
| **Express.js Framework** | Routing (`express.Router()`), static file serving (`express.static()`), request parsing (`express.json()`), CORS middleware, session middleware, and centralized error handling. |
| **MongoDB & Mongoose** | Document database schema design, relational user references (`ref: 'User'`), data types, field constraints (required, enum, trim, maxlength), timestamps, connection lifecycle tracking, and Mongoose model queries. |
| **Separation of Concerns** | Clear architectural division between presentation (`public/`), routing (`routes/`), data modeling (`models/`), database configuration (`config/`), and middleware (`middleware/`). |

---

## 🎨 Design System & Aesthetics

Bloom features a gentle, feminine visual identity that feels warm, peaceful, and refined.

- **Color Palette:**
  - **Canvas Background:** Soft Warm Ivory (`#FAF6F2`)
  - **Card Surfaces:** Crisp White (`#FFFFFF`) and Petal Cream (`#FFF9F6`)
  - **Brand & Accent Rose:** Dusty Rose (`#D98895`), Soft Blush (`#F6D6DC`), and Deep Rose (`#B85B6B`)
  - **Botanical Sage Green:** Gentle Sage (`#7D9B72`, `#EEF4EB`) for Low Priority & Calm vibes
  - **Honey Amber:** Warm Amber (`#B56D1E`, `#FFF4E5`) for Medium Priority
  - **Text Typography:** Dark Roasted Cocoa (`#3C2B2E`) for high-contrast, accessible readability
  - **Borders & Dividers:** Delicate Rose-Cream borders (`#F3E5E3`, `#E8D4D6`)
- **Typography:**
  - **Headings:** *Playfair Display* — an elegant, classic serif font.
  - **Body & Controls:** *Plus Jakarta Sans* — a clean, friendly, modern sans-serif font.
- **Visual Polish:**
  - Generous card border radii (`14px` - `28px`).
  - Subtle multi-layered drop shadows (`box-shadow: 0 4px 12px rgba(140, 70, 80, 0.05)`).
  - Floating ambient petals (CSS-animated Unicode flowers 🌸, 🌷, 🌿, 🤍, 🍃).
  - Eye icons (`👁️` / `🙈`) to toggle password visibility.
  - Zero harsh neon colors or childish cartoon styling.

---

## ✨ Key Features & Multi-User Architecture

### 1. Welcome / Login Page (`public/login.html`)
- Warm welcome card with Bloom logo (`🌸 Bloom`), tagline (*"tend to your little list"*), and greeting (*"A little space for your dreams, plans & everyday moments ✨"*).
- Email and password fields with inline validation.
- Show/hide password button (`👁️` / `🙈`).
- "Enter Your Garden 🌸" button with asynchronous loading spinner.
- Direct link to Create Account (`/register.html`).

### 2. Registration Page (`public/register.html`)
- Matching feminine card.
- Full Name, Email Address, Password, and Confirm Password fields.
- Password minimum length verification (at least 6 characters).
- Frontend and backend password match check.
- Duplicate email prevention (rejects already-registered emails with a friendly prompt to sign in).
- Passwords salted and hashed securely using `bcryptjs` before writing to MongoDB. Plain-text passwords are never stored.

### 3. Personal Dashboard & Private Task Isolation
- **Personalized Header:** Greets the logged-in user by name (*"A little space for you, [Name] ✨"*).
- **Sidebar Profile Card:** Displays the user's initial avatar, full name, nurturer role, and a quick sign-out button.
- **Header Sign Out Button:** Dedicated "Sign Out 🍃" button destroying server session and clearing cookies.
- **Strict Privacy Scoping:** Every task in MongoDB references its owner via `user: ObjectId`. Tasks, search queries, filters, and dashboard counts are strictly filtered by `req.session.userId`.
- **Zero Cross-User Access:** If User 2 attempts to view, update, or delete User 1's task by altering an ID, the server returns `404 Not Found`.

### 4. Complete CRUD Operations (Preserved & Protected)
- **Create:** Add a task with Title, Notes, Due Date, Priority (`Low`, `Medium`, `High`), and Status (`To Do`, `In Progress`, `Completed`).
- **Read:** Fetch only the authenticated user's tasks from MongoDB.
- **Update:** Edit task details via a gentle modal dialog.
- **Delete:** Safely remove a task with an aesthetic confirmation dialog.
- **Complete:** Floral circular checkbox toggle with strikethrough, muted tone, and checkmark.

### 5. Multi-Filter Navigation & Live Search
- **Filters:** All Tasks, Today (local calendar date), Upcoming, In Progress, Completed.
- **Search:** Instant debounced keyword search on title and description.
- **Sorting:** Newest First, Due Date (Soonest/Latest), Priority (High/Low), Title (A–Z).

---

## 🏛 System Architecture & File Organization

```text
bloom-todolist/
├── config/
│   └── db.js                 # Mongoose connection with timeout & readyState tracking
├── middleware/
│   ├── authMiddleware.js     # requireAuth (protects API & dashboard) & redirectIfAuth
│   └── errorHandler.js       # Centralized JSON error handler & 404 middleware
├── models/
│   ├── Task.js               # Task schema with user reference, validation & timestamps
│   └── User.js               # User schema with bcrypt password hashing & methods
├── public/                   # Static assets served by Express
│   ├── css/
│   │   └── style.css         # Complete feminine CSS design system with CSS variables
│   ├── js/
│   │   ├── auth.js           # Login & Registration AJAX logic, validation, show/hide toggle
│   │   ├── app.js            # Dashboard logic, session check, DOM rendering, & task AJAX
│   │   └── jquery.min.js     # Standalone jQuery 3.7.1 library (offline college lab ready)
│   ├── index.html            # Protected dashboard layout, forms, & modals
│   ├── login.html            # Beautiful Welcome / Sign In page
│   └── register.html         # Elegant Create Account page
├── routes/
│   ├── authRoutes.js         # REST endpoints for register, login, logout, me
│   └── taskRoutes.js         # REST endpoints for user-scoped task CRUD operations
├── tests/
│   └── verify.js             # Automated 50-test verification suite (auth & CRUD)
├── .env                      # Local environment configuration (PORT, MONGODB_URI, SESSION_SECRET)
├── .env.example              # Placeholder configuration template
├── .gitignore                # Excludes node_modules and .env
├── package.json              # Project scripts & dependencies
└── README.md                 # Complete documentation & college viva presentation guide
```

### Database Schemas (User & Task)

#### `models/User.js`:
```javascript
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 50 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
  },
  { timestamps: true }
);

// Hash password with bcrypt before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

#### `models/Task.js`:
```javascript
const taskSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Task owner is required.'],
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, trim: true, default: '', maxlength: 500 },
    dueDate: { type: Date, default: null },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
    status: { type: String, enum: ['To Do', 'In Progress', 'Completed'], default: 'To Do' },
  },
  { timestamps: true }
);

// Compound indexing for fast per-user queries
taskSchema.index({ user: 1, status: 1, dueDate: 1, priority: 1 });
```

### Session Management & Cookie Security
Sessions are managed using `express-session` backed by `connect-mongo`:
- **Server-Side Storage:** Active sessions are stored in MongoDB in a `sessions` collection. Sessions persist across server reloads and browser restarts.
- **Signed Cookie:** The client receives a signed `connect.sid` cookie.
- **Cookie Security:**
  - `httpOnly: true`: Prevents malicious JavaScript from reading the session cookie (mitigates XSS).
  - `sameSite: 'lax'`: Protects against Cross-Site Request Forgery (CSRF).
  - `maxAge: 7 * 24 * 60 * 60 * 1000`: 7-day session duration.

### Legacy Data Migration Guarantee
If tasks existed in MongoDB before authentication was added, Bloom's `migrateLegacyTasks` helper automatically links unassigned tasks to the first registered user account upon registration/login. **No student data was deleted or lost.**

---

## 🛠 Technology Stack & Justification

| Technology | Purpose | Why It Was Chosen |
|---|---|---|
| **HTML5** | Markup | Clean, accessible semantic structure with native form validation and input types (`type="date"`, `type="email"`). |
| **CSS3** | Presentation | Custom styling using CSS variables, Flexbox, Grid, and animations without relying on heavy external frameworks. |
| **Vanilla JavaScript** | Application Logic | Modern ES6+ features for parsing dates, managing arrays, and handling state. |
| **jQuery 3.7.1** | DOM & Event Handling | Simplifies element traversal, event delegation, and modal animations with cross-browser consistency. |
| **jQuery AJAX** | Client-Server Comm. | Performs non-blocking asynchronous HTTP requests (`$.ajax`) without reloading the page. |
| **Node.js** | Server Environment | Fast, event-driven JavaScript runtime running the backend web server. |
| **Express.js** | Web Framework | Minimalist routing framework for building clean RESTful API endpoints and serving static files. |
| **express-session** | Session Middleware | Creates secure server-side sessions and manages authentication cookies. |
| **connect-mongo** | Session Store | Persists active sessions inside MongoDB so logins survive server restarts. |
| **bcryptjs** | Password Hashing | Pure JavaScript implementation of bcrypt that securely salts and hashes passwords without native compilation issues on Windows. |
| **MongoDB** | Database | Flexible, scalable NoSQL document database ideal for storing JSON-like user and task records. |
| **Mongoose** | Object Data Modeling | Provides strict schema validation, type casting, default values, and relational references for MongoDB. |
| **dotenv** | Environment Config | Loads environment variables (`PORT`, `MONGODB_URI`, `SESSION_SECRET`) securely from a `.env` file. |

---

## 🚀 Installation & Setup Guide

### 1. Open Terminal in Project Directory
```powershell
cd "C:\Users\GEETHU\.gemini\antigravity\scratch\bloom-todolist"
```

### 2. Environment Variables (.env)
Your `.env` file is configured with:
```env
PORT=3000
MONGODB_URI=mongodb://127.0.0.1:27017/bloom_db
SESSION_SECRET=bloom_gentle_secret_key_2026_soft_blossom
```

### 3. Run Automated Tests
Execute the 50-test suite verifying authentication, cookies, CRUD, and isolation:
```powershell
npm test
```
*(Or `npm.cmd test`)*

### 4. Start the Application
```powershell
# Development mode (auto-restart with nodemon):
npm run dev

# Or standard mode:
npm start
```

### 5. Access in Browser
Navigate to:
👉 **`http://localhost:3000`**

- Unauthenticated visitors will be greeted with the **Sign In** page (`/login.html`).
- Click **"Create Account 🌷"** to register your personal garden.

---

## ☁️ Vercel Cloud Deployment Guide

Bloom is configured out-of-the-box for **Vercel** serverless hosting:

### Step 1: Set Up Free Online Database (MongoDB Atlas)
1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) and sign up for a free account.
2. Click **Build a Database** and choose the **M0 Free** cluster.
3. In **Database Access**: Create a username and password (e.g. `bloomuser` and your chosen password).
4. In **Network Access**: Click **Add IP Address** → Choose **Allow Access from Anywhere** (`0.0.0.0/0`) so Vercel's cloud servers can connect.
5. In **Database** → Click **Connect** → Choose **Drivers** (Node.js) → Copy the connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/bloom_db?retryWrites=true&w=majority
   ```
   *(Replace `<username>` and `<password>` with your database user credentials).*

### Step 2: Deploy to Vercel
1. Log in to [vercel.com](https://vercel.com) using your GitHub account (`Geethu290`).
2. Click **"Add New..."** → **"Project"**.
3. Under **Import Git Repository**, find **`Bloom-todolist`** and click **Import**.
4. In the **Configure Project** screen:
   - **Framework Preset:** Leave as *Other* (configured by `vercel.json`).
   - Expand the **Environment Variables** section and add:
     - `MONGODB_URI` = *(Your MongoDB Atlas connection string from Step 1)*
     - `SESSION_SECRET` = *(Any secure random string, e.g. `bloom_production_secret_key_2026`)*
     - `NODE_ENV` = `production`
5. Click **Deploy**!
6. In ~60 seconds, Vercel will complete the build and give you your live public URL:
   `https://bloom-todolist-xxxx.vercel.app` 🌸

---

## 📡 REST API Documentation

### Authentication Endpoints (`/api/auth`)

| Method | Endpoint | Description | Request Body | Response | Status |
|---|---|---|---|---|---|
| **POST** | `/api/auth/register` | Register a new account & start session | `{ name, email, password, confirmPassword }` | `{ success: true, message: "...", user: {...} }` | `201 Created` / `400` |
| **POST** | `/api/auth/login` | Authenticate credentials & start session | `{ email, password }` | `{ success: true, message: "...", user: {...} }` | `200 OK` / `401` |
| **POST** | `/api/auth/logout` | Destroy session & clear session cookie | None | `{ success: true, message: "..." }` | `200 OK` |
| **GET** | `/api/auth/me` | Check session & get logged-in user profile | None | `{ success: true, isAuthenticated: true, user: {...} }` | `200 OK` |

### Task Management Endpoints (`/api/tasks`)
*(All task endpoints require an active session via cookie)*

| Method | Endpoint | Description | Request Body | Success Response | Status |
|---|---|---|---|---|---|
| **GET** | `/api/tasks` | Get user's tasks (supports `search`, `filter`, `status`, `priority`, `sortBy`) | None | `{ success: true, count: 5, data: [...] }` | `200 OK` |
| **GET** | `/api/tasks/:id` | Get single task (must belong to user) | None | `{ success: true, data: {...} }` | `200 OK` / `404` |
| **GET** | `/api/tasks/stats/summary` | Get user's dashboard metrics | None | `{ success: true, data: { total, completed, ... } }` | `200 OK` |
| **POST** | `/api/tasks` | Plant a new task owned by logged-in user | `{ title, description, dueDate, priority, status }` | `{ success: true, message: "...", data: {...} }` | `201 Created` / `400` |
| **PUT** | `/api/tasks/:id` | Update task owned by logged-in user | `{ title, description, dueDate, priority, status }` | `{ success: true, message: "...", data: {...} }` | `200 OK` / `404` |
| **PATCH**| `/api/tasks/:id/status`| Quick status toggle for user's task | `{ status: "Completed" }` | `{ success: true, message: "...", data: {...} }` | `200 OK` / `404` |
| **DELETE**| `/api/tasks/:id` | Delete task owned by logged-in user | None | `{ success: true, message: "...", data: { id: "..." } }` | `200 OK` / `404` |

---

## 🔍 How It Works: Technical Walkthrough

### How Passwords Are Hashed with Bcrypt
1. When a user submits their password during registration, it is validated on the backend.
2. Mongoose executes a `pre('save')` hook:
   ```javascript
   const salt = await bcrypt.genSalt(10);
   this.password = await bcrypt.hash(this.password, salt);
   ```
3. A cryptographic salt with 10 rounds is generated and combined with the password.
4. Only the resultant irreversible hash is stored in MongoDB.
5. During login, `bcrypt.compare(enteredPassword, storedHash)` verifies the password without ever decrypting or storing plain-text passwords.

### How Private Task Isolation Works
- Every task document has a `user` field containing the owner's `ObjectId`.
- Task queries never accept a user ID from query parameters or request bodies (which could be spoofed).
- The user's identity is taken strictly from `req.session.userId`, set securely during login.
- Example:
  ```javascript
  const task = await Task.findOne({ _id: req.params.id, user: req.session.userId });
  ```
  If another user tries to fetch or modify that task, MongoDB returns `null`, and the server returns `404 Not Found`.

---

## 🧪 Automated Verification Test Suite

Bloom includes an automated test suite in `tests/verify.js` covering **50 individual assertions**:
1. Static files and routing protection (unauthenticated access redirects to `/login.html`).
2. API route protection (unauthenticated calls return `401 Unauthorized`).
3. User registration with password mismatch, length checks, and duplicate email prevention.
4. Password verification (confirming passwords are saved as `$2a/b` bcrypt hashes, not plain text).
5. User login and session cookie verification (`connect.sid`).
6. Session verification via `/api/auth/me`.
7. Task creation, reading, updating, and status toggling.
8. Multi-user isolation (User 2 registering, confirming User 2 cannot see or edit User 1's tasks).
9. Logout and session destruction (confirming session cookie becomes invalid).
10. Re-login persistence (confirming user tasks survive logout and re-login).

To run the test suite:
```powershell
npm test
```
Result: **`🌿 Full-Stack Verification Complete: 50 passed, 0 failed.`**

---

## 🎓 College Viva & Presentation Guide

**Q1: Why did you use server-side sessions with `connect-mongo` instead of JWT?**
> *"Server-side sessions using `express-session` and `connect-mongo` store session state in MongoDB and transmit an encrypted, HttpOnly session ID cookie to the browser. This eliminates the risk of token theft via JavaScript (XSS attacks), allows instant server-side revocation on logout, and ensures sessions persist across server restarts."*

**Q2: How do you prevent one user from accessing or modifying another user's tasks?**
> *"We enforce authorization at the database query level using the server-established session. The `user` ID is extracted from `req.session.userId`, never from client input. Every Mongoose query (`find`, `findOne`, `findOneAndUpdate`, `findOneAndDelete`) includes `{ user: req.session.userId }`. Even if a user guesses another task's ID, the query returns 404 Not Found."*

**Q3: How are passwords secured?**
> *"We use `bcryptjs` with a cost factor (salt rounds) of 10 in a Mongoose pre-save hook. Each password receives a unique cryptographic salt that protects against rainbow table and dictionary attacks. Plain-text passwords are never saved in MongoDB."*

**Q4: How does your application prevent unauthenticated access to the dashboard?**
> *"We implemented an `authMiddleware.js` module. For browser page requests (`/`, `/index.html`), if no active session is found, the server issues an HTTP 302 redirect to `/login.html`. For AJAX API requests (`/api/tasks`), the server returns an HTTP 401 Unauthorized JSON response, causing the client to redirect to login."*

---

*Made with 🌸 and care for Web Application Development (WAD).*
