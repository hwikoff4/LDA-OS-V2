/*
  # Create Authentication and Role-Based Access Control Tables

  1. New Tables
    - `companies`
      - Company information and metadata

    - `user_profiles`
      - Extended user profiles with roles and company associations

    - `user_permissions`
      - Individual user permissions

    - `permission_definitions`
      - Available permission definitions

  2. Security
    - Enable RLS on all tables
    - Role-based policies (owner, admin, company_owner, employee)
*/

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('owner', 'admin', 'company_owner', 'employee')),
  company_id uuid REFERENCES companies(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  avatar_url text,
  created_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create permission_definitions table
CREATE TABLE IF NOT EXISTS permission_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  category text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create user_permissions table
CREATE TABLE IF NOT EXISTS user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  permission_key text NOT NULL REFERENCES permission_definitions(key) ON DELETE CASCADE,
  granted_by uuid REFERENCES user_profiles(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, permission_key)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_permission_key ON user_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);

-- Insert default permission definitions
INSERT INTO permission_definitions (key, name, description, category) VALUES
  ('admin.access', 'Admin Dashboard Access', 'Access to admin dashboard and settings', 'admin'),
  ('admin.users.view', 'View All Users', 'View all users across all companies', 'admin'),
  ('admin.users.create', 'Create Users', 'Create new users and assign roles', 'admin'),
  ('admin.users.edit', 'Edit Users', 'Edit user profiles and permissions', 'admin'),
  ('admin.users.delete', 'Delete Users', 'Delete user accounts', 'admin'),
  ('admin.companies.view', 'View All Companies', 'View all companies in the system', 'admin'),
  ('admin.companies.create', 'Create Companies', 'Create new companies', 'admin'),
  ('admin.companies.edit', 'Edit Companies', 'Edit company information', 'admin'),
  ('admin.companies.delete', 'Delete Companies', 'Delete companies', 'admin'),
  ('gpts.view', 'View GPTs', 'View GPT configurations', 'gpts'),
  ('gpts.create', 'Create GPTs', 'Create new GPT configurations', 'gpts'),
  ('gpts.edit', 'Edit GPTs', 'Edit existing GPT configurations', 'gpts'),
  ('gpts.delete', 'Delete GPTs', 'Delete GPT configurations', 'gpts'),
  ('knowledge.view', 'View Knowledge Base', 'View knowledge base documents', 'knowledge'),
  ('knowledge.upload', 'Upload Documents', 'Upload documents to knowledge base', 'knowledge'),
  ('knowledge.edit', 'Edit Documents', 'Edit knowledge base documents', 'knowledge'),
  ('knowledge.delete', 'Delete Documents', 'Delete knowledge base documents', 'knowledge'),
  ('chat.access', 'Access Chat', 'Access chat functionality', 'chat'),
  ('chat.history.view', 'View Chat History', 'View chat conversation history', 'chat'),
  ('dashboard.view', 'View Dashboard', 'View main dashboard', 'dashboard'),
  ('eos.view', 'View EOS Tools', 'Access EOS tools and features', 'eos'),
  ('eos.edit', 'Edit EOS Data', 'Edit EOS meetings, rocks, and todos', 'eos'),
  ('company.users.view', 'View Company Users', 'View users within own company', 'company'),
  ('company.users.create', 'Add Company Users', 'Add employees to own company', 'company'),
  ('company.users.edit', 'Edit Company Users', 'Edit employee permissions', 'company'),
  ('company.users.delete', 'Remove Company Users', 'Remove employees from company', 'company')
ON CONFLICT (key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_definitions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for companies table
CREATE POLICY "Owners and admins can view all companies"
  ON companies FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners can view their own company"
  ON companies FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT company_id FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('company_owner', 'employee')
    )
  );

CREATE POLICY "Owners and admins can insert companies"
  ON companies FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Owners and admins can update companies"
  ON companies FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Only owners can delete companies"
  ON companies FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.id = auth.uid()
      AND user_profiles.role = 'owner'
    )
  );

-- RLS Policies for user_profiles table
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Owners and admins can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.id = auth.uid()
      AND up.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners can view their company users"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (
    company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'company_owner'
    )
  );

CREATE POLICY "Admins can create users except owner role"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    AND (role != 'owner' OR EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    ))
  );

CREATE POLICY "Company owners can create employees in their company"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (
    role = 'employee'
    AND company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'company_owner'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM user_profiles WHERE id = auth.uid()));

CREATE POLICY "Owners and admins can update profiles"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
    AND (
      user_profiles.role != 'owner'
      OR EXISTS (
        SELECT 1 FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'owner'
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners can update their employees"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    role = 'employee'
    AND company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'company_owner'
    )
  )
  WITH CHECK (
    role = 'employee'
    AND company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'company_owner'
    )
  );

CREATE POLICY "Only owners can delete user profiles"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
    AND user_profiles.role != 'owner'
  );

CREATE POLICY "Company owners can delete their employees"
  ON user_profiles FOR DELETE
  TO authenticated
  USING (
    role = 'employee'
    AND company_id IN (
      SELECT company_id FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'company_owner'
    )
  );

-- RLS Policies for user_permissions table
CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owners and admins can view all permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners can view their employees permissions"
  ON user_permissions FOR SELECT
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE company_id IN (
        SELECT company_id FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'company_owner'
      )
      AND role = 'employee'
    )
  );

CREATE POLICY "Owners and admins can manage permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Company owners can manage employee permissions"
  ON user_permissions FOR ALL
  TO authenticated
  USING (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE company_id IN (
        SELECT company_id FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'company_owner'
      )
      AND role = 'employee'
    )
  )
  WITH CHECK (
    user_id IN (
      SELECT id FROM user_profiles
      WHERE company_id IN (
        SELECT company_id FROM user_profiles
        WHERE id = auth.uid()
        AND role = 'company_owner'
      )
      AND role = 'employee'
    )
  );

-- RLS Policies for permission_definitions table
CREATE POLICY "Everyone can view permission definitions"
  ON permission_definitions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only owners can modify permission definitions"
  ON permission_definitions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid()
      AND role = 'owner'
    )
  );

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    'active'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS set_updated_at_companies ON companies;
CREATE TRIGGER set_updated_at_companies
  BEFORE UPDATE ON companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_updated_at_user_profiles ON user_profiles;
CREATE TRIGGER set_updated_at_user_profiles
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
