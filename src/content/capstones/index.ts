import type { Capstone, CapstoneId } from './types'
import { life } from './life'

/** Add a capstone here and it appears in the catalog. Nothing else to touch.
 *  Array order is display order — course-progression order, Life first. */
export const capstones: Capstone[] = [life]

export const capstoneById = (id: CapstoneId) => capstones.find((c) => c.id === id)

/** Every topic at least one stage of these capstones stands on — what the
 *  catalog's coverage line and verify-content's coverage gate both read. */
export function coveredTopicIds(cs: Capstone[]): Set<string> {
  const ids = new Set<string>()
  for (const c of cs) for (const s of c.stages) for (const r of s.topicRefs) ids.add(r.topicId)
  return ids
}
