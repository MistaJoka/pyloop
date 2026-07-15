import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const files: Topic = {
  id: 'files',
  title: 'files',
  order: 11,
  levels: [beginner, working, fluent, advanced, master],
}
