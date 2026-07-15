import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const conditionals: Topic = {
  id: 'conditionals',
  title: 'conditionals',
  order: 4,
  levels: [beginner, working, fluent, advanced, master],
}
