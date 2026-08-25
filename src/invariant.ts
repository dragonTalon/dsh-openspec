/**
 * Package-owned invariant companion for `@dragonTalon/dsh-openspec`.
 * @module @dragonTalon/dsh-openspec/invariant
 */

/* jscpd:ignore-start */
import type { Context } from '@deepseek-ai/cordis'
import type { InvariantInstaller } from '@deepseek-ai/dsh-invariants'

const PACKAGE_NAME = '@dragonTalon/dsh-openspec'

/** Cordis companion plugin name. */
export const name = 'dsh-openspec-invariant'
/** Service required before the companion can reserve package ownership. */
export const inject = ['invariants']

/**
 * No runtime invariant: the package registers skill content through the skill
 * registry, which already owns registration uniqueness, lifecycle, and
 * duplicate-name resolution. There is no independent mutable state to
 * cross-check here.
 */
const install: InvariantInstaller = () => {}

/**
 * Register this package's invariant companion.
 * @param ctx - Cordis context carrying the invariant service.
 * @returns the installed registration's disposer after setup succeeds.
 */
export const apply = (ctx: Context): Promise<() => void> =>
  Promise.resolve(ctx.invariants.register(PACKAGE_NAME, install))
/* jscpd:ignore-end */
