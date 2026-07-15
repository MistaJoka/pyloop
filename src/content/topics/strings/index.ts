import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const strings: Topic = {
  id: 'strings',
  title: 'strings',
  order: 8,
  levels: [beginner, working, fluent, advanced, master],
}
