# Feature Roadmap

## Phase 1 – Authentication & Access Control
- Enforce role-based routing with NextAuth middleware
- Replace localStorage user handling with `auth()` hooks/components
- Support OAuth account linking + fallback credential login

## Phase 2 – Driver Experience
- Real-time driver tracking via socket + map component
- Gamification: levels, badges, weekly stats, leaderboard UI
- Notifications for proximity + completed orders

## Phase 3 – Payments
- Integrate real PromptPay flow + gateway fallback
- Update checkout UI to select payment, handle callbacks, send receipts
- Remove demo-only APIs and add audit logs

## Phase 4 – Analytics & Monitoring
- Live dashboards per role (restaurant, admin, driver) with exportable data
- Alerting hooks (Slack/Telegram) when health check fails
- Extend logging with structured metrics for key flows

## Phase 5 – AI Assistance & Search
- Natural-language order builder leveraging existing RAG stack
- Semantic search filters in menu/orders

## Phase 6 – Testing & QA
- Playwright e2e for login → order → payment → delivery
- Contract tests for auth/payment API
- Load testing scripts for driver tracking

We'll execute sequentially and update this file as each phase completes.
