# User Management Feature

## Overview
A complete user management system with status control has been added to the Minima Hotel Reports & Analytics application.

## Features

### User List View
- Display all users in a clean, organized table
- Search functionality to filter users by name, email, or role
- Real-time user count display
- Status badges showing active/inactive state
- Responsive design with loading states

### Add New User
- Create new users with email and password authentication
- Required fields: Email, Password, Name, Role
- Optional field: Phone number
- Role selection from predefined roles (Admin, Manager, Receptionist, etc.)
- New users are automatically set to "active" status
- Form validation and error handling

### Edit User
- Update user information (name, phone, role)
- Email is read-only (cannot be changed after creation)
- Real-time updates to the user list

### User Status Management
- Toggle user status between "active" and "inactive"
- Active users can access the system
- Inactive users are blocked from login
- Confirmation dialog before status change
- Audit logging for all status changes

### Role Management
- Support for multiple roles:
  - Admin
  - Manager
  - Receptionist
  - Inventory Controller
  - Kitchen Staff
  - Purchasing Officer
  - Client
- Color-coded badges for easy role identification
- Role-based access control ready

## Technical Implementation

### Files Created
1. **app/(protected)/users/page.tsx** - Main user management page
2. **hooks/useUsers.ts** - Custom hook for user CRUD operations
3. **components/ui/Dialog.tsx** - Reusable dialog component for modals
4. **USER_MANAGEMENT.md** - Documentation

### Files Modified
1. **types/auth.ts** - Added `status` field to UserProfile interface
2. **hooks/useAuth.tsx** - Updated to handle user status in profile loading and signup
3. **hooks/useUsers.ts** - Added `toggleUserStatus()` function and audit logging
4. **components/auth/AuthGuard.tsx** - Added status check to prevent inactive users from accessing
5. **app/unauthorized/page.tsx** - Updated to show different messages for inactive users
6. **components/layout/Sidebar.tsx** - Added "Users" navigation link

### Database Schema Changes

#### UserProfile Structure
```typescript
{
  email: string;
  name?: string;
  phone?: string;
  role: AppRole;
  status: "active" | "inactive";  // NEW FIELD
  createdAt: string;
  updatedAt: string;
}
```

### Technologies Used
- Firebase Authentication for user creation
- Firebase Realtime Database for user profile storage
- React hooks for state management
- Radix UI for accessible dialog components
- Lucide React for icons
- Tailwind CSS for styling

## Usage

### Accessing User Management
Navigate to `/users` or click "Users" in the sidebar navigation.

### Adding a User
1. Click the "Add User" button
2. Fill in the required fields (email, password, name, role)
3. Optionally add a phone number
4. Click "Add User" to create
5. User is automatically set to "active" status

### Editing a User
1. Click the "Edit" button next to the user
2. Update the desired fields
3. Click "Save Changes"

### Changing User Status
1. Click "Deactivate" or "Activate" button next to the user
2. Confirm the action in the dialog
3. User status will be updated immediately
4. Inactive users cannot log in to the system

## Security & Access Control

### Authentication Guard
- Only authenticated admin users can access the user management page
- Inactive users are automatically redirected to unauthorized page
- Status is checked on every protected route access

### Audit Logging
All user management actions are logged:
- User creation (with details: email, name, role)
- User updates (with changed fields)
- Status changes (activate/deactivate with previous and new status)

Logs include:
- Action performed
- Timestamp
- Admin who performed the action
- User affected
- Metadata (details of changes)

### Password Security
- Password is required only during user creation
- Passwords are handled by Firebase Authentication
- No password storage in Realtime Database

## User Experience

### Visual Indicators
- **Active Status**: Green badge with "active" text
- **Inactive Status**: Gray outline badge with "inactive" text
- **Deactivate Button**: Red hover state with Ban icon
- **Activate Button**: Green hover state with CheckCircle icon

### Feedback
- Toast notifications for all actions (success/error)
- Loading states during operations
- Confirmation dialogs for status changes
- Clear error messages

## Migration Notes

### Existing Users
- Existing users without a `status` field will default to "active"
- The system automatically adds the status field when loading profiles
- No manual migration required

### Backward Compatibility
- All existing functionality remains intact
- Status field is optional in the database (defaults to "active")
- Existing authentication flows continue to work

## Future Enhancements
- Bulk user operations (activate/deactivate multiple users)
- User activity logs and last login tracking
- Password reset functionality
- Email verification
- User profile pictures
- Advanced filtering and sorting
- Export user list to CSV/Excel
- User roles and permissions management
- Session management (force logout inactive users)

