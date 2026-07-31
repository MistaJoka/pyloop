/** The one content bundle: everything verify-content needs in a single
 *  esbuild entry, and the same modules the UI imports piecemeal. Keep this
 *  file free of src/ui/ imports — it runs under node. */
export { topics, topicById, levelOf } from './topics'
export { capstones, capstoneById, coveredTopicIds } from './capstones'
export { payoffValidators } from './capstones/payoff'
