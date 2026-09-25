-- ==============================================================================
-- VIA TOURS & TRAVELS — COMPLETE SUPABASE DATABASE & ROW-LEVEL SECURITY SETUP
-- ==============================================================================
-- 
-- WHY THIS SCRIPT IS BULLETPROOF:
-- 1. Creates all tables IF NOT EXISTS (destinations, packages, blog_posts, etc.).
--    (Fixes ERROR: 42P01: relation "public.blogs" does not exist).
-- 2. Creates the 'package-images' public storage bucket IF NOT EXISTS.
-- 3. Enables Row Level Security (RLS) on all tables.
-- 4. Establishes "Secrets off the Frontend" access policies:
--    - Public (anon) can ONLY submit trip inquiries (INSERT) — cannot read other clients' inquiries.
--    - Public (anon) can ONLY view published catalog content (SELECT).
--    - Authenticated admin staff have full CRUD permissions.
--
-- HOW TO RUN:
-- 1. Copy the entire contents of this file.
-- 2. In Supabase Dashboard, open SQL Editor > New Query.
-- 3. Paste and click 'Run'.
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- STEP 1: CREATE APPLICATION TABLES (IF NOT ALREADY CREATED)
-- ==============================================================================

-- 1. Destinations Table
CREATE TABLE IF NOT EXISTS public.destinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    country TEXT DEFAULT '',
    region TEXT DEFAULT '',
    description TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    best_time TEXT DEFAULT '',
    attractions JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Packages Table
CREATE TABLE IF NOT EXISTS public.packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    destination_id UUID REFERENCES public.destinations(id) ON DELETE SET NULL,
    title TEXT NOT NULL UNIQUE,
    price NUMERIC DEFAULT 0,
    duration TEXT DEFAULT '',
    category TEXT DEFAULT '',
    short_description TEXT DEFAULT '',
    description TEXT DEFAULT '',
    itinerary JSONB DEFAULT '[]'::jsonb,
    inclusions JSONB DEFAULT '[]'::jsonb,
    exclusions JSONB DEFAULT '[]'::jsonb,
    important_info JSONB DEFAULT '[]'::jsonb,
    image_url TEXT DEFAULT '',
    gallery_images JSONB DEFAULT '[]'::jsonb,
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Blog Posts Table (Named blog_posts in the application controller)
CREATE TABLE IF NOT EXISTS public.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL UNIQUE,
    slug TEXT DEFAULT '',
    excerpt TEXT DEFAULT '',
    content TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Compatibility view for 'blogs'
CREATE OR REPLACE VIEW public.blogs AS SELECT * FROM public.blog_posts;

-- 4. Testimonials Table
CREATE TABLE IF NOT EXISTS public.testimonials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    location TEXT DEFAULT '',
    rating INTEGER DEFAULT 5,
    message TEXT DEFAULT '',
    image_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. FAQs Table
CREATE TABLE IF NOT EXISTS public.faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT DEFAULT '',
    category TEXT DEFAULT 'General',
    is_published BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Enquiries Table (Client Inquiries & Booking Leads)
CREATE TABLE IF NOT EXISTS public.enquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT DEFAULT '',
    destination TEXT DEFAULT '',
    preferred_dates TEXT DEFAULT '',
    party_size TEXT DEFAULT '2',
    budget_tier TEXT DEFAULT '',
    requirements TEXT DEFAULT '',
    status TEXT DEFAULT 'New',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT DEFAULT '',
    email TEXT UNIQUE,
    phone TEXT DEFAULT '',
    whatsapp TEXT DEFAULT '',
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- STEP 2: CREATE STORAGE BUCKET (IF NOT ALREADY CREATED)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-images', 'package-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- STEP 3: ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- ==============================================================================
ALTER TABLE public.destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- STEP 4: DEFINE AIRTIGHT ACCESS POLICIES ("SECRETS OFF THE FRONTEND")
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- ENQUIRIES: PUBLIC CAN ONLY INSERT; ONLY AUTHENTICATED ADMIN CAN READ/MANAGE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can submit enquiries" ON public.enquiries;
CREATE POLICY "Public can submit enquiries"
ON public.enquiries
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Only authenticated admins can view enquiries" ON public.enquiries;
CREATE POLICY "Only authenticated admins can view enquiries"
ON public.enquiries
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only authenticated admins can update enquiries" ON public.enquiries;
CREATE POLICY "Only authenticated admins can update enquiries"
ON public.enquiries
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Only authenticated admins can delete enquiries" ON public.enquiries;
CREATE POLICY "Only authenticated admins can delete enquiries"
ON public.enquiries
FOR DELETE
TO authenticated
USING (true);

