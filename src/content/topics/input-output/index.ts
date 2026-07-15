import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const inputOutput: Topic = {
  id: 'input-output',
  title: 'input and output',
  order: 2,
  levels: [beginner, working, fluent, advanced, master],
}
