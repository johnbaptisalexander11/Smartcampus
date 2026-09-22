# Smart Campus Food and Student Support System (MERN)

A full-stack university campus platform that combines canteen food services with student support features in one application.

This project is built using the MERN stack:
- **MongoDB** (database)
- **Express.js** (backend framework)
- **React.js** (frontend)
- **Node.js** (runtime)

---

## Project Modules

### Authentication
- JWT-based login and registration
- Role support: `student`, `admin`, `vendor`
- Protected routes and role-based authorization

### Food Ordering
- Browse menu
- Search and filter by category/canteen
- Cart management
- Checkout and order placement
- Order history and status tracking
- Ratings and reviews

### Wallet
- Wallet balance
- Top up wallet
- Pay for food orders
- Transaction history
- Monthly spending summary
- Reward points placeholder

### Complaints
- Submit complaint
- Complaint list and status tracking
- Admin complaint review and status updates

### Food Sharing
- Post extra food with expiry time
- View available shared food
- Claim shared food
- Mark as collected

### Group Study
- Create and join study groups
- Task tracking
- Shared notes
- Attendance tracking
- Room booking placeholder

### Admin Panel
- **Super admin** (`admin@campus.edu`): dashboard stats, users, all orders, wallet reports, complaints, food-sharing moderation
- **Canteen owners** (`canteen1@` … `canteen4@`): dashboard for their canteen, **manage menu** (prices and items visible on the student menu), and **orders** for that canteen only

### Vendor Panel
- Dashboard stats
- Manage menu items
- Manage incoming orders
- Update order status
- Revenue summary

---

## High-Level Folder Structure

```text
project-root/
├─ backend/
│  ├─ config/
│  ├─ controllers/
│  ├─ middleware/
│  ├─ models/
│  ├─ routes/
│  ├─ scripts/
│  │  └─ seedData.js
│  ├─ utils/
│  ├─ validations/
│  ├─ app.js
│  └─ server.js
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  ├─ context/
│  │  ├─ layouts/
│  │  ├─ modules/
│  │  ├─ routes/
│  │  └─ services/
│  └─ index.html
├─ .env.example
└─ README.md
```

---

## Setup Instructions

## 1) Clone and open project
```bash
git clone <your-repo-url>
cd <project-folder>
```

## 2) Configure environment variables
Copy `.env.example` into `.env` at project root and update values:
```env
NODE_ENV=development
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/canteen_management
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d
```

Create `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

## 3) Install dependencies

Backend:
```bash
cd backend
npm install
```

Frontend:
```bash
cd ../frontend
npm install
```

## 4) Seed sample data
From backend folder:
```bash
npm run seed
```

## 5) Run backend and frontend

Backend:
```bash
cd backend
npm run dev
```

Frontend:
```bash
cd frontend
npm run dev
```

---

## Sample Seed Data

Seed includes:
- 4 users: admin, vendor, 2 students
- food categories and menu items
- wallet balances and transactions
- complaints
- food sharing posts
- one study group with tasks, notes, and attendance

Default seeded credentials:
- **Super admin** (platform-wide): `admin@campus.edu / password123`
- **Canteen owners** (menu + orders for one canteen each):
  - `canteen1@campus.edu / CanteenAdmin1` (1st Canteen)
  - `canteen2@campus.edu / CanteenAdmin2` (2nd Canteen)
  - `canteen3@campus.edu / CanteenAdmin3` (3rd Canteen)
  - `canteen4@campus.edu / CanteenAdmin4` (4th Canteen)
- `vendor@campus.edu / password123`
- `student1@campus.edu / password123`
- `student2@campus.edu / password123`

---

## API Base

Backend base URL:
```text
http://localhost:5000/api
```

Main route groups:
- `/auth`
- `/food-ordering`
- `/wallet`
- `/complaints`
- `/food-sharing`
- `/group-study`
- `/admin`
- `/vendor`

---

## Test Checklist (Manual QA)

Use this checklist for final submission demo/testing.

### Authentication
- [ ] Register as student
- [ ] Login with valid credentials
- [ ] Protected routes block unauthenticated users
- [ ] Role-based routes restrict access correctly

### Food Ordering
- [ ] Menu loads
- [ ] Search works
- [ ] Category/canteen filters work
- [ ] Add/update/remove cart items works
- [ ] Checkout totals are correct
- [ ] Place order creates order history entry
- [ ] Order status timeline is visible
- [ ] Rating/review can be submitted

### Wallet
- [ ] Wallet balance loads
- [ ] Top up increases balance
- [ ] Pay for order deducts balance
- [ ] Transaction history updates
- [ ] Monthly spending summary shows data

### Complaints
- [ ] Student can submit complaint
- [ ] Student can view own complaints
- [ ] Admin can view all complaints
- [ ] Admin can update complaint status

### Food Sharing
- [ ] Student can create post
- [ ] Available posts list loads
- [ ] Another student can claim post
- [ ] Claimed post can be marked collected
- [ ] Expired post handling works

### Group Study
- [ ] Create study group
- [ ] Join study group
- [ ] Add/update tasks
- [ ] Add shared notes
- [ ] Mark attendance
- [ ] Update room booking placeholder

### Admin Panel
- [ ] Dashboard stats load
- [ ] User status toggle works
- [ ] Orders list loads
- [ ] Wallet report loads
- [ ] Food sharing moderation works

### Vendor Panel
- [ ] Dashboard stats load
- [ ] Create/update/delete menu item
- [ ] Incoming orders list loads
- [ ] Update order status
- [ ] Revenue summary loads

---

## Future Improvements

1. **Payment Gateway Integration**
   - Integrate Razorpay/Stripe for real wallet top-up and settlement flows.

2. **Notification System**
   - Add real-time notifications (WebSocket) for order updates, complaints, and group activities.

3. **File Uploads**
   - Add image upload for menu items and attachments for complaints/notes.

4. **Advanced Analytics**
   - Admin and vendor charts for demand trends, peak-time orders, and conversion.

5. **Testing and CI**
   - Add unit/integration tests (Jest + Supertest + React Testing Library) and CI pipeline.

6. **Security Hardening**
   - Add rate limiting, stricter input validation, account lockout policy, and audit logs.

7. **Production Readiness**
   - Docker setup, environment-based logging, and deployment pipeline for cloud hosting.

8. **Mobile App**
   - Build React Native app for student and vendor operations.

---

## Academic Submission Notes

- This system demonstrates modular full-stack architecture, role-based access control, and domain-driven feature separation.
- The project is intentionally designed with scalable module boundaries so additional university services can be integrated in future semesters.
