# Editorial Ops – Context Document

## Purpose of this Document

This document defines the **complete functional, operational, and technical context** of the Editorial Operations (Editorial Ops) system used inside Maono.

It serves as:

- A **reference document** for designers, developers, and architects
- A **functional blueprint** for building the Editorial Ops system
- A **technical context file** usable by AI development tools
- A **source of truth** for workflows and responsibilities

This document focuses **only on Editorial Ops**.

---

# 1. Editorial Ops Overview

Editorial Ops is responsible for managing the **full lifecycle of content production** across multiple clients and channels.

It coordinates multiple teams:

- Strategy Team
- Marketing Team
- Graphic Design Team
- Photo Production Team
- Video Production Team
- Social Media Managers
- Client Approvers

The objective is:

**Zero forgotten deliverables. Zero missed deadlines. Full traceability.**

---

# 2. Core Editorial Workflow

## High-Level Flow

Strategy → Planning → Production → Validation → Publishing → Reporting

---

## Step-by-Step Workflow

### Step 1 — Strategy Definition

Performed by:
- Marketing Strategist

Output:
- Campaign Objectives
- Content Themes
- Platforms Selection
- Posting Frequency
- KPI Targets

Deliverables:

- Editorial Strategy Document
- Campaign Brief

---

### Step 2 — Editorial Calendar Planning

Performed by:
- Content Planner

Output:
- Content Calendar Entries

Each entry contains:

- Platform
- Publication Date
- Content Type
- Message Theme
- Format

---

### Step 3 — Production Workflow

Content is assigned to relevant production teams.

Production Types:

- Graphic Design
- Photography
- Video Production
- Copywriting

Each task includes:

- Assigned resource
- Deadline
- Dependencies

---

### Step 4 — Review & Validation

Internal approval first.

Then client validation.

States:

- Draft
- Internal Review
- Client Review
- Approved
- Revision Required

---

### Step 5 — Publishing

Content scheduled or published.

Platforms:

- Instagram
- Facebook
- LinkedIn
- TikTok
- YouTube
- X (Twitter)

---

### Step 6 — Performance Reporting

Collected metrics:

- Reach
- Engagement
- CTR
- Conversion

---

# 3. Roles & Responsibilities

## Marketing Strategist

Responsibilities:

- Define campaign direction
- Define KPIs
- Approve editorial calendar

---

## Content Planner

Responsibilities:

- Build editorial calendar
- Schedule posts
- Maintain timeline integrity

---

## Designer

Responsibilities:

- Create visuals
- Respect brand guidelines

---

## Photographer / Videographer

Responsibilities:

- Produce media assets
- Deliver raw & edited content

---

## Social Media Manager

Responsibilities:

- Publish content
- Monitor engagement

---

## Client

Responsibilities:

- Approve content
- Provide feedback

---

# 4. Core Entities (Data Models)

## editorial.campaign

Fields:

- name
- client_id
- objective
- start_date
- end_date
- status

---

## editorial.calendar

Fields:

- campaign_id
- publication_date
- platform
- content_type
- theme

---

## editorial.content

Fields:

- calendar_id
- content_title
- content_format
- assigned_team
- deadline
- status

---

## editorial.asset

Fields:

- content_id
- file_url
- version
- asset_type

---

## editorial.approval

Fields:

- content_id
- internal_status
- client_status
- comment

---

## editorial.publication

Fields:

- content_id
- platform
- published_at

---

## editorial.performance

Fields:

- content_id
- impressions
- engagement
- clicks

---

# 5. Editorial Task Dependencies

Dependencies are mandatory.

Example:

Copywriting → Design → Review → Publish

No step can be skipped.

---

# 6. Reminder System

The system must include:

- Automatic reminders
- Escalation alerts
- Deadline warnings

Reminder Timing:

- J-7
- J-3
- J-1
- J-0

Escalation:

- Notify Manager
- Notify Team Lead

---

# 7. Status Lifecycle

Each content moves through:

Draft → In Production → In Review → Approved → Scheduled → Published

---

# 8. Multi-Platform Handling

Each content may have variants:

Example:

- Instagram version
- LinkedIn version
- TikTok version

---

# 9. File Management Rules

Assets must support:

- Versioning
- History tracking
- Rollback

---

# 10. Notifications

Notification triggers:

- New task assignment
- Deadline approaching
- Content approved
- Revision required

Channels:

- Email
- In-app
- Slack (optional)

