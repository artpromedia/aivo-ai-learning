/**
 * `@aivo/skill-graphs` — static, standards-anchored curriculum graphs.
 *
 * v0.1 ships seed graphs for CCSS-Math K and NGSS K–2 Physical Science.
 * Future versions will cover the rest of K–12 Math, ELA, NGSS, and SEL.
 */
export type {
  FrameworkId,
  FrameworkRef,
  Subject,
  GradeBand,
  Skill,
  SkillGraph,
  GraphIssue,
} from "./types.js";

export {
  validateGraph,
  indexGraph,
  getSkill,
  topologicalSort,
  findByFrameworkCode,
  prerequisiteClosure,
} from "./graph.js";

export { ccssMathKindergarten } from "./seeds/ccss-math-k.js";
export { ngssK2PhysicalScience } from "./seeds/ngss-k2-physical-science.js";

import { ccssMathKindergarten } from "./seeds/ccss-math-k.js";
import { ngssK2PhysicalScience } from "./seeds/ngss-k2-physical-science.js";
import type { SkillGraph } from "./types.js";

/** All seed graphs that ship with this package, in registration order. */
export const SEED_GRAPHS: readonly SkillGraph[] = [
  ccssMathKindergarten,
  ngssK2PhysicalScience,
];

/** Look up a seed graph by id. Returns `undefined` if not found. */
export function getSeedGraph(id: string): SkillGraph | undefined {
  return SEED_GRAPHS.find((g) => g.id === id);
}
