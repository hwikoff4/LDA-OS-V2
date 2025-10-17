# Authentication & Role-Based Access Control Implementation

## Overview
Multi-tier authentication system with role-based permissions for Legacy Decks Academy OS.

## User Hierarchy
1. **Owner** - Highest level, full access to everything
2. **Admin** - Second highest, access to everything except owner role modifications
3. **Company Owner** - Company-level access, can manage own company employees
4. **Employee** - Limited access, permissions granted by company owner

## Database Schema
Tables created in migration: `20251017190000_create_auth_and_rbac_tables.sql`

### Tables:
- `companies` - Company information
- `user_profiles` - User profiles with roles and company associations
- `permission_definitions` - Available permissions
- `user_permissions` - Individual user permissions

### Key Features:
- Row Level Security (RLS) enabled on all tables
- Automatic user profile creation on signup
- Permission-based access control
- Company-scoped data access

## Files Created

### 1. Authentication Context
**File:** `/lib/auth/auth-context.tsx`
- Manages authentication state
- Provides user profile and permissions
- Functions: `signIn`, `signUp`, `signOut`, `hasPermission`, `hasRole`

### 2. Login Page
**File:** `/app/login/page.tsx`
- Email/password authentication
- Error handling
- Redirects to dashboard on success

### 3. Signup Page
**File:** `/app/signup/page.tsx`
- User registration
- Password confirmation
- Automatic profile creation

### 4. Protected Route Component
**File:** `/components/protected-route.tsx`
- Protects routes based on permissions or roles
- Redirects unauthorized users
- Loading state handling

### 5. Users Management Component
**File:** `/components/users-management.tsx`
- Full CRUD operations for users
- Role assignment
- Permission management
- Company assignment
- Search and filtering

### 6. Permissions Helper
**File:** `/lib/auth/permissions.ts`
- Default permissions per role
- Permission check helpers
- Role validation functions

### 7. Updated Settings Page
**File:** `/app/settings/page-with-users.tsx`
- Added "Users" tab
- Protected route wrapper
- User management interface

## Usage

### Protecting Routes
```typescript
import { ProtectedRoute } from "@/components/protected-route"

export default function MyPage() {
  return (
    <ProtectedRoute requiredRoles={["owner", "admin"]}>
      {/* Protected content */}
    </ProtectedRoute>
  )
}
```

### Checking Permissions
```typescript
import { useAuth } from "@/lib/auth/auth-context"

function MyComponent() {
  const { hasPermission, hasRole } = useAuth()

  if (hasRole("owner", "admin")) {
    // Show admin content
  }

  if (hasPermission("gpts.create")) {
    // Show create GPT button
  }
}
```

### User Management
Access through Settings > Users tab (only visible to owners, admins, and company owners)

## Permission Categories
1. **admin** - Admin dashboard and system management
2. **gpts** - GPT configuration management
3. **knowledge** - Knowledge base management
4. **chat** - Chat functionality
5. **dashboard** - Dashboard access
6. **eos** - EOS tools access
7. **company** - Company user management

## Setup Instructions

1. **Run Migration**
   - The migration file is already created at `/supabase/migrations/20251017190000_create_auth_and_rbac_tables.sql`
   - Apply it to your Supabase database

2. **Create First Owner**
   - Sign up through `/signup`
   - Manually update the user's role to 'owner' in the database:
   ```sql
   UPDATE user_profiles
   SET role = 'owner'
   WHERE email = 'your-email@example.com';
   ```

3. **Update Environment Variables**
   - Ensure `.env` has proper Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Update Root Layout**
   - The AuthProvider is already wrapped in `/app/layout.tsx`

5. **Enable Settings Page**
   - Rename `/app/settings/page-with-users.tsx` to `/app/settings/page.tsx` (replacing the old one)

## Access Control Matrix

| Feature | Owner | Admin | Company Owner | Employee |
|---------|-------|-------|--------------|----------|
| View All Companies | ✓ | ✓ | ✗ | ✗ |
| Create Companies | ✓ | ✓ | ✗ | ✗ |
| View All Users | ✓ | ✓ | Company Only | ✗ |
| Create Admin Users | ✓ | ✗ | ✗ | ✗ |
| Create Company Owners | ✓ | ✓ | ✗ | ✗ |
| Create Employees | ✓ | ✓ | ✓ | ✗ |
| Manage GPTs | ✓ | ✓ | ✓ | ✗ |
| Manage Knowledge Base | ✓ | ✓ | ✓ | ✗ |
| Access Chat | ✓ | ✓ | ✓ | ✓ |
| View Dashboard | ✓ | ✓ | ✓ | ✓ |

## Next Steps

1. Add logout button to navigation/header
2. Update dashboard sidebar to respect user permissions
3. Add user profile display in header
4. Implement password reset functionality
5. Add email verification (optional)
6. Test all permission scenarios
7. Add audit logging for sensitive operations

## Security Notes

- All passwords are hashed by Supabase Auth
- RLS policies enforce data isolation
- Company owners can only see/manage their company's data
- Employees start with no permissions
- Owner role cannot be deleted or demoted (except by another owner)
