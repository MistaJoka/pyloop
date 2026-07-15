import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const dictsAndSets: Topic = {
  id: 'dicts-and-sets',
  title: 'dictionaries and sets',
  order: 10,
  levels: [beginner, working, fluent, advanced, master],
}
