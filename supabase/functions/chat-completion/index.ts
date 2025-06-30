import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('🚀 Edge Function invoked:', {
    method: req.method,
    url: req.url,
    timestamp: new Date().toISOString()
  })

  try {
    // Get environment variables
    console.log('📡 Loading environment variables...')
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')

    console.log('🔧 Environment check:', {
      hasSupabaseUrl: !!supabaseUrl,
      hasServiceKey: !!supabaseServiceKey,
      hasOpenAI: !!openaiApiKey,
      hasAnthropic: !!anthropicApiKey
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase configuration')
    }

    // Create Supabase client
    console.log('💾 Creating Supabase client...')
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse request body
    console.log('📥 Parsing request body...')
    let requestBody
    try {
      requestBody = await req.json()
      console.log('✅ Request body parsed:', {
        purpose: requestBody.purpose,
        model: requestBody.model,
        messageCount: requestBody.messages?.length,
        hasConversationId: !!requestBody.conversation_id,
        isStream: requestBody.stream
      })
    } catch (error) {
      console.error('❌ Request body parse error:', error)
      return new Response(
        JSON.stringify({ error: 'INVALID_REQUEST_BODY', message: 'Invalid JSON in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract authorization header
    console.log('🔐 Checking authorization...')
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or invalid auth header')
      return new Response(
        JSON.stringify({ error: 'AUTHENTICATION_FAILED', message: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    console.log('🎫 Token extracted, length:', token.length)

    // Verify the user's JWT token
    console.log('👤 Verifying user token...')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      console.error('❌ Auth verification failed:', authError?.message)
      return new Response(
        JSON.stringify({ error: 'AUTHENTICATION_FAILED', message: 'Invalid authentication token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = user.id
    console.log('✅ User authenticated:', userId.substring(0, 8))

    // Get user tier and usage data
    console.log('📊 Loading user tier and usage data...')
    const getUserTierAndUsage = async () => {
      try {
        console.log('🔍 Querying user data from database...')
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
          .maybeSingle()

        if (userError) {
          console.error('❌ Error loading user data:', userError)
          return null
        }

        console.log('👤 User data loaded:', {
          hasUserData: !!userData,
          tierName: userData?.subscription_tiers?.tier_name || 'free',
          tokensUsed: userData?.monthly_tokens_used || 0,
          messagesUsed: userData?.daily_messages_sent || 0
        })

        // Determine tier
        let tierName = 'free'
        let tierLimits = {
          monthly_tokens: 35000,
          daily_messages: 25,
          allowed_models: ['gpt-4o-mini', 'claude-3-5-haiku-20241022']
        }

        if (userData?.subscription_tiers?.tier_name) {
          tierName = userData.subscription_tiers.tier_name
          
          if (tierName === 'basic') {
            tierLimits = {
              monthly_tokens: 1000000,
              daily_messages: -1,
              allowed_models: [
                'gpt-4o-mini', 'claude-3-5-haiku-20241022',
                'gpt-4o', 'gpt-4.1', 'gpt-4.1-mini', 'claude-3-5-sonnet-20241022'
              ]
            }
          } else if (tierName === 'pro') {
            tierLimits = {
              monthly_tokens: 1500000,
              daily_messages: -1,
              allowed_models: ['*'] // All models
            }
          }
        }

        const result = {
          tier: tierName,
          tierLimits,
          tokensUsedThisMonth: userData?.monthly_tokens_used || 0,
          messagesUsedToday: userData?.daily_messages_sent || 0,
          billingPeriodStart: userData?.billing_period_start || userData?.created_at
        }

        console.log('📈 Tier data computed:', {
          tier: result.tier,
          monthlyLimit: result.tierLimits.monthly_tokens,
          tokensUsed: result.tokensUsedThisMonth,
          messagesUsed: result.messagesUsedToday
        })

        return result
      } catch (error) {
        console.error('💥 Error in getUserTierAndUsage:', error)
        return null
      }
    }

    const userTierData = await getUserTierAndUsage()
    if (!userTierData) {
      console.error('❌ Failed to load user tier data')
      return new Response(
        JSON.stringify({ error: 'USER_DATA_ERROR', message: 'Failed to load user data' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ User tier data loaded successfully')

    // HANDLE SPECIAL PURPOSES
    if (requestBody.purpose === 'generate_example') {
      console.log('🎯 Handling example generation...')
      
      if (!requestBody.userRequest || !requestBody.taskType || !requestBody.exampleNumber) {
        console.error('❌ Missing required fields for example generation')
        return new Response(
          JSON.stringify({ error: 'MISSING_REQUIRED_FIELDS', message: 'Missing userRequest, taskType, or exampleNumber' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!openaiApiKey) {
        console.error('❌ OpenAI API key not configured for example generation')
        return new Response(
          JSON.stringify({ error: 'OPENAI_API_NOT_CONFIGURED', message: 'OpenAI API not available' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        console.log('🤖 Calling OpenAI for example generation...')
        const systemPrompt = `You are an expert prompt engineer. Generate a specific, realistic example for the user's request. 

Task Type: ${requestBody.taskType}
User Request: ${requestBody.userRequest}
Example Number: ${requestBody.exampleNumber}

Generate a practical example that shows the style and approach they want. Keep it under 1000 characters. Be specific and realistic.

Example Format:
- For creative tasks: Show writing style, tone, structure
- For coding: Show code style, commenting, approach  
- For analysis: Show reasoning style, depth, structure
- For general: Show communication style, detail level

Generate only the example content, no explanations.`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'system', content: systemPrompt }],
            max_tokens: 300,
            temperature: 0.7
          })
        })

        if (!openaiResponse.ok) {
          console.error('❌ OpenAI API error:', openaiResponse.status)
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const openaiData = await openaiResponse.json()
        const example = openaiData.choices?.[0]?.message?.content

        if (!example) {
          console.error('❌ No example generated from OpenAI')
          throw new Error('No example generated')
        }

        console.log('✅ Example generated successfully, length:', example.length)

        // Update user's token usage
        const tokensUsed = openaiData.usage?.total_tokens || 250
        console.log('💾 Updating token usage:', tokensUsed)
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            monthly_tokens_used: userTierData.tokensUsedThisMonth + tokensUsed,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('⚠️ Failed to update token usage:', updateError)
        } else {
          console.log('✅ Token usage updated successfully')
        }

        return new Response(
          JSON.stringify({
            example: example.trim(),
            model: 'gpt-4o-mini',
            usage: openaiData.usage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error('💥 Example generation error:', error)
        return new Response(
          JSON.stringify({ 
            error: 'EXAMPLE_GENERATION_FAILED', 
            message: error.message 
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Handle prompt enhancement
    if (requestBody.purpose === 'enhance_prompt') {
      console.log('✨ Handling prompt enhancement...')
      
      if (!requestBody.userRequest || !requestBody.taskType || !requestBody.userRole) {
        console.error('❌ Missing required fields for prompt enhancement')
        return new Response(
          JSON.stringify({ error: 'MISSING_REQUIRED_FIELDS', message: 'Missing userRequest, taskType, or userRole' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      if (!openaiApiKey) {
        console.error('❌ OpenAI API key not configured for prompt enhancement')
        return new Response(
          JSON.stringify({ 
            error: 'PROMPT_ENHANCEMENT_FAILED', 
            message: 'OpenAI API not available',
            fallback: requestBody.currentPrompt || requestBody.userRequest
          }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      try {
        console.log('🧠 Calling OpenAI for prompt enhancement...')
        const enhancementPrompt = `You are an expert prompt engineer. Enhance this user request into a professional, detailed prompt that will get better AI results.

Original Request: "${requestBody.userRequest}"
Task Type: ${requestBody.taskType}
Desired Role: ${requestBody.userRole}

Create an enhanced prompt that:
1. Sets clear role and expertise level
2. Provides specific context and requirements
3. Asks for structured, detailed output
4. Uses best prompting practices

Keep the enhanced prompt under 2000 characters but make it significantly more detailed and specific than the original.

Generate only the enhanced prompt, no explanations.`

        const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'gpt-4o',
            messages: [{ role: 'system', content: enhancementPrompt }],
            max_tokens: 600,
            temperature: 0.3
          })
        })

        if (!openaiResponse.ok) {
          console.error('❌ OpenAI API error for enhancement:', openaiResponse.status)
          throw new Error(`OpenAI API error: ${openaiResponse.status}`)
        }

        const openaiData = await openaiResponse.json()
        const enhancedPrompt = openaiData.choices?.[0]?.message?.content

        if (!enhancedPrompt) {
          console.error('❌ No enhanced prompt generated')
          throw new Error('No enhanced prompt generated')
        }

        console.log('✅ Prompt enhanced successfully, length:', enhancedPrompt.length)

        // Update user's token usage
        const tokensUsed = openaiData.usage?.total_tokens || 400
        console.log('💾 Updating token usage for enhancement:', tokensUsed)
        
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            monthly_tokens_used: userTierData.tokensUsedThisMonth + tokensUsed,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId)

        if (updateError) {
          console.error('⚠️ Failed to update token usage for enhancement:', updateError)
        } else {
          console.log('✅ Enhancement token usage updated successfully')
        }

        return new Response(
          JSON.stringify({
            enhancedPrompt: enhancedPrompt.trim(),
            model: 'gpt-4o',
            usage: openaiData.usage
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

      } catch (error) {
        console.error('💥 Prompt enhancement error:', error)
        return new Response(
          JSON.stringify({ 
            error: 'PROMPT_ENHANCEMENT_FAILED', 
            message: error.message,
            fallback: requestBody.currentPrompt || requestBody.userRequest
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // MAIN CHAT COMPLETION LOGIC
    console.log('💬 Processing main chat completion...')
    const { model, messages, conversation_id, stream = true } = requestBody

    if (!model || !messages || !Array.isArray(messages)) {
      console.error('❌ Missing required fields for chat completion:', {
        hasModel: !!model,
        hasMessages: !!messages,
        isMessagesArray: Array.isArray(messages)
      })
      return new Response(
        JSON.stringify({ error: 'MISSING_REQUIRED_FIELDS', message: 'Missing model or messages' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('📝 Chat completion request details:', {
      model,
      messageCount: messages.length,
      conversationId: conversation_id,
      isStreaming: stream,
      totalPromptLength: messages.reduce((sum, msg) => sum + msg.content.length, 0)
    })

    // Check if model is allowed for user's tier
    console.log('🔒 Checking model access permissions...')
    const isModelAllowed = userTierData.tierLimits.allowed_models.includes('*') || 
                          userTierData.tierLimits.allowed_models.includes(model)

    if (!isModelAllowed) {
      console.error('❌ Model not allowed for user tier:', {
        model,
        userTier: userTierData.tier,
        allowedModels: userTierData.tierLimits.allowed_models
      })
      return new Response(
        JSON.stringify({
          error: 'MODEL_NOT_ALLOWED',
          message: `${model} is not available on your current plan`,
          userTier: userTierData.tier,
          allowedModels: userTierData.tierLimits.allowed_models
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Model access granted')

    // Check usage limits
    console.log('📊 Checking usage limits...')
    if (userTierData.tierLimits.daily_messages > 0 && 
        userTierData.messagesUsedToday >= userTierData.tierLimits.daily_messages) {
      console.error('❌ Daily message limit exceeded:', {
        used: userTierData.messagesUsedToday,
        limit: userTierData.tierLimits.daily_messages
      })
      return new Response(
        JSON.stringify({
          error: 'DAILY_MESSAGE_LIMIT_EXCEEDED',
          message: 'Daily message limit reached',
          usage: {
            current: userTierData.messagesUsedToday,
            limit: userTierData.tierLimits.daily_messages
          }
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (userTierData.tokensUsedThisMonth >= userTierData.tierLimits.monthly_tokens) {
      console.error('❌ Monthly token limit exceeded:', {
        used: userTierData.tokensUsedThisMonth,
        limit: userTierData.tierLimits.monthly_tokens
      })
      return new Response(
        JSON.stringify({
          error: 'MONTHLY_LIMIT_EXCEEDED',
          message: 'Monthly token limit exceeded',
          usage: {
            current: userTierData.tokensUsedThisMonth,
            limit: userTierData.tierLimits.monthly_tokens
          }
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('✅ Usage limits passed')

    // Route to appropriate AI service
    console.log('🔀 Routing to AI service...')
    if (model.includes('claude')) {
      if (!anthropicApiKey) {
        console.error('❌ Anthropic API key not configured')
        return new Response(
          JSON.stringify({ error: 'ANTHROPIC_API_NOT_CONFIGURED', message: 'Claude models not available' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🤖 Routing to Claude API...')
      return await handleClaudeAPI(anthropicApiKey, model, messages, stream, supabase, userId, userTierData, conversation_id)
    } else {
      if (!openaiApiKey) {
        console.error('❌ OpenAI API key not configured')
        return new Response(
          JSON.stringify({ error: 'OPENAI_API_NOT_CONFIGURED', message: 'OpenAI models not available' }),
          { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      console.log('🧠 Routing to OpenAI API...')
      return await handleOpenAIAPI(openaiApiKey, model, messages, stream, supabase, userId, userTierData, conversation_id)
    }

  } catch (error) {
    console.error('💥 Edge Function error:', error)
    return new Response(
      JSON.stringify({ error: 'INTERNAL_SERVER_ERROR', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

// OpenAI API handler with enhanced logging
async function handleOpenAIAPI(apiKey, model, messages, stream, supabase, userId, userTierData, conversationId) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  console.log('🚀 Starting OpenAI API call:', {
    model,
    messageCount: messages.length,
    stream,
    conversationId
  })

  try {
    console.log('📤 Making request to OpenAI API...')
    const startTime = Date.now()
    
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        stream,
        max_tokens: 4000,
        temperature: 0.7
      })
    })

    const responseTime = Date.now() - startTime
    console.log('📥 OpenAI API response received:', {
      status: openaiResponse.status,
      responseTime: `${responseTime}ms`,
      isOk: openaiResponse.ok
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('❌ OpenAI API error response:', {
        status: openaiResponse.status,
        statusText: openaiResponse.statusText,
        errorText: errorText.substring(0, 500)
      })
      throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`)
    }

    if (stream) {
      console.log('🌊 Setting up streaming response...')
      return new Response(openaiResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      console.log('📦 Processing non-streaming response...')
      const data = await openaiResponse.json()
      
      console.log('📊 Response data received:', {
        hasChoices: !!data.choices,
        choicesLength: data.choices?.length,
        hasUsage: !!data.usage,
        totalTokens: data.usage?.total_tokens
      })
      
      // Update usage
      const tokensUsed = data.usage?.total_tokens || 0
      console.log('💾 Updating user usage:', {
        tokensUsed,
        newTotal: userTierData.tokensUsedThisMonth + tokensUsed,
        newMessages: userTierData.messagesUsedToday + 1
      })
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          monthly_tokens_used: userTierData.tokensUsedThisMonth + tokensUsed,
          daily_messages_sent: userTierData.messagesUsedToday + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('⚠️ Failed to update user usage:', updateError)
      } else {
        console.log('✅ User usage updated successfully')
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('💥 OpenAI API handler error:', error)
    return new Response(
      JSON.stringify({ error: 'OPENAI_API_ERROR', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}

// Claude API handler with enhanced logging  
async function handleClaudeAPI(apiKey, model, messages, stream, supabase, userId, userTierData, conversationId) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  console.log('🚀 Starting Claude API call:', {
    model,
    messageCount: messages.length,
    stream,
    conversationId
  })

  try {
    console.log('📤 Making request to Anthropic API...')
    const startTime = Date.now()
    
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4000,
        messages,
        stream
      })
    })

    const responseTime = Date.now() - startTime
    console.log('📥 Anthropic API response received:', {
      status: anthropicResponse.status,
      responseTime: `${responseTime}ms`,
      isOk: anthropicResponse.ok
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('❌ Anthropic API error response:', {
        status: anthropicResponse.status,
        statusText: anthropicResponse.statusText,
        errorText: errorText.substring(0, 500)
      })
      throw new Error(`Anthropic API error: ${anthropicResponse.status} - ${errorText}`)
    }

    if (stream) {
      console.log('🌊 Setting up Claude streaming response...')
      return new Response(anthropicResponse.body, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      })
    } else {
      console.log('📦 Processing Claude non-streaming response...')
      const data = await anthropicResponse.json()
      
      console.log('📊 Claude response data received:', {
        hasContent: !!data.content,
        hasUsage: !!data.usage,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens
      })
      
      // Update usage
      const tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
      console.log('💾 Updating user usage for Claude:', {
        tokensUsed,
        newTotal: userTierData.tokensUsedThisMonth + tokensUsed,
        newMessages: userTierData.messagesUsedToday + 1
      })
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          monthly_tokens_used: userTierData.tokensUsedThisMonth + tokensUsed,
          daily_messages_sent: userTierData.messagesUsedToday + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (updateError) {
        console.error('⚠️ Failed to update user usage for Claude:', updateError)
      } else {
        console.log('✅ Claude user usage updated successfully')
      }

      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }
  } catch (error) {
    console.error('💥 Claude API handler error:', error)
    return new Response(
      JSON.stringify({ error: 'ANTHROPIC_API_ERROR', message: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}