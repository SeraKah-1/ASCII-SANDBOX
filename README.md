# ASCII Educational Sandbox

A technical visualization engine that converts educational content into interactive ASCII-based simulations and step-by-step process journeys.

## Core Modules

### 1. Sandbox Engine
- Cellular Automata simulation based on AI-generated rules.
- Real-time entity interaction logic.
- Dynamic parameter control via sliders.

### 2. Journey Visualizer
- Sequential process mapping (50x20 ASCII grid).
- Spatial zone definitions and actor movement tracking.
- Context-aware intervention system for real-time adjustments.

### 3. Social Podcast
- Multi-agent educational dialogue generation.
- Atomic fact extraction from source documents.
- Interactive learning phase progression.

## Tech Stack
- **Frontend**: Next.js 15, TypeScript, Tailwind CSS, Lucide React.
- **State Management**: Zustand (with persistence).
- **AI Providers**: Google Gemini (Flash/Pro), Groq (Llama/Mixtral).
- **Backend/Sync**: Supabase (Auth & JSONB storage).

## Configuration

### Environment Variables
Required variables for deployment:
- `NEXT_PUBLIC_GEMINI_API_KEY`: Google AI SDK access.
- `NEXT_PUBLIC_GROQ_API_KEY`: Groq Cloud API access.
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project endpoint.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase client access key.

### Database Schema
The cloud sync feature requires a `saved_states` table in Supabase:
```sql
create table public.saved_states (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  type text check (type in ('sandbox', 'journey', 'study')) not null,
  title text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);
```

## Development
1. Install dependencies: `npm install`
2. Run development server: `npm run dev`
3. Build for production: `npm run build`

## License
MIT
