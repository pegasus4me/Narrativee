# Plan-Based LLM Selection Implementation Summary

## Overview
Implemented a modular, plan-based LLM selection system that supports different AI models for different user tiers, with:
- **Anonymous users**: Limited to 1 report (tracked via cookies)
- **Free users**: Token-based usage (50 tokens)
- **Premium users**: Credit-based quota (1000 credits, configurable)
- Full token/credit tracking infrastructure ready to activate

---

## Changes Made

### 1. **LLM Configuration System** (`apps/backend/src/config/llm.config.ts`)

Created centralized configuration for all LLM usage:

#### Report Generation Models:
- **No Auth Users** → Grok 4.1 Fast Reasoning (4000 token limit)
- **Free Plan Users** → Qwen 3 235B via OpenRouter (8000 token limit)
- **Premium Plan Users** → Claude Sonnet 4.5 via OpenRouter (16000 token limit)

#### Chat Models (All Logged-in Users):
- **Questions** → Grok 4.1 Fast Reasoning (500 tokens)
- **Edits** → Claude 4.5 Haiku (2000 tokens)
- **Regenerate** → Claude 4.5 Haiku (5000 tokens)

#### Token/Credit Costs (for future tracking):
- Report generation: 5 tokens (no-auth, 1 max), 3 tokens (free), 3 credits (premium)
- Chat question: 1 token/credit
- Chat edit: 2 tokens/credits
- Chat regenerate: 3 tokens/credits

#### User Limits:
- **Anonymous**: 1 report max (tracked via cookie, 30-day expiry)
- **Free**: 50 tokens (≈16 reports max)
- **Premium**: 1000 credits (≈333 reports max, configurable)

---

### 2. **Authentication Middleware Updates** (`apps/backend/src/middleware/auth.ts`)

Extended `AuthRequest` interface to include:
```typescript
user?: {
  id: string;
  email: string;
  name: string;
  image?: string;
  plan: 'free' | 'premium';  // NEW
  tokens?: number;            // NEW - for future token tracking
}
```

Both `verifyAuth` and `optionalAuth` middleware now:
- Extract user plan from Better Auth session
- Default to 'free' plan if not set
- Include token balance in request object

---

### 3. **Anonymous User Limit** (`apps/backend/src/routes/report.ts`)

#### Cookie-Based Tracking:
- Anonymous users checked before report generation
- Cookie `narrativee_anon_report_generated` set after first report
- 30-day expiry, httpOnly, sameSite: 'lax'
- Returns 403 with clear message when limit reached:
  ```json
  {
    "error": "Report limit reached",
    "message": "You can only generate 1 report without an account. Please sign in to create more reports.",
    "requiresAuth": true,
    "limit": 1
  }
  ```

### 4. **Report Generation Updates** (`apps/backend/src/routes/report.ts` & `apps/backend/src/services/LLM/llm.ts`)

#### Routes:
- `/api/report/generate` now passes `userPlan` to report generation function
- Plan determined from `req.user?.plan || null` (null = no auth)

#### LLM Service:
- Renamed `callClaudeAPI` → `callLLMAPI` (model-agnostic)
- Accepts `llmConfig` parameter for dynamic model selection
- Logs which model is being used for transparency
- Supports both OpenRouter and X.ai providers

---

### 5. **Chat Route Authentication** (`apps/backend/src/routes/chat.ts`)

#### Breaking Changes:
- **All chat endpoints now require authentication**
- `/api/chat` → Protected with `verifyAuth` middleware
- `/api/chat/regenerate` → Protected with `verifyAuth` middleware

#### Error Handling:
- Returns 401 with clear message: "Please log in to use the chat feature"
- Frontend handles this gracefully with login prompt

#### LLM Selection:
- Uses `getChatConfig()` to select appropriate model
- Questions → Grok (cheap and fast)
- Edits/Regenerate → Claude Haiku (better quality)

---

### 6. **Frontend ChatSidebar Updates** (`apps/web/app/components/ChatSidebar.tsx`)

#### Authentication Integration:
- Added `useSession()` hook from Better Auth
- Initial message changes based on auth status
- Input UI replaced with login button when not authenticated

#### User Experience:
- **Not logged in**: Shows "Please log in" message with login button
- **Logged in**: Full chat functionality available
- **Session expired**: Graceful error handling with re-login prompt

