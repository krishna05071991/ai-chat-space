# Chat Models - AI Chat Platform

A modern, responsive AI chat platform with multi-model switching capabilities, built with React, TypeScript, and Supabase.

## 🚀 Features

- **Multi-Provider AI Integration**: Seamless switching between OpenAI and Anthropic models
- **Real-Time Streaming**: Token-by-token response display with smooth animations
- **Anniversary-Based Billing**: Personalized monthly reset cycles
- **Cross-Device Sync**: Real-time conversation synchronization
- **Premium UI/UX**: Apple-level design aesthetics with micro-interactions
- **Mobile-First Design**: Optimized for all screen sizes
- **Comprehensive Usage Tracking**: Transparent token and message limits

## 🛠️ Tech Stack

### Frontend
- **React 18.3.1** with TypeScript
- **Tailwind CSS 3.4.1** with custom design system
- **Vite 5.4.2** for fast development and optimized builds
- **Lucide React** for consistent iconography

### Backend
- **Supabase** for authentication, database, and serverless functions
- **PostgreSQL** with Row Level Security (RLS)
- **Edge Functions** for secure AI API integration

### AI Providers
- **OpenAI API** - GPT models including GPT-4o, GPT-4.1, and reasoning models
- **Anthropic API** - Claude models including Claude 3.5, Claude 4

## 📱 Deployment

### Netlify Configuration

The project includes a comprehensive `netlify.toml` configuration for:

- **SPA Routing**: All routes redirect to `index.html` for client-side routing
- **Build Optimization**: Automatic builds with proper environment variables
- **Security Headers**: Content Security Policy, XSS Protection, and more
- **Performance**: Optimized caching strategies for static assets
- **Environment Management**: Different configurations for production and preview

### Build Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Required environment variables for deployment:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🧭 Routing Architecture

Chat Models uses **client-side state-based routing** for simplicity and performance:

### Page Types
- **`chat`** (default) - Main chat interface with conversations
- **`profile`** - Profile settings page (full page)
- **`pricing`** - Pricing plans page (full page)

### Navigation Flow
1. **Sidebar Navigation** - Menu items for Profile Settings and Pricing Plans
2. **Back Buttons** - Return to chat from any page
3. **Programmatic Navigation** - Upgrade prompts automatically navigate to pricing

### Routing Implementation
```typescript
// All routing is handled in ChatLayout.tsx
type CurrentPage = 'chat' | 'profile' | 'pricing'
const [currentPage, setCurrentPage] = useState<CurrentPage>('chat')

// Navigation handlers
const handleProfileSettings = () => setCurrentPage('profile')
const handlePricingPlans = () => setCurrentPage('pricing')
const handleBackToChat = () => setCurrentPage('chat')
```

### Why State-Based Routing?

1. **Simplicity**: No external routing library dependencies
2. **Performance**: No route-based code splitting needed
3. **State Preservation**: Chat state remains intact across page switches
4. **Mobile-Friendly**: Smooth transitions without URL bar flashing

## 🔧 Development

### Project Structure
```
src/
├── components/
│   ├── auth/           # Authentication components
│   ├── chat/           # Main chat interface and pages
│   ├── common/         # Shared components (Logo, etc.)
│   ├── onboarding/     # User onboarding flow
│   ├── settings/       # Profile settings
│   └── usage/          # Usage tracking and warnings
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries and services
└── types/              # TypeScript type definitions
```

### Key Components

#### ChatLayout.tsx
- **Main routing controller** with state-based navigation
- **Conversation management** and message handling
- **AI model integration** with streaming responses

#### Sidebar.tsx
- **Navigation menu** with page indicators
- **Conversation list** with search and management
- **User profile** and usage statistics

#### ProfileSettingsPage.tsx & PricingPlansPage.tsx
- **Full-page components** replacing modal dialogs
- **Consistent header design** with back navigation
- **Mobile-optimized layouts**

## 🎨 Design System

### Branding
- **Primary Font**: Poppins (headings), Inter (body)
- **Color Scheme**: Purple gradient primary, with provider-specific colors
- **Logo**: Chat Models with distinctive typography

### Responsive Design
- **Mobile-First**: Optimized for touch interactions
- **Breakpoints**: sm (640px), md (768px), lg (1024px), xl (1280px)
- **Safe Areas**: Support for device notches and dynamic islands

### Animation & Interactions
- **Smooth Transitions**: 300ms cubic-bezier easing
- **Micro-Interactions**: Hover states, loading animations
- **Glassmorphism**: Subtle backdrop blur effects

## 🔐 Security

### Authentication
- **Supabase Auth** with JWT token management
- **Session Validation** with automatic refresh
- **Row Level Security** for data isolation

### Data Protection
- **Server-Side API Keys** via Edge Functions
- **Input Sanitization** for markdown content
- **CORS Protection** with proper headers

## 📊 Analytics & Monitoring

### Usage Tracking
- **Token Consumption** with real-time updates
- **Message Limits** with anniversary-based resets
- **Model Usage** statistics and trends

### Error Handling
- **Graceful Degradation** for network failures
- **User-Friendly Messages** for common errors
- **Automatic Retry** for transient failures

## 🚀 Deployment Checklist

1. **Environment Setup**
   - Configure Supabase project
   - Set up environment variables
   - Deploy Edge Functions

2. **Domain Configuration**
   - Set up custom domain in Netlify
   - Configure DNS records
   - Enable HTTPS

3. **Performance Optimization**
   - Enable Netlify CDN
   - Configure caching headers
   - Optimize images and assets

4. **Monitoring Setup**
   - Configure error tracking
   - Set up analytics
   - Monitor performance metrics

## 📄 License

This project is proprietary software. All rights reserved.

## 🤝 Support

For technical support or questions:
- Email: support@chatmodels.app
- Documentation: [Coming Soon]

---

**Chat Models** - Powered by advanced AI, designed for humans.