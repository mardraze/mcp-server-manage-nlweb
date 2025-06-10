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
export declare class Database {
    private db;
    private dbPath;
    constructor();
    initialize(): Promise<void>;
    addPage(page: Omit<NlwebPage, 'id' | 'createdAt' | 'updatedAt'>): Promise<number>;
    updatePage(id: number, updates: Partial<NlwebPage>): Promise<void>;
    getPage(id: number): Promise<NlwebPage | null>;
    getPageByUrl(url: string): Promise<NlwebPage | null>;
    getAllPages(): Promise<NlwebPage[]>;
    searchPages(query: string): Promise<NlwebPage[]>;
    deletePage(id: number): Promise<void>;
    close(): Promise<void>;
}
//# sourceMappingURL=database.d.ts.map