import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const forLoops: Topic = {
  id: 'for-loops',
  title: 'for loops',
  order: 5,
  levels: [beginner, working, fluent, advanced, master],
}
