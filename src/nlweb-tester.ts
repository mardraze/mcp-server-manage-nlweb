import { NlwebPage } from './database.js';

export interface TestResult {
  url: string;
  status: 'success' | 'error';
  responseTime: number;
  statusCode?: number;
  title?: string;
  description?: string;
  content?: string;
  error?: string;
  timestamp: string;
}

export class NlwebTester {
  private timeout: number;

  constructor(timeout: number = 10000) {
    this.timeout = timeout;
  }

  async testPage(url: string): Promise<TestResult> {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    try {
      // Validate URL
      new URL(url);

      return {
        url,
        status: 'success',
        responseTime: Date.now() - startTime,
        title: '',
        description: '',
        content: '',
        timestamp,
      };

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        url,
        status: 'error',
        responseTime,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp,
      };
    }
  }

  async testMultiplePages(urls: string[]): Promise<TestResult[]> {
    const promises = urls.map(url => this.testPage(url));
    return Promise.all(promises);
  }

  async testPageWithRetry(args:any): Promise<TestResult> {
    let lastResult: TestResult;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      lastResult = await this.testPage(url);
      
      if (lastResult.status === 'success') {
        return lastResult;
      }

      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }

    return lastResult!;
  }

  async performHealthCheck(pages: NlwebPage[]): Promise<{
    totalPages: number;
    successfulPages: number;
    failedPages: number;
    averageResponseTime: number;
    results: TestResult[];
  }> {
    const urls = pages.map(page => page.url);
    const results = await this.testMultiplePages(urls);

    const successfulPages = results.filter(r => r.status === 'success').length;
    const failedPages = results.length - successfulPages;
    const averageResponseTime = results.reduce((sum, r) => sum + r.responseTime, 0) / results.length;

    return {
      totalPages: results.length,
      successfulPages,
      failedPages,
      averageResponseTime: Math.round(averageResponseTime),
      results,
    };
  }

  isValidUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }

  extractDomain(url: string): string {
    try {
      return new URL(url).hostname;
    } catch {
      return 'unknown';
    }
  }
}
