export interface DocChunk {
  id: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface ContentMetadata {
  subject: string;
  grade: number;
  chapter: string;
  topic?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  language?: string;
  tags?: string[];
  author?: string;
  lastUpdated?: Date | string;
  isSyllabus?: boolean;
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

class ContentManagementService {
  private isInitialized = false;
  private store = new Map<string, DocChunk>();

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async addContent(text: string, metadata: ContentMetadata, id?: string): Promise<string> {
    await this.initialize();
    const contentId = id || this.generateContentId(metadata);
    this.store.set(contentId, {
      id: contentId,
      text: text.trim(),
      metadata: {
        ...metadata,
        lastUpdated: new Date().toISOString(),
      },
    });
    return contentId;
  }

  async addMultipleContent(
    contents: Array<{
      text: string;
      metadata: ContentMetadata;
      id?: string;
    }>,
  ): Promise<string[]> {
    await this.initialize();
    const ids: string[] = [];
    for (const content of contents) {
      ids.push(await this.addContent(content.text, content.metadata, content.id));
    }
    return ids;
  }

  async updateContent(id: string, text: string, metadata: Partial<ContentMetadata>): Promise<void> {
    await this.initialize();
    const existing = this.store.get(id);
    this.store.set(id, {
      id,
      text: text.trim(),
      metadata: {
        ...(existing?.metadata || {}),
        ...metadata,
        lastUpdated: new Date().toISOString(),
      },
    });
  }

  async deleteContent(id: string): Promise<void> {
    await this.initialize();
    this.store.delete(id);
  }

  async searchContent(
    query: string,
    filters: ContentSearchFilters = {},
    topK = 10,
  ): Promise<DocChunk[]> {
    await this.initialize();
    const normalizedQuery = String(query || "").toLowerCase().trim();

    const matches = Array.from(this.store.values()).filter((item) => {
      const metadata = item.metadata || {};
      const textMatch =
        !normalizedQuery ||
        item.text.toLowerCase().includes(normalizedQuery) ||
        item.id.toLowerCase().includes(normalizedQuery);

      if (!textMatch) return false;
      if (filters.grade && Number(metadata.grade) !== filters.grade) return false;
      if (filters.subject && String(metadata.subject || "").toLowerCase() !== filters.subject.toLowerCase()) {
        return false;
      }
      if (filters.chapter && String(metadata.chapter || "").toLowerCase() !== filters.chapter.toLowerCase()) {
        return false;
      }
      if (filters.topic && String(metadata.topic || "").toLowerCase() !== filters.topic.toLowerCase()) {
        return false;
      }
      if (filters.difficulty && String(metadata.difficulty || "").toLowerCase() !== filters.difficulty.toLowerCase()) {
        return false;
      }
      if (filters.tags?.length) {
        const tags = Array.isArray(metadata.tags) ? metadata.tags.map(String) : [];
        if (!filters.tags.some((tag) => tags.includes(tag))) return false;
      }

      return true;
    });

    return matches.slice(0, topK);
  }

  async getContentById(id: string): Promise<DocChunk | null> {
    await this.initialize();
    return this.store.get(id) || null;
  }

  async getContentStatistics(): Promise<{
    totalContent: number;
    byGrade: { [grade: number]: number };
    bySubject: { [subject: string]: number };
    byChapter: { [chapter: string]: number };
  }> {
    await this.initialize();

    const byGrade: { [grade: number]: number } = {};
    const bySubject: { [subject: string]: number } = {};
    const byChapter: { [chapter: string]: number } = {};

    for (const item of this.store.values()) {
      const metadata = item.metadata || {};
      if (metadata.grade) byGrade[metadata.grade] = (byGrade[metadata.grade] || 0) + 1;
      if (metadata.subject) bySubject[metadata.subject] = (bySubject[metadata.subject] || 0) + 1;
      if (metadata.chapter) byChapter[metadata.chapter] = (byChapter[metadata.chapter] || 0) + 1;
    }

    return {
      totalContent: this.store.size,
      byGrade,
      bySubject,
      byChapter,
    };
  }

  async initializeWithDefaultContent(): Promise<void> {
    await this.initialize();
  }

  async initializeWithSyllabus(params: { board?: string; language?: string } = {}): Promise<void> {
    await this.initialize();
    for (let grade = 1; grade <= 12; grade += 1) {
      await this.addContent(
        `Syllabus outline for Grade ${grade} Mathematics.`,
        {
          subject: "mathematics",
          grade,
          chapter: `Grade ${grade} overview`,
          language: params.language || "en",
          board: params.board || "generic",
          isSyllabus: true,
        },
      );
    }
  }

  async clearAllContent(): Promise<void> {
    await this.initialize();
    this.store.clear();
  }

  async exportContent(filters: ContentSearchFilters = {}): Promise<DocChunk[]> {
    return this.searchContent("", filters, 10000);
  }

  async importContent(contents: DocChunk[]): Promise<void> {
    await this.initialize();
    for (const item of contents) {
      this.store.set(item.id, item);
    }
  }

  validateContentMetadata(metadata: ContentMetadata): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!metadata.subject?.trim()) errors.push("Subject is required");
    if (!metadata.grade || metadata.grade < 1 || metadata.grade > 12) {
      errors.push("Grade must be between 1 and 12");
    }
    if (!metadata.chapter?.trim()) errors.push("Chapter is required");
    if (
      metadata.difficulty &&
      !["beginner", "intermediate", "advanced"].includes(metadata.difficulty)
    ) {
      errors.push("Difficulty must be beginner, intermediate, or advanced");
    }
    return { isValid: errors.length === 0, errors };
  }

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
    ];
  }

  getAvailableGrades(): number[] {
    return Array.from({ length: 12 }, (_, index) => index + 1);
  }

  async getContentSuggestions(
    grade: number,
    subject: string,
  ): Promise<{ missingChapters: string[]; suggestedTopics: string[] }> {
    await this.initialize();
    const chapterLabel = `Grade ${grade} overview`;
    const existing = await this.searchContent("", { grade, subject }, 1000);
    const existingChapters = new Set(existing.map((item) => String(item.metadata?.chapter || "")));
    const defaultChapters = [chapterLabel, "Introduction", "Practice", "Revision"];

    return {
      missingChapters: defaultChapters.filter((chapter) => !existingChapters.has(chapter)),
      suggestedTopics: ["concepts", "examples", "practice questions", "revision notes"],
    };
  }

  private generateContentId(metadata: ContentMetadata): string {
    const subject = metadata.subject.toLowerCase().replace(/\s+/g, "-");
    const chapter = metadata.chapter.toLowerCase().replace(/\s+/g, "-");
    return `${subject}-${metadata.grade}-${chapter}-${Date.now()}`;
  }
}

export const contentManagementService = new ContentManagementService();
