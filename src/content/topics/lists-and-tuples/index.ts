import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const listsAndTuples: Topic = {
  id: 'lists-and-tuples',
  title: 'lists and tuples',
  order: 9,
  levels: [beginner, working, fluent, advanced, master],
}
