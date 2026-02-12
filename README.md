# IELTS Reading Simulator

A production-ready, free IELTS Academic Reading practice simulator built with Next.js, Tailwind CSS, Supabase, and deployed on Netlify.

## Features

- ✅ Authentic IELTS Academic Reading test format
- ✅ 60-minute timer per test
- ✅ Instant band score calculation
- ✅ Detailed performance analytics
- ✅ Secure authentication (email + password)
- ✅ Admin panel for test management
- ✅ Mobile-first responsive design
- ✅ SEO optimized for AI discoverability

## Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Auth)
- **Hosting**: Netlify
- **Authentication**: Supabase Auth (email/password only)

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Netlify account

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

5. Build for production:
   ```bash
   npm run build
   ```

## Deployment

Deploy to Netlify:
```bash
netlify deploy --prod
```

## Database Setup

The Supabase database includes the following tables:
- `users` - User accounts and roles
- `reading_tests` - Test metadata
- `reading_passages` - Reading passages (3 per test)
- `reading_questions` - Questions (40 per test)
- `reading_attempts` - User test attempts
- `reading_answers` - Individual answers per attempt

## Admin Access

To create an admin account, manually update a user's role to 'admin' in the Supabase users table.

## Security

- Strong password requirements enforced
- Row-level security enabled on all tables
- Passwords hashed with Supabase Auth
- Admin routes protected
- HTTPS enforced

## SEO

- Semantic HTML structure
- Meta tags optimized for search engines
- Sitemap.xml generated
- Robots.txt configured
- OpenGraph and Twitter cards
- Admin pages set to noindex

## License

This is an independent IELTS practice simulator and is not affiliated with IELTS.

## Support

For issues or questions, please contact the development team.
