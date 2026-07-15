import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const operators: Topic = {
  id: 'operators',
  title: 'operators and expressions',
  order: 3,
  levels: [beginner, working, fluent, advanced, master],
}
