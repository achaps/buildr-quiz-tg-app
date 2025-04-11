# Buildr Quiz Telegram Mini App

A Telegram Mini App for daily quizzes with streak and points system.

## Setup

1. Clone the repository
```bash
git clone <repository-url>
cd buildr-quiz-tg-app
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Configure environment variables
```bash
cp .env.example .env.local
```
Then edit `.env.local` with your actual values:
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key

## Development

Run the development server:
```bash
npm run dev
# or
yarn dev
```

## Deployment

The app is configured for deployment on Vercel. To deploy:

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add the following environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Database Schema

The app uses the following tables in Supabase:

- `quiz_questions`: Stores all quiz questions
- `quiz_user_progress`: Tracks user progress and streaks
- `tg-users`: Main users table with points

## Features

- Daily quiz questions
- Streak system (up to 5 days)
- Points multiplier based on streak
- Integration with Telegram Mini App