---

# 11. Risk Management

Risk Indicators:

- Late content
- Missing asset
- Client non-response

Each risk triggers:

- Warning banner

---

# 12. Editorial Templates

Templates must exist for:

- Post types
- Campaign types
- Approval workflows

---

# 13. UX Considerations

The interface must:

- Reduce cognitive load
- Highlight urgency
- Support batch operations

---

# 14. API Gateway Scope

Editorial API endpoints:

GET /campaigns
POST /calendar
GET /contents
POST /approval
POST /publish

---

# 15. Performance Dashboard

KPIs displayed:

- Content completion rate
- Approval turnaround time
- Publishing punctuality

---

# 16. Security Model

Access roles:

- Strategist
- Designer
- Publisher
- Client

---

# 17. Audit Logs

Track:

- Who modified content
- When
- What changed

---

# 18. Scalability Considerations

System must support:

- Multiple clients
- Multiple campaigns
- Thousands of content items

---

# 19. Mobile Requirements

Mobile users must be able to:

- Approve content
- View tasks
- Upload assets

---

# 20. Success Criteria

Editorial Ops is successful if:

- Deadlines are met
- No deliverables are forgotten
- Teams collaborate seamlessly

---



# 21. USER STORIES (EDITORIAL OPS)

## Strategist

User Story 1:
As a Strategist, I want to create a campaign strategy so that the team understands the communication direction.

Acceptance Criteria:
- Campaign objective defined
- Target platforms selected
- KPIs defined
- Strategy validated

User Story 2:
As a Strategist, I want to validate the editorial calendar so that production starts on time.

Acceptance Criteria:
- Calendar entries visible
- Validation recorded

---

## Content Planner

User Story 1:
As a Planner, I want to schedule content so that deadlines are respected.

Acceptance Criteria:
- Publication date set
- Platform defined
- Dependencies assigned

---

## Designer

User Story:
As a Designer, I want to receive tasks with clear briefs so that I can produce assets correctly.

Acceptance Criteria:
- Brief attached
- Deadline visible
- File upload available

---

## Client

User Story:
As a Client, I want to approve or reject content so that only validated content is published.

Acceptance Criteria:
- Content preview visible
- Approval button available
- Comment required if rejected

---

# 22. ODOO MODEL SCHEMA (DETAILED)

## editorial.campaign

Fields:

name (Char)
client_id (Many2one res.partner)
objective (Text)
start_date (Date)
end_date (Date)
status (Selection)

Relations:
calendar_ids (One2many editorial.calendar)

---

## editorial.calendar

Fields:

campaign_id (Many2one editorial.campaign)
publication_date (Datetime)
platform (Selection)
content_type (Selection)
theme (Char)

Relations:
content_ids (One2many editorial.content)

---

## editorial.content

Fields:

calendar_id (Many2one editorial.calendar)
content_title (Char)
content_format (Selection)
assigned_team (Selection)
deadline (Datetime)
status (Selection)

Relations:
asset_ids (One2many editorial.asset)
approval_ids (One2many editorial.approval)

---

## editorial.asset

Fields:

content_id (Many2one editorial.content)
file_url (Binary/File)
version (Integer)
asset_type (Selection)

---

## editorial.approval

Fields:

content_id (Many2one editorial.content)
internal_status (Selection)
client_status (Selection)
comment (Text)

---

## editorial.performance

Fields:

content_id (Many2one editorial.content)
impressions (Integer)
engagement (Integer)
clicks (Integer)

---

# 23. BPMN WORKFLOW (EDITORIAL OPS)

Flow Description:

Start → Strategy Creation → Calendar Planning → Content Production → Internal Review → Client Review → Approval → Scheduling → Publishing → Reporting → End

Parallel Processes:
- Multiple content production tasks may run simultaneously.

Decision Points:
- If rejected → return to production
- If approved → proceed to scheduling

---

# 24. OPENAPI CONTRACT (EDITORIAL OPS)

Base Path:

/api/v1/editorial

Endpoints:

GET /campaigns
Description: Retrieve campaign list

POST /campaigns
Description: Create campaign

GET /calendar
Description: Retrieve calendar entries

POST /calendar
Description: Create calendar entry

GET /contents
Description: Retrieve content list

POST /contents
Description: Create content item

POST /approvals
Description: Submit approval

POST /publish
Description: Publish content

GET /performance
Description: Retrieve metrics

---

# END OF DOCUMENT

