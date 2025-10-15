import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import type { TablesInsert } from '@/types/database.types'

export async function POST() {
  try {
    // Test the connection first by trying to insert sample data
    const defaultCategories = [
      { name: 'Technology', slug: 'technology', description: 'Latest tech trends and innovations', color: '#8B5CF6' },
      { name: 'Entertainment', slug: 'entertainment', description: 'Movies, TV shows, celebrity news', color: '#F59E0B' },
      { name: 'Lifestyle', slug: 'lifestyle', description: 'Health, fashion, and lifestyle trends', color: '#10B981' },
      { name: 'Business', slug: 'business', description: 'Market trends and business news', color: '#3B82F6' },
      { name: 'Sports', slug: 'sports', description: 'Sports news and trending events', color: '#EF4444' },
      { name: 'World News', slug: 'world-news', description: 'Breaking news and global events', color: '#6B7280' }
    ];

    const results = [];
    let hasError = false;

    // Test 1: Check if we can connect to Supabase
    try {
      const { error: testError } = await supabaseAdmin.from('categories').select('count').limit(1);
      if (testError && !testError.message.includes('does not exist')) {
        throw testError;
      }
      results.push('✅ Supabase connection verified');
    } catch (error) {
      console.error('Connection test failed:', error);
      return NextResponse.json({
        success: false,
        error: error instanceof Error ? error.message : 'Connection failed',
        message: 'Cannot connect to Supabase. Please verify your service role key and database URL.'
      });
    }

    // Test 2: Try to insert categories (this will work if tables exist)
    try {
      for (const category of defaultCategories) {
        const upsertPayload: TablesInsert<'categories'> = category
        const { error } = await supabaseAdmin
          .from('categories')
          .upsert(upsertPayload, { 
            onConflict: 'slug',
            ignoreDuplicates: true 
          });
        
        if (error && !error.message.includes('duplicate')) {
          console.error('Category insert error:', error);
          hasError = true;
        }
      }
      
      if (!hasError) {
        results.push('✅ Default categories created/updated');
      }
    } catch (error) {
      console.error('Categories setup error:', error);
      results.push('⚠️ Categories setup had issues (table may need manual creation)');
    }

    // Test 3: Try to fetch categories to verify table exists
    try {
      const { data, error } = await supabaseAdmin
        .from('categories')
        .select('name, slug')
        .limit(5);

      if (!error && data) {
        results.push(`✅ Categories table verified (${data.length} categories found)`);
      }
    } catch {
      results.push('⚠️ Categories table needs to be created manually');
    }

    // Test 4: Check blog_posts table
    try {
      const { error } = await supabaseAdmin
        .from('blog_posts')
        .select('count')
        .limit(1);

      if (!error) {
        results.push('✅ Blog posts table verified');
      }
    } catch {
      results.push('⚠️ Blog posts table needs to be created manually');
    }

    // Test 5: Check trending_topics table
    try {
      const { error } = await supabaseAdmin
        .from('trending_topics')
        .select('count')
        .limit(1);

      if (!error) {
        results.push('✅ Trending topics table verified');
      }
    } catch {
      results.push('⚠️ Trending topics table needs to be created manually');
    }

    const isFullySetup = results.filter(r => r.includes('✅')).length >= 3;

    return NextResponse.json({
      success: true,
      message: isFullySetup 
        ? 'Database is ready! All essential tables are working.'
        : 'Partial setup completed. Some tables may need manual creation.',
      results,
      manual_setup_needed: !isFullySetup,
      sql_file_location: 'src/database/schema.sql',
      next_steps: isFullySetup ? [
        'Visit /admin to start generating AI content',
        'Your blog is ready for content creation!',
        'Test the trending topics feature'
      ] : [
        'Go to Supabase Dashboard → SQL Editor',
        'Run the SQL from src/database/schema.sql',
        'Then return to /admin to start creating content'
      ]
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Setup failed. Please check your Supabase service role key and try again.',
      troubleshooting: [
        'Verify SUPABASE_SERVICE_ROLE_KEY in .env.local',
        'Check if your Supabase project is active',
        'Try running SQL manually in Supabase Dashboard'
      ]
    });
  }
}