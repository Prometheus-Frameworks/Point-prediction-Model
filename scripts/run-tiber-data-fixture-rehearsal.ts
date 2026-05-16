import { runTiberDataFixtureRehearsal } from '../src/rehearsal/runTiberDataFixtureRehearsal.js';

const [, , fixturePath, outputDir] = process.argv;

const result = await runTiberDataFixtureRehearsal({
  fixture_path: fixturePath,
  ...(outputDir === undefined ? {} : { output_dir: outputDir }),
});

console.log(JSON.stringify(result.ok ? result.data : { errors: result.errors, warnings: result.warnings }, null, 2));

if (!result.ok) process.exitCode = 1;
