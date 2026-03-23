#!/usr/bin/env tsx

import { contentManagementService } from "../lib/content-management-service";

const seedContent = [
  {
    id: "mathematics-1-introduction",
    text: "Introduction to numbers, counting, and simple arithmetic for Grade 1 learners.",
    metadata: {
      subject: "mathematics",
      grade: 1,
      chapter: "Introduction",
    },
  },
  {
    id: "science-5-living-things",
    text: "Basic science notes on living things, plants, and animals for Grade 5 learners.",
    metadata: {
      subject: "science",
      grade: 5,
      chapter: "Living Things",
    },
  },
];

async function main() {
  await contentManagementService.initialize();
  await contentManagementService.addMultipleContent(seedContent);
  const stats = await contentManagementService.getContentStatistics();
  console.log("Seed content imported successfully.");
  console.log(JSON.stringify(stats, null, 2));
}

if (require.main === module) {
  main().catch((error) => {
    console.error("Content ingestion failed:", error);
    process.exit(1);
  });
}
