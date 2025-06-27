// COMPLETE: Edge Function with comprehensive conversation tracking and usage management
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// COMPLETE: All supported models
const VALID_OPENAI_MODELS = [
  'gpt-3.5-turbo',
  'gpt-4o-mini',
  'gpt-4o',
  'gpt-4.1',
  'gpt-4.1-mini',
  'gpt-4.1-nano',
  'gpt-4-turbo',
  'o3',
  'o3-mini',
  'o4-mini'
];

const VALID_CLAUDE_MODELS = [
  // Latest Claude 4 Models (May 2025)
  'claude-opus-4-20250514',
  'claude-sonnet-4-20250514',
  // Claude 3.7 Models
  'claude-3-7-sonnet-20250219',
  // Claude 3.5 Models
  'claude-3-5-sonnet-20241022',
  'claude-3-5-haiku-20241022',
  // Claude 3 Models (Legacy)
  'claude-3-opus-20240229'
];

// COMPLETE: Pricing tier definitions matching frontend
const PRICING_TIERS = {
  free: {
    monthly_tokens: 35000,
    daily_messages: 25,
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022'
    ]
  },
  basic: {
    monthly_tokens: 1000000,
    daily_messages: -1,
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022',
      'gpt-4o',
      'gpt-4.1',
      'gpt-4.1-mini',
      'claude-3-5-sonnet-20241022',
      'claude-3-7-sonnet-20250219',
      'claude-sonnet-4-20250514'
    ]
  },
  pro: {
    monthly_tokens: 1500000,
    daily_messages: -1,
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022',
      'gpt-4o',
      'gpt-4.1',
      'gpt-4.1-mini',
      'gpt-4.1-nano',
      'gpt-4-turbo',
      'o3',
      'o3-mini',
      'o4-mini',
      'claude-3-5-sonnet-20241022',
      'claude-3-7-sonnet-20250219',
      'claude-sonnet-4-20250514',
      'claude-opus-4-20250514',
      'claude-3-opus-20240229'
    ]
  }
};

