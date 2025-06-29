# Chat Models - AI Chat Platform

A modern, production-ready AI chat platform with multi-provider integration, intelligent usage tracking, and advanced prompt engineering capabilities.

## 🌟 Key Features

### 🎯 **Smart Prompt Helper** (Pro Feature)
- **Intelligent Prompt Engineering**: AI-powered prompt optimization system
- **Task-Specific Optimization**: Specialized prompts for Creative, Coding, Analysis, and General tasks
- **Intent Analysis**: Understands user goals and restructures prompts for maximum effectiveness
- **Professional Templates**: Expert-level prompt structures with clear sections and requirements
- **Model Recommendations**: Auto-selects optimal AI models based on task type
- **Style Learning**: Few-shot examples to match your preferred output style

### 🤖 **Multi-Provider AI Integration**
- **OpenAI Models**: GPT-4o, GPT-4.1, GPT-4.1 Mini, GPT-4.1 Nano, o3/o4 reasoning models
- **Anthropic Claude**: Claude 3.5 Sonnet/Haiku, Claude 3.7, Claude 4 Sonnet/Opus
- **Google Gemini**: Gemini 1.5/2.0/2.5 Flash and Pro models
- **Real-Time Streaming**: Token-by-token response delivery
- **Seamless Switching**: Change models mid-conversation
- **Latest AI Access**: 2025 cutting-edge models including reasoning capabilities

### 💳 **Smart Subscription System**
- **Anniversary-Based Billing**: Personalized reset dates based on signup date
- **Three Tiers**: Free (35K tokens), Basic ($6 - 1M tokens), Pro ($9 - 1.5M tokens)
- **Real-Time Usage Tracking**: Live token and message counters
- **Progressive Warnings**: Smart alerts at 70%, 90%, and 95% usage
- **Transparent Billing**: Clear countdown timers to your personal reset date

### 📱 **Mobile-First Design**
- **Responsive Interface**: Optimized for all screen sizes
- **Touch-Friendly**: 48px minimum touch targets
- **Safe Area Support**: Handles notches and dynamic islands
- **Smooth Animations**: 60fps transitions and micro-interactions
- **Offline-Ready**: Progressive Web App capabilities

