import { NextResponse } from 'next/server'
import { ensureAdminApiAccess } from '@/lib/auth'

export async function GET() {
  try {
    const session = await ensureAdminApiAccess()
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const checks = {
      openai: !!process.env.OPENAI_API_KEY,
      gemini: !!process.env.GOOGLE_GEMINI_API_KEY,
      supabase_url: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    const apiKeyStatus = {
      openai: process.env.OPENAI_API_KEY ? 
        `Present (${process.env.OPENAI_API_KEY.substring(0, 10)}...)` : 
        'Missing',
      gemini: process.env.GOOGLE_GEMINI_API_KEY ? 
        `Present (${process.env.GOOGLE_GEMINI_API_KEY.substring(0, 10)}...)` : 
        'Missing',
      supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'Missing',
      supabase_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 
        `Present (${process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10)}...)` : 
        'Missing'
    }

    return NextResponse.json({
      success: true,
      message: 'Configuration check completed',
      checks,
      apiKeyStatus,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Configuration check failed'
      },
      { status: 500 }
    )
  }
}