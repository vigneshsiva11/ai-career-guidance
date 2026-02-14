#!/usr/bin/env tsx

// Educational Content Ingestion Script
// This script populates the vector database with educational content

import { contentManagementService } from "../lib/content-management-service";
import { educationalContent } from "../lib/educational-content";

interface IngestionOptions {
  clearExisting?: boolean;
  batchSize?: number;
  dryRun?: boolean;
  verbose?: boolean;
}

class EducationalContentIngestion {
  private options: IngestionOptions;

  constructor(options: IngestionOptions = {}) {
    this.options = {
      clearExisting: false,
      batchSize: 50,
      dryRun: false,
      verbose: false,
      ...options,
    };
  }

  async run(): Promise<void> {
    console.log("🚀 Starting Educational Content Ingestion...\n");

    try {
      // Initialize the content management service
      console.log("📋 Initializing content management service...");
      await contentManagementService.initialize();

      // Show current statistics
      await this.showCurrentStatistics();

      // Clear existing content if requested
      if (this.options.clearExisting) {
        console.log("🗑️  Clearing existing content...");
        if (!this.options.dryRun) {
          await contentManagementService.clearAllContent();
        }
        console.log("✅ Existing content cleared\n");
      }

      // Ingest educational content
      await this.ingestContent();

      // Optionally seed syllabus after content if flag provided
      if (process.argv.includes("--seed-syllabus")) {
        const boardArg = process.argv.find((a) => a.startsWith("--board="));
        const langArg = process.argv.find((a) => a.startsWith("--language="));
        const board = boardArg ? boardArg.split("=")[1] : undefined;
        const language = langArg ? langArg.split("=")[1] : undefined;
        console.log(
          "📘 Seeding syllabus (Classes 1–12)",
          board ? `for ${board}` : ""
        );
        if (!this.options.dryRun) {
          await contentManagementService.initializeWithSyllabus({
            board,
            language,
          });
        }
      }

      // Show final statistics
      await this.showFinalStatistics();

      console.log("🎉 Educational content ingestion completed successfully!");
    } catch (error) {
      console.error("❌ Error during ingestion:", error);
      process.exit(1);
    }
  }

  private async showCurrentStatistics(): Promise<void> {
    try {
      const stats = await contentManagementService.getContentStatistics();
      console.log("📊 Current Content Statistics:");
      console.log(`   Total content pieces: ${stats.totalContent}`);
      console.log(`   Grades covered: ${Object.keys(stats.byGrade).length}`);
      console.log(
        `   Subjects covered: ${Object.keys(stats.bySubject).length}`
      );
      console.log(
        `   Chapters covered: ${Object.keys(stats.byChapter).length}\n`
      );
    } catch (error) {
      console.log("📊 No existing content found (fresh start)\n");
    }
  }

  private async ingestContent(): Promise<void> {
    console.log("📚 Ingesting educational content...");

    if (this.options.dryRun) {
      console.log("🔍 DRY RUN MODE - No actual ingestion will occur");
      console.log(
        `   Would ingest ${educationalContent.length} content pieces`
      );
      return;
    }

    const totalContent = educationalContent.length;
    const batchSize = this.options.batchSize;
    const totalBatches = Math.ceil(totalContent / batchSize);

    console.log(`   Total content pieces: ${totalContent}`);
    console.log(`   Batch size: ${batchSize}`);
    console.log(`   Total batches: ${totalBatches}\n`);

    for (let i = 0; i < totalBatches; i++) {
      const startIndex = i * batchSize;
      const endIndex = Math.min(startIndex + batchSize, totalContent);
      const batch = educationalContent.slice(startIndex, endIndex);

      console.log(
        `📦 Processing batch ${i + 1}/${totalBatches} (${
          batch.length
        } items)...`
      );

      try {
        await contentManagementService.addMultipleContent(
          batch.map((c) => ({
            id: c.id,
            text: c.text,
            metadata: c.metadata as any,
          }))
        );
        console.log(`✅ Batch ${i + 1} completed successfully`);

        if (this.options.verbose) {
          batch.forEach((content, index) => {
            console.log(
              `   ${startIndex + index + 1}. ${content.id} - ${
                content.metadata?.subject
              } Grade ${content.metadata?.grade}`
            );
          });
        }

        // Add a small delay between batches to avoid rate limiting
        if (i < totalBatches - 1) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`❌ Error processing batch ${i + 1}:`, error);
        throw error;
      }
    }

