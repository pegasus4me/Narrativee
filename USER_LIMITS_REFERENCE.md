# User Limits & Pricing Reference

Quick reference for user tiers, limits, and LLM usage in Narrativee.

---

## User Tiers Overview

| Tier | Report Limit | Chat Access | Model Quality | Cost per Report* |
|------|-------------|-------------|---------------|-----------------|
| **Anonymous** | 1 report (cookie-tracked) | ❌ No | Grok 4.1 Fast | ~$0.001 |
| **Free** | 50 tokens (≈16 reports) | ✅ Yes | Qwen 3 235B | ~$0.005 |
| **Premium** | 1000 credits (≈333 reports) | ✅ Yes | Claude Sonnet 4.5 | ~$0.02 |

*Estimated costs based on average token usage

---

## Detailed Limits

### Anonymous Users (No Login)
- **Reports**: 1 maximum
- **Tracking**: Browser cookie (`narrativee_anon_report_generated`)
- **Expiry**: 30 days
- **Chat**: Not available
- **Model**: Grok 4.1 Fast Reasoning
- **Token Limit**: 4000 tokens per report
- **After Limit**: Prompt to sign up

**User Experience:**
1. Upload CSV, generate 1 report
2. Try to generate 2nd report → Get error
3. See message: "Sign in to create more reports"

---

### Free Users (Logged In)
- **Reports**: Token-based (50 tokens default)
- **Token Cost per Report**: 3 tokens
- **Max Reports**: ~16 reports (50 ÷ 3)
- **Chat**: Full access
  - Questions: 1 token each
  - Edits: 2 tokens each
  - Regenerate: 3 tokens each
- **Model (Reports)**: Qwen 3 235B via OpenRouter
- **Model (Chat)**: Grok for questions, Claude Haiku for edits
- **Token Limit**: 8000 tokens per report
- **After Limit**: Purchase token packs or upgrade to Premium

**Token Breakdown Example:**
- 10 reports = 30 tokens
- 5 chat questions = 5 tokens
- 3 chat edits = 6 tokens
- 1 regenerate = 3 tokens
- **Total**: 44 tokens (6 remaining)

---

### Premium Users (Paid)
- **Reports**: Credit-based (1000 credits default)
- **Credit Cost per Report**: 3 credits
- **Max Reports**: ~333 reports (1000 ÷ 3)
- **Chat**: Full access
  - Questions: 1 credit each
  - Edits: 2 credits each
  - Regenerate: 3 credits each
- **Model (Reports)**: Claude Sonnet 4.5 via OpenRouter
- **Model (Chat)**: Grok for questions, Claude Haiku for edits
- **Token Limit**: 16000 tokens per report
- **After Limit**: Purchase credit packs

**Credit Breakdown Example:**
- 100 reports = 300 credits
- 50 chat questions = 50 credits
- 30 chat edits = 60 credits
- 10 regenerates = 30 credits
- **Total**: 440 credits (560 remaining)

**Note**: Premium credit allocation (1000) is configurable via `llm.config.ts`

---

## LLM Model Selection

### Report Generation

| User Type | Model | Provider | Max Tokens | Quality |
|-----------|-------|----------|------------|---------|
| Anonymous | Grok 4.1 Fast Reasoning | X.ai | 4,000 | Good |
| Free | Qwen 3 235B | OpenRouter | 8,000 | Better |
| Premium | Claude Sonnet 4.5 | OpenRouter | 16,000 | Best |

### Chat Operations

| Operation | Model | Provider | Max Tokens | All Users |
|-----------|-------|----------|------------|-----------|
| Questions | Grok 4.1 Fast Reasoning | X.ai | 500 | ✅ |
| Edits | Claude 4.5 Haiku | OpenRouter | 2,000 | ✅ |
| Regenerate | Claude 4.5 Haiku | OpenRouter | 5,000 | ✅ |

---

## Token/Credit Costs

### Report Generation
- Anonymous: 5 tokens (theoretical, only 1 allowed)
- Free: 3 tokens
- Premium: 3 credits

### Chat Operations
- Question: 1 token/credit
- Edit: 2 tokens/credits
- Regenerate: 3 tokens/credits

---

## Error Messages

### Anonymous - Report Limit Reached
```json
{
  "error": "Report limit reached",
  "message": "You can only generate 1 report without an account. Please sign in to create more reports.",
  "requiresAuth": true,
  "limit": 1
}
```
**HTTP Status**: 403 Forbidden

