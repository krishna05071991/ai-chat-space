// ENHANCED: Edge Function with example and prompt enhancement support
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// COMPLETE: All supported models with reasoning model detection
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

// NEW: Valid Gemini models
const VALID_GEMINI_MODELS = [
  'gemini-2.0-flash',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-pro'
];

// FIXED: Updated pricing tier definitions to match frontend exactly
const PRICING_TIERS = {
  free: {
    monthly_tokens: 35000,
    daily_messages: 25,
    allowed_models: [
      'gpt-4o-mini',
      'claude-3-5-haiku-20241022',
      'gemini-2.0-flash'
    ]
  },
  basic: {
    monthly_tokens: 1000000,
    daily_messages: -1,
    allowed_models: [
      'gpt-4o-mini', 'claude-3-5-haiku-20241022', 'gemini-2.0-flash',
      'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'claude-3-5-sonnet-20241022',
      'claude-3-7-sonnet-20250219', 'claude-sonnet-4-20250514',
      'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash'
    ]
  },
  pro: {
    monthly_tokens: 1500000,
    daily_messages: -1,
    allowed_models: [
      // OpenAI Models
      'gpt-4o-mini', 'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'gpt-4-turbo',
      'o3', 'o3-mini', 'o4-mini',
      // Claude Models  
      'claude-3-5-haiku-20241022', 'claude-3-5-sonnet-20241022', 'claude-3-7-sonnet-20250219',
      'claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-3-opus-20240229',
      // FIXED: All Gemini Models for Pro tier
      'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash', 'gemini-2.5-pro'
    ]
  }
};

// NEW: Function to detect OpenAI reasoning models
function isReasoningModel(modelId) {
  return modelId && (modelId.includes('o1') || modelId.includes('o3') || modelId.includes('o4'));
}

function isClaudeModel(modelId) {
  return modelId && VALID_CLAUDE_MODELS.includes(modelId);
}

// NEW: Function to detect Gemini models
function isGeminiModel(modelId) {
  return modelId && VALID_GEMINI_MODELS.includes(modelId);
}

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
      dailyLimit: result.tierLimits.daily_messages,
      allowedModels: result.tierLimits.allowed_models.length
    });

    return result;

  } catch (error) {
    console.error('💥 Error in getUserTierAndUsage:', error);
    throw error;
  }
}

