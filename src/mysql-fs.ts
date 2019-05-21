const emptyFn = () => {
};

export interface IMySQLFilesConnection {
  query(sql: string, args: any[], callback: (err: any, result: any) => void): any;
}

export interface IMySQLFilesOptions {
  limit: number;

  metaSelector?(): void;
}

export interface IMeta {
  fileId: never,
  sourceId: never,
  nodeId: never,
  status?: number,
  contentType?: string,
}

export class MySQLFiles {
  /**
   *
   * @param {MySQLConnection} connection
   * @param {string} databaseName
   */
  constructor(
    private connection: IMySQLFilesConnection,
    private databaseName: string,
    private options: IMySQLFilesOptions = {limit: 10000}
  ) {
  }

  /**
   * Puts object inside
   * @param {String} uid
   * @param {any} data
   * @param {any} meta
   */
  public async put(externalId: string, blopData: any, meta: IMeta) {
    const {fileId, node} = await this._getNodeTable(externalId);

    await this._q(`REPLACE INTO ${this._db()}.node_${node} SET ?`, {
      id: fileId,
      blobData: blopData
    });

    await this._q(`REPLACE INTO ${this._db()}.metadata SET ?`, {
        fileId: fileId,
        sourceId: externalId,
        nodeId: node,
        status: 200,
        contentType: 'text/plain',
        ...meta
      }
    );
    return {fileId, node}
  }

  public async get(externalId: string) {
    const result = await this._q(`SELECT fileId, nodeId, contentType, lastMod FROM ${this._db()}.metadata WHERE sourceId=? LIMIT 1`, [externalId]);

    if (result.length) {
      const meta = result[0];
      const [{blobData}] = await this._q(`SELECT blobData from ${this._db()}.node_${meta.nodeId} WHERE id=?`, [meta.fileId]);
      return {
        meta: {
          contentType: meta.contentType,
          lastMod: meta.lastMod
        },
        blobData
      }
    }
    return null;
  }


  private _db() {
    return `\`${this.databaseName}\``;
  }

  private _q(sql: string, args?: any): Promise<any[]> {
    return (new Promise((resolve, reject) => {
      this.connection.query(sql, args || [], (err, result) => {
        if (err) {
          reject(err);
        }
        resolve(result);
      });
    }));
  }

  public bootstrap() {
    return this._q(`CREATE DATABASE ${this._db()};`)
      .catch(emptyFn)
      .then(() =>
        Promise.all([
          this._q(`
            CREATE TABLE ${this._db()}.metadata (
              fileId int(11) unsigned NOT NULL AUTO_INCREMENT,
              nodeId mediumint(11) NOT NULL DEFAULT '-1',
              sourceId int(11) NOT NULL,
              status mediumint(11) NOT NULL,
              lastMod int(32) unsigned NOT NULL DEFAULT '0',
              contentType varchar(24) DEFAULT ' ',
              PRIMARY KEY (fileId),
              UNIQUE KEY sourceId (sourceId),
              KEY node (nodeId)
            ) ENGINE=myisam DEFAULT CHARSET=utf8;
          `),
          this._q(`
            CREATE TABLE ${this._db()}.partitions (
              id int(11) unsigned NOT NULL,
              fromId int(11) DEFAULT NULL,
              toId int(11) DEFAULT NULL,
              PRIMARY KEY (id)
            ) ENGINE=myisam DEFAULT CHARSET=utf8;
           `)
        ]))
  }

  private _createNodeTable(id: number) {
    return this._q(`
      CREATE TABLE ${this._db()}.\`node_${id}\` (
          \`id\` int(11) unsigned NOT NULL AUTO_INCREMENT,
          \`status\` int(11) DEFAULT NULL,
          \`blobData\` longblob,
          PRIMARY KEY (id)
        ) ENGINE=MyIsam DEFAULT CHARSET=utf8;
      `);
  }

  private _insertNode(node: number) {
    return this._createNodeTable(node)
      .then(() =>
        this._q(`INSERT INTO ${this._db()}.partitions SET ?`, {
          id: node
        })
      );
  }

  private _getNodeTable(sid: string) {
    return this._q(`INSERT INTO ${this._db()}.metadata SET ?`, {
      sourceId: sid,
      status: 0
    })
      .catch(emptyFn)
      .then(async () => {
        const [{fileId}] = await this._q(`SELECT fileId FROM ${this._db()}.metadata WHERE sourceId=? LIMIT 1`, [sid])
        const node = Math.floor(fileId / this.options.limit);
        const part = await this._q(`SELECT id from ${this._db()}.partitions WHERE id=? LIMIT 1`, [node]);
        if (!part.length) {
          await this._insertNode(node)
        }
        return {
          fileId,
          node,
        }
      })
  }
}
