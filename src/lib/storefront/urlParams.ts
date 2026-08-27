/**
 * Removing credential-bearing query parameters from a URL.
 *
 * The confirmation page has to RECEIVE the status/tracking token in the URL - it is
 * server-rendered, so the token must arrive with the request. Once the page exists the
 * token has done its job, and a URL is the least private part of a request:
 *
 *   * it stays in the address bar, so it is what a customer copies, bookmarks or shares
 *   * it stays in browser history, and in the history of any device that syncs it
 *   * it is the Referer on outbound clicks (mitigated by Referrer-Policy: no-referrer,
 *     but not every context honours it)
 *   * it lands in the access log of every proxy in front of the app
 *
 * Pure and separate from the component so the rewrite rule can be tested without a DOM:
 * the interesting cases are "what happens to the rest of the query string" and "what
 * happens when there is nothing to strip", and both are easy to get subtly wrong in a
 * way no one notices until a token is left in the bar.
 */

export interface StripResult {
  /** The path + query to replace the current history entry with. */
  url: string;
  /** False when nothing matched, so the caller can skip the history write entirely. */
  changed: boolean;
}

/**
 * Removes `names` from the query string of `href`.
 *
 * Everything else is preserved, including other parameters and their order, because a
 * page may legitimately depend on them. The hash is dropped deliberately: it is never
 * sent to the server, nothing here uses one, and carrying it would only add a case.
 */
export function stripSensitiveParams(href: string, names: readonly string[]): StripResult {
  const url = new URL(href);
  let changed = false;
  for (const name of names) {
    if (url.searchParams.has(name)) {
      url.searchParams.delete(name);
      changed = true;
    }
  }
  const search = url.searchParams.toString();
  return { url: `${url.pathname}${search === '' ? '' : `?${search}`}`, changed };
}
