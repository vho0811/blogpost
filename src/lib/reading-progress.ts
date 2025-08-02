export interface ReadingProgress {
  blogId: string;
  progress: number;
  lastReadAt: string;
  completed: boolean;
}

class ReadingProgressManager {
  private storageKey = 'blog_reading_progress';

  // Get all reading progress from localStorage
  private getStoredProgress(): Record<string, ReadingProgress> {
    if (typeof window === 'undefined') return {};
    
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error reading progress from localStorage:', error);
      return {};
    }
  }

  // Save reading progress to localStorage
  private saveProgress(progress: Record<string, ReadingProgress>): void {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(progress));
    } catch (error) {
      console.error('Error saving progress to localStorage:', error);
    }
  }

  // Update progress for a specific blog post
  updateProgress(blogId: string, progress: number): void {
    const allProgress = this.getStoredProgress();
    
    allProgress[blogId] = {
      blogId,
      progress: Math.min(Math.max(progress, 0), 100),
      lastReadAt: new Date().toISOString(),
      completed: progress >= 100
    };

    this.saveProgress(allProgress);
  }

  // Get progress for a specific blog post
  getProgress(blogId: string): ReadingProgress | null {
    const allProgress = this.getStoredProgress();
    return allProgress[blogId] || null;
  }

  // Get all reading progress
  getAllProgress(): Record<string, ReadingProgress> {
    return this.getStoredProgress();
  }

  // Get reading progress for multiple blog posts
  getProgressForPosts(blogIds: string[]): Record<string, ReadingProgress> {
    const allProgress = this.getStoredProgress();
    const result: Record<string, ReadingProgress> = {};
    
    blogIds.forEach(id => {
      if (allProgress[id]) {
        result[id] = allProgress[id];
      }
    });
    
    return result;
  }

  // Clear progress for a specific blog post
  clearProgress(blogId: string): void {
    const allProgress = this.getStoredProgress();
    delete allProgress[blogId];
    this.saveProgress(allProgress);
  }

  // Clear all reading progress
  clearAllProgress(): void {
    this.saveProgress({});
  }

  // Get reading statistics
  getReadingStats(): {
    totalPosts: number;
    completedPosts: number;
    averageProgress: number;
    totalReadingTime: number;
  } {
    const allProgress = this.getStoredProgress();
    const posts = Object.values(allProgress);
    
    if (posts.length === 0) {
      return {
        totalPosts: 0,
        completedPosts: 0,
        averageProgress: 0,
        totalReadingTime: 0
      };
    }

    const completedPosts = posts.filter(p => p.completed).length;
    const averageProgress = posts.reduce((sum, p) => sum + p.progress, 0) / posts.length;
    
    // Calculate total reading time (rough estimate)
    const totalReadingTime = posts.reduce((sum, p) => {
      // Assume 5 minutes per post for completed posts, proportional time for partial
      return sum + (p.completed ? 5 : (p.progress / 100) * 5);
    }, 0);

    return {
      totalPosts: posts.length,
      completedPosts,
      averageProgress: Math.round(averageProgress),
      totalReadingTime: Math.round(totalReadingTime)
    };
  }
}

// Export singleton instance
export const readingProgressManager = new ReadingProgressManager(); 