// CRITICAL: Enhanced getUserTierAndUsage with anniversary-based reset logic
async function getUserTierAndUsage(supabase, userId) {
  console.log('🔍 Getting tier and usage for user:', userId);

  try {
    // STEP 1: Get user data with subscription tier and current usage
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        *,
        subscription_tiers (
          tier_name,
          monthly_token_limit,
          daily_message_limit,
          allowed_models
        )
      `)
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('❌ Error fetching user data:', userError);
      throw new Error(`Failed to fetch user data: ${userError.message}`);
    }

    if (!userData) {
      throw new Error('User not found');
    }

    // STEP 2: Determine user's tier
    let tier = 'free'; // Default fallback
    if (userData?.subscription_tiers?.tier_name && PRICING_TIERS[userData.subscription_tiers.tier_name]) {
      tier = userData.subscription_tiers.tier_name;
      console.log('✅ Found user tier from database:', tier);
    } else {
      console.log('⚠️ No tier found, defaulting to free');
    }

    // STEP 3: Anniversary-based reset logic
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD
    
    let needsUpdate = false;
    let updates = {};

    // Daily reset check
    const lastDailyReset = userData.last_daily_reset ? userData.last_daily_reset.split('T')[0] : null;
    if (!lastDailyReset || lastDailyReset < currentDate) {
      console.log('🔄 Daily reset needed. Last reset:', lastDailyReset, 'Current:', currentDate);
      updates.daily_messages_sent = 0;
      updates.last_daily_reset = currentDate;
      needsUpdate = true;
    }

    // Monthly reset check (anniversary-based)
    const billingPeriodStart = userData.billing_period_start ? new Date(userData.billing_period_start) : new Date(userData.created_at);
    const lastMonthlyReset = userData.last_monthly_reset ? new Date(userData.last_monthly_reset) : null;
    
    // Calculate next billing anniversary
    const nextBillingDate = new Date(now.getFullYear(), now.getMonth(), billingPeriodStart.getDate());
    if (nextBillingDate <= now) {
      // If this month's anniversary has passed, next reset is next month
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }
    
    // Check if we've passed the billing anniversary since last reset
    const shouldResetMonthly = !lastMonthlyReset || 
      (now >= nextBillingDate && lastMonthlyReset < nextBillingDate);
    
    if (shouldResetMonthly) {
      console.log('🔄 Monthly reset needed. Last reset:', lastMonthlyReset, 'Next billing:', nextBillingDate);
      updates.monthly_tokens_used = 0;
      updates.last_monthly_reset = currentDate;
      needsUpdate = true;
    }

    // STEP 4: Apply resets if needed
    if (needsUpdate) {
      console.log('💾 Applying usage resets:', updates);
      const { error: updateError } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (updateError) {
        console.error('❌ Error updating user resets:', updateError);
        throw new Error(`Failed to update user resets: ${updateError.message}`);
      }

      // Update userData with new values
      userData.daily_messages_sent = updates.daily_messages_sent ?? userData.daily_messages_sent;
      userData.monthly_tokens_used = updates.monthly_tokens_used ?? userData.monthly_tokens_used;
      userData.last_daily_reset = updates.last_daily_reset ?? userData.last_daily_reset;
      userData.last_monthly_reset = updates.last_monthly_reset ?? userData.last_monthly_reset;
    }

    // STEP 5: Return tier data and current usage
    const result = {
      tier,
      tierLimits: PRICING_TIERS[tier],
      messagesUsedToday: userData.daily_messages_sent || 0,
      tokensUsedThisMonth: userData.monthly_tokens_used || 0,
      billingPeriodStart: userData.billing_period_start,
      lastDailyReset: userData.last_daily_reset,
      lastMonthlyReset: userData.last_monthly_reset,
      userId: userData.id
    };

    console.log('📊 Final usage data:', {
      tier: result.tier,
      messagesUsedToday: result.messagesUsedToday,
      tokensUsedThisMonth: result.tokensUsedThisMonth,
      monthlyLimit: result.tierLimits.monthly_tokens,
      dailyLimit: result.tierLimits.daily_messages
    });

    return result;

  } catch (error) {
    console.error('💥 Error in getUserTierAndUsage:', error);
    throw error;
  }
}

// FIXED: Message persistence without explicit total_tokens (let DB calculate it)
async function saveUserMessage(supabase, conversationId, userId, content, sequenceNumber) {
  try {
    console.log('💾 Saving user message:', { conversationId, userId, sequenceNumber });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content: content,
        model_used: null,
        input_tokens: 0,
        output_tokens: 0,
        // REMOVED: total_tokens: 0 - Let database calculate this automatically
        sequence_number: sequenceNumber
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save user message: ${error.message}`);
    }

    console.log('✅ User message saved:', message.id);
    return message;

  } catch (error) {
    console.error('❌ Error saving user message:', error);
    throw error;
  }
}

