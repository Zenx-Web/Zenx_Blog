// Shared utility for category colors
export function getCategoryColor(category: string): string {
  const colors: { [key: string]: string } = {
    'technology': 'bg-purple-100 text-purple-800',
    'Technology': 'bg-purple-100 text-purple-800',
    'entertainment': 'bg-yellow-100 text-yellow-800',
    'Entertainment': 'bg-yellow-100 text-yellow-800',
    'business': 'bg-blue-100 text-blue-800',
    'Business': 'bg-blue-100 text-blue-800',
    'lifestyle': 'bg-green-100 text-green-800',
    'Lifestyle': 'bg-green-100 text-green-800',
    'sports': 'bg-red-100 text-red-800',
    'Sports': 'bg-red-100 text-red-800',
    'world-news': 'bg-gray-100 text-gray-800',
    'World News': 'bg-gray-100 text-gray-800',
    'science': 'bg-indigo-100 text-indigo-800',
    'Science': 'bg-indigo-100 text-indigo-800',
    'health': 'bg-teal-100 text-teal-800',
    'Health': 'bg-teal-100 text-teal-800'
  }
  return colors[category] || 'bg-gray-100 text-gray-800'
}