### Free/Premium - Insufficient Tokens/Credits
```json
{
  "error": "Insufficient tokens",
  "message": "Insufficient tokens. Required: 3, Available: 0"
}
```
**HTTP Status**: 402 Payment Required

### Chat - Not Authenticated
```json
{
  "error": "Authentication required",
  "message": "Please log in to use the chat feature"
}
```
**HTTP Status**: 401 Unauthorized

---

## Cookie Details

### Anonymous Report Tracking Cookie

**Name**: `narrativee_anon_report_generated`
**Value**: `"true"`
**Attributes**:
- `maxAge`: 2,592,000,000ms (30 days)
- `httpOnly`: true
- `sameSite`: 'lax'
- `secure`: true (production only)

**Purpose**: Prevent anonymous users from generating more than 1 report

**Bypass Prevention**:
- HttpOnly prevents JavaScript access
- Server-side validation on every request
- Cookie tied to browser session

---

## Database Schema

### `user` table additions

```sql
-- Plan column (should already exist from Better Auth setup)
plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'premium'))

-- Tokens/Credits column (NEW)
tokens INTEGER DEFAULT 50
```

**Indexes**:
- `user_plan_idx` ON `plan` (faster queries)
- `user_tokens_idx` ON `tokens` (faster balance checks)

### `token_transactions` table (optional, for tracking)

```sql
CREATE TABLE token_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES "user"(id) ON DELETE CASCADE,
  action TEXT CHECK (action IN ('report_generation', 'chat_question', 'chat_edit', 'chat_regenerate', ...)),
  tokens_cost INTEGER NOT NULL,
  tokens_remaining INTEGER NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Configuration (llm.config.ts)

### Adjusting Limits

```typescript
// Token/Credit allocations
export const DEFAULT_USER_TOKENS = {
  free: 50,        // Change this to adjust free user tokens
  premium: 1000,   // Change this to adjust premium credits
};

// Report limits
export const REPORT_LIMITS = {
  anonymous: 1,    // Anonymous user limit (do not change)
  free: 50,        // Max reports for free (tied to tokens)
  premium: 1000,   // Max reports for premium (tied to credits)
};
```

### Adjusting Token Costs

```typescript
// In LLM_CONFIGS.reportGeneration
noAuth: {
  // ...
  tokenCost: 5,  // Change cost for anonymous
},
free: {
  // ...
  tokenCost: 3,  // Change cost for free users
},
premium: {
  // ...
  tokenCost: 3,  // Change cost for premium users (0 = free reports)
},
```

---

## Upgrade Paths

### Anonymous → Free
**Benefit**: 49 more reports (from 1 to 50 total)
**Gain**: Full chat access
**Model Upgrade**: Grok → Qwen (better quality)

### Free → Premium
**Benefit**: 950 more credits (from 50 to 1000 total)
**Gain**: Higher quality reports
**Model Upgrade**: Qwen → Claude Sonnet 4.5 (best quality)
**Token Increase**: 8K → 16K per report

---

## Future Enhancements (Not Yet Implemented)

- [ ] Token purchase system (Stripe)
- [ ] Credit purchase system for premium users
- [ ] Token/credit balance display in UI
- [ ] Daily token refills for free users (e.g., +10/day)
- [ ] Monthly credit resets for premium users
- [ ] Usage analytics dashboard
- [ ] Low balance warnings
- [ ] Upgrade prompts when limits reached
- [ ] Referral bonuses (extra tokens/credits)
- [ ] Promotional credits

---

## Quick Decision Tree

```
User wants to generate a report:
├─ Is user logged in?
│  ├─ NO → Anonymous user
│  │  ├─ Has cookie set?
│  │  │  ├─ YES → Return 403 "Sign in to create more"
│  │  │  └─ NO → Generate with Grok (set cookie)
│  └─ YES → Logged in user
│     ├─ What's their plan?
│     │  ├─ Free → Use Qwen (deduct 3 tokens)
│     │  └─ Premium → Use Claude Sonnet (deduct 3 credits)
│     └─ Enough balance?
│        ├─ YES → Generate report
│        └─ NO → Return 402 "Insufficient tokens/credits"

User wants to use chat:
├─ Is user logged in?
│  ├─ NO → Return 401 "Please log in"
│  └─ YES → Allow chat
│     ├─ Question → Grok (1 token/credit)
│     ├─ Edit → Claude Haiku (2 tokens/credits)
│     └─ Regenerate → Claude Haiku (3 tokens/credits)
```

---

**Last Updated**: 2025-11-27
**Version**: 1.0