// CRITICAL: AI response persistence with usage tracking
async function saveAIMessage(supabase, conversationId, content, modelUsed, usage, sequenceNumber) {
  try {
    console.log('💾 Saving AI message:', { 
      conversationId, 
      modelUsed, 
      sequenceNumber,
      inputTokens: usage.prompt_tokens,
      outputTokens: usage.completion_tokens,
      totalTokens: usage.total_tokens
    });

    const { data: message, error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: content,
        model_used: modelUsed,
        input_tokens: usage.prompt_tokens || 0,
        output_tokens: usage.completion_tokens || 0,
        // REMOVED: total_tokens - Let database calculate this automatically
        sequence_number: sequenceNumber
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save AI message: ${error.message}`);
    }

    console.log('✅ AI message saved:', message.id);
    return message;

  } catch (error) {
    console.error('❌ Error saving AI message:', error);
    throw error;
  }
}

// NEW: Update conversation title if it's still "New Chat"
async function updateConversationTitle(supabase, conversationId, firstUserMessage) {
  try {
    console.log('🏷️ Checking conversation title for:', conversationId);

    // Get current conversation
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('title')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching conversation:', fetchError);
      return; // Don't throw, this is not critical
    }

    // Only update if title is "New Chat"
    if (conversation && conversation.title === 'New Chat') {
      // Create title from first user message (first 50 characters)
      let newTitle = firstUserMessage.trim();
      if (newTitle.length > 50) {
        newTitle = newTitle.substring(0, 50) + '...';
      }

      console.log('📝 Updating conversation title:', { conversationId, newTitle });

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ title: newTitle })
        .eq('id', conversationId);

      if (updateError) {
        console.error('❌ Error updating conversation title:', updateError);
        return; // Don't throw, this is not critical
      }

      console.log('✅ Conversation title updated successfully');
    } else {
      console.log('ℹ️ Conversation title already set, skipping update');
    }

  } catch (error) {
    console.error('❌ Error in updateConversationTitle:', error);
    // Don't throw - title update is not critical for functionality
  }
}

// NEW: Track model history in conversation
async function updateModelHistory(supabase, conversationId, modelUsed) {
  try {
    console.log('📊 Updating model history for:', { conversationId, modelUsed });

    // Get current model history
    const { data: conversation, error: fetchError } = await supabase
      .from('conversations')
      .select('model_history')
      .eq('id', conversationId)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching conversation for model history:', fetchError);
      return; // Don't throw, this is not critical
    }

    // Get current model history array
    let modelHistory = conversation?.model_history || [];
    
    // Ensure it's an array
    if (!Array.isArray(modelHistory)) {
      modelHistory = [];
    }

    // Add model to history if not already present
    if (!modelHistory.includes(modelUsed)) {
      modelHistory.push(modelUsed);

      console.log('📈 Adding model to history:', { conversationId, modelUsed, newHistory: modelHistory });

      const { error: updateError } = await supabase
        .from('conversations')
        .update({ model_history: modelHistory })
        .eq('id', conversationId);

      if (updateError) {
        console.error('❌ Error updating model history:', updateError);
        return; // Don't throw, this is not critical
      }

      console.log('✅ Model history updated successfully');
    } else {
      console.log('ℹ️ Model already in history, skipping update');
    }

  } catch (error) {
    console.error('❌ Error in updateModelHistory:', error);
    // Don't throw - model history update is not critical for functionality
  }
}

// CRITICAL: Update user usage statistics
async function updateUserUsage(supabase, userId, tokensUsed, messagesAdded = 1) {
  try {
    console.log('📈 Updating user usage:', { userId, tokensUsed, messagesAdded });

    const { error } = await supabase
      .from('users')
      .update({
        monthly_tokens_used: supabase.sql`monthly_tokens_used + ${tokensUsed}`,
        daily_messages_sent: supabase.sql`daily_messages_sent + ${messagesAdded}`
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user usage: ${error.message}`);
    }

    console.log('✅ User usage updated successfully');

  } catch (error) {
    console.error('❌ Error updating user usage:', error);
    throw error;
  }
}

// CRITICAL: Update daily usage tracking table
async function updateUsageTracking(supabase, userId, tokensUsed, messagesAdded, modelUsed) {
  try {
    console.log('📊 Updating usage tracking:', { userId, tokensUsed, messagesAdded, modelUsed });

    const today = new Date().toISOString().split('T')[0];

    // Upsert daily usage record
    const { error } = await supabase
      .from('usage_tracking')
      .upsert({
        user_id: userId,
        date: today,
        tokens_used: supabase.sql`COALESCE(tokens_used, 0) + ${tokensUsed}`,
        messages_sent: supabase.sql`COALESCE(messages_sent, 0) + ${messagesAdded}`,
        models_used: supabase.sql`COALESCE(models_used, '{}') || jsonb_build_object('${modelUsed}', COALESCE((models_used->>'${modelUsed}')::int, 0) + 1)`,
        cost_incurred: supabase.sql`COALESCE(cost_incurred, 0) + ${tokensUsed * 0.001}` // Rough cost calculation
      }, {
        onConflict: 'user_id,date'
      });

    if (error) {
      throw new Error(`Failed to update usage tracking: ${error.message}`);
    }

    console.log('✅ Usage tracking updated successfully');

  } catch (error) {
    console.error('❌ Error updating usage tracking:', error);
    throw error;
  }
}

