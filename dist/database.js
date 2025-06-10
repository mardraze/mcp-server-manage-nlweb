import sqlite3 from 'sqlite3';
import path from 'path';
import os from 'os';
import fs from 'fs';
export class Database {
    db;
    dbPath;
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
    async initialize() {
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
                    if (err)
                        reject(err);
                    else
                        resolve();
                });
            });
        });
    }
    async addPage(page) {
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
            ], function (err) {
                if (err)
                    reject(err);
                else
                    resolve(this.lastID);
            });
            stmt.finalize();
        });
    }
    async updatePage(id, updates) {
        const updatedData = {
            ...updates,
            updatedAt: new Date().toISOString()
        };
        const fields = Object.keys(updatedData).filter(key => key !== 'id');
        const setClause = fields.map(field => `${field} = ?`).join(', ');
        const values = fields.map(field => updatedData[field]);
        return new Promise((resolve, reject) => {
            this.db.run(`UPDATE nlweb_pages SET ${setClause} WHERE id = ?`, [...values, id], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async getPage(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM nlweb_pages WHERE id = ?', [id], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    async getPageByUrl(url) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM nlweb_pages WHERE url = ?', [url], (err, row) => {
                if (err)
                    reject(err);
                else
                    resolve(row || null);
            });
        });
    }
    async getAllPages() {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT * FROM nlweb_pages ORDER BY updatedAt DESC', (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async searchPages(query) {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT * FROM nlweb_pages 
         WHERE title LIKE ? OR description LIKE ? OR tags LIKE ? OR url LIKE ?
         ORDER BY updatedAt DESC`, [`%${query}%`, `%${query}%`, `%${query}%`, `%${query}%`], (err, rows) => {
                if (err)
                    reject(err);
                else
                    resolve(rows);
            });
        });
    }
    async deletePage(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM nlweb_pages WHERE id = ?', [id], (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    async close() {
        return new Promise((resolve, reject) => {
            this.db.close((err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
}
//# sourceMappingURL=database.js.map