#### Error Handling:
- Detects 401 errors from backend
- Shows context-appropriate error messages
- Guides users to re-authenticate when needed

---

### 7. **Token/Credit Tracking Infrastructure** (Ready for Future Use)

#### Database Migrations:
Created 2 SQL migration files in `apps/backend/migrations/`:

**001_add_tokens_column.sql**:
```sql
ALTER TABLE "user" ADD COLUMN "tokens" integer DEFAULT 50;
CREATE INDEX "user_tokens_idx" ON "user" ("tokens");
UPDATE "user" SET tokens = 50 WHERE plan = 'free' AND tokens IS NULL;
UPDATE "user" SET tokens = 1000 WHERE plan = 'premium' AND tokens IS NULL;
```

**002_create_token_transactions_table.sql**:
```sql
CREATE TABLE "token_transactions" (
  id, user_id, action, tokens_cost,
  tokens_remaining, metadata, created_at
);
```

#### Token Service (`apps/backend/src/services/database/tokenDB.ts`):

Functions ready to use:
- `getUserTokenBalance(userId)` - Get current balance
- `hasEnoughTokens(userId, required)` - Check if user can afford action
- `deductTokens(userId, action, cost, metadata)` - Deduct and record transaction
- `addTokens(userId, amount, reason)` - Add tokens/credits (purchases, promos)
- `initializeUserTokens(userId, plan)` - Setup for new users (50 tokens or 1000 credits)
- `getTokenTransactionHistory(userId, limit)` - Audit trail

#### Implementation Notes:
- **Free users**: 50 tokens by default
- **Premium users**: 1000 credits by default (configurable in `llm.config.ts`)
- All functions include transaction safety (BEGIN/COMMIT/ROLLBACK)
- Error messages distinguish between "tokens" (free) and "credits" (premium)
- Token/credit costs defined in `llm.config.ts` for easy adjustment

---

## How to Enable Token Tracking (Future)

When ready to activate token tracking:

1. **Run Database Migrations**:
   ```bash
   psql $DATABASE_URL < apps/backend/migrations/001_add_tokens_column.sql
   psql $DATABASE_URL < apps/backend/migrations/002_create_token_transactions_table.sql
   ```

2. **Update Report Route** (`apps/backend/src/routes/report.ts`):
   ```typescript
   import { deductTokens, hasEnoughTokens } from '../services/database/tokenDB';
   import { getReportGenerationConfig } from '../config/llm.config';

   // In /generate endpoint, before generating report:
   if (req.user) {
     const llmConfig = getReportGenerationConfig(req.user.plan);
     const cost = llmConfig.tokenCost || 0;

     if (cost > 0) {
       const canAfford = await hasEnoughTokens(req.user.id, cost);
       if (!canAfford) {
         return res.status(402).json({
           error: 'Insufficient tokens',
           message: `You need ${cost} tokens to generate a report.`
         });
       }

       await deductTokens(req.user.id, 'report_generation', cost, {
         reportStyle,
         fileName: file.originalname
       });
     }
   }
   ```

3. **Update Chat Routes** (same pattern):
   - Check token balance before API call
   - Deduct tokens after successful response
   - Return 402 (Payment Required) when insufficient

4. **Frontend Updates**:
   - Display token balance in UI (from user session)
   - Show warning when tokens low
   - Prompt to upgrade to premium or purchase tokens

---

## Testing Checklist

### Database:
- [ ] Run both SQL migrations on Supabase
- [ ] Verify `plan` column exists in `user` table with index
- [ ] Verify `tokens` column exists with default value 50
- [ ] Verify `token_transactions` table created successfully

### Backend - Report Generation:
- [ ] Anonymous user generates 1st report → Uses Grok 4.1, sets cookie
- [ ] Anonymous user tries 2nd report → Returns 403 with "login required" message
- [ ] Free user generates report → Uses Qwen 3 235B (8000 tokens max)
- [ ] Premium user generates report → Uses Claude Sonnet 4.5 (16000 tokens max)
- [ ] Check logs confirm correct model selection
- [ ] Anonymous report cookie persists for 30 days

### Backend - Chat:
- [ ] Unauthenticated chat request → Returns 401
- [ ] Logged-in user asks question → Uses Grok
- [ ] Logged-in user requests edit → Uses Claude Haiku
- [ ] Logged-in user regenerates → Uses Claude Haiku

