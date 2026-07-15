import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const whileLoops: Topic = {
  id: 'while-loops',
  title: 'while loops',
  order: 6,
  levels: [beginner, working, fluent, advanced, master],
}
