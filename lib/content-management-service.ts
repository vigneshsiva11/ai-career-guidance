// Content Management Service for Educational RAG System
import { vectorDatabaseService, DocChunk } from "./vector-database-service";
import { educationalContent } from "./educational-content";

export interface ContentMetadata {
  subject: string;
  grade: number;
  chapter: string;
  topic?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  language?: string;
  tags?: string[];
  author?: string;
  lastUpdated?: Date;
  // Marks content as syllabus/curriculum outline to enable prioritized retrieval
  isSyllabus?: boolean;
  // Optional education board/curriculum tag
  board?: string;
}

export interface ContentSearchFilters {
  grade?: number;
  subject?: string;
  chapter?: string;
  topic?: string;
  difficulty?: string;
  tags?: string[];
}

export class ContentManagementService {
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await vectorDatabaseService.initialize();
      this.isInitialized = true;
      console.log("[Content Management] Service initialized successfully");
    } catch (error) {
      console.error("[Content Management] Initialization failed:", error);
      throw error;
    }
  }

  // Add new educational content
  async addContent(
    text: string,
    metadata: ContentMetadata,
    id?: string
  ): Promise<string> {
    await this.initialize();

    const contentId = id || this.generateContentId(metadata);

    const docChunk: DocChunk = {
      id: contentId,
      text: text.trim(),
      metadata: {
        ...metadata,
        lastUpdated: new Date().toISOString(),
      },
    };

    try {
      await vectorDatabaseService.upsertDocuments([docChunk]);
      console.log(`[Content Management] Added content: ${contentId}`);
      return contentId;
    } catch (error) {
      console.error("[Content Management] Error adding content:", error);
      throw error;
    }
  }

  // Add multiple content pieces
  async addMultipleContent(
    contents: Array<{
      text: string;
      metadata: ContentMetadata;
      id?: string;
    }>
  ): Promise<string[]> {
    await this.initialize();

    const docChunks: DocChunk[] = contents.map((content) => ({
      id: content.id || this.generateContentId(content.metadata),
      text: content.text.trim(),
      metadata: {
        ...content.metadata,
        lastUpdated: new Date().toISOString(),
      },
    }));

    try {
      await vectorDatabaseService.upsertDocuments(docChunks);
      const ids = docChunks.map((chunk) => chunk.id);
      console.log(`[Content Management] Added ${ids.length} content pieces`);
      return ids;
    } catch (error) {
      console.error(
        "[Content Management] Error adding multiple content:",
        error
      );
      throw error;
    }
  }

  // Update existing content
  async updateContent(
    id: string,
    text: string,
    metadata: Partial<ContentMetadata>
  ): Promise<void> {
    await this.initialize();

    const docChunk: DocChunk = {
      id,
      text: text.trim(),
      metadata: {
        ...metadata,
        lastUpdated: new Date().toISOString(),
      },
    };

    try {
      await vectorDatabaseService.upsertDocuments([docChunk]);
      console.log(`[Content Management] Updated content: ${id}`);
    } catch (error) {
      console.error("[Content Management] Error updating content:", error);
      throw error;
    }
  }

  // Delete content
  async deleteContent(id: string): Promise<void> {
    await this.initialize();

    try {
      await vectorDatabaseService.deleteDocument(id);
      console.log(`[Content Management] Deleted content: ${id}`);
    } catch (error) {
      console.error("[Content Management] Error deleting content:", error);
      throw error;
    }
  }

  // Search content
  async searchContent(
    query: string,
    filters: ContentSearchFilters = {},
    topK: number = 10
  ): Promise<DocChunk[]> {
    await this.initialize();

    try {
      const results = await vectorDatabaseService.searchSimilar(query, {
        topK,
        grade: filters.grade,
        subject: filters.subject,
        chapter: filters.chapter,
        filter: {
          ...(filters.topic && { topic: filters.topic }),
          ...(filters.difficulty && { difficulty: filters.difficulty }),
          ...(filters.tags && { tags: { $in: filters.tags } }),
        },
      });

      return results.map((result) => ({
        id: result.id,
        text: result.text || "",
        metadata: result.metadata,
      }));
    } catch (error) {
      console.error("[Content Management] Error searching content:", error);
      throw error;
    }
  }

  // Get content by ID
  async getContentById(id: string): Promise<DocChunk | null> {
    await this.initialize();

    try {
      // Since Pinecone doesn't have a direct get by ID, we'll search with a unique query
      const results = await vectorDatabaseService.searchSimilar(id, {
        topK: 1,
        filter: { id: id },
      });

      if (results.length > 0) {
        return {
          id: results[0].id,
          text: results[0].text || "",
          metadata: results[0].metadata,
        };
      }

      return null;
    } catch (error) {
      console.error("[Content Management] Error getting content by ID:", error);
      throw error;
    }
  }

  // Get content statistics
  async getContentStatistics(): Promise<{
    totalContent: number;
    byGrade: { [grade: number]: number };
    bySubject: { [subject: string]: number };
    byChapter: { [chapter: string]: number };
  }> {
    await this.initialize();

    try {
      const stats = await vectorDatabaseService.getIndexStats();

      // Get sample content to analyze metadata
      const sampleResults = await vectorDatabaseService.searchSimilar("", {
        topK: 1000,
      });

      const byGrade: { [grade: number]: number } = {};
      const bySubject: { [subject: string]: number } = {};
      const byChapter: { [chapter: string]: number } = {};

      sampleResults.forEach((result) => {
        const metadata = result.metadata;
        if (metadata) {
          if (metadata.grade) {
            byGrade[metadata.grade] = (byGrade[metadata.grade] || 0) + 1;
          }
          if (metadata.subject) {
            bySubject[metadata.subject] =
              (bySubject[metadata.subject] || 0) + 1;
          }
          if (metadata.chapter) {
            byChapter[metadata.chapter] =
              (byChapter[metadata.chapter] || 0) + 1;
          }
        }
      });

      return {
        totalContent: stats.totalVectors,
        byGrade,
        bySubject,
        byChapter,
      };
    } catch (error) {
      console.error("[Content Management] Error getting statistics:", error);
      throw error;
    }
  }

  // Initialize with default educational content
  async initializeWithDefaultContent(): Promise<void> {
    await this.initialize();

    try {
      console.log(
        "[Content Management] Initializing with default educational content..."
      );
      await vectorDatabaseService.upsertDocuments(educationalContent);
      console.log(
        `[Content Management] Initialized with ${educationalContent.length} default content pieces`
      );
    } catch (error) {
      console.error(
        "[Content Management] Error initializing with default content:",
        error
      );
      throw error;
    }
  }

  // Initialize vector DB with syllabus outlines for Classes 1-12 across core subjects
  async initializeWithSyllabus(
    params: { board?: string; language?: string } = {}
  ): Promise<void> {
    await this.initialize();
    const board = params.board || "generic";
    const language = params.language || "en";

    try {
      console.log(
        "[Content Management] Initializing syllabus (Classes 1-12)..."
      );

      const subjects = [
        "mathematics",
        "science",
        "english",
        "history",
        "geography",
        // High school streams (will be filtered by chapters availability)
        "physics",
        "chemistry",
        "biology",
      ];

      const docChunks: DocChunk[] = [];

      for (let grade = 1; grade <= 12; grade++) {
        for (const subject of subjects) {
          const chapters = this.getCommonChapters(subject, grade, board);
          if (!chapters || chapters.length === 0) continue;

          for (const chapter of chapters) {
            const id = this.generateContentId({ subject, grade, chapter });
            const objectives = this.getSuggestedTopics(subject, grade);
            const text = [
              `Syllabus Outline — Class ${grade} — ${subject} — ${chapter}`,
              "Learning Objectives:",
              ...objectives
                .slice(0, 5)
                .map((t, i) => `${i + 1}. ${t.replace(/_/g, " ")}`),
              "Assessment Focus:",
              "- Concept understanding",
              "- Simple applications with examples appropriate to the grade",
              "- Short explanations using clear language",
            ].join("\n");

            docChunks.push({
              id,
              text,
              metadata: {
                subject,
                grade,
                chapter,
                topic: chapter,
                language,
                isSyllabus: true,
                board,
                lastUpdated: new Date().toISOString(),
              },
            });
          }
        }
      }

      if (docChunks.length > 0) {
        await vectorDatabaseService.upsertDocuments(docChunks);
        console.log(
          `[Content Management] Syllabus initialized with ${docChunks.length} entries`
        );
      } else {
        console.warn("[Content Management] No syllabus chapters generated");
      }
    } catch (error) {
      console.error("[Content Management] Error initializing syllabus:", error);
      throw error;
    }
  }

  // Clear all content
  async clearAllContent(): Promise<void> {
    await this.initialize();

    try {
      await vectorDatabaseService.clearIndex();
      console.log("[Content Management] Cleared all content");
    } catch (error) {
      console.error("[Content Management] Error clearing content:", error);
      throw error;
    }
  }

  // Export content to JSON
  async exportContent(filters: ContentSearchFilters = {}): Promise<DocChunk[]> {
    await this.initialize();

    try {
      // Get all content by searching with empty query and high topK
      const results = await vectorDatabaseService.searchSimilar("", {
        topK: 10000, // High number to get all content
        grade: filters.grade,
        subject: filters.subject,
        chapter: filters.chapter,
        filter: {
          ...(filters.topic && { topic: filters.topic }),
          ...(filters.difficulty && { difficulty: filters.difficulty }),
          ...(filters.tags && { tags: { $in: filters.tags } }),
        },
      });

      return results.map((result) => ({
        id: result.id,
        text: result.text || "",
        metadata: result.metadata,
      }));
    } catch (error) {
      console.error("[Content Management] Error exporting content:", error);
      throw error;
    }
  }

  // Import content from JSON
  async importContent(contents: DocChunk[]): Promise<void> {
    await this.initialize();

    try {
      await vectorDatabaseService.upsertDocuments(contents);
      console.log(
        `[Content Management] Imported ${contents.length} content pieces`
      );
    } catch (error) {
      console.error("[Content Management] Error importing content:", error);
      throw error;
    }
  }

  // Validate content metadata
  validateContentMetadata(metadata: ContentMetadata): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!metadata.subject || metadata.subject.trim() === "") {
      errors.push("Subject is required");
    }

    if (!metadata.grade || metadata.grade < 1 || metadata.grade > 12) {
      errors.push("Grade must be between 1 and 12");
    }

    if (!metadata.chapter || metadata.chapter.trim() === "") {
      errors.push("Chapter is required");
    }

    if (
      metadata.difficulty &&
      !["beginner", "intermediate", "advanced"].includes(metadata.difficulty)
    ) {
      errors.push("Difficulty must be beginner, intermediate, or advanced");
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Generate unique content ID
  private generateContentId(metadata: ContentMetadata): string {
    const subject = metadata.subject.toLowerCase().replace(/\s+/g, "-");
    const grade = metadata.grade;
    const chapter = metadata.chapter.toLowerCase().replace(/\s+/g, "-");
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);

    return `${subject}-${grade}-${chapter}-${timestamp}-${random}`;
  }

  // Get available subjects
  getAvailableSubjects(): string[] {
    return [
      "mathematics",
      "science",
      "physics",
      "chemistry",
      "biology",
      "english",
      "history",
      "geography",
      "social-science",
      "computer-science",
      "art",
      "music",
      "physical-education",
    ];
  }

  // Get available grades
  getAvailableGrades(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
  }

  // Get content suggestions based on existing content
  async getContentSuggestions(
    grade: number,
    subject: string
  ): Promise<{
    missingChapters: string[];
    suggestedTopics: string[];
  }> {
    await this.initialize();

    try {
      const existingContent = await this.searchContent(
        "",
        { grade, subject },
        1000
      );
      const existingChapters = new Set(
        existingContent
          .map((content) => content.metadata?.chapter)
          .filter(Boolean)
      );

      // Define common chapters for each subject and grade
      const commonChapters = this.getCommonChapters(subject, grade);
      const missingChapters = commonChapters.filter(
        (chapter) => !existingChapters.has(chapter)
      );

      const suggestedTopics = this.getSuggestedTopics(subject, grade);

      return {
        missingChapters,
        suggestedTopics,
      };
    } catch (error) {
      console.error(
        "[Content Management] Error getting content suggestions:",
        error
      );
      throw error;
    }
  }

  private getCommonChapters(
    subject: string,
    grade: number,
    board: string = "generic"
  ): string[] {
    const normalizedBoard = (board || "generic").toLowerCase();
    const generic: { [key: string]: { [grade: number]: string[] } } = {
      mathematics: {
        1: ["Numbers", "Addition", "Subtraction", "Shapes", "Measurement"],
        2: [
          "Place Value",
          "Multiplication",
          "Division",
          "Fractions",
          "Geometry",
        ],
        3: [
          "Fractions",
          "Decimals",
          "Measurement",
          "Geometry",
          "Data Handling",
        ],
        4: [
          "Large Numbers",
          "Fractions",
          "Decimals",
          "Geometry",
          "Measurement",
        ],
        5: ["Large Numbers", "Fractions", "Decimals", "Percentage", "Geometry"],
        6: ["Integers", "Fractions", "Decimals", "Algebra", "Geometry"],
        7: ["Integers", "Fractions", "Algebra", "Geometry", "Data Handling"],
        8: [
          "Rational Numbers",
          "Linear Equations",
          "Geometry",
          "Data Handling",
          "Mensuration",
        ],
        9: [
          "Number Systems",
          "Polynomials",
          "Coordinate Geometry",
          "Linear Equations",
          "Triangles",
        ],
        10: [
          "Real Numbers",
          "Polynomials",
          "Pair of Linear Equations",
          "Triangles",
          "Circles",
        ],
        11: [
          "Sets",
          "Relations and Functions",
          "Trigonometric Functions",
          "Complex Numbers",
          "Linear Inequalities",
        ],
        12: [
          "Relations and Functions",
          "Inverse Trigonometric Functions",
          "Matrices",
          "Determinants",
          "Continuity",
        ],
      },
      science: {
        1: ["Plants", "Animals", "Human Body", "Weather", "Materials"],
        2: ["Plants", "Animals", "Human Body", "Weather", "Materials"],
        3: ["Plants", "Animals", "Human Body", "Weather", "Materials"],
        4: ["Plants", "Animals", "Human Body", "Weather", "Materials"],
        5: ["Plants", "Animals", "Human Body", "Weather", "Materials"],
        6: [
          "Food",
          "Materials",
          "Separation of Substances",
          "Changes Around Us",
          "Getting to Know Plants",
        ],
        7: [
          "Nutrition in Plants",
          "Nutrition in Animals",
          "Fibre to Fabric",
          "Heat",
          "Acids, Bases and Salts",
        ],
        8: [
          "Crop Production",
          "Microorganisms",
          "Synthetic Fibres",
          "Metals and Non-metals",
          "Coal and Petroleum",
        ],
        9: [
          "Matter in Our Surroundings",
          "Is Matter Around Us Pure",
          "Atoms and Molecules",
          "Structure of Atom",
          "The Fundamental Unit of Life",
        ],
        10: [
          "Light",
          "Human Eye",
          "Electricity",
          "Magnetic Effects",
          "Sources of Energy",
        ],
      },
    };

    const cbse: { [key: string]: { [grade: number]: string[] } } = {
      mathematics: {
        9: [
          "Number Systems",
          "Polynomials",
          "Coordinate Geometry",
          "Linear Equations in Two Variables",
          "Triangles",
        ],
        10: [
          "Real Numbers",
          "Polynomials",
          "Pair of Linear Equations in Two Variables",
          "Triangles",
          "Circles",
        ],
        11: [
          "Sets",
          "Relations and Functions",
          "Trigonometric Functions",
          "Complex Numbers",
        ],
        12: [
          "Relations and Functions",
          "Inverse Trigonometric Functions",
          "Matrices",
          "Determinants",
          "Continuity and Differentiability",
        ],
      },
      science: generic.science,
      physics: {
        11: [
          "Units and Measurements",
          "Kinematics",
          "Laws of Motion",
          "Work, Energy and Power",
        ],
        12: [
          "Electrostatics",
          "Current Electricity",
          "Magnetic Effects",
          "Optics",
        ],
      },
      chemistry: {
        11: [
          "Some Basic Concepts of Chemistry",
          "Atomic Structure",
          "Chemical Bonding",
          "Thermodynamics",
        ],
        12: [
          "Solid State",
          "Solutions",
          "Electrochemistry",
          "Chemical Kinetics",
          "Organic Chemistry",
        ],
      },
      biology: {
        11: [
          "Diversity of Living Organisms",
          "Structural Organisation",
          "Cell Structure and Function",
        ],
        12: [
          "Reproduction",
          "Genetics and Evolution",
          "Biology and Human Welfare",
          "Biotechnology",
        ],
      },
    };

    const icse: { [key: string]: { [grade: number]: string[] } } = {
      mathematics: generic.mathematics,
      science: generic.science,
      physics: {
        10: [
          "Force, Work, Power and Energy",
          "Light",
          "Sound",
          "Electricity and Magnetism",
        ],
      },
      chemistry: {
        10: [
          "Periodic Table",
          "Chemical Bonding",
          "Acids, Bases and Salts",
          "Mole Concept and Stoichiometry",
        ],
      },
      biology: {
        10: [
          "Basic Biology",
          "Plant Physiology",
          "Human Anatomy and Physiology",
          "Health and Hygiene",
        ],
      },
    };

    const state: { [key: string]: { [grade: number]: string[] } } = generic;

    const boardMap: Record<string, typeof generic> = {
      generic,
      cbse: cbse as any,
      icse: icse as any,
      state: state as any,
    };

    const selected = boardMap[normalizedBoard] || generic;
    return selected[subject]?.[grade] || generic[subject]?.[grade] || [];
  }

  private getSuggestedTopics(subject: string, grade: number): string[] {
    const topicMap: { [key: string]: string[] } = {
      mathematics: [
        "basic_operations",
        "algebra",
        "geometry",
        "measurement",
        "data_handling",
        "number_system",
      ],
      science: [
        "living_things",
        "materials",
        "energy",
        "environment",
        "human_body",
        "earth_science",
      ],
      physics: [
        "mechanics",
        "thermodynamics",
        "waves",
        "electricity",
        "magnetism",
        "optics",
      ],
      chemistry: [
        "atomic_structure",
        "chemical_bonding",
        "reactions",
        "organic_chemistry",
        "physical_chemistry",
      ],
      biology: [
        "cell_biology",
        "genetics",
        "ecology",
        "physiology",
        "evolution",
        "taxonomy",
      ],
      english: [
        "grammar",
        "literature",
        "writing",
        "reading",
        "vocabulary",
        "communication",
      ],
      history: [
        "ancient_history",
        "medieval_history",
        "modern_history",
        "world_history",
        "indian_history",
      ],
      geography: [
        "physical_geography",
        "human_geography",
        "environmental_geography",
        "economic_geography",
      ],
    };

    return topicMap[subject] || [];
  }
}

// Singleton instance
export const contentManagementService = new ContentManagementService();
