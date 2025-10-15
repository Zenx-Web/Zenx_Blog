export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface EmailPreferences {
  newPosts?: boolean
  weekly?: boolean
  monthly?: boolean
}

export interface UserPreferences {
  emailNotifications?: boolean
  theme?: 'light' | 'dark' | string
}

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          color: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          color?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          color?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          content: string
          excerpt: string
          featured_image: string | null
          category: string
          tags: string[] | null
          is_featured: boolean | null
          is_published: boolean | null
          seo_title: string | null
          seo_description: string | null
          read_time: number | null
          views: number | null
          created_at: string | null
          updated_at: string | null
          published_at: string | null
        }
        Insert: {
          id?: string
          title: string
          slug: string
          content: string
          excerpt: string
          featured_image?: string | null
          category: string
          tags?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          seo_title?: string | null
          seo_description?: string | null
          read_time?: number | null
          views?: number | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          content?: string
          excerpt?: string
          featured_image?: string | null
          category?: string
          tags?: string[] | null
          is_featured?: boolean | null
          is_published?: boolean | null
          seo_title?: string | null
          seo_description?: string | null
          read_time?: number | null
          views?: number | null
          created_at?: string | null
          updated_at?: string | null
          published_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'blog_posts_category_fkey'
            columns: ['category']
            referencedRelation: 'categories'
            referencedColumns: ['slug']
          }
        ]
      }
      trending_topics: {
        Row: {
          id: string
          topic: string
          source: string
          relevance_score: number | null
          used: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          topic: string
          source: string
          relevance_score?: number | null
          used?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          topic?: string
          source?: string
          relevance_score?: number | null
          used?: boolean | null
          created_at?: string | null
        }
        Relationships: []
      }
      site_analytics: {
        Row: {
          id: string
          page_path: string
          views: number | null
          unique_visitors: number | null
          date: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          page_path: string
          views?: number | null
          unique_visitors?: number | null
          date?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          page_path?: string
          views?: number | null
          unique_visitors?: number | null
          date?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
      email_subscriptions: {
        Row: {
          id: string
          email: string
          is_verified: boolean | null
          verification_token: string | null
          subscribed_at: string | null
          verified_at: string | null
          unsubscribed_at: string | null
          preferences: EmailPreferences | Json | null
          created_at: string | null
        }
        Insert: {
          id?: string
          email: string
          is_verified?: boolean | null
          verification_token?: string | null
          subscribed_at?: string | null
          verified_at?: string | null
          unsubscribed_at?: string | null
          preferences?: EmailPreferences | Json | null
          created_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          is_verified?: boolean | null
          verification_token?: string | null
          subscribed_at?: string | null
          verified_at?: string | null
          unsubscribed_at?: string | null
          preferences?: EmailPreferences | Json | null
          created_at?: string | null
        }
        Relationships: []
      }
      user_reading_history: {
        Row: {
          id: string
          user_id: string
          post_id: string
          progress: number | null
          completed: boolean | null
          read_time_seconds: number | null
          first_read_at: string | null
          last_read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          progress?: number | null
          completed?: boolean | null
          read_time_seconds?: number | null
          first_read_at?: string | null
          last_read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          progress?: number | null
          completed?: boolean | null
          read_time_seconds?: number | null
          first_read_at?: string | null
          last_read_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_reading_history_post_id_fkey'
            columns: ['post_id']
            referencedRelation: 'blog_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_reading_history_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      user_saved_posts: {
        Row: {
          id: string
          user_id: string
          post_id: string
          saved_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          post_id: string
          saved_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          post_id?: string
          saved_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_saved_posts_post_id_fkey'
            columns: ['post_id']
            referencedRelation: 'blog_posts'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_saved_posts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          bio: string | null
          preferences: UserPreferences | Json | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferences?: UserPreferences | Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          preferences?: UserPreferences | Json | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'user_profiles_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      handle_new_user: {
        Args: Record<string, never>
        Returns: unknown
      }
      increment_post_views: {
        Args: {
          post_slug: string
        }
        Returns: unknown
      }
      track_page_view: {
        Args: {
          page_path: string
        }
        Returns: unknown
      }
      update_updated_at_column: {
        Args: Record<string, never>
        Returns: unknown
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']