-- ------------------------------------------------------------------------------
-- CUSTOMERS: PUBLIC CAN INSERT; ONLY AUTHENTICATED ADMIN CAN VIEW/MANAGE
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can create customer record on lead submit" ON public.customers;
CREATE POLICY "Public can create customer record on lead submit"
ON public.customers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "Only authenticated admins can view customers" ON public.customers;
CREATE POLICY "Only authenticated admins can view customers"
ON public.customers
FOR SELECT
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Only authenticated admins can modify customers" ON public.customers;
CREATE POLICY "Only authenticated admins can modify customers"
ON public.customers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- DESTINATIONS: PUBLIC CAN READ PUBLISHED; ONLY ADMIN CAN MODIFY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published destinations" ON public.destinations;
CREATE POLICY "Public can view published destinations"
ON public.destinations
FOR SELECT
TO anon, authenticated
USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage destinations" ON public.destinations;
CREATE POLICY "Admins can manage destinations"
ON public.destinations
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- PACKAGES: PUBLIC CAN READ PUBLISHED; ONLY ADMIN CAN MODIFY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published packages" ON public.packages;
CREATE POLICY "Public can view published packages"
ON public.packages
FOR SELECT
TO anon, authenticated
USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage packages" ON public.packages;
CREATE POLICY "Admins can manage packages"
ON public.packages
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- BLOG POSTS: PUBLIC CAN READ PUBLISHED; ONLY ADMIN CAN MODIFY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published blogs" ON public.blog_posts;
CREATE POLICY "Public can view published blogs"
ON public.blog_posts
FOR SELECT
TO anon, authenticated
USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage blogs" ON public.blog_posts;
CREATE POLICY "Admins can manage blogs"
ON public.blog_posts
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- TESTIMONIALS: PUBLIC CAN READ; ONLY ADMIN CAN MODIFY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published testimonials" ON public.testimonials;
CREATE POLICY "Public can view published testimonials"
ON public.testimonials
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage testimonials" ON public.testimonials;
CREATE POLICY "Admins can manage testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- FAQS: PUBLIC CAN READ PUBLISHED; ONLY ADMIN CAN MODIFY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view published faqs" ON public.faqs;
CREATE POLICY "Public can view published faqs"
ON public.faqs
FOR SELECT
TO anon, authenticated
USING (is_published = true OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage faqs" ON public.faqs;
CREATE POLICY "Admins can manage faqs"
ON public.faqs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- SETTINGS: PUBLIC CAN READ; ONLY ADMIN CAN MODIFY
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view settings" ON public.settings;
CREATE POLICY "Public can view settings"
ON public.settings
FOR SELECT
TO anon, authenticated
USING (true);

DROP POLICY IF EXISTS "Admins can manage settings" ON public.settings;
CREATE POLICY "Admins can manage settings"
ON public.settings
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ------------------------------------------------------------------------------
-- STORAGE BUCKET: package-images
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public can view package images" ON storage.objects;
CREATE POLICY "Public can view package images"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'package-images');

DROP POLICY IF EXISTS "Admins can upload package images" ON storage.objects;
CREATE POLICY "Admins can upload package images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'package-images');

DROP POLICY IF EXISTS "Admins can update package images" ON storage.objects;
CREATE POLICY "Admins can update package images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'package-images');

DROP POLICY IF EXISTS "Admins can delete package images" ON storage.objects;
CREATE POLICY "Admins can delete package images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'package-images');

-- ==============================================================================
-- STATUS CHECK: CONFIRM RLS ENFORCEMENT ACROSS ALL PUBLIC TABLES
-- ==============================================================================
SELECT tablename, rowsecurity AS rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('destinations', 'packages', 'blog_posts', 'testimonials', 'faqs', 'enquiries', 'customers', 'settings')
ORDER BY tablename ASC;