### 🔐 **Enterprise-Grade Security**
- **Row Level Security**: Database-level user isolation
- **Session Management**: Automatic token refresh and validation
- **API Key Protection**: Server-side credential management
- **Data Privacy**: Secure conversation storage and sync

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm 8+
- Supabase account and project
- OpenAI API key (optional)
- Anthropic API key (optional)
- Google AI API key (optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chat-models
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🏗️ Technical Architecture

### Frontend Stack
- **React 18.3.1** with TypeScript for type safety
- **Tailwind CSS 3.4.1** with custom design system
- **Vite 5.4.2** for fast development and optimized builds
- **Lucide React** for consistent iconography
- **Marked 12.0.0** for markdown rendering

### Backend Infrastructure
- **Supabase 2.39.0** for authentication, database, and serverless functions
- **PostgreSQL** with advanced Row Level Security (RLS)
- **Edge Functions** for secure AI API integration
- **Real-time subscriptions** for cross-device sync

### AI Provider Integration
- **Unified API**: Consistent interface across all providers
- **Smart Fallbacks**: Automatic error handling and retries
- **Usage Tracking**: Real-time token consumption monitoring
- **Cost Optimization**: Intelligent model selection for tasks

## 📊 Feature Breakdown

### Authentication & User Management
- ✅ Email/password authentication with Supabase Auth
- ✅ Session persistence with automatic refresh
- ✅ User profile management with onboarding flow
- ✅ Secure session validation and cleanup

### Chat Experience
- ✅ Real-time streaming responses with typing indicators
- ✅ Conversation management (create, rename, delete, export)
- ✅ Cross-device synchronization
- ✅ Message persistence with sequence numbering
- ✅ Markdown rendering for AI responses
- ✅ Error recovery and retry mechanisms

### Smart Prompt Helper (Pro)
- ✅ Multi-step guided prompt creation
- ✅ Task type classification (Creative, Coding, Analysis, General)
- ✅ Role-based AI persona selection
- ✅ Style example collection with AI generation
- ✅ Advanced prompt enhancement using GPT-4o
- ✅ Live preview with token estimation
- ✅ Model recommendations based on task type

### Usage Management
- ✅ Anniversary-based billing cycles
- ✅ Real-time usage tracking with database sync
- ✅ Progressive warning system (70%, 90%, 95%)
- ✅ Personalized reset timers
- ✅ Tier-based model access control
- ✅ Usage limit enforcement with upgrade prompts

### Model Management
- ✅ Comprehensive model catalog (30+ models)
- ✅ Provider categorization and filtering
- ✅ Smart model recommendations
- ✅ Tier-based access control
- ✅ Real-time availability checking
- ✅ Performance indicators (speed, cost, capability)

### Data Management
- ✅ Secure conversation storage
- ✅ Message history with full-text search capability
- ✅ Export functionality (JSON format)
- ✅ Data synchronization across devices
- ✅ Automatic cleanup and archiving
- ✅ Usage analytics and reporting

## 🎨 Design System

### Color Palette
- **Primary**: Purple gradient (#8B5CF6 to #7C3AED)
- **Providers**: Blue (OpenAI), Orange (Anthropic), Green (Google)
- **Status**: Success (#10B981), Warning (#F59E0B), Error (#EF4444)
- **Neutrals**: Gray scale (#F9FAFB to #111827)

### Typography
- **Font**: Inter with feature settings for enhanced readability
- **Scales**: Mobile-first responsive text sizing
- **Hierarchy**: Clear heading structure with proper line heights

### Spacing & Layout
- **Grid**: 8px base spacing system
- **Breakpoints**: Mobile-first responsive design
- **Safe Areas**: Support for modern device layouts

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Project Structure
```
src/
├── components/           # React components
│   ├── auth/            # Authentication components
│   ├── chat/            # Chat interface components
│   ├── prompt-helper/   # Smart Prompt Helper components
│   ├── usage/           # Usage tracking components
│   └── settings/        # Settings and profile components
├── hooks/               # Custom React hooks
├── lib/                 # Utility libraries and services
├── types/               # TypeScript type definitions
└── styles/              # CSS and styling files
```

### Code Quality
- **TypeScript**: Strict type checking enabled
- **ESLint**: React and TypeScript rules
- **Component Architecture**: Modular, reusable components
- **State Management**: React hooks with proper error boundaries

## 🚀 Deployment

### Netlify Deployment
1. Build configuration in `netlify.toml`
2. Environment variables setup
3. Automatic deployments from Git
4. CDN and edge optimization

### Supabase Backend
1. Database migrations in `supabase/migrations/`
2. Edge Functions in `supabase/functions/`
3. Row Level Security policies
4. Real-time subscriptions

## 📈 Performance

### Metrics
- **Load Time**: < 2s for first meaningful paint
- **Response Time**: < 500ms for UI interactions
- **Streaming**: Real-time token delivery
- **Sync**: < 30s cross-device synchronization
- **Uptime**: 99.9% availability target

### Optimizations
- **Code Splitting**: Lazy-loaded components
- **Bundle Size**: Optimized with tree-shaking
- **Caching**: Browser and CDN caching strategies
- **Database**: Indexed queries and connection pooling

## 🏆 Unique Value Propositions

1. **Anniversary-Based Billing**: Industry-first personalized billing cycles
2. **Smart Prompt Engineering**: AI-powered prompt optimization
3. **Multi-Provider Access**: Choice between OpenAI, Anthropic, and Google
4. **Real-Time Reset Timers**: Exact countdown to usage resets
5. **Cross-Device Sync**: Seamless conversation synchronization
6. **Latest AI Models**: Early access to 2025 cutting-edge models
7. **Transparent Usage**: Clear token tracking with detailed analytics

---

**Chat Models** - Empowering conversations with intelligent AI integration and professional prompt engineering.