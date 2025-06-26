# chat.space - Functional Requirements Document

## Project Overview
chat.space is a production-ready AI chat platform with multi-model switching capabilities, subscription tiers, usage tracking, and real-time streaming responses. Built with React, TypeScript, Tailwind CSS, and Supabase with comprehensive cross-device synchronization and premium UI/UX.

---

## 🏗️ Architecture Overview

### Frontend Stack
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for responsive styling and design system
- **Lucide React** for consistent iconography
- **Vite** for fast development and optimized builds
- **ESLint** for code quality and consistency

### Backend Stack
- **Supabase** for authentication, database, and edge functions
- **PostgreSQL** with Row Level Security (RLS) for data protection
- **Edge Functions** for secure AI API integration and usage enforcement
- **OpenAI API** for GPT models (GPT-3.5, GPT-4o, GPT-4.1, o3/o4 series)
- **Anthropic API** for Claude models (Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus)

---

## 🎯 Core Functionalities Implemented

### 1. Authentication System (AuthLayout.tsx)
**Screen: Login/Registration Page**

**✅ Implemented Features:**
- Email and password authentication via Supabase Auth
- User registration and login forms with real-time validation
- Purple gradient theme with glassmorphism effects
- Custom logo integration with fallback to Lucide icons
- Loading states and comprehensive error handling
- Automatic session management and persistence
- Form validation with immediate feedback
- Responsive design for all screen sizes
- Smooth transitions and micro-animations
- Invalid session cleanup and re-authentication handling

**Security Features:**
- Secure JWT token-based authentication
- Session validation and auto-refresh
- Invalid session detection and cleanup
- Comprehensive error handling for expired sessions
- Automatic token refresh on expiration

---

### 2. Main Chat Interface (ChatLayout.tsx)
**Screen: Primary Application Dashboard**

**✅ Implemented Features:**
- Real-time streaming AI chat responses with token-by-token display
- Multi-conversation management in memory and database
- Model switching between multiple providers (OpenAI & Anthropic)
- Advanced model support including GPT-4o, GPT-4.1, Claude 3.5 Sonnet, Claude 4, o3/o4 models
- Comprehensive token usage tracking with detailed statistics
- Cross-device conversation synchronization
- Automatic conversation saving to Supabase every 30 seconds
- Error handling with user-friendly messages and recovery options
- Loading states for all operations with visual feedback
- Responsive layout with collapsible sidebar
- Enhanced z-index management for proper UI layering

**Technical Implementation:**
- React state management for real-time updates
- AbortController for cancelling streaming requests
- Automatic database sync with conflict resolution
- Immediate database saving for critical operations
- Session validation before all operations
- Proper stacking context management for UI components
- Memory-efficient message handling

---

### 3. Enhanced Sidebar Navigation (Sidebar.tsx)
**Screen: Left Navigation Panel**

**✅ Implemented Features:**
- Conversation list with message counts and timestamps
- "New Chat" button with instant conversation creation
- Active conversation highlighting with purple accent
- Mobile-responsive with overlay and backdrop blur
- User profile section with current tier display
- Context menu for conversation management (rename, delete, export)
- Real-time usage statistics display with progress bars
- Settings and upgrade access
- Conversation export functionality (JSON format)
- Bulk conversation clearing with confirmation dialogs
- Real-time usage tracking integration

**Mobile Optimizations:**
- Hamburger menu toggle with smooth animations
- Swipe gestures and touch-friendly interface
- Automatic closing after selection on mobile
- Optimized spacing for touch targets
- Responsive breakpoints for tablet and desktop

---

### 4. Enhanced Chat Area (ChatArea.tsx)
**Screen: Main Conversation View**

**✅ Implemented Features:**
- Welcome state with comprehensive model information and branding
- Message history display with proper threading and timestamps
- Real-time streaming message rendering with blinking cursor
- Model indicator in persistent header with proper z-index layering
- Message count display and conversation metadata
- Error banner with dismissible alerts and retry options
- Usage warning system with tier-specific messaging
- Auto-scrolling to latest messages with smooth behavior
- Mobile-optimized message layout with responsive design
- Enhanced header with seamless branding integration
- Provider-specific model categorization (OpenAI, Anthropic)
- 2025 model badge indicators for latest models
- Real-time reset time display for usage limits