// CRITICAL: Get next sequence number for conversation
async function getNextSequenceNumber(supabase, conversationId) {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('sequence_number')
      .eq('conversation_id', conversationId)
      .order('sequence_number', { ascending: false })
      .limit(1);

    if (error) {
      throw new Error(`Failed to get sequence number: ${error.message}`);
    }

    const lastSequence = data && data.length > 0 ? data[0].sequence_number : 0;
    return (lastSequence || 0) + 1;

  } catch (error) {
    console.error('❌ Error getting sequence number:', error);
    return 1; // Fallback to 1 if error
  }
}

function isClaudeModel(modelId) {
  return VALID_CLAUDE_MODELS.includes(modelId);
}

// STREAMING: OpenAI API with usage tracking
async function callOpenAIStreamingAPI(requestBody, controller) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log('🌊 Streaming OpenAI API with model:', requestBody.model);

  const openaiPayload = {
    model: requestBody.model,
    messages: requestBody.messages,
    max_tokens: requestBody.max_tokens || 4000,
    temperature: requestBody.temperature || 0.7,
    stream: true
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify(openaiPayload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ OpenAI API error:', response.status, errorData);
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader available');
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let totalContent = '';
  let usage = {
    prompt_tokens: 0,
    completion_tokens: 0,
    total_tokens: 0
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            
            if (content) {
              totalContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                content: content
              })}\n\n`));
            }

            // Capture usage from final message
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Estimate usage if not provided by OpenAI
    if (usage.total_tokens === 0) {
      const estimatedPromptTokens = Math.ceil(JSON.stringify(requestBody.messages).length / 4);
      const estimatedCompletionTokens = Math.ceil(totalContent.length / 4);
      usage = {
        prompt_tokens: estimatedPromptTokens,
        completion_tokens: estimatedCompletionTokens,
        total_tokens: estimatedPromptTokens + estimatedCompletionTokens
      };
    }

    return {
      content: totalContent,
      usage,
      model: requestBody.model
    };
  } finally {
    reader.releaseLock();
  }
}

// STREAMING: Anthropic API with usage tracking
async function callAnthropicStreamingAPI(requestBody, controller) {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured');
  }

  console.log('🌊 Streaming Anthropic API with model:', requestBody.model);

  const claudePayload = {
    model: requestBody.model,
    max_tokens: requestBody.max_tokens || 4000,
    messages: requestBody.messages,
    temperature: requestBody.temperature || 0.7,
    stream: true
  };

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify(claudePayload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ Anthropic API error:', response.status, errorData);
    throw new Error(`Anthropic API error: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body reader available');
  }

  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = '';
  let totalContent = '';
  let usage = {
    input_tokens: 0,
    output_tokens: 0
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              const content = parsed.delta.text;
              totalContent += content;
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'content',
                content: content
              })}\n\n`));
            }

            if (parsed.type === 'message_stop' && parsed.usage) {
              usage = parsed.usage;
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Convert Anthropic usage to OpenAI format
    const normalizedUsage = {
      prompt_tokens: usage.input_tokens || 0,
      completion_tokens: usage.output_tokens || 0,
      total_tokens: (usage.input_tokens || 0) + (usage.output_tokens || 0)
    };

    return {
      content: totalContent,
      usage: normalizedUsage,
      model: requestBody.model
    };
  } finally {
    reader.releaseLock();
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();
    console.log('📥 Received request:', {
      model: requestBody.model,
      messageCount: requestBody.messages?.length,
      conversationId: requestBody.conversation_id,
      hasStream: !!requestBody.stream
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // CRITICAL: Authentication
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'AUTHENTICATION_REQUIRED',
        type: 'AUTHENTICATION_FAILED',
        message: 'Authentication token required'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'INVALID_TOKEN',
        type: 'AUTHENTICATION_FAILED',
        message: 'Invalid authentication token'
      }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CRITICAL: Get user tier and usage with anniversary-based resets
    const userTierData = await getUserTierAndUsage(supabase, user.id);

    // CRITICAL: Pre-request validation
    // 1. Model allowance check
    if (!userTierData.tierLimits.allowed_models.includes(requestBody.model)) {
      return new Response(JSON.stringify({
        error: 'MODEL_NOT_ALLOWED',
        type: 'MODEL_NOT_ALLOWED',
        message: `${requestBody.model} is not available on your current plan. Please upgrade or select a different model.`,
        usage: {
          current: 0,
          limit: 0,
          resetTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        userTier: userTierData.tier,
        allowedModels: userTierData.tierLimits.allowed_models
      }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Daily message limit check (for free tier)
    if (userTierData.tierLimits.daily_messages !== -1 && 
        userTierData.messagesUsedToday >= userTierData.tierLimits.daily_messages) {
      
      const resetTime = new Date();
      resetTime.setDate(resetTime.getDate() + 1);
      resetTime.setHours(0, 0, 0, 0);

      return new Response(JSON.stringify({
        error: 'DAILY_MESSAGE_LIMIT_EXCEEDED',
        type: 'DAILY_MESSAGE_LIMIT_EXCEEDED',
        message: `Daily message limit reached. You've used ${userTierData.messagesUsedToday}/${userTierData.tierLimits.daily_messages} messages today. Upgrade to Basic for unlimited messages!`,
        usage: {
          current: userTierData.messagesUsedToday,
          limit: userTierData.tierLimits.daily_messages,
          percentage: Math.round((userTierData.messagesUsedToday / userTierData.tierLimits.daily_messages) * 100),
          resetTime: resetTime.toISOString()
        },
        userTier: userTierData.tier
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Monthly token limit check
    if (userTierData.tokensUsedThisMonth >= userTierData.tierLimits.monthly_tokens) {
      const resetTime = new Date();
      resetTime.setMonth(resetTime.getMonth() + 1);
      resetTime.setDate(new Date(userTierData.billingPeriodStart).getDate());

      return new Response(JSON.stringify({
        error: 'MONTHLY_TOKEN_LIMIT_EXCEEDED',
        type: 'MONTHLY_LIMIT_EXCEEDED',
        message: `Monthly token limit exceeded. You've used ${userTierData.tokensUsedThisMonth.toLocaleString()}/${userTierData.tierLimits.monthly_tokens.toLocaleString()} tokens this month. Upgrade for more tokens!`,
        usage: {
          current: userTierData.tokensUsedThisMonth,
          limit: userTierData.tierLimits.monthly_tokens,
          percentage: Math.round((userTierData.tokensUsedThisMonth / userTierData.tierLimits.monthly_tokens) * 100),
          resetTime: resetTime.toISOString()
        },
        userTier: userTierData.tier
      }), {
        status: 429,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate model
    const isAnthropic = isClaudeModel(requestBody.model);
    const validModels = isAnthropic ? VALID_CLAUDE_MODELS : VALID_OPENAI_MODELS;
    if (!validModels.includes(requestBody.model)) {
      return new Response(JSON.stringify({
        error: 'INVALID_MODEL',
        type: 'INVALID_MODEL',
        message: `Model ${requestBody.model} is not supported`
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Extract conversation data
    const conversationId = requestBody.conversation_id;
    const userMessage = requestBody.messages[requestBody.messages.length - 1];

    if (!conversationId || !userMessage || userMessage.role !== 'user') {
      return new Response(JSON.stringify({
        error: 'INVALID_REQUEST',
        type: 'INVALID_REQUEST',
        message: 'Conversation ID and user message required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // CRITICAL: Get next sequence numbers
    const baseSequence = await getNextSequenceNumber(supabase, conversationId);
    const userSequence = baseSequence;
    const aiSequence = baseSequence + 1;

    // CRITICAL: Save user message BEFORE AI call
    const savedUserMessage = await saveUserMessage(
      supabase, 
      conversationId, 
      user.id, 
      userMessage.content, 
      userSequence
    );

    console.log(`🔄 Routing to ${isAnthropic ? 'Anthropic' : 'OpenAI'} API:`, {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      userId: user.id,
      tier: userTierData.tier,
      conversationId
    });

    // STREAMING: Process AI response
    if (requestBody.stream) {
      console.log('🌊 Starting streaming response...');
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // Call AI API and get response
            const result = isAnthropic 
              ? await callAnthropicStreamingAPI(requestBody, controller)
              : await callOpenAIStreamingAPI(requestBody, controller);

            console.log('✅ AI response completed:', {
              contentLength: result.content.length,
              tokensUsed: result.usage.total_tokens
            });

            // CRITICAL: Save AI message with usage data
            const savedAIMessage = await saveAIMessage(
              supabase,
              conversationId,
              result.content,
              result.model,
              result.usage,
              aiSequence
            );

            // CRITICAL: Update user usage statistics
            await updateUserUsage(
              supabase,
              user.id,
              result.usage.total_tokens,
              1 // One message added (user message)
            );

            // CRITICAL: Update usage tracking
            await updateUsageTracking(
              supabase,
              user.id,
              result.usage.total_tokens,
              1,
              result.model
            );

            // NEW: Update conversation title if this is the first user message
            await updateConversationTitle(supabase, conversationId, userMessage.content);

            // NEW: Track model usage in conversation history
            await updateModelHistory(supabase, conversationId, result.model);

            // Send completion event with message IDs and usage
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'done',
              content: result.content,
              usage: result.usage,
              model: result.model,
              messageIds: {
                userMessage: savedUserMessage.id,
                aiMessage: savedAIMessage.id
              }
            })}\n\n`));

            console.log('✅ Streaming completed successfully with full conversation tracking');
            controller.close();

          } catch (error) {
            console.error('❌ Streaming error:', error);
            const encoder = new TextEncoder();
            
            // ENHANCED: Better error type classification
            let errorType = 'INTERNAL_ERROR';
            if (error.message.includes('API key')) {
              errorType = 'API_CONFIGURATION_ERROR';
            } else if (error.message.includes('Failed to save')) {
              errorType = 'DATABASE_OPERATION_FAILED';
            } else if (error.message.includes('OpenAI') || error.message.includes('Anthropic')) {
              errorType = 'AI_SERVICE_ERROR';
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: errorType,
              message: error.message
            })}\n\n`));
            controller.close();
          }
        }
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
    }

    // Non-streaming fallback
    return new Response(JSON.stringify({
      error: 'STREAMING_ONLY',
      type: 'STREAMING_ONLY',
      message: 'This endpoint only supports streaming requests'
    }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Edge function error:', error);
    
    // ENHANCED: Better error classification
    let errorType = 'INTERNAL_ERROR';
    let statusCode = 500;
    
    if (error.message.includes('Authentication') || error.message.includes('User not found')) {
      errorType = 'AUTHENTICATION_FAILED';
      statusCode = 401;
    } else if (error.message.includes('Failed to fetch user data') || error.message.includes('database')) {
      errorType = 'DATABASE_OPERATION_FAILED';
      statusCode = 503;
    }

    return new Response(JSON.stringify({
      error: errorType,
      type: errorType,
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});