# GramUdyogAI Hackathon Platform

## Overview

The GramUdyogAI platform has been enhanced with a comprehensive hackathon management system that connects investors, skillers, companies, and NGOs. This platform serves as an "AI for Impact" solution in the skilling domain.

## New Features Implemented

### 1. AI-Powered Event Management (`/events`)

**Features:**
- Create and manage hackathons, workshops, competitions, and meetups
- AI-assisted event generation with intelligent content creation
- One-click social media post generation for marketing
- Event filtering and search capabilities
- Real-time participant tracking
- Impact metrics and analytics

**Key Components:**
- Event creation with AI assistance
- Social media integration (Twitter, LinkedIn, Facebook, Instagram)
- Event status management (draft, active, ongoing, completed)
- Budget and prize pool management
- Skills requirement specification

### 2. Public Projects Showcase (`/projects`)

**Features:**
- Browse innovative projects created by participants
- Impact metrics and success stories
- Investment opportunities for investors
- Project categorization and filtering
- Team member profiles and skills
- Testimonials and awards

**Key Components:**
- Project portfolio display
- Impact metrics (people impacted, revenue generated, jobs created)
- Funding status tracking
- Technology stack showcase
- Award and recognition display

### 3. Enhanced Authentication System (`/auth`)

**Features:**
- Phone number and password-based authentication
- Multi-user type support (Individual, Company, NGO, Investor)
- Multi-language support
- Voice-based onboarding option
- Profile completion workflow

**User Types:**
- **Individual**: Skillers, learners, and professionals
- **Company**: Corporates and businesses
- **NGO**: Non-profit organizations  
- **Investor**: Angel investors and VCs

### 4. Dashboard Integration

**Features:**
- Hackathon platform stats in main dashboard
- Quick access to event management
- Recent events overview
- Project creation statistics
- Participant engagement metrics

## Technical Implementation

### Backend APIs

#### Event Management (`/api/events`)
- `GET /api/events` - List all events with filtering
- `POST /api/events` - Create new event
- `POST /api/events/generate-with-ai` - AI-powered event generation
- `POST /api/events/{id}/generate-social-posts` - Generate social media posts
- `POST /api/events/{id}/publish-social-post` - Publish social media posts
- `PUT /api/events/{id}` - Update event
- `DELETE /api/events/{id}` - Delete event

#### Public Projects (`/api/projects`)
- `GET /api/projects` - List all projects with filtering
- `GET /api/projects/{id}` - Get specific project details
- `POST /api/projects` - Create new project
- `GET /api/projects/stats/overview` - Get project statistics
- `GET /api/projects/featured` - Get featured projects

### Database Schema

#### Events Table
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    event_type TEXT NOT NULL,
    category TEXT NOT NULL,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    max_participants INTEGER NOT NULL,
    current_participants INTEGER DEFAULT 0,
    budget INTEGER DEFAULT 0,
    prize_pool INTEGER DEFAULT 0,
    organizer_id INTEGER NOT NULL,
    organizer_type TEXT NOT NULL,
    skills_required TEXT,
    tags TEXT,
    status TEXT DEFAULT 'draft',
    impact_metrics TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
```

#### Projects Table
```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_type TEXT NOT NULL,
    team_members TEXT NOT NULL,
    technologies TEXT NOT NULL,
    impact_metrics TEXT NOT NULL,
    funding_status TEXT NOT NULL,
    funding_amount INTEGER,
    funding_goal INTEGER,
    location TEXT NOT NULL,
    state TEXT NOT NULL,
    created_at TEXT NOT NULL,
    completed_at TEXT NOT NULL,
    status TEXT NOT NULL,
    media TEXT NOT NULL,
    testimonials TEXT NOT NULL,
    awards TEXT NOT NULL,
    tags TEXT NOT NULL
);
```

## User Flow

### 1. New User Journey
1. User clicks "Get Started" on homepage
2. Redirected to `/auth` for login/registration
3. Selects user type (Individual/Company/NGO/Investor)
4. Chooses preferred language
5. Completes profile setup
6. Redirected to dashboard with hackathon platform integration

### 2. Event Creation Flow
1. Navigate to `/events`
2. Click "Create Event"
3. Fill basic event details
4. Use "Generate with AI" for enhanced content
5. Review and publish
6. Generate social media posts for marketing

### 3. Project Showcase Flow
1. Navigate to `/projects`
2. Browse projects by category, status, or funding
3. View detailed project information
4. Contact teams for investment opportunities
5. Track impact metrics and success stories

## AI Integration

### Event Generation
- Uses LLM to generate event titles, descriptions, and requirements
- Intelligent skill requirement suggestions
- Tag generation based on event type and category

### Social Media Marketing
- Automated post generation for multiple platforms
- Platform-specific content optimization
- One-click publishing capabilities

### Impact Analytics
- Real-time metrics tracking
- Social impact scoring
- Sustainability assessment

## Future Enhancements

### Phase 2 Features (Planned)
1. **GeM Integration**: Government e-Marketplace product recommendations
2. **Advanced Analytics**: Enhanced dashboard with real-time insights
3. **Team Formation**: AI-powered team matching
4. **Mentorship System**: Expert-mentor pairing
5. **Funding Portal**: Direct investment facilitation

### Phase 3 Features (Planned)
1. **Unified AI Agent**: Single chatbot with access to all platform functions
2. **Mobile App**: Progressive Web App with offline capabilities
3. **Advanced Matching**: Intelligent participant-event matching
4. **Automated Marketing**: AI-driven campaign generation

## Getting Started

### Prerequisites
- Node.js 16+
- Python 3.8+
- SQLite database

### Installation
1. Clone the repository
2. Install frontend dependencies: `cd frontend && npm install`
3. Install backend dependencies: `cd backend && pip install -r requirements.txt`
4. Start backend server: `cd backend && python main.py`
5. Start frontend development server: `cd frontend && npm run dev`

### Access Points
- **Homepage**: `http://localhost:5173/`
- **Authentication**: `http://localhost:5173/auth`
- **Event Management**: `http://localhost:5173/events`
- **Public Projects**: `http://localhost:5173/projects`
- **Dashboard**: `http://localhost:5173/dashboard`

## Contributing

The hackathon platform is designed to be extensible. Key areas for contribution:

1. **AI Enhancements**: Improve event generation and social media content
2. **Analytics**: Add more sophisticated impact metrics
3. **Integrations**: Connect with external platforms and APIs
4. **UI/UX**: Enhance the user experience and accessibility
5. **Mobile**: Develop native mobile applications

## Support

For questions or support regarding the hackathon platform, please refer to the main project documentation or create an issue in the repository. 