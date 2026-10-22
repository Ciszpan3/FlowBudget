---
name: create-feature
description: Implement a FlowBudget business feature across React, Express, shared contracts, Prisma, tests, and concise documentation. Use for functionality spanning at least two application layers.
---

# Fullstack feature

Start from the user outcome and identify the smallest vertical slice that delivers it. Inspect neighboring feature modules before choosing file placement.

1. Define or extend Zod boundary contracts in `packages/shared` only when both apps use them.
2. Model ownership and financial invariants before changing persistence. For schema changes, apply the `database-change` skill.
3. Implement a thin Express route and domain-focused service where logic is non-trivial. Scope every owned lookup and mutation by `userId`; validate related IDs independently.
4. Build the React flow inside its business feature. Fetch and mutate with TanStack Query, invalidate the narrowest useful keys, and cover loading, error, empty, success, keyboard, and narrow-screen states.
5. Add tests at the cheapest layer that proves each invariant; use integration tests for authorization and ownership.
6. Run targeted tests and typecheck first, then repository lint and build. Update only documentation whose contract or behavior changed.

Do not create speculative abstractions, mirror server state in Context, use floating-point financial arithmetic, or expose a control that has no implemented action.
