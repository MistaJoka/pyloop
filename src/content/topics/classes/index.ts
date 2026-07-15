import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const classes: Topic = {
  id: 'classes',
  title: 'classes',
  order: 13,
  levels: [beginner, working, fluent, advanced, master],
}
