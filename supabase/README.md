# Supabase Bootstrap Instructions

Follow these instructions to set up the database and bootstrap your first administrative user.

## 1. Initial Database Setup
1. Open your Supabase project dashboard.
2. Navigate to the **SQL Editor**.
3. Create a new query, paste the entire contents of [schema.sql](./schema.sql), and run it. This will create all required tables, custom types, functions, RLS policies, and triggers.

## 2. Bootstrapping the First Admin User
Administrative users are validated against the `public.admin_users` table. Because of RLS and server guards, we do not hardcode admin credentials.

To create your first admin user:
1. **Create auth account**: In Supabase Authentication, create a user with email/password or sign up through the admin login form after enabling email/password auth.
2. **Find User ID**:
   - Go to your Supabase project dashboard.
   - Navigate to **Authentication** -> **Users**.
   - Copy the **User ID** (a UUID string) of the newly registered user.
3. **Insert Admin User Record**:
   - Navigate to the **SQL Editor** or the **Table Editor** on your Supabase dashboard.
   - Run the following SQL query to elevate the user's privileges (replace the placeholder values with the actual User ID and email):

     ```sql
     INSERT INTO public.admin_users (id, email, role, is_active)
     VALUES (
       'YOUR_USER_UUID_HERE',
       'your-admin-email@example.com',
       'super_admin',
       true
     );
     ```

## 3. Allowed Admin Roles
The following roles are configured in `public.admin_role` and granted management permissions:
- `super_admin`: Has full access including managing other admin users.
- `admin`: Has management access to content, products, and inquiries.
- `editor`: Has write access to content and products, but cannot modify sensitive settings.
- `viewer`: Read-only access (default).