**Message Display:**
- User messages with purple gradient avatars
- AI responses with model identification and provider icons
- Timestamp display on hover with relative formatting
- Error message handling with distinct styling and recovery options
- Message content with proper text wrapping and formatting
- Provider-specific color coding and badges
- Token usage display for each message

**UI/UX Improvements:**
- Fixed z-index stacking for model selector dropdown
- Proper layering of header components above main content
- Enhanced dropdown visibility and interaction
- Smooth animations and transitions throughout

---

### 5. Advanced Message Input System (MessageInput.tsx)
**Screen: Chat Input Interface**

**✅ Implemented Features:**
- Auto-resizing textarea with character limits (4000 chars)
- Enhanced model selector dropdown with tier-based availability
- Send button with streaming state indication and visual feedback
- Stop generation button during AI responses
- Keyboard shortcuts (Enter to send, Shift+Enter for new line)
- Purple gradient theming with glassmorphism effects
- Disabled states during streaming and errors
- Model descriptions and tier requirements
- Responsive design for all screen sizes
- Usage validation with pre-send warnings
- Real-time character count and token estimation

**Model Selection:**
- Visual model indicators with color coding
- Tier-based model access restrictions with lock icons
- Model descriptions and capabilities
- Upgrade prompts for premium models
- Provider grouping (OpenAI vs Anthropic)
- Real-time availability checking

---

### 6. Enhanced Model Selector (ModelSelector.tsx)
**Screen: Model Selection Interface**

**✅ Implemented Features:**
- Comprehensive model support across multiple providers
- Grouped display by provider (OpenAI, Anthropic)
- Model tier indicators (flagship, efficient, latest, premium, nano)
- Compact and full view modes for different contexts
- Provider-specific color coding and badges
- Model descriptions and capabilities with detailed information
- 2025 model indicators for latest releases
- Fixed z-index stacking issues for proper dropdown layering
- Full opacity backgrounds for better visibility
- Enhanced shadow and border styling
- Tier-based access control with visual restrictions

**Supported Models:**
- **OpenAI**: GPT-4o, GPT-4o Mini, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o3, o3-mini, o4-mini, GPT-3.5 Turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3.5 Haiku, Claude 3 Opus
- Future-ready architecture for new model releases

**Technical Improvements:**
- Proper z-index values (99998/99999) for dropdown layering
- Solid white backgrounds instead of semi-transparent
- Enhanced shadow effects for better visual separation
- Responsive design with mobile-optimized interactions

---

### 7. Message Components

#### MessageBubble.tsx
**Function: Individual Message Display**
- ChatGPT-style clean message layout with proper spacing
- User/AI avatar differentiation with provider icons
- Model used indicator for AI responses with provider badges
- Timestamp display with relative formatting ("2 minutes ago")
- Error message styling and handling with recovery options
- Responsive text wrapping and spacing
- Provider-specific color coding (OpenAI blue, Anthropic orange)
- 2025 model indicators with sparkle icons
- Token usage display for each message
- Copy message functionality

#### StreamingMessage.tsx
**Function: Real-time AI Response Display**
- Live token streaming with animated blinking cursor
- Stop generation functionality with confirmation
- Model indicator during streaming with provider info
- Error handling during streaming with retry options
- Smooth content updates without flicker
- Cancel button with user confirmation
- Provider-specific styling and animations
- Token count estimation during streaming
- Progress indicators for long responses

---

### 8. Comprehensive Usage Tracking System

#### UsageDisplay.tsx
**Function: Usage Statistics Dashboard**
- Real-time token usage tracking (daily/monthly) with live updates
- Message count tracking with daily limits for free tier
- Progress bars with color-coded warnings (green/yellow/red)
- Tier-specific limit display with upgrade prompts
- Usage percentage calculations with precise formatting
- Auto-refresh every 5 minutes for accuracy
- Visual indicators for usage levels
- **Real-time reset time display** showing exact hours/minutes until limits reset
- Anniversary-based billing cycle information
- Historical usage trends

#### UsageWarningBanner.tsx
**Function: Usage Limit Warnings**
- Progressive warning system (70%, 90%, 95%) with escalating urgency
- Tier-specific warning messages with personalized content
- Upgrade prompts with benefits comparison
- Dismissible warnings for paid tiers
- Color-coded alert levels (yellow, amber, red)
- Dynamic messaging based on user tier and usage patterns
- **Real-time countdown timers** for limit resets
- Anniversary-based reset information display

