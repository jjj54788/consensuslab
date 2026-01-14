import { seedPresetTemplates } from "./server/seedTemplates.ts";

console.log("Manually initializing preset templates...");
await seedPresetTemplates();
console.log("Done!");
process.exit(0);
