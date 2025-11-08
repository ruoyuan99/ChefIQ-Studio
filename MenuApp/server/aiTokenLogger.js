/**
 * AI Token Usage Logger
 * Logs token usage for all OpenAI API calls
 */

// Pricing per 1M tokens (as of 2024)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.15,   // $0.15 per 1M input tokens
    output: 0.60,  // $0.60 per 1M output tokens
  },
  'gpt-4o': {
    input: 2.50,   // $2.50 per 1M input tokens
    output: 10.00, // $10.00 per 1M output tokens
  },
  'gpt-4-turbo': {
    input: 10.00,  // $10.00 per 1M input tokens
    output: 30.00, // $30.00 per 1M output tokens
  },
  'gpt-3.5-turbo': {
    input: 0.50,   // $0.50 per 1M input tokens
    output: 1.50,  // $1.50 per 1M output tokens
  },
  'text-embedding-3-small': {
    input: 0.02,   // $0.02 per 1M input tokens
    output: 0,     // No output tokens for embeddings
  },
};

/**
 * Calculate cost based on token usage
 */
function calculateCost(model, promptTokens, completionTokens) {
  const modelPricing = PRICING[model] || PRICING['gpt-4o-mini'];
  const inputCost = (promptTokens / 1000000) * modelPricing.input;
  const outputCost = (completionTokens / 1000000) * modelPricing.output;
  return inputCost + outputCost;
}

/**
 * Log token usage for OpenAI API calls
 * @param {string} endpoint - API endpoint name (e.g., 'extract-recipe', 'optimize-recipe')
 * @param {string} model - Model used (e.g., 'gpt-4o-mini')
 * @param {object} usage - Usage object from OpenAI response
 * @param {object} options - Additional options (url, recipeTitle, etc.)
 */
function logTokenUsage(endpoint, model, usage, options = {}) {
  if (!usage) {
    console.log('⚠️  Token usage information not available');
    return;
  }

  const promptTokens = usage.prompt_tokens || 0;
  const completionTokens = usage.completion_tokens || 0;
  const totalTokens = usage.total_tokens || (promptTokens + completionTokens);
  const cost = calculateCost(model, promptTokens, completionTokens);

  // Format log message
  const logMessage = `
📊 AI Token Usage Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Endpoint: ${endpoint}
Model: ${model}
${options.url ? `URL: ${options.url}` : ''}
${options.recipeTitle ? `Recipe: ${options.recipeTitle}` : ''}
${options.userId ? `User ID: ${options.userId}` : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Tokens:
  • Prompt: ${promptTokens.toLocaleString()} tokens
  • Completion: ${completionTokens.toLocaleString()} tokens
  • Total: ${totalTokens.toLocaleString()} tokens
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Cost: $${cost.toFixed(6)} (${(cost * 1000).toFixed(3)} cents)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();

  console.log(logMessage);

  // Also log a concise version
  console.log(`💰 [${endpoint}] ${totalTokens} tokens (${promptTokens} + ${completionTokens}) = $${cost.toFixed(6)}`);

  return {
    endpoint,
    model,
    promptTokens,
    completionTokens,
    totalTokens,
    cost,
    timestamp: new Date().toISOString(),
    ...options,
  };
}

/**
 * Log token usage from OpenAI completion response
 * @param {string} endpoint - API endpoint name
 * @param {object} completion - OpenAI completion response
 * @param {object} options - Additional options
 */
function logCompletionUsage(endpoint, completion, options = {}) {
  const model = completion.model || options.model || 'gpt-4o-mini';
  const usage = completion.usage;
  
  return logTokenUsage(endpoint, model, usage, options);
}

module.exports = {
  logTokenUsage,
  logCompletionUsage,
  calculateCost,
  PRICING,
};

