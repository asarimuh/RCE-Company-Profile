# Project Overview

## Project Purpose
This project is a multi-page company profile website for Rising Creators Entertainment (RCE) that combines a public marketing website with a KOL/KOC influencer registration workflow and an admin dashboard for reviewing submitted registrations.

The current purpose is to:
- present RCE's services, blog content, and company information
- enable talent to register as KOL/KOC/Influencer through a multi-step registration form
- store registration submissions in Supabase PostgreSQL
- provide an authenticated admin interface to read and analyze registration data

## Business Goals
- Build credibility for Rising Creators Entertainment as a live entertainment and digital business agency
- Capture creator registrations with rich profile data
- Support administrator review of sign-ups via a secure admin portal
- Provide analytics and export capability for internal team decisions
- Maintain a simple deployable static frontend with Supabase backend integration

## User Journey
1. Visitor lands on the public website (`src/index.html` and service/blog pages)
2. Visitor navigates to the talent registration page (`src/pages/register.html`)
3. Visitor completes the multi-step registration form
4. Registration data is validated in the browser and submitted to Supabase
5. Visitor sees a success confirmation page (`src/pages/register-success.html`)
6. Administrator logs in at `/admin/login.html`
7. Administrator views dashboard metrics in `/admin/dashboard.html`
8. Administrator inspects registration records in `/admin/kol-database.html`

## Public Website Overview
The public website is a static multi-page site built with HTML/CSS/JavaScript and Vite for bundling. It includes:
- landing page: `src/index.html`
- service detail pages: `src/pages/services/*.html`
- blog list and detail pages: `src/pages/blogs.html` + `src/pages/blogs/*.html`
- registration page: `src/pages/register.html`
- registration success page: `src/pages/register-success.html`
- global CSS under `src/css`, with page-specific CSS under `src/css/pages`
- reusable JS behavior in `src/js/main.js`

## Registration Workflow
- `src/pages/register.html` contains the multi-step form and markup
- `src/js/registration-form.js` handles step navigation, field validation, honeypot anti-spam, cooldown, form data normalization, and Supabase insert
- `src/js/supabase-client.js` initializes Supabase client with environment variables
- On successful submission, users are redirected to `src/pages/register-success.html`

## Admin Dashboard Overview
- `src/admin/login.html` and `src/admin/js/login.js` provide email/password authentication via Supabase
- `src/admin/dashboard.html` and `src/admin/js/dashboard.js` load high-level registration statistics and recent submissions
- `src/admin/kol-database.html` and `src/admin/js/kol-database.js` provide searchable, sortable, paginated table view of `talent_registrations`
- `src/admin/analytics.html` and `src/admin/js/analytics.js` render charts and summary cards from registration data
- Shared admin utilities live in `src/admin/js/admin-utils.js`

## Current Development Stage
The project is currently at a functional MVP stage with:
- complete public marketing website and content pages
- integrated registration form with client-side validation and Supabase persistence
- authenticated admin portal with read-only data review capabilities
- analytics and export flows for internal users

## Future Roadmap (Identifiable)
From existing code and comments, the likely future roadmap includes:
- editing and approving registrations
- deletion and workflow status management
- internal notes and comments on candidate records
- more advanced analytics and filtering
- better role management and authorization
- improved scalability, security hardening, and audit logging
