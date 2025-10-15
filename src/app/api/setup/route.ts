import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic Supabase connection
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(1)

    if (error) {
      return NextResponse.json({
        status: 'error',
        message: 'Database connection failed',
        error: error.message,
        instructions: [
          '1. Go to your Supabase project dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the schema from src/database/schema.sql',
          '4. Run the SQL commands to create tables and policies',
          '5. Make sure to update the admin email in the policies'
        ]
      })
    }

    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful!',
      categories: data?.length || 0,
      next_steps: [
        '1. Set up your AI API keys (ChatGPT and Gemini)',
        '2. Get your Supabase service role key for admin access',
        '3. Update admin email in database policies',
        '4. Test the admin dashboard at /admin'
      ]
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Connection test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}