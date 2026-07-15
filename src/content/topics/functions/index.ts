import type { Topic } from '../../types'
import { beginner } from './beginner'
import { working } from './working'
import { fluent } from './fluent'
import { advanced } from './advanced'
import { master } from './master'

export const functions: Topic = {
  id: 'functions',
  title: 'functions',
  order: 7,
  levels: [beginner, working, fluent, advanced, master],
}
