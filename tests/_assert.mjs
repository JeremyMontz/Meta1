// tests/_assert.mjs
// Tiny shared reporter for contract TCs — uniform failure format, no framework.
// Not a TC (no ".test." infix, and "_"-prefixed) so the runner never runs it.
export function makeReport(name) {
  const fails = [];
  return {
    check: (cond, msg) => { if (!cond) fails.push(msg); },
    done: (summary) => {
      console.log(summary);
      if (fails.length) {
        console.error(`\n${name}: ${fails.length} failure(s)`);
        for (const f of fails) console.error(`  x ${f}`);
        process.exit(1);
      }
      console.log(`${name}: ok`);
    },
  };
}
