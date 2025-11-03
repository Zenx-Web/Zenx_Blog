export type BlogContentFormat =
  | 'news'
  | 'feature'
  | 'analysis'
  | 'opinion'
  | 'story'
  | 'guide'
  | 'listicle'

export const BLOG_CONTENT_FORMAT_OPTIONS: ReadonlyArray<{
  value: BlogContentFormat
  label: string
  description: string
}> = [
  {
    value: 'news',
    label: 'News report',
    description: 'Objective, time-sensitive update with sources and next steps.'
  },
  {
    value: 'feature',
    label: 'Feature profile',
    description: 'Human-centered narrative with scene-setting and interviews.'
  },
  {
    value: 'analysis',
    label: 'Deep analysis',
    description: 'Data-backed breakdown connecting context, trends, and implications.'
  },
  {
    value: 'opinion',
    label: 'Opinion / editorial',
    description: 'Clear stance backed by arguments, counterpoints, and call to action.'
  },
  {
    value: 'story',
    label: 'Narrative story',
    description: 'Character-driven storytelling with dialogue and plot arcs.'
  },
  {
    value: 'guide',
    label: 'How-to guide',
    description: 'Practical steps, checklists, and tips for doing something specific.'
  },
  {
    value: 'listicle',
    label: 'Listicle',
    description: 'Numbered highlights with punchy sections and quick takeaways.'
  }
]
