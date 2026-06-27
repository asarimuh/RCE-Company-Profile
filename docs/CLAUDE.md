# CLAUDE.md

# Rising Creators Entertainment Website

> Primary project context for Claude.
>
> Read this file before performing any development task.
>
> This document is the authoritative source of project architecture, engineering standards, coding conventions, roadmap, and implementation guidelines.

---

# Project Overview

## Project Name

Rising Creators Entertainment (RCE)

## Current Stage

Functional MVP

## Project Type

Multi-page company profile website with an integrated creator registration system and internal admin dashboard.

The project combines:

* Company Profile Website
* Service Pages
* Blog System
* Creator Registration Portal
* Internal Admin Dashboard
* Analytics Dashboard

This project is **not** intended to become a traditional SPA unless explicitly requested.

The existing architecture should be preserved whenever possible.

---

# Business Goals

The website exists to:

* Present Rising Creators Entertainment
* Showcase company services
* Publish SEO-friendly blog articles
* Recruit creators (KOL/KOC/Influencers)
* Collect creator information
* Store registrations securely
* Allow internal staff to review applicants

Future versions will become an internal creator management platform.

---

# Technology Stack

## Frontend

* HTML5
* CSS3
* JavaScript (ES Modules)

## Build

* Vite

## Backend

* Supabase

### Services Used

* PostgreSQL
* Authentication

## Deployment

* Vercel

## Libraries

* @supabase/supabase-js
* exceljs

No Node backend exists.

No Express.

No Laravel.

No Next.js.

No React.

Everything is static HTML with client-side JavaScript.

---

# High-Level Architecture

Visitor

↓

Landing Page

↓

Registration Form

↓

Supabase

↓

PostgreSQL

↓

Admin Dashboard

The application is a static frontend.

Supabase functions as the backend.

---

# Public Website

Current pages include:

* Landing page
* About
* Services
* Blog listing
* Blog details
* Registration page
* Registration success page

The public website is primarily informational.

Only the registration page writes data.

---

# Registration System

The registration system is a multi-step form.

Current features:

* Step validation
* Progress indicator
* Honeypot spam protection
* Submission cooldown
* WhatsApp normalization
* Category selection
* Platform selection
* Portfolio support
* Terms agreement
* Supabase integration

Submission destination:

talent_registrations

---

# Admin Dashboard

Current features include:

Dashboard

* Registration count
* Recent registrations

Database

* Search
* Filter
* Sort
* Pagination
* Detail drawer
* Excel export

Analytics

* Platform distribution
* Monthly registrations
* Category breakdown
* Top creators

Authentication

* Supabase Auth
* Protected routes

---

# Database

Current primary table

talent_registrations

Contains information including:

Personal

* name
* birth date
* gender
* location

Contact

* email
* WhatsApp

Social

* TikTok
* Instagram
* YouTube

Creator

* primary platform
* categories
* follower counts
* portfolio

Metadata

* timestamps
* user agent
* referrer

Future database expansion should include:

* users
* roles
* admin_notes
* activity_logs
* approvals

---

# Current Limitations

Current admin dashboard is mostly read-only.

Missing functionality includes:

* Edit registration
* Delete registration
* Approval workflow
* Rejection workflow
* Review notes
* Comments
* Audit log
* Role management

Analytics currently fetches all records into the browser.

No server-side aggregation exists.

No migration system exists.

No SQL versioning exists.

No documented RLS policies exist.

---

# Folder Structure

Important folders

src/

Main application.

src/pages/

Public pages.

src/css/

Public styling.

src/js/

Public JavaScript.

src/admin/

Entire admin portal.

src/admin/js/

Admin functionality.

src/public/assets/

Static assets.

---

# Coding Philosophy

When modifying this project:

DO

* Preserve architecture.
* Make incremental improvements.
* Keep code modular.
* Prefer reusable utilities.
* Follow existing conventions.
* Write production-ready code.
* Improve maintainability.

DO NOT

* Rewrite working code unnecessarily.
* Introduce unnecessary frameworks.
* Add dependencies without justification.
* Break existing architecture.

---

# Code Standards

JavaScript

* ES Modules
* Async/Await
* Avoid callback chains
* Small reusable functions
* Proper error handling

HTML

* Semantic
* Accessible
* SEO-friendly

CSS

* Reuse existing styling
* Follow current organization

Naming

Use kebab-case.

Examples

registration-form.js

admin-auth.js

dashboard.js

---

# Error Handling

Always include:

* try/catch
* loading state
* empty state
* success state
* error state

Never silently ignore errors.

---

# Security

Whenever security is relevant:

Recommend:

* RLS
* Input validation
* Least privilege
* Secure authentication
* Sanitization

Do not expose secrets.

Never hardcode credentials.

---

# Performance

Prefer:

* Lazy loading
* Modular JavaScript
* Efficient DOM updates
* Pagination
* Database indexing

Avoid:

* Fetching unnecessary records
* Duplicate queries
* Expensive loops

---

# Accessibility

All new features should include:

* Keyboard support
* Semantic HTML
* Proper labels
* Focus management
* ARIA only when appropriate

---

# Preferred Development Workflow

When implementing a feature:

1. Understand existing implementation.
2. Explain architecture impact.
3. Identify affected files.
4. Identify database changes.
5. Explain Supabase changes.
6. Implement code.
7. Explain deployment implications.
8. Suggest future improvements if beneficial.

---

# Feature Requests

Whenever I request a new feature:

First determine:

* Existing modules involved
* Required database changes
* Supabase changes
* Authentication changes
* Deployment impact
* Security implications

Then implement.

---

# Refactoring Rules

Refactor only if:

* Complexity is significantly reduced.
* Maintainability improves.
* Performance improves.
* Security improves.

Do not refactor simply for stylistic reasons.

---

# Future Roadmap

Priority 1

* Registration editing
* Approval workflow
* Delete workflow
* Internal notes

Priority 2

* SQL migrations
* RLS
* Backend validation
* Security improvements

Priority 3

* Database views
* Analytics optimization
* Better reporting

Priority 4

* Notifications
* Team collaboration
* Task assignment
* Audit history

---

# AI Assistant Instructions

You are acting as the lead software engineer for this project.

When answering:

* Understand the current architecture first.
* Avoid suggesting unnecessary rewrites.
* Build on existing code.
* Prefer scalable solutions.
* Challenge poor architectural decisions.
* Prioritize long-term maintainability.
* Produce production-ready code.
* Include validation and error handling.
* Explain why major decisions are made.

Never generate placeholder implementations unless explicitly requested.

If information is missing, ask before making assumptions.

This document is the canonical project context.
