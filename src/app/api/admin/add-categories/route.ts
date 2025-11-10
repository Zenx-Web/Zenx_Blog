import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Add missing categories
    const { data, error } = await supabase
      .from('categories')
      .upsert([
        {
          name: 'Science',
          slug: 'science',
          description: 'Scientific research and discoveries',
          color: '#06B6D4'
        },
        {
          name: 'Health', 
          slug: 'health',
          description: 'Health and wellness news',
          color: '#10B981'
        }
      ], {
        onConflict: 'slug',
        ignoreDuplicates: true
      })

    if (error) {
      console.error('Error adding categories:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Missing categories added successfully',
      data 
    })
  } catch (error) {
    console.error('Error in add-categories API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}