    console.log("\n✅ All content ingested successfully!");
  }

  private async showFinalStatistics(): Promise<void> {
    console.log("\n📊 Final Content Statistics:");

    try {
      const stats = await contentManagementService.getContentStatistics();

      console.log(`   Total content pieces: ${stats.totalContent}`);
      console.log("\n   Content by Grade:");
      Object.entries(stats.byGrade)
        .sort(([a], [b]) => parseInt(a) - parseInt(b))
        .forEach(([grade, count]) => {
          console.log(`     Grade ${grade}: ${count} pieces`);
        });

      console.log("\n   Content by Subject:");
      Object.entries(stats.bySubject)
        .sort(([a], [b]) => a.localeCompare(b))
        .forEach(([subject, count]) => {
          console.log(`     ${subject}: ${count} pieces`);
        });

      console.log("\n   Content by Chapter (Top 10):");
      Object.entries(stats.byChapter)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([chapter, count]) => {
          console.log(`     ${chapter}: ${count} pieces`);
        });
    } catch (error) {
      console.error("❌ Error getting final statistics:", error);
    }
  }

  // Test the ingestion with a small sample
  async testIngestion(): Promise<void> {
    console.log("🧪 Testing ingestion with sample content...\n");

    const sampleContent = educationalContent.slice(0, 5);
    console.log(`Testing with ${sampleContent.length} sample content pieces:`);

    sampleContent.forEach((content, index) => {
      console.log(
        `   ${index + 1}. ${content.id} - ${content.metadata?.subject} Grade ${
          content.metadata?.grade
        }`
      );
    });

    try {
      await contentManagementService.initialize();
      await contentManagementService.addMultipleContent(
        sampleContent.map((c) => ({
          id: c.id,
          text: c.text,
          metadata: c.metadata as any,
        }))
      );
      console.log("\n✅ Test ingestion successful!");

      // Test search functionality
      console.log("\n🔍 Testing search functionality...");
      const searchResults = await contentManagementService.searchContent(
        "numbers",
        { grade: 1 },
        3
      );
      console.log(
        `Found ${searchResults.length} results for "numbers" in Grade 1:`
      );
      searchResults.forEach((result, index) => {
        console.log(
          `   ${index + 1}. ${result.id} - ${result.text.substring(0, 100)}...`
        );
      });
    } catch (error) {
      console.error("❌ Test ingestion failed:", error);
      throw error;
    }
  }

  // Validate content before ingestion
  async validateContent(): Promise<void> {
    console.log("🔍 Validating educational content...\n");

    const errors: string[] = [];
    const warnings: string[] = [];

    educationalContent.forEach((content, index) => {
      // Check required fields
      if (!content.id) {
        errors.push(`Content ${index + 1}: Missing ID`);
      }
      if (!content.text || content.text.trim() === "") {
        errors.push(`Content ${index + 1}: Missing or empty text`);
      }
      if (!content.metadata) {
        errors.push(`Content ${index + 1}: Missing metadata`);
      } else {
        if (!content.metadata.subject) {
          errors.push(`Content ${index + 1}: Missing subject`);
        }
        if (
          !content.metadata.grade ||
          content.metadata.grade < 1 ||
          content.metadata.grade > 12
        ) {
          errors.push(
            `Content ${index + 1}: Invalid grade (${content.metadata.grade})`
          );
        }
        if (!content.metadata.chapter) {
          errors.push(`Content ${index + 1}: Missing chapter`);
        }
      }

      // Check for duplicates
      const duplicateIds = educationalContent.filter(
        (c) => c.id === content.id
      );
      if (duplicateIds.length > 1) {
        errors.push(`Content ${index + 1}: Duplicate ID (${content.id})`);
      }

      // Check text length
      if (content.text && content.text.length < 50) {
        warnings.push(
          `Content ${index + 1}: Text is very short (${
            content.text.length
          } characters)`
        );
      }
    });

    console.log(`📊 Validation Results:`);
    console.log(`   Total content pieces: ${educationalContent.length}`);
    console.log(`   Errors: ${errors.length}`);
    console.log(`   Warnings: ${warnings.length}`);

    if (errors.length > 0) {
      console.log("\n❌ Errors found:");
      errors.forEach((error) => console.log(`   - ${error}`));
    }

    if (warnings.length > 0) {
      console.log("\n⚠️  Warnings:");
      warnings.forEach((warning) => console.log(`   - ${warning}`));
    }

    if (errors.length === 0) {
      console.log("\n✅ Content validation passed!");
    } else {
      console.log("\n❌ Content validation failed!");
      process.exit(1);
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);

  const options: IngestionOptions = {
    clearExisting: args.includes("--clear"),
    batchSize: parseInt(
      args.find((arg) => arg.startsWith("--batch-size="))?.split("=")[1] || "50"
    ),
    dryRun: args.includes("--dry-run"),
    verbose: args.includes("--verbose"),
  };

  const ingestion = new EducationalContentIngestion(options);

  if (args.includes("--test")) {
    await ingestion.testIngestion();
  } else if (args.includes("--validate")) {
    await ingestion.validateContent();
  } else {
    await ingestion.run();
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main().catch(console.error);
}

export { EducationalContentIngestion };