#### LimitExceededModal.tsx
**Function: Limit Violation Handling**
- Modal dialogs for token/message limits with detailed information
- Tier-specific upgrade recommendations with pricing
- Usage statistics with **real-time reset times**
- Benefits comparison for upgrades with feature lists
- Direct upgrade actions with pricing information
- **Anniversary-based reset timing** display
- Personalized messaging based on user's billing cycle

---

### 9. Enhanced Subscription System (PricingModal.tsx)
**Screen: Subscription Management**

**✅ Implemented Features:**
- Four-tier pricing structure (Free, Basic, Pro, Super Pro)
- Feature comparison with detailed limitations and benefits
- Current plan indication with usage statistics
- Popular plan highlighting with visual emphasis
- Responsive pricing cards with mobile optimization
- Tier-specific benefits and token limits
- Upgrade flow integration with seamless transitions

**Pricing Tiers:**
- **Free**: 10 messages/day, 30K tokens/month, Basic models (GPT-3.5, Claude Haiku)
- **Basic ($5/month)**: Unlimited messages, 300K tokens, Enhanced models (GPT-4o Mini, Claude Sonnet)
- **Pro ($9/month)**: 750K tokens, All models including premium (GPT-4o, Claude Opus)
- **Super Pro ($19/month)**: 2M tokens, Priority access, Advanced features (o3/o4 models)

---

### 10. Multi-Provider Backend Infrastructure

#### Enhanced Edge Functions (chat-completion/index.ts)
**Function: AI Chat Processing**
- Multi-provider AI integration (OpenAI + Anthropic) with normalized responses
- User authentication and session validation
- **Anniversary-based usage enforcement** with real billing cycles
- Token counting and usage tracking with precise calculations
- Model access restrictions by tier with real-time validation
- Error handling with detailed responses and recovery suggestions
- CORS configuration for web access
- Normalized response format across providers
- Streaming support for real-time responses
- **Real-time reset time calculation** based on user's actual signup date

#### Database Service (databaseService.ts)
**Function: Data Persistence**
- Conversation CRUD operations with optimistic updates
- Message storage with comprehensive token tracking
- **Real-time usage statistics calculation** with anniversary-based billing
- Cross-device synchronization with conflict resolution
- Row Level Security (RLS) enforcement
- Automatic token calculation triggers
- Database connection testing and validation
- Proper sequence number handling for messages
- **User billing anniversary tracking** for accurate reset times

#### Enhanced Database Schema
**Function: Data Structure**
- Conversations table with user relationships and metadata
- Messages table with comprehensive token tracking fields
- Foreign key constraints and cascade deletes
- Indexes for performance optimization
- Automatic timestamp updates with triggers
- Token calculation triggers and functions
- Sequence number tracking for message ordering
- **User billing cycle tracking** for anniversary-based limits

---

### 11. Authentication & Session Management

#### useAuth.ts Hook
**Function: Authentication State Management**
- User session persistence with automatic refresh
- Automatic token refresh with error handling
- Invalid session cleanup and recovery
- Sign up/in/out functionality with validation
- Session validation utilities
- Error handling for auth failures with user-friendly messages
- Corrupted session detection and cleanup

#### Row Level Security (RLS)
**Function: Data Security**
- User-specific data access controls
- Conversation ownership enforcement
- Message access through conversation ownership
- Secure API endpoints with user validation
- Real-time policy enforcement

---

### 12. Cross-Device Data Synchronization

#### useDatabaseSync.ts Hook
**Function: Cross-Device Sync**
- Automatic periodic synchronization (every 30 seconds)
- Immediate saving for critical operations
- Merge strategy for conflicting changes with intelligent resolution
- Initial data loading on authentication
- Background sync with comprehensive error handling
- Session validation before all operations
- Intelligent sync conflict resolution

---

### 13. Multi-Provider AI Integration

#### Enhanced Streaming Service (streamingService.ts)
**Function: Real-time AI Responses**
- Multi-provider streaming chat completions
- Token-by-token response rendering with smooth animations
- **Anniversary-based usage statistics collection** with real-time validation
- Error handling during streaming with recovery options
- Request cancellation support with user confirmation
- Token estimation for UI display
- Normalized response handling across providers
- **Real-time usage limit enforcement** with personalized reset times

