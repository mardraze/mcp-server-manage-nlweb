import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs';

export interface NlwebPage {
  id?: number;
  url: string;
  title: string;
  description?: string;
  tags?: string;
  content?: string;
  status: 'active' | 'inactive' | 'error';
  lastChecked?: string;
  responseTime?: number;
  createdAt: string;
  updatedAt: string;
}

export class Database {
  private db: sqlite3.Database;
  private dbPath: string;

  constructor() {
    const homeDir = os.homedir();
    const dbDir = path.join(homeDir, '.nlweb-mcp');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    this.dbPath = path.join(dbDir, 'nlweb.db');
    this.db = new sqlite3.Database(this.dbPath);
  }

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.serialize(() => {
        this.db.run(`
          CREATE TABLE IF NOT EXISTS nlweb_pages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            tags TEXT,
            content TEXT,
            status TEXT DEFAULT 'active',
            lastChecked TEXT,
            responseTime INTEGER,
            createdAt TEXT NOT NULL,
            updatedAt TEXT NOT NULL
          )
        `, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    });
  }

  async addPage(page: Omit<NlwebPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<number> {
    const now = new Date().toISOString();
    const pageWithTimestamps = {
      ...page,
      createdAt: now,
      updatedAt: now
    };

    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO nlweb_pages (url, title, description, tags, content, status, lastChecked, responseTime, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      stmt.run([
        pageWithTimestamps.url,
        pageWithTimestamps.title,
        pageWithTimestamps.description,
        pageWithTimestamps.tags,
        pageWithTimestamps.content,
        pageWithTimestamps.status,
        pageWithTimestamps.lastChecked,
        pageWithTimestamps.responseTime,
        pageWithTimestamps.createdAt,
        pageWithTimestamps.updatedAt
      ], function(err) {
        if (err) reject(err);
        else resolve(this.lastID);
      });
      
      stmt.finalize();
    });
  }

  async updatePage(id: number, updates: Partial<NlwebPage>): Promise<void> {
    const updatedData = {
      ...updates,
      updatedAt: new Date().toISOString()
    };

    const fields = Object.keys(updatedData).filter(key => key !== 'id');
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    const values = fields.map(field => updatedData[field as keyof typeof updatedData]);

    return new Promise((resolve, reject) => {
      this.db.run(
        `UPDATE nlweb_pages SET ${setClause} WHERE id = ?`,
        [...values, id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async getPage(id: number): Promise<NlwebPage | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM nlweb_pages WHERE id = ?',
        [id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as NlwebPage || null);
        }
      );
    });
  }

  async getPageByUrl(url: string): Promise<NlwebPage | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        'SELECT * FROM nlweb_pages WHERE url = ?',
        [url],
        (err, row) => {
          if (err) reject(err);
          else resolve(row as NlwebPage || null);
        }
      );
    });
  }

  async getAllPages(): Promise<NlwebPage[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        'SELECT * FROM nlweb_pages ORDER BY updatedAt DESC',
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as NlwebPage[]);
        }
      );
    });
  }

  async searchPages(query: string): Promise<NlwebPage[]> {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM nlweb_pages 
         WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? OR url LIKE ?
         ORDER BY updatedAt DESC`,
        [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows as NlwebPage[]);
        }
      );
    });
  }

  async deletePage(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'DELETE FROM nlweb_pages WHERE id = ?',
        [id],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}
