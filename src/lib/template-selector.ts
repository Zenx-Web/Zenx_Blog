// Template selector utility
// Selects a template based on category and post ID for consistent but varied layouts

export type TemplateType = 'classic' | 'modern' | 'magazine' | 'minimal'

const categoryTemplateMap: Record<string, TemplateType[]> = {
  'Technology': ['modern', 'classic'],
  'Entertainment': ['magazine', 'modern'],
  'Business': ['classic', 'minimal'],
  'Lifestyle': ['modern', 'magazine'],
  'Sports': ['classic', 'modern'],
  'World News': ['minimal', 'classic'],
  'Science': ['modern', 'minimal'],
  'Health': ['minimal', 'modern'],
}

export function getTemplateForPost(category: string, postId: string): TemplateType {
  // Get preferred templates for this category
  const categoryTemplates = categoryTemplateMap[category] || ['classic', 'modern']
  
  // Use post ID to deterministically select a template
  // This ensures the same post always gets the same template
  const hash = postId.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc)
  }, 0)
  
  const index = Math.abs(hash) % categoryTemplates.length
  return categoryTemplates[index]
}

export function getAllTemplateTypes(): TemplateType[] {
  return ['classic', 'modern', 'magazine', 'minimal']
}