#### Comprehensive Model Configuration
**Function: AI Model Management**
- Multiple provider support (OpenAI, Anthropic) with seamless switching
- Latest 2025 models (GPT-4.1, Claude 4, o3/o4 series)
- Tier-based model access restrictions with visual indicators
- Model descriptions and capabilities with detailed information
- Color-coded model indicators with provider branding
- Token limit configurations per model
- Provider-specific pricing information

---

### 14. Real-Time Usage Statistics

#### useUsageStats.ts Hook
**Function: Real-time Usage Tracking**
- **Anniversary-based daily and monthly token usage calculation**
- Daily message count tracking with real-time updates
- Tier limit enforcement with personalized messaging
- Warning threshold management with progressive alerts
- Automatic refresh every 5 minutes for accuracy
- Database-driven statistics with RLS enforcement
- Progressive warning system with escalating urgency
- **Real-time reset time calculation** based on user's actual billing anniversary

---

### 15. Enhanced User Interface Components

#### Logo Component (Logo.tsx)
**Function: Brand Identity**
- Custom logo support with fallback to Lucide icons
- Multiple size variants (sm, md, lg, xl)
- Light/dark/gradient variants for different contexts
- Text integration option with brand name
- Responsive scaling with proper aspect ratios

#### Error Handling (ErrorBanner.tsx)
**Function: User Feedback**
- Dismissible error messages with clear actions
- Consistent error styling with brand colors
- Icon integration for visual clarity
- Auto-dismiss timers for non-critical errors
- Retry functionality for recoverable errors

#### Conversation Management (ConversationMenu.tsx)
**Function: Conversation Operations**
- Context menu for conversation actions
- Rename functionality with inline editing
- Delete confirmation with safety prompts
- Export conversation functionality (JSON format)
- Light theme integration for sidebar consistency

---

## 🧭 Navigation Structure

### Primary Navigation
1. **Sidebar (Left Panel)**
   - New Chat button (always visible)
   - Conversation list with search/filter
   - User profile with tier display
   - Settings access
   - Upgrade prompts

2. **Header (Top Bar)**
   - Brand logo and name
   - Model selector with tier restrictions
   - Usage statistics display
   - Current conversation info

3. **Main Content Area**
   - Chat messages with streaming
   - Message input with model selection
   - Usage warnings and upgrade prompts

### Mobile Navigation
- Hamburger menu for sidebar toggle
- Responsive header with condensed information
- Touch-optimized interactions
- Swipe gestures for navigation

---

## 🎨 Frontend Rules and Logic

