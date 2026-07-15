import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const variablesAndTypes: Topic = {
  id: 'variables-and-types',
  title: 'variables and types',
  order: 1,
  levels: [beginner, working, fluent, advanced, master],
}
