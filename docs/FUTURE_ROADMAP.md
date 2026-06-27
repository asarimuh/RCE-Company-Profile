# Future Roadmap

## Phase 2: Core Admin Workflow
- Implement registration editing in admin portal.
- Add approval/rejection workflow with `status` field and admin actions.
- Enable real delete functionality with proper audit logging.
- Add internal notes/comments per registration record.
- Add user roles and access control beyond basic admin auth.

## Phase 3: Data Integrity and Security
- Add Supabase migrations or schema export to repository.
- Configure Row Level Security (RLS) policies for admin and public access.
- Add explicit API or Supabase functions for write operations rather than direct anonymous inserts if security needs increase.
- Harden form validation on the backend.
- Replace `not_provided` fallback values with nullable fields where appropriate.

## Phase 4: Analytics and Reporting
- Move aggregates to the database or Supabase views for performance.
- Add export formats beyond Excel (CSV, PDF).
- Add charts and dashboards for quality metrics, source tracking, and conversion rates.
- Add historical trend comparisons and cohort reporting.

## Phase 5: Collaboration and Workflow
- Add internal task assignment, review notes, and history tracking.
- Add notification system for new submissions and status changes.
- Add reminders and follow-up scheduling.
- Build a more complete admin workspace with collaboration features.

## Recommended Order
1. **Admin workflow first**: editing, status, delete, notes. This enables practical management of registration data.
2. **Security second**: schema, RLS, backend validation. Once admin actions exist, strong security becomes essential.
3. **Analytics third**: optimize data flow and build better reports once the dataset is mature.
4. **Collaboration last**: add workflows and notifications after the data model and auth model are stable.

## Why This Order
- Adding admin edit/review capability turns a static read-only system into a usable operations tool.
- Security improvements are most valuable once data modification is possible.
- Analytics on top of a stable data model gives more reliable insights.
- Collaboration features rely on a mature workflow and secure access model.
