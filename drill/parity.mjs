// drill/parity.mjs — [DRILL #408] throwaway parity fixture for the #303 red-join drill.
// Not a real feature. Do not merge; teardown after the drill.
export function label(n) {
  // Returns 'even' for even integers, 'odd' for odd integers (#408 spec).
  return n % 2 === 0 ? 'even' : 'odd';
}