### Frontend:
- [ ] ChatSidebar shows login prompt when not authenticated
- [ ] ChatSidebar works normally when authenticated
- [ ] Graceful handling of 401 errors
- [ ] Login button redirects to `/auth/signin`
- [ ] Anonymous user sees "1 report limit" message after generating
- [ ] Anonymous user prompted to sign up when trying 2nd report

---

## Environment Variables Required

Make sure these are set in `.env`:

```bash
# LLM API Keys
GROK_API_KEY=your_grok_api_key
OPEN_ROUTER_KEY=your_openrouter_api_key

# Better Auth
BETTER_AUTH_SECRET=your_secret_key
BETTER_AUTH_URL=http://localhost:3000
DATABASE_URL=postgresql://...

# Frontend URL (for OpenRouter)
FRONTEND_URL=http://localhost:3000
```

---

## API Changes Summary

### Breaking Changes:
| Endpoint | Before | After |
|----------|--------|-------|
| `POST /api/chat` | Public | **Requires auth** |
| `POST /api/chat/regenerate` | Public | **Requires auth** |
| `POST /api/report/generate` | Unlimited for anonymous | **1 report max (cookie-tracked)** |

### Non-Breaking Changes:
| Endpoint | Change |
|----------|--------|
| `POST /api/report/generate` | Now uses plan-based LLM selection |

---

## File Structure

```
apps/backend/
├── src/
│   ├── config/
│   │   └── llm.config.ts              # NEW - LLM configurations
│   ├── middleware/
│   │   └── auth.ts                    # UPDATED - Added plan & tokens
│   ├── routes/
│   │   ├── chat.ts                    # UPDATED - Auth required
│   │   └── report.ts                  # UPDATED - Plan-based LLM
│   └── services/
│       ├── database/
│       │   └── tokenDB.ts             # NEW - Token tracking functions
│       └── LLM/
│           └── llm.ts                 # UPDATED - Model-agnostic API calls
└── migrations/
    ├── 001_add_tokens_column.sql      # NEW - Add tokens column
    └── 002_create_token_transactions_table.sql  # NEW - Transactions table

apps/web/
└── app/
    └── components/
        └── ChatSidebar.tsx            # UPDATED - Auth-aware UI
```

---

## Next Steps (Optional Enhancements)

1. **Token/Credit Display**: Add balance display in navbar for logged-in users
   - Free: "50 tokens remaining"
   - Premium: "1000 credits remaining"
2. **Credit Purchase**: Create `/api/credits/purchase` endpoint (Stripe integration)
   - Free users: Buy token packs (e.g., 50 tokens for $5)
   - Premium users: Buy credit packs (e.g., 500 credits for $10)
3. **Admin Dashboard**: Track LLM usage costs per user for analytics
4. **Credit Refills**:
   - Free: Scheduled task to refill tokens (e.g., 10/day)
   - Premium: Monthly credit reset or rollover system
5. **Usage Analytics**: Chart showing token/credit consumption over time
6. **Plan Upgrade Flow**:
   - Anonymous → Free: Prompt after 1 report
   - Free → Premium: Prompt when tokens < 10
   - Premium: Prompt to buy credits when < 50 remaining
7. **Frontend Report Limit Warning**:
   - Show "1/1 reports used" message to anonymous users
   - Encourage sign-up after first report
8. **Configurable Premium Credits**:
   - Add admin panel to adjust premium credit allocation (currently hardcoded to 1000)

---

## Architecture Benefits

### Modularity:
- All LLM configs in one file → Easy to add new models
- Token costs centralized → Simple price adjustments
- Clean separation of concerns

### Scalability:
- New plan tiers: Just add to `llm.config.ts`
- New LLM providers: Extend config with new provider type
- Token tracking ready to enable without code changes

### Cost Optimization:
- Cheap models for non-authenticated users
- Quality models for paying customers
- Token system prevents abuse

### Developer Experience:
- TypeScript types for safety
- Clear error messages
- Comprehensive logging
- Transaction safety for token operations

---

## Support

For issues or questions:
1. Check logs in backend console for LLM selection
2. Verify environment variables are set
3. Confirm database migrations ran successfully
4. Test with different user plans (no-auth, free, premium)

---

**Implementation completed**: All todos finished successfully! 🎉
