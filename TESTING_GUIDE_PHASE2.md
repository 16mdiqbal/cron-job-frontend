# Phase 2 - Testing Guide

## Quick Start

The application is now running at **http://localhost:5173/**

## Authentication Flow Test

### 1. Initial State (Not Authenticated)
- Navigate to http://localhost:5173/
- **Expected**: Redirect to `/login` page
- **See**: Login form with email/password fields

### 2. Login Page
- **URL**: http://localhost:5173/login
- **Components visible**:
  - "Cron Job Manager" title
  - "Welcome Back" card
  - Email input
  - Password input
  - Remember me checkbox
  - Sign In button

### 3. Form Validation Test
Try these to test validation:

**Empty fields:**
- Leave email empty → Error: "Email is required"
- Leave password empty → Error: "Password is required"

**Invalid email:**
- Enter "test" → Error: "Invalid email address"

**Short password:**
- Enter "12345" → Error: "Password must be at least 6 characters"

**Valid credentials:**
- Email: `test@example.com`
- Password: `password123`
- Click "Sign In"

### 4. After Login (Successful)
- **Expected**: Redirect to `/dashboard`
- **Components visible**:
  - Header with logo
  - Sidebar with navigation
  - Dashboard content with stats cards
  - User info in header (email/name + role)
  - Logout button

### 5. Navigation Test
Click through the sidebar menu:

- ✅ **Dashboard** → `/dashboard`
- ✅ **Jobs** → `/jobs` (placeholder)
- ✅ **Executions** → `/executions` (placeholder)
- ✅ **Notifications** → `/notifications` (placeholder)
- ✅ **Settings** → `/settings` (placeholder)
- ⚠️ **Users** → Only visible if user role is "admin"

### 6. Mobile Responsive Test
- Resize browser to mobile width (< 768px)
- **Expected**:
  - Sidebar hidden by default
  - Hamburger menu button in header
  - Click hamburger → Sidebar slides in
  - Click backdrop → Sidebar closes

### 7. Logout Test
- Click "Logout" button in header
- **Expected**:
  - Redirect to `/login`
  - Auth state cleared
  - Token removed from localStorage

### 8. Protected Route Test
- After logout, try accessing: http://localhost:5173/dashboard
- **Expected**: Redirect to `/login`

## Backend Integration (When Ready)

The frontend is configured to connect to:
- **API Base URL**: `http://localhost:5001/api`

### Start Backend Server
```bash
cd ../cron-job-backend
# Activate virtual environment
source venv/bin/activate  # or venv\Scripts\activate on Windows
# Start server
python -m src.app
```

Backend should be running on: http://localhost:5001

### Test with Real Backend
1. Start backend server
2. Create a test user:
   ```bash
   cd cron-job-backend
   python create_admin.py
   ```
3. Use those credentials to login in frontend

## Developer Tools

### Browser Console
Open DevTools (F12) to see:
- Network requests to API
- Console logs
- LocalStorage values

### Check LocalStorage
In browser console:
```javascript
// Check stored token
localStorage.getItem('token')

// Check stored user
JSON.parse(localStorage.getItem('user'))

// Check auth storage (Zustand)
localStorage.getItem('auth-storage')
```

### API Request Format
When backend is ready, login request will be:
```
POST http://localhost:5001/api/auth/login
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "admin123"
}
```

Expected response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "1",
      "email": "admin@example.com",
      "name": "Admin User",
      "role": "admin",
      "createdAt": "2025-12-13T..."
    }
  }
}
```

## Troubleshooting

### Issue: Login button doesn't work
**Check**:
1. Backend server is running
2. API URL is correct in `.env.development`
3. CORS is enabled on backend
4. Check browser console for errors

### Issue: Redirect loop
**Solution**: Clear localStorage
```javascript
localStorage.clear()
```
Refresh page

### Issue: Sidebar doesn't show
**Check**:
1. User is authenticated
2. Auth state is properly set
3. Check React DevTools for useAuthStore state

### Issue: Can't access /users page
**Check**:
1. User role is "admin"
2. Token is valid
3. Check console for redirect messages

## Next Phase Preview

In Phase 3, we'll implement:
- Job creation form
- Job list with table view
- Cron expression helper
- Edit/delete operations
- Pagination and filters

Stay tuned! 🚀
