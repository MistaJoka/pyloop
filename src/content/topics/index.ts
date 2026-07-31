import type { LevelId, Topic } from '../types'
import { variablesAndTypes } from './variables-and-types'
import { inputOutput } from './input-output'
import { operators } from './operators'
import { conditionals } from './conditionals'
import { forLoops } from './for-loops'
import { whileLoops } from './while-loops'
import { functions } from './functions'
import { strings } from './strings'
import { listsAndTuples } from './lists-and-tuples'
import { dictsAndSets } from './dicts-and-sets'
import { files } from './files'
import { exceptions } from './exceptions'
import { classes } from './classes'

/** Add a topic here and it appears on the map. Nothing else to touch.
 *  `order` is course order; the array order doesn't matter. */
export const topics: Topic[] = [
  variablesAndTypes,
  inputOutput,
  operators,
  conditionals,
  forLoops,
  whileLoops,
  functions,
  strings,
  listsAndTuples,
  dictsAndSets,
  files,
  exceptions,
  classes,
].sort((a, b) => a.order - b.order)

export const topicById = (id: string) => topics.find((t) => t.id === id)

export const levelOf = (topic: Topic, level: LevelId) =>
  topic.levels.find((l) => l.level === level)
