import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const exceptions: Topic = {
  id: 'exceptions',
  title: 'exceptions',
  order: 12,
  levels: [beginner, working, fluent, advanced, master],
}
