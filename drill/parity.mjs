// drill/parity.mjs — [DRILL #408] throwaway parity fixture for the #303 red-join drill.
// Not a real feature. Do not merge; teardown after the drill.
export function label(n) {
  // BUG (intentional, #408 drill): inverted — returns 'odd' for even n and 'even' for odd.
  return n % 2 === 0 ? 'odd' : 'even';
}