// NEW: Ensure conversation exists before saving messages
async function ensureConversationExists(supabase, conversationId, userId) {
  try {
    console.log('🔍 Checking if conversation exists:', conversationId);

    // Check if conversation exists
    const { data: existingConversation, error: fetchError } = await supabase
      .from('conversations')
      .select('id, title')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code === 'PGRST116') {
      // Conversation doesn't exist, create it
      console.log('📝 Creating new conversation:', conversationId);
      
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          id: conversationId,
          user_id: userId,
          title: 'New Chat',
          model_history: [],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        throw new Error(`Failed to create conversation: ${createError.message}`);
      }

      console.log('✅ Conversation created successfully:', newConversation.id);
      return newConversation;

    } else if (fetchError) {
      throw new Error(`Failed to check conversation: ${fetchError.message}`);
    } else {
      console.log('✅ Conversation already exists:', existingConversation.id);
      return existingConversation;
    }

  } catch (error) {
    console.error('❌ Error ensuring conversation exists:', error);
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

// FIXED: Update user usage statistics with fetch-modify-update pattern
async function updateUserUsage(supabase, userId, tokensUsed, messagesAdded = 1) {
  try {
    console.log('📈 Updating user usage:', { userId, tokensUsed, messagesAdded });

    // First, fetch current user data
    const { data: currentUser, error: fetchError } = await supabase
      .from('users')
      .select('monthly_tokens_used, daily_messages_sent')
      .eq('id', userId)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch current user usage: ${fetchError.message}`);
    }

    // Calculate new values
    const newMonthlyTokens = (currentUser.monthly_tokens_used || 0) + tokensUsed;
    const newDailyMessages = (currentUser.daily_messages_sent || 0) + messagesAdded;

    // Update with calculated values
    const { error } = await supabase
      .from('users')
      .update({
        monthly_tokens_used: newMonthlyTokens,
        daily_messages_sent: newDailyMessages
      })
      .eq('id', userId);

    if (error) {
      throw new Error(`Failed to update user usage: ${error.message}`);
    }

    console.log('✅ User usage updated successfully:', {
      newMonthlyTokens,
      newDailyMessages
    });

  } catch (error) {
    console.error('❌ Error updating user usage:', error);
    throw error;
  }
}

// FIXED: Update daily usage tracking table with fetch-modify-update pattern
async function updateUsageTracking(supabase, userId, tokensUsed, messagesAdded, modelUsed) {
  try {
    console.log('📊 Updating usage tracking:', { userId, tokensUsed, messagesAdded, modelUsed });

    const today = new Date().toISOString().split('T')[0];

    // First, try to fetch existing record for today
    const { data: existingRecord, error: fetchError } = await supabase
      .from('usage_tracking')
      .select('*')
      .eq('user_id', userId)
      .eq('date', today)
      .single();

    let updateData;

    if (fetchError && fetchError.code === 'PGRST116') {
      // No existing record, create new one
      updateData = {
        user_id: userId,
        date: today,
        tokens_used: tokensUsed,
        messages_sent: messagesAdded,
        models_used: { [modelUsed]: 1 },
        cost_incurred: tokensUsed * 0.001 // Rough cost calculation
      };
    } else if (fetchError) {
      throw new Error(`Failed to fetch existing usage tracking: ${fetchError.message}`);
    } else {
      // Existing record found, calculate new values
      const currentModelsUsed = existingRecord.models_used || {};
      const newModelsUsed = {
        ...currentModelsUsed,
        [modelUsed]: (currentModelsUsed[modelUsed] || 0) + 1
      };

      updateData = {
        user_id: userId,
        date: today,
        tokens_used: (existingRecord.tokens_used || 0) + tokensUsed,
        messages_sent: (existingRecord.messages_sent || 0) + messagesAdded,
        models_used: newModelsUsed,
        cost_incurred: (existingRecord.cost_incurred || 0) + (tokensUsed * 0.001)
      };
    }

    // Upsert the record
    const { error } = await supabase
      .from('usage_tracking')
      .upsert(updateData, {
        onConflict: 'user_id,date'
      });

    if (error) {
      throw new Error(`Failed to update usage tracking: ${error.message}`);
    }

    console.log('✅ Usage tracking updated successfully:', updateData);

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

// ENHANCED: Generate example using GPT-4o for Prompt Helper with better prompts
async function generateExample(userRequest, taskType, exampleNumber = 1) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log('🎯 Generating example with GPT-4o for:', { userRequest, taskType, exampleNumber });

  // ENHANCED: Better example generation prompts based on task type
  const taskPrompts = {
    creative: `Generate a compelling creative writing example that demonstrates:
- Rich, vivid imagery and sensory details
- Engaging narrative voice and style
- Emotional depth and resonance
- Clear structure and pacing`,
    
    coding: `Generate a clean, professional code example that demonstrates:
- Best practices and clear structure
- Proper commenting and documentation
- Efficient, readable implementation
- Modern coding standards`,
    
    analysis: `Generate a structured analytical example that demonstrates:
- Logical reasoning and clear methodology
- Data-driven insights and evidence
- Systematic problem-solving approach
- Clear conclusions and recommendations`,
    
    general: `Generate a helpful, well-structured example that demonstrates:
- Clear communication and organization
- Comprehensive coverage of key points
- Practical, actionable information
- Professional presentation`
  };

  const prompt = `${taskPrompts[taskType] || taskPrompts.general}

User's specific request: "${userRequest}"

Create Example ${exampleNumber} that directly relates to their request. Make it:
- Concise but high-quality (under 300 words)
- Immediately relevant and useful
- Something they can learn from or build upon
- Professional but accessible

Focus on showing the style, approach, and quality they should expect.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o', // Use GPT-4o for fast, high-quality examples
      messages: [
        { role: 'user', content: prompt }
      ],
      max_tokens: 500,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ GPT-4o example generation error:', response.status, errorData);
    throw new Error(`Example generation failed: ${response.status}`);
  }

  const data = await response.json();
  const example = data.choices?.[0]?.message?.content;

  if (!example) {
    throw new Error('No example content generated');
  }

  console.log('✅ Example generated successfully:', {
    contentLength: example.length,
    model: 'gpt-4o',
    taskType,
    exampleNumber
  });

  return {
    example: example.trim(),
    model: 'gpt-4o',
    usage: data.usage
  };
}

// ENHANCED: Enhance prompt using GPT-4o with Role-Task Format framework
async function enhancePrompt(userRequest, taskType, userRole, currentPrompt) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log('🚀 Enhancing prompt with GPT-4o for:', { userRequest, taskType, userRole });

  // ENHANCED: Use Role-Task Format framework for prompt enhancement
  const enhancementPrompt = `You are a prompt engineering expert specializing in the Role-Task Format framework. 

Enhance this basic prompt using the Role-Task Format framework to get significantly better AI results.

CONTEXT:
- Task Type: ${taskType}
- User's Role Selection: ${userRole}
User's Request: "${userRequest}"
- Current Basic Prompt: "${currentPrompt}"

ENHANCEMENT FRAMEWORK:
Use the Role-Task Format which includes:
1. ROLE: Clear identity and expertise for the AI
2. TASK: Specific, actionable instructions
3. FORMAT: Expected output structure and style
4. CONTEXT: Relevant background and constraints
5. EXAMPLES: If helpful patterns (but don't add unless truly beneficial)

REQUIREMENTS:
- Make the role more specific and authoritative
- Break down the task into clear, actionable steps
- Specify the exact format and style of response needed
- Add relevant context that improves output quality
- Keep the user's original intent intact
- Make it 2-3x more effective than the basic version

RESPONSE:
Return only the enhanced prompt using proper Role-Task Format. No explanations or meta-commentary.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openaiApiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        { role: 'user', content: enhancementPrompt }
      ],
      max_tokens: 800,
      temperature: 0.2 // Lower temperature for consistent, structured enhancement
    })
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ GPT-4o prompt enhancement error:', response.status, errorData);
    throw new Error(`Prompt enhancement failed: ${response.status}`);
  }

  const data = await response.json();
  const enhancedPrompt = data.choices?.[0]?.message?.content;

  if (!enhancedPrompt) {
    throw new Error('No enhanced prompt generated');
  }

  console.log('✅ Prompt enhanced successfully:', {
    originalLength: currentPrompt?.length || 0,
    enhancedLength: enhancedPrompt.length,
    model: 'gpt-4o',
    framework: 'Role-Task Format'
  });

  return {
    enhancedPrompt: enhancedPrompt.trim(),
    model: 'gpt-4o',
    usage: data.usage
  };
}

// FIXED: OpenAI API with proper reasoning model support
async function callOpenAIStreamingAPI(requestBody, controller) {
  const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
  if (!openaiApiKey) {
    throw new Error('OPENAI_API_KEY not configured');
  }

  console.log('🌊 Streaming OpenAI API with model:', requestBody.model);

  // CRITICAL FIX: Detect reasoning models and use different parameters
  const isReasoning = isReasoningModel(requestBody.model);
  
  let openaiPayload;
  
  if (isReasoning) {
    // FIXED: Reasoning models require different parameters
    console.log('🧠 Using reasoning model parameters for:', requestBody.model);
    openaiPayload = {
      model: requestBody.model,
      messages: requestBody.messages,
      max_completion_tokens: requestBody.max_tokens || 25000, // Use max_completion_tokens for reasoning models
      reasoning_effort: "medium", // Required for reasoning models
      stream: true
      // REMOVED: temperature, top_p, presence_penalty, frequency_penalty, logprobs (not supported)
    };
  } else {
    // Standard models use normal parameters
    console.log('📝 Using standard model parameters for:', requestBody.model);
    openaiPayload = {
      model: requestBody.model,
      messages: requestBody.messages,
      max_tokens: requestBody.max_tokens || 4000,
      temperature: requestBody.temperature || 0.7,
      stream: true
    };
  }

  console.log('📤 OpenAI payload:', {
    model: openaiPayload.model,
    isReasoningModel: isReasoning,
    hasReasoningEffort: !!openaiPayload.reasoning_effort,
    hasMaxCompletionTokens: !!openaiPayload.max_completion_tokens,
    hasMaxTokens: !!openaiPayload.max_tokens
  });

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
    
    // ENHANCED: Better error messages for reasoning model issues
    if (response.status === 404 && isReasoning) {
      throw new Error(`OpenAI reasoning model ${requestBody.model} not available. This might be a model access or API configuration issue.`);
    } else if (response.status === 400 && isReasoning) {
      throw new Error(`OpenAI reasoning model ${requestBody.model} parameter error. Check model availability and API access.`);
    } else {
      throw new Error(`OpenAI API error: ${response.status} - ${errorData}`);
    }
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
    
    // ENHANCED: Better error messages for Claude 4 model issues
    if (response.status === 404) {
      throw new Error(`Claude model ${requestBody.model} not available. This might be a model access or API configuration issue.`);
    } else if (response.status === 400) {
      throw new Error(`Claude model ${requestBody.model} parameter error. Check model availability and API access.`);
    } else {
      throw new Error(`Anthropic API error: ${response.status} - ${errorData}`);
    }
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

// NEW: Gemini API with enhanced error handling and rate limit detection
async function callGeminiStreamingAPI(requestBody, controller) {
  const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiApiKey) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  console.log('🌊 Streaming Gemini API with model:', requestBody.model);

  // Convert messages to Gemini format
  const geminiMessages = requestBody.messages.map((msg) => ({
    role: msg.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: msg.content }]
  }));

  const geminiPayload = {
    contents: geminiMessages,
    generationConfig: {
      maxOutputTokens: requestBody.max_tokens || 4000,
      temperature: requestBody.temperature || 0.7
    }
  };

  // FIXED: Use alt=sse for proper Server-Sent Events format
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${requestBody.model}:streamGenerateContent?alt=sse&key=${geminiApiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(geminiPayload)
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('❌ Gemini API error:', response.status, errorData);
    
    // ENHANCED: Detect rate limits and provide user-friendly messages
    if (response.status === 429 || errorData.includes('quota') || errorData.includes('rate limit')) {
      throw new Error("We've hit Gemini API rate limits! Please try again in a few minutes, or use a different model like GPT-4o-mini or Claude 3.5 Haiku.");
    } else if (response.status === 403 && errorData.includes('quota exceeded')) {
      throw new Error("Gemini API quota exceeded. We've hit the daily limits for this model. Let's try using OpenAI or Claude models instead!");
    } else if (response.status === 400 && errorData.includes('quota')) {
      throw new Error("Gemini model quota exceeded. Let's try again later or use a different model like GPT-4o or Claude 3.5.");
    } else if (response.status === 404) {
      throw new Error(`Gemini model ${requestBody.model} not available. This might be a model access or API configuration issue.`);
    } else {
      throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
    }
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
            
            // Extract content from Gemini response format
            if (parsed.candidates && parsed.candidates[0] && parsed.candidates[0].content) {
              const parts = parsed.candidates[0].content.parts;
              if (parts && parts[0] && parts[0].text) {
                const content = parts[0].text;
                totalContent += content;
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                  type: 'content',
                  content: content
                })}\n\n`));
              }
            }

            // Capture usage if available
            if (parsed.usageMetadata) {
              usage = {
                prompt_tokens: parsed.usageMetadata.promptTokenCount || 0,
                completion_tokens: parsed.usageMetadata.candidatesTokenCount || 0,
                total_tokens: parsed.usageMetadata.totalTokenCount || 0
              };
            }
          } catch (e) {
            // Skip malformed JSON
          }
        }
      }
    }

    // Estimate usage if not provided by Gemini
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
      hasStream: !!requestBody.stream,
      isReasoningModel: requestBody.model ? isReasoningModel(requestBody.model) : false,
      isGeminiModel: requestBody.model ? isGeminiModel(requestBody.model) : false,
      purpose: requestBody.purpose // NEW: Check for example generation or prompt enhancement
    });

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract common variables for special purposes
    const { purpose, userRequest, taskType, userRole, currentPrompt, exampleNumber, constraints } = requestBody;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    // NEW: Handle example generation requests
    if (purpose === 'generate_example') {
      console.log('🎯 Generating example for prompt helper')
      
      try {
        const { userRequest, taskType, exampleNumber, constraints } = requestBody
        
        if (!userRequest || !taskType || !exampleNumber) {
          throw new Error('Missing required fields for example generation')
        }
        
        // Track token usage for example generation
        let totalTokensUsed = 0
        
        // UPDATED: System prompt with 1000 character limit constraint
        const examplePrompt = `You are an expert prompt engineer helping users create examples for AI prompts.

Task: Generate a high-quality example for a ${taskType} task.

User's request: "${userRequest}"
Example number: ${exampleNumber}

CRITICAL CONSTRAINT: Your response must be under 1000 characters while still being a complete, useful example.

Be concise but comprehensive. Focus on quality over length.

Generate a specific, detailed example that demonstrates:
- The exact style and tone the user wants
- The format and structure they prefer
- The level of detail they're looking for
- The approach they should take

Requirements:
- Be specific and actionable
- Match the ${taskType} task type perfectly
- Keep it under 1000 characters
- Make it a perfect example of what they want

Generate only the example content, nothing else.`
        
        // Use GPT-4o-mini for example generation (fast and cost-effective)
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'user', content: examplePrompt }
            ],
            max_tokens: 500,
            temperature: 0.8
          })
        })
        
        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.text()
          console.error('❌ OpenAI example generation error:', errorData)
          throw new Error('Failed to generate example')
        }
        
        const openaiData = await openaiResponse.json()
        const example = openaiData.choices?.[0]?.message?.content?.trim()
        const exampleUsage = openaiData.usage
        
        if (!example) {
          throw new Error('No example content generated')
        }
        
        // ADDED: Token usage tracking for example generation
        const usage = exampleData.usage || {}
        
        console.log('📊 Example generation usage:', {
          exampleNumber,
          usage,
          contentLength: example.length
        })
        
        // Track token usage in user's account
        if (usage.total_tokens > 0) {
          await updateUserUsage(supabase, userId, {
            tokens_used: usage.total_tokens,
            messages_sent: 0, // Examples don't count as messages
            operation: 'example_generation'
          })
        }
        
        console.log('✅ Example generated successfully:', {
          exampleNumber,
          length: example.length,
          tokensUsed: totalTokensUsed
        })
        
        return new Response(JSON.stringify({
          example,
          model: 'gpt-4o-mini',
          usage: usage
        }), {
          headers: corsHeaders,
          status: 200
        })
        
      } catch (error) {
        console.error('❌ Example generation failed:', error)
        return new Response(JSON.stringify({
          error: 'EXAMPLE_GENERATION_FAILED',
          message: error.message || 'Failed to generate example'
        }), {
          headers: corsHeaders,
          status: 500
        })
      }
    }
    
    // NEW: Handle prompt enhancement requests  
    if (purpose === 'enhance_prompt') {
      console.log('🚀 Enhancing prompt with advanced prompt engineering')
      
      try {
        const { userRequest, taskType, userRole, currentPrompt } = requestBody
        
        if (!userRequest || !taskType || !userRole) {
          throw new Error('Missing required fields for prompt enhancement')
        }
        
        // Track token usage for prompt enhancement
        let totalTokensUsed = 0
        
        // Advanced prompt enhancement system prompt
        const enhancementPrompt = [
          {
            role: 'system',
            content: `You are an expert prompt engineer. Your task is to enhance the user's basic prompt into a sophisticated, high-performance prompt that will get much better results from AI models.

Enhancement Techniques:
- Add context and background information
- Include step-by-step instructions
- Specify desired output format
- Add constraints and quality criteria
- Include examples or templates when helpful
- Use advanced prompting techniques (chain-of-thought, few-shot, etc.)
- Optimize for the specific task type: ${taskType}

The enhanced prompt should be comprehensive yet focused, and significantly improve upon the basic version.`
          },
          {
            role: 'user', 
            content: `Task Type: ${taskType}
User Role: ${userRole}
Original Request: "${userRequest}"

Current Basic Prompt:
${currentPrompt}

Please create an enhanced version that will produce much better AI results. Make it comprehensive and optimized for ${taskType} tasks.`
          }
        ]
        
        // Use GPT-4o for prompt enhancement (higher quality reasoning)
        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: enhancementPrompt,
            max_tokens: 1000,
            temperature: 0.3
          })
        })
        
        if (!openaiResponse.ok) {
          const errorData = await openaiResponse.text()
          console.error('❌ OpenAI enhancement error:', errorData)
          
          // Fallback to basic prompt if enhancement fails
          return new Response(JSON.stringify({
            error: 'PROMPT_ENHANCEMENT_FAILED',
            message: 'Enhancement service unavailable',
            fallback: currentPrompt
          }), {
            headers: corsHeaders,
            status: 200
          })
        }
        
        const openaiData = await openaiResponse.json()
        const enhancedPrompt = openaiData.choices?.[0]?.message?.content?.trim()
        const enhancementUsage = openaiData.usage
        
        if (!enhancedPrompt) {
          throw new Error('No enhanced prompt generated')
        }
        
        // Track tokens used for prompt enhancement
        if (enhancementUsage) {
          totalTokensUsed = enhancementUsage.total_tokens
          
          // Update user's monthly token usage for prompt enhancement
          const { error: updateError } = await supabase
            .from('users')
            .update({ 
              monthly_tokens_used: userTierData.tokensUsedThisMonth + totalTokensUsed,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          if (updateError) {
            console.error('❌ Failed to update usage for prompt enhancement:', updateError)
          } else {
            console.log('✅ Updated usage stats for prompt enhancement:', {
              tokensUsed: totalTokensUsed,
              newTotal: userTierData.tokensUsedThisMonth + totalTokensUsed
            })
          }
        }
        
        console.log('✅ Prompt enhanced successfully:', {
          originalLength: currentPrompt.length,
          enhancedLength: enhancedPrompt.length,
          tokensUsed: totalTokensUsed
        })
        
        return new Response(JSON.stringify({
          enhancedPrompt,
          model: 'gpt-4o',
          usage: enhancementUsage
        }), {
          headers: corsHeaders,
          status: 200
        })
        
      } catch (error) {
        console.error('❌ Prompt enhancement failed:', error)
        return new Response(JSON.stringify({
          error: 'PROMPT_ENHANCEMENT_FAILED',
          message: error.message || 'Failed to enhance prompt',
          fallback: currentPrompt
        }), {
          headers: corsHeaders,
          status: 500
        })
      }
    }

    // ENHANCED: Intelligent prompt enhancement for Smart Prompt Mode
    if (purpose === 'enhance_prompt') {
      console.log('🎯 Enhancing prompt with advanced prompt engineering')
      
      const enhancementSystemPrompt = `You are an expert prompt engineer who specializes in creating highly effective prompts for AI systems. Your expertise includes understanding user intent, structuring clear instructions, and applying prompt engineering best practices.

Your task is to transform a user's basic request into a comprehensive, well-structured prompt that will yield superior AI responses.

ENHANCEMENT PRINCIPLES:
1. **Intent Analysis**: Understand what the user really wants to achieve
2. **Outcome Definition**: Clearly specify the expected deliverable 
3. **Context Setting**: Provide relevant background and constraints
4. **Structure**: Organize the prompt logically with clear sections
5. **Specificity**: Be precise about format, tone, and requirements
6. **Task-Specific Optimization**: Tailor approach based on domain (creative, technical, analytical)

ENHANCEMENT PROCESS:
1. Analyze the user's request to understand their true intent
2. Identify the specific outcome they need
3. Determine the best role/persona for the AI to adopt
4. Structure the prompt with clear sections (context, task, requirements, output format)
5. Add relevant constraints and quality criteria
6. Include examples or templates when helpful

TASK TYPE SPECIALIZATIONS:
- **Creative**: Focus on inspiration, style, audience, mood, creative constraints
- **Coding**: Specify language, best practices, error handling, documentation, testing
- **Analysis**: Define methodology, data sources, depth of analysis, presentation format
- **General**: Ensure clarity, completeness, actionability, and user-focused outcomes

Transform the user's basic request into a prompt that will produce significantly better AI responses. Make it comprehensive but not overwhelming. Focus on clarity and actionability.`

      const enhancementMessages = [
        {
          role: 'system',
          content: enhancementSystemPrompt
        },
        {
          role: 'user', 
          content: `Please enhance this prompt for better AI results:

TASK TYPE: ${taskType}
USER ROLE PREFERENCE: ${userRole}
ORIGINAL REQUEST: "${userRequest}"
CURRENT BASIC PROMPT: "${currentPrompt}"

Create an enhanced version that follows prompt engineering best practices and will produce significantly better results. Structure it clearly and make it comprehensive yet focused.`
        }
      ]

      try {
        const enhancementResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini', // Use efficient model for enhancement
            messages: enhancementMessages,
            max_tokens: 1500,
            temperature: 0.3, // Lower temperature for more consistent enhancement
          }),
        })

        if (!enhancementResponse.ok) {
          throw new Error(`Enhancement failed: ${enhancementResponse.status}`)
        }

        const enhancementData = await enhancementResponse.json()
        const enhancedPrompt = enhancementData.choices?.[0]?.message?.content

        if (!enhancedPrompt) {
          throw new Error('No enhanced prompt received')
        }

        console.log('✅ Prompt enhanced successfully')
        
        return new Response(JSON.stringify({
          enhancedPrompt: enhancedPrompt.trim(),
          model: 'gpt-4o-mini',
          usage: enhancementData.usage
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })

      } catch (error) {
        console.error('❌ Prompt enhancement failed:', error)
        
        return new Response(JSON.stringify({
          error: 'PROMPT_ENHANCEMENT_FAILED',
          message: `Failed to enhance prompt: ${error.message}`,
          fallback: currentPrompt
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
    }

    // ENHANCED: Example generation for Smart Prompt Mode
    if (purpose === 'generate_example') {
      console.log('🎯 Handling example generation request');
      
      try {
        const result = await generateExample(
          requestBody.userRequest, 
          requestBody.taskType,
          requestBody.exampleNumber || 1
        );
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Example generation failed:', error);
        return new Response(JSON.stringify({
          error: 'EXAMPLE_GENERATION_FAILED',
          message: error.message || 'Failed to generate example'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // NEW: Handle prompt enhancement for Prompt Helper
    if (requestBody.purpose === 'enhance_prompt') {
      console.log('🚀 Handling prompt enhancement request');
      
      try {
        const result = await enhancePrompt(
          requestBody.userRequest, 
          requestBody.taskType, 
          requestBody.userRole,
          requestBody.currentPrompt
        );
        
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      } catch (error) {
        console.error('❌ Prompt enhancement failed:', error);
        return new Response(JSON.stringify({
          error: 'PROMPT_ENHANCEMENT_FAILED',
          message: error.message || 'Failed to enhance prompt'
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

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

    // FIXED: Enhanced model validation with Gemini support
    console.log('🔍 Validating model:', {
      requestedModel: requestBody.model,
      userTier: userTierData.tier,
      allowedModels: userTierData.tierLimits.allowed_models.slice(0, 5) + '...' // Show first 5
    });

    // CRITICAL: Pre-request validation
    // 1. Model allowance check
    if (!userTierData.tierLimits.allowed_models.includes(requestBody.model)) {
      console.log('❌ Model not allowed for user tier:', {
        model: requestBody.model,
        tier: userTierData.tier,
        allowedCount: userTierData.tierLimits.allowed_models.length
      });

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

    // ENHANCED: Validate model with multi-provider support
    const isAnthropic = isClaudeModel(requestBody.model);
    const isGemini = isGeminiModel(requestBody.model);
    const isOpenAI = !isAnthropic && !isGemini;

    let validModels;
    if (isAnthropic) {
      validModels = VALID_CLAUDE_MODELS;
    } else if (isGemini) {
      validModels = VALID_GEMINI_MODELS;
    } else {
      validModels = VALID_OPENAI_MODELS;
    }

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

    // CRITICAL FIX: Ensure conversation exists before saving messages
    await ensureConversationExists(supabase, conversationId, user.id);

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

    console.log(`🔄 Routing to ${isGemini ? 'Gemini' : isAnthropic ? 'Anthropic' : 'OpenAI'} API:`, {
      model: requestBody.model,
      messageCount: requestBody.messages.length,
      userId: user.id,
      tier: userTierData.tier,
      conversationId,
      isReasoningModel: isOpenAI && isReasoningModel(requestBody.model),
      isGeminiModel: isGemini
    });

    // STREAMING: Process AI response
    if (requestBody.stream) {
      console.log('🌊 Starting streaming response...');
      
      const stream = new ReadableStream({
        async start(controller) {
          try {
            // ENHANCED: Route to appropriate AI provider
            let result;
            if (isGemini) {
              result = await callGeminiStreamingAPI(requestBody, controller);
            } else if (isAnthropic) {
              result = await callAnthropicStreamingAPI(requestBody, controller);
            } else {
              result = await callOpenAIStreamingAPI(requestBody, controller);
            }

            console.log('✅ AI response completed:', {
              provider: isGemini ? 'Gemini' : isAnthropic ? 'Anthropic' : 'OpenAI',
              contentLength: result.content.length,
              tokensUsed: result.usage.total_tokens,
              model: result.model
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
            
            // ENHANCED: Better error type classification with Gemini rate limit handling
            let errorType = 'INTERNAL_ERROR';
            let userMessage = error.message;

            if (error.message.includes('API key') || error.message.includes('not configured')) {
              errorType = 'API_CONFIGURATION_ERROR';
            } else if (error.message.includes('Failed to save') || error.message.includes('Failed to create conversation')) {
              errorType = 'DATABASE_OPERATION_FAILED';
            } else if (error.message.includes('rate limit') || error.message.includes('quota') || error.message.includes('Gemini API')) {
              errorType = 'RATE_LIMIT_EXCEEDED';
              // Keep the user-friendly message from the Gemini API function
            } else if (error.message.includes('OpenAI') || error.message.includes('Anthropic') || error.message.includes('reasoning model') || error.message.includes('Claude model')) {
              errorType = 'AI_SERVICE_ERROR';
            }

            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'error',
              error: errorType,
              message: userMessage
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