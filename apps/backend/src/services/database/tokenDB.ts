import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

/**
 * Token tracking for user actions
 * FUTURE IMPLEMENTATION - Database schema needs to be created first
 */

export interface TokenTransaction {
  id: string;
  userId: string;
  action: 'report_generation' | 'chat_question' | 'chat_edit' | 'chat_regenerate';
  tokensCost: number;
  tokensRemaining: number;
  metadata?: any;
  createdAt: Date;
}

/**
 * Get user's current token/credit balance
 * @returns Number of tokens/credits remaining
 */
export async function getUserTokenBalance(userId: string): Promise<number> {
  try {
    const query = `
      SELECT tokens
      FROM "user"
      WHERE id = $1
    `;
    const result = await pool.query(query, [userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    return result.rows[0].tokens || 0;
  } catch (error) {
    console.error('Error fetching user token balance:', error);
    throw error;
  }
}

/**
 * Check if user has enough tokens/credits for an action
 */
export async function hasEnoughTokens(
  userId: string,
  requiredTokens: number
): Promise<boolean> {
  const balance = await getUserTokenBalance(userId);
  return balance >= requiredTokens;
}

/**
 * Deduct tokens from user's balance and record transaction
 * @returns New token balance, or throws error if insufficient tokens
 */
export async function deductTokens(
  userId: string,
  action: TokenTransaction['action'],
  tokensCost: number,
  metadata?: any
): Promise<number> {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get current balance
    const balanceQuery = `
      SELECT tokens, plan
      FROM "user"
      WHERE id = $1
      FOR UPDATE
    `;
    const balanceResult = await client.query(balanceQuery, [userId]);

    if (balanceResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const currentBalance = balanceResult.rows[0].tokens || 0;
    const userPlan = balanceResult.rows[0].plan;

    // Check if user has enough tokens/credits (premium users also have limits now)
    if (currentBalance < tokensCost) {
      const resourceName = userPlan === 'premium' ? 'credits' : 'tokens';
      throw new Error(`Insufficient ${resourceName}. Required: ${tokensCost}, Available: ${currentBalance}`);
    }

    const newBalance = currentBalance - tokensCost;

    // Update user's token balance
    const updateQuery = `
      UPDATE "user"
      SET tokens = $1, "updatedAt" = NOW()
      WHERE id = $2
    `;
    await client.query(updateQuery, [newBalance, userId]);

    // Record transaction (if token_transactions table exists)
    // TODO: Create token_transactions table first
    /*
    const transactionQuery = `
      INSERT INTO token_transactions (user_id, action, tokens_cost, tokens_remaining, metadata)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    await client.query(transactionQuery, [
      userId,
      action,
      tokensCost,
      newBalance,
      JSON.stringify(metadata || {})
    ]);
    */

    await client.query('COMMIT');

    console.log(`💰 Tokens deducted: ${tokensCost} from user ${userId}. New balance: ${newBalance}`);

    return newBalance;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deducting tokens:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Add tokens to user's balance (for purchases, promotions, etc.)
 */
export async function addTokens(
  userId: string,
  tokensToAdd: number,
  reason: string = 'manual_addition'
): Promise<number> {
  try {
    const query = `
      UPDATE "user"
      SET tokens = COALESCE(tokens, 0) + $1, "updatedAt" = NOW()
      WHERE id = $2
      RETURNING tokens
    `;
    const result = await pool.query(query, [tokensToAdd, userId]);

    if (result.rows.length === 0) {
      throw new Error('User not found');
    }

    const newBalance = result.rows[0].tokens;
    console.log(`💰 Tokens added: ${tokensToAdd} to user ${userId}. New balance: ${newBalance}`);

    return newBalance;
  } catch (error) {
    console.error('Error adding tokens:', error);
    throw error;
  }
}

/**
 * Initialize tokens/credits for new user
 * Free: 50 tokens, Premium: 1000 credits (configurable)
 */
export async function initializeUserTokens(userId: string, plan: 'free' | 'premium' = 'free'): Promise<void> {
  try {
    const initialTokens = plan === 'premium' ? 1000 : 50; // Premium gets 1000 credits

    const query = `
      UPDATE "user"
      SET tokens = $1, "updatedAt" = NOW()
      WHERE id = $2 AND tokens IS NULL
    `;
    await pool.query(query, [initialTokens, userId]);

    const resourceName = plan === 'premium' ? 'credits' : 'tokens';
    console.log(`🎁 Initialized ${plan} user ${userId} with ${initialTokens} ${resourceName}`);
  } catch (error) {
    console.error('Error initializing user tokens:', error);
    throw error;
  }
}

/**
 * Get user's token transaction history
 * (Requires token_transactions table to be created)
 */
export async function getTokenTransactionHistory(
  userId: string,
  limit: number = 50
): Promise<TokenTransaction[]> {
  // TODO: Implement when token_transactions table is created
  /*
  try {
    const query = `
      SELECT
        id, user_id as "userId", action, tokens_cost as "tokensCost",
        tokens_remaining as "tokensRemaining", metadata, created_at as "createdAt"
      FROM token_transactions
      WHERE user_id = $1
      ORDER BY created_at DESC
      LIMIT $2
    `;
    const result = await pool.query(query, [userId, limit]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching token transaction history:', error);
    throw error;
  }
  */
  return [];
}