### Design System
- **Color Palette**: Purple gradient primary (#8B5CF6 to #7C3AED)
- **Typography**: Inter font family with 400/500/600/700 weights
- **Spacing**: 8px grid system for consistent spacing
- **Breakpoints**: Mobile-first responsive design (sm: 640px, md: 768px, lg: 1024px, xl: 1280px)

### Component Architecture
- **Modular Design**: Each component handles single responsibility
- **Prop Drilling Prevention**: Context and hooks for state management
- **Type Safety**: Comprehensive TypeScript interfaces
- **Error Boundaries**: Graceful error handling throughout

### State Management Rules
1. **Local State**: Component-specific UI state (useState)
2. **Shared State**: Cross-component state via custom hooks
3. **Persistent State**: Database sync for conversations and settings
4. **Cache Strategy**: Optimistic updates with database sync

### Performance Optimizations
- **Lazy Loading**: Components loaded on demand
- **Memoization**: React.memo for expensive components
- **Debouncing**: Database operations and API calls
- **Virtual Scrolling**: For large conversation lists

### Accessibility Standards
- **WCAG 2.1 AA Compliance**: Color contrast, keyboard navigation
- **Screen Reader Support**: Proper ARIA labels and roles
- **Focus Management**: Logical tab order and focus indicators
- **Responsive Text**: Scalable fonts and touch targets

---

## 🔗 Backend Dependencies

### Supabase Edge Function Dependencies

#### 1. Authentication Requirements
```typescript
// Required for all API calls
Authorization: Bearer <jwt_token>
apikey: <supabase_anon_key>
```

#### 2. Environment Variables (Edge Function)
```typescript
SUPABASE_URL: string                    // Supabase project URL
SUPABASE_SERVICE_ROLE_KEY: string      // Service role for database access
OPENAI_API_KEY: string                 // OpenAI API access
ANTHROPIC_API_KEY: string              // Anthropic Claude API access
```

#### 3. Database Schema Dependencies
```sql
-- Required tables with RLS policies
conversations (id, user_id, title, created_at, updated_at)
messages (id, conversation_id, role, content, model_used, tokens, created_at)
```

#### 4. API Request Format
```typescript
// Expected request body for chat-completion
{
  model: string,                        // Model ID (e.g., "gpt-4o", "claude-3-5-sonnet")
  messages: Array<{
    role: 'user' | 'assistant',
    content: string
  }>,
  stream?: boolean,                     // Enable streaming responses
  max_tokens?: number,                  // Token limit per response
  temperature?: number                  // Response creativity (0-1)
}
```

#### 5. Response Format
```typescript
// Normalized response format from Edge Function
{
  choices: [{
    message: {
      content: string                   // AI response text
    }
  }],
  usage: {
    prompt_tokens: number,              // Input tokens used
    completion_tokens: number,          // Output tokens generated
    total_tokens: number                // Total tokens consumed
  },
  model: string                         // Model that processed the request
}
```

#### 6. Error Response Format
```typescript
// Enhanced error responses with anniversary-based reset times
{
  error: string,                        // Error type identifier
  type: 'DAILY_MESSAGE_LIMIT_EXCEEDED' | 'MONTHLY_LIMIT_EXCEEDED' | 'MODEL_NOT_ALLOWED',
  message: string,                      // User-friendly error message
  usage?: {
    current: number,                    // Current usage count
    limit: number,                      // Usage limit
    resetTime: string,                  // ISO timestamp of exact reset time
    percentage?: number                 // Usage percentage
  },
  userTier?: string,                    // Current subscription tier
  allowedModels?: string[]              // Models available to user
}
```

#### 7. Usage Tracking Dependencies
- **Real-time token counting**: Accurate usage calculation per request
- **Anniversary-based billing**: Reset times based on user signup date
- **Tier enforcement**: Model access validation based on subscription
- **Rate limiting**: Request throttling based on tier limits

#### 8. Model Provider Integration
- **OpenAI API**: GPT models with streaming support
- **Anthropic API**: Claude models with message format conversion
- **Response Normalization**: Consistent format across providers
- **Error Handling**: Provider-specific error translation

---

## 🚀 Current Status: Production Ready

### ✅ Completed Features
- Multi-provider AI chat with streaming responses
- **Real-time usage tracking with anniversary-based billing cycles**
- Cross-device conversation synchronization
- Comprehensive subscription management
- Mobile-responsive design with premium UI/UX
- Secure authentication and data protection
- **Personalized reset time display** based on user's actual billing anniversary
- Enhanced error handling with detailed user feedback

### 🔧 Technical Achievements
- **Anniversary-based usage limits**: Reset times calculated from user's actual signup date
- **Real-time countdown timers**: Exact hours/minutes until limit resets
- **Tier-based model access**: Visual restrictions and upgrade prompts
- **Multi-provider streaming**: Seamless switching between OpenAI and Anthropic
- **Cross-device sync**: Real-time conversation synchronization
- **Production-grade security**: RLS, JWT tokens, and session management

### 📊 Performance Metrics
- **Sub-second response times**: Optimized API calls and caching
- **Real-time updates**: Live usage statistics and reset timers
- **Mobile optimization**: Touch-friendly interface with smooth animations
- **Error recovery**: Graceful handling of network and API failures

---

## 🎯 Key Differentiators

1. **Anniversary-Based Billing**: Personalized reset times based on actual signup date
2. **Real-Time Usage Display**: Live countdown timers and usage statistics
3. **Multi-Provider AI**: Seamless switching between OpenAI and Anthropic models
4. **Production-Grade Security**: Comprehensive RLS and session management
5. **Cross-Device Sync**: Real-time conversation synchronization
6. **Premium UI/UX**: Apple-level design aesthetics with micro-interactions

The platform is ready for production deployment with comprehensive error handling, security measures, and scalable architecture supporting multiple AI providers and advanced user management features with **real-time, personalized usage tracking**.