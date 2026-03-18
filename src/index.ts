import {
  broncosContext,
  dolphinsContext,
  jaylenWaddle,
  waddleTradeEvent,
} from './data/scenarios/waddleToBroncos.js';
import { projectPlayer } from './models/projection/projectPlayer.js';

const result = projectPlayer(
  jaylenWaddle,
  dolphinsContext,
  broncosContext,
  waddleTradeEvent,
);

console.log(`Player: ${result.player.name} (${result.player.position})`);
console.log(`Event: ${result.event?.description ?? 'None'}`);
console.log(`Baseline PPR/G: ${result.baseline.pprPointsPerGame}`);
console.log(`Adjusted PPR/G: ${result.adjusted.pprPointsPerGame}`);
console.log(`Delta: ${result.deltaPprPointsPerGame}`);
console.log('Explanation:');
for (const bullet of result.explanation) {
  console.log(`- ${bullet}`);
}
