# Networker – MVP Specification (Version 0.1 “Manual Logger”)
*Prepared by: Product Manager (ChatGPT)  |  Date: 30 Jul 2025*

---

## 1 · Purpose & Success Criteria
| Item | Definition |
|------|-----------|
| **Product Goal** | Provide founders with a *super‑light* place to jot down new contacts and facts about them, then view or update those details later. |
| **Primary KPI** | **Interactions logged per user per week** – target ≥ 3 inside the pilot cohort. |
| **MVP Gate** | Roi uses “Networker” for ≥ 1 week and prefers it to notes/phonebook for new contacts. |

---

## 2 · Personas (Launch Order)
1. **Founder** (primary) – 5‑20 new connections a week.
2. **VC Associate** (secondary) – higher volume, onboarded once flow is stable.

---

## 3 · Core Use Case
> **Scenario:** *“When I meet someone new, I open Networker, type a quick note about them, and later find the card to refresh my memory or add more info.”*

**Critical Path v0.1**
1. Open app → press **➕ Add Note**.
2. Free‑text input (e.g. “Met Dana from StarkTech, VP R&D, intro’d by Gil. Follow up on pilot”).
3. Press **Save**.
4. App parses text → either **creates** a new contact **or** **updates** an existing card.
5. User can open **Contacts List** (infinite scroll) and tap a card to view or edit details.

---

## 4 · Functional Scope
| Epic | Must‑Have | Out‑of‑Scope v0.1 |
|------|-----------|-------------------|
| **Auth** | Google OAuth | Email/password, 2FA |
| **Contacts** | List (scroll), view card, edit fields | Import, dedup automation |
| **Interactions** | Add note (free text + date auto), edit | Attachments, structured types |
| **Graph** | Mini‑graph in contact view (introduced_by & same_company edges) | Global graph screen |
| **Search** | None (scroll only) | Omni‑search bar |
| **Settings** | Display name, sign‑out | Notifications, reminders |

---

## 5 · Data Model (Supabase/Postgres)
### contacts
- **id** uuid PK
- **hebrew_name** text  *(optional)*
- **english_name** text *(optional)*
- **company** text
- **job_title** text
- **how_met** text
- **tags** text[]
- **created_at** timestamptz
- **updated_at** timestamptz

### interactions
- **id** uuid PK
- **contact_id** uuid FK→contacts
- **body** text
- **occurred_at** date (default NOW())

### edges
- **id** uuid PK
- **source_contact_id** uuid
- **target_contact_id** uuid
- **relation_type** enum(`introduced_by`,`same_company`)

---

## 6 · Duplicate‑Name Handling
When a free‑text note is saved, Networker attempts to match **either** `hebrew_name` **or** `english_name` via `ILIKE`:
* **Single match** → ask user **“Same person?”** with Yes/No dialog.
* **No match** → create new contact.
* **Multi match** → prompt user to pick one.

---

## 7 · Smart Text Parsing (Rule‑based)
1. **Name detection** – first capitalized tokens → english_name; next Hebrew UTF‑8 token(s) → hebrew_name.
2. **Company** – token ending with *Inc./Tech/VC* etc.
3. **Introductions** – regex `intro(?:’?d)? by (.+)` → `edges` row.
4. Everything else stored in **interaction.body**.

Target accuracy ≈ 70 %; user can always edit manually.

---

## 8 · Application Architecture
| Layer | Tech | Rationale |
|-------|------|-----------|
| Frontend | React + Vite + Tailwind | Minimal bundle, fast dev. |
| Auth & DB | Supabase (Google OAuth) | One‑stop BAAS. |
| Parsing | **Supabase Edge Function** (TypeScript) | Close to DB, low‑latency. |
| Graph | `react‑force‑graph` (mini view) | Lightweight, canvas‑based. |
| Hosting | Vercel static frontend; Supabase backend | Simple CI/CD. |
| Observability | Supabase logs + Sentry | Basic error tracking. |

---

## 9 · UX Requirements
| Screen | Key Elements | SLAs |
|--------|--------------|------|
| **Login** | Google button | OAuth ≤ 5 s |
| **Contacts List** | Avatar, name (HE/EN), company, last interaction | Infinite scroll ≤ 400 ms page |
| **Add Note** | Full‑screen textarea, “Save” button | Save round‑trip ≤ 1 s |
| **Contact View** | Editable fields, interaction timeline, mini‑graph | Edits autosave on blur |

---

## 10 · Backup & Export
- **Daily automatic backup** handled by Supabase.
- **Manual CSV Export**: action button in Settings exports *contacts + interactions* to downloadable CSV (UTF‑8, comma‑delimited).

---

## 11 · Analytics
- Track: `note_created`, `contact_created`, `contact_updated`, `session_start`.
- Dashboard: Supabase SQL → Grafana panel.

---

## 12 · Roll‑out Plan
| Phase | Dates* | Deliverables |
|-------|--------|-------------|
| **Design & POC** | 1‑14 Aug | Figma wires, schema, Edge Function spike |
| **Sprint #1** | 15‑31 Aug | Auth, Contacts list, Add Note |
| **Sprint #2** | 1‑14 Sep | Contact view, edit, mini‑graph, Sentry |
| **Internal Test** | 15‑21 Sep | Roi + 2 founders |
| **Pilot Release** | 22 Sep | 5 founders |
| **Review & Decide** | 6 Oct | KPI check, next‑features plan |

*Dates assume 1 FT dev + 0.3 designer; adjust if resourcing changes.*

---

## 13 · Future Considerations (Phase 2+ Preview)
- Omni‑search bar & advanced filters.
- Contact import (Google Contacts, CSV).
- AI suggestions & reminders.
- Notion sync.
- Team sharing & RBAC.

---

**End of Document**

