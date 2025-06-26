// COMPLETE: Edge Function with subscription tier checking and usage tracking
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
  'gpt-4-turbo',
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
// COMPLETE: Pricing tier definitions matching your app
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
      'claude-3-5-sonnet-20241022'
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
      'gpt-4-turbo',
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
// CRITICAL: Get user's actual tier from database (FIXED VERSION)
async function getUserTierAndUsage(supabase, userId) {
  console.log('🔍 Getting tier and usage for user:', userId);
  // STEP 1: Get user's actual subscription tier from database
  const { data: userData, error: userError } = await supabase.from('users').select(`
      *,
      subscription_tiers (
        tier_name,
        monthly_token_limit,
        daily_message_limit,
        allowed_models
      )
    `).eq('id', userId).single();
  if (userError) {
    console.error('❌ Error fetching user tier:', userError);
  }
  // STEP 2: Determine the actual tier (not hardcoded!)
  let tier = 'free' // Default fallback
  ;
  if (userData?.subscription_tiers?.tier_name) {
    tier = userData.subscription_tiers.tier_name;
    console.log('✅ Found user tier from database:', tier);
  } else {
    console.log('⚠️ No tier found, defaulting to free');
  }
  // STEP 3: Validate tier exists in PRICING_TIERS
  if (!PRICING_TIERS[tier]) {
    console.error('❌ Invalid tier found:', tier, 'falling back to free');
    tier = 'free';
  }
  // STEP 4: Get user's conversations for RLS compliance
  const { data: conversations } = await supabase.from('conversations').select('id').eq('user_id', userId);
  const conversationIds = conversations?.map((c)=>c.id) || [];
  // STEP 5: If no conversations exist, return tier info without usage data
  if (conversationIds.length === 0) {
    console.log('📝 No conversations found, returning tier without usage');
    return {
      tier,
      tierLimits: PRICING_TIERS[tier],
      messagesUsedToday: 0,
      tokensUsedThisMonth: 0
    };
  }
  // STEP 6: Calculate usage for existing conversations
  const today = new Date().toISOString().split('T')[0];
  const { count: messageCount } = await supabase.from('messages').select('id', {
    count: 'exact'
  }).gte('created_at', today + 'T00:00:00Z').lt('created_at', today + 'T23:59:59Z').eq('role', 'user').in('conversation_id', conversationIds);
  // Get this month's token usage
  const thisMonth = new Date().toISOString().substring(0, 7) // YYYY-MM
  ;
  const { data: tokenUsage } = await supabase.from('messages').select('total_tokens, input_tokens, output_tokens').gte('created_at', thisMonth + '-01T00:00:00Z').lt('created_at', thisMonth + '-31T23:59:59Z').in('conversation_id', conversationIds);
  const totalTokensUsed = tokenUsage?.reduce((sum, msg)=>{
    return sum + (msg.total_tokens || msg.input_tokens + msg.output_tokens || 0);
  }, 0) || 0;
  console.log('📊 Calculated usage:', {
    tier,
    messagesUsedToday: messageCount || 0,
    tokensUsedThisMonth: totalTokensUsed
  });
  return {
    tier,
    tierLimits: PRICING_TIERS[tier],
    messagesUsedToday: messageCount || 0,
    tokensUsedThisMonth: totalTokensUsed
  };
}
function isClaudeModel(modelId) {
  return VALID_CLAUDE_MODELS.includes(modelId);
}
// STREAMING: OpenAI API with real-time streaming
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
    while(true){
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, {
        stream: true
      });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines){
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
            if (parsed.usage) {
              usage = parsed.usage;
            }
          } catch (e) {
          // Skip malformed JSON
          }
        }
      }
    }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'done',
      usage: usage,
      model: requestBody.model,
      content: totalContent
    })}\n\n`));
    return {
      content: totalContent,
      usage,
      model: requestBody.model
    };
  } finally{
    reader.releaseLock();
  }
}
// STREAMING: Anthropic API with real-time streaming  
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
    output_tokens: 0,
    total_tokens: 0
  };
  try {
    while(true){
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, {
        stream: true
      });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';
      for (const line of lines){
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
              usage = {
                input_tokens: parsed.usage.input_tokens || 0,
                output_tokens: parsed.usage.output_tokens || 0,
                total_tokens: (parsed.usage.input_tokens || 0) + (parsed.usage.output_tokens || 0)
              };
            }
          } catch (e) {
          // Skip malformed JSON
          }
        }
      }
    }
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
      type: 'done',
      usage: {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens
      },
      model: requestBody.model,
      content: totalContent
    })}\n\n`));
    return {
      content: totalContent,
      usage: {
        prompt_tokens: usage.input_tokens,
        completion_tokens: usage.output_tokens,
        total_tokens: usage.total_tokens
      },
      model: requestBody.model
    };
  } finally{
    reader.releaseLock();
  }
}
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  try {
    const requestBody = await req.json();
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    // Get user from JWT token
    const authToken = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!authToken) {
      return new Response(JSON.stringify({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication token required'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    const { data: { user } } = await supabase.auth.getUser(authToken);
    if (!user) {
      return new Response(JSON.stringify({
        error: 'INVALID_TOKEN',
        message: 'Invalid authentication token'
      }), {
        status: 401,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // CRITICAL: Get user's subscription tier and usage
    const userTierData = await getUserTierAndUsage(supabase, user.id);
    console.log('👤 User tier data:', {
      tier: userTierData.tier,
      allowedModels: userTierData.tierLimits.allowed_models,
      requestedModel: requestBody.model
    });
    // CRITICAL: Validate model is allowed for user's tier
    if (!userTierData.tierLimits.allowed_models.includes(requestBody.model)) {
      return new Response(JSON.stringify({
        error: 'MODEL_NOT_ALLOWED',
        message: `${requestBody.model} is not available on your current plan. Please upgrade or select a different model.`,
        currentTier: userTierData.tier,
        allowedModels: userTierData.tierLimits.allowed_models
      }), {
        status: 403,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // CRITICAL: Check usage limits
    if (userTierData.tierLimits.daily_messages !== -1 && userTierData.messagesUsedToday >= userTierData.tierLimits.daily_messages) {
      return new Response(JSON.stringify({
        error: 'DAILY_MESSAGE_LIMIT_EXCEEDED',
        message: `Daily message limit reached. Please upgrade to Basic for unlimited messages.`,
        currentUsage: userTierData.messagesUsedToday,
        limit: userTierData.tierLimits.daily_messages
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    if (userTierData.tokensUsedThisMonth >= userTierData.tierLimits.monthly_tokens) {
      return new Response(JSON.stringify({
        error: 'MONTHLY_TOKEN_LIMIT_EXCEEDED',
        message: `Monthly token limit exceeded. Please upgrade your plan or try again next month.`,
        currentUsage: userTierData.tokensUsedThisMonth,
        limit: userTierData.tierLimits.monthly_tokens
      }), {
        status: 429,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    // Validate model
    const isAnthropic = isClaudeModel(requestBody.model);
    const validModels = isAnthropic ? VALID_CLAUDE_MODELS : VALID_OPENAI_MODELS;
    if (!validModels.includes(requestBody.model)) {
      return new Response(JSON.stringify({
        error: 'INVALID_MODEL',
        message: `Model ${requestBody.model} is not supported`
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
    console.log(`🔄 Routing to ${isAnthropic ? 'Anthropic' : 'OpenAI'} API:`, {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      userId: user.id,
      tier: userTierData.tier
    });
    // STREAMING: Always use streaming when requested
    if (requestBody.stream) {
      console.log('🌊 Starting streaming response...');
      const stream = new ReadableStream({
        async start (controller) {
          try {
            const result = isAnthropic ? await callAnthropicStreamingAPI(requestBody, controller) : await callOpenAIStreamingAPI(requestBody, controller);
            console.log('✅ Streaming completed successfully');
            controller.close();
          } catch (error) {
            console.error('❌ Streaming error:', error);
            const encoder = new TextEncoder();
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: error.message
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
      message: 'This endpoint only supports streaming requests'
    }), {
      status: 400,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('💥 Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
