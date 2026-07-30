/**
 * Serve Vite build from Workers static assets.
 * Replaces any previous Worker script bound to `gbf`.
 */
export default {
  async fetch(request, env) {
    return env.ASSETS.fetch(request)
  },
}
