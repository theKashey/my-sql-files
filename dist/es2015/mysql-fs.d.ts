export interface IConnection {
    query(sql: string, args: any[], callback: (err: any, result: any) => void): any;
}
export interface IOptions {
    limit: number;
    metaSelector?(): void;
}
export interface IMeta {
    fileId: never;
    sourceId: never;
    nodeId: never;
    status?: number;
    contentType?: string;
}
export declare class MySQLfiles {
    private connection;
    private databaseName;
    private options;
    constructor(connection: IConnection, databaseName: string, options?: IOptions);
    put(externalId: string, blopData: any, meta: IMeta): Promise<{
        fileId: any;
        node: number;
    }>;
    get(externalId: string): Promise<{
        meta: {
            contentType: any;
            lastMod: any;
        };
        blobData: any;
    }>;
    private _db;
    private _q;
    bootstrap(): Promise<[any[], any[]]>;
    private _createNodeTable;
    private _insertNode;
    private _getNodeTable;
}
