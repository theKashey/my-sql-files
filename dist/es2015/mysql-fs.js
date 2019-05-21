import * as tslib_1 from "tslib";
var emptyFn = function () {
};
var MySQLfiles = (function () {
    function MySQLfiles(connection, databaseName, options) {
        if (options === void 0) { options = { limit: 10000 }; }
        this.connection = connection;
        this.databaseName = databaseName;
        this.options = options;
    }
    MySQLfiles.prototype.put = function (externalId, blopData, meta) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var _a, fileId, node;
            return tslib_1.__generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4, this._getNodeTable(externalId)];
                    case 1:
                        _a = _b.sent(), fileId = _a.fileId, node = _a.node;
                        return [4, this._q("REPLACE INTO " + this._db() + ".node_" + node + " SET ?", {
                                id: fileId,
                                blobData: blopData
                            })];
                    case 2:
                        _b.sent();
                        return [4, this._q("REPLACE INTO " + this._db() + ".metadata SET ?", tslib_1.__assign({ fileId: fileId, sourceId: externalId, nodeId: node, status: 200, contentType: 'text/plain' }, meta))];
                    case 3:
                        _b.sent();
                        return [2, { fileId: fileId, node: node }];
                }
            });
        });
    };
    MySQLfiles.prototype.get = function (externalId) {
        return tslib_1.__awaiter(this, void 0, void 0, function () {
            var result, meta, blobData;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._q("SELECT fileId, nodeId, contentType, lastMod FROM " + this._db() + ".metadata WHERE sourceId=? LIMIT 1", [externalId])];
                    case 1:
                        result = _a.sent();
                        if (!result.length) return [3, 3];
                        meta = result[0];
                        return [4, this._q("SELECT blobData from " + this._db() + ".node_" + meta.nodeId + " WHERE id=?", [meta.fileId])];
                    case 2:
                        blobData = (_a.sent())[0].blobData;
                        return [2, {
                                meta: {
                                    contentType: meta.contentType,
                                    lastMod: meta.lastMod
                                },
                                blobData: blobData
                            }];
                    case 3: return [2, null];
                }
            });
        });
    };
    MySQLfiles.prototype._db = function () {
        return "`" + this.databaseName + "`";
    };
    MySQLfiles.prototype._q = function (sql, args) {
        var _this = this;
        return (new Promise(function (resolve, reject) {
            _this.connection.query(sql, args || [], function (err, result) {
                if (err) {
                    reject(err);
                }
                resolve(result);
            });
        }));
    };
    MySQLfiles.prototype.bootstrap = function () {
        var _this = this;
        return this._q("CREATE DATABASE " + this._db() + ";")
            .catch(emptyFn)
            .then(function () {
            return Promise.all([
                _this._q("\n            CREATE TABLE " + _this._db() + ".metadata (\n              fileId int(11) unsigned NOT NULL AUTO_INCREMENT,\n              nodeId mediumint(11) NOT NULL DEFAULT '-1',\n              sourceId int(11) NOT NULL,\n              status mediumint(11) NOT NULL,\n              lastMod int(32) unsigned NOT NULL DEFAULT '0',\n              contentType varchar(24) DEFAULT ' ',\n              PRIMARY KEY (fileId),\n              UNIQUE KEY sourceId (sourceId),\n              KEY node (nodeId)\n            ) ENGINE=myisam DEFAULT CHARSET=utf8;\n          "),
                _this._q("\n            CREATE TABLE " + _this._db() + ".partitions (\n              id int(11) unsigned NOT NULL,\n              fromId int(11) DEFAULT NULL,\n              toId int(11) DEFAULT NULL,\n              PRIMARY KEY (id)\n            ) ENGINE=myisam DEFAULT CHARSET=utf8;\n           ")
            ]);
        });
    };
    MySQLfiles.prototype._createNodeTable = function (id) {
        return this._q("\n      CREATE TABLE " + this._db() + ".`node_" + id + "` (\n          `id` int(11) unsigned NOT NULL AUTO_INCREMENT,\n          `status` int(11) DEFAULT NULL,\n          `blobData` longblob,\n          PRIMARY KEY (id)\n        ) ENGINE=MyIsam DEFAULT CHARSET=utf8;\n      ");
    };
    MySQLfiles.prototype._insertNode = function (node) {
        var _this = this;
        return this._createNodeTable(node)
            .then(function () {
            return _this._q("INSERT INTO " + _this._db() + ".partitions SET ?", {
                id: node
            });
        });
    };
    MySQLfiles.prototype._getNodeTable = function (sid) {
        var _this = this;
        return this._q("INSERT INTO " + this._db() + ".metadata SET ?", {
            sourceId: sid,
            status: 0
        })
            .catch(emptyFn)
            .then(function () { return tslib_1.__awaiter(_this, void 0, void 0, function () {
            var fileId, node, part;
            return tslib_1.__generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4, this._q("SELECT fileId FROM " + this._db() + ".metadata WHERE sourceId=? LIMIT 1", [sid])];
                    case 1:
                        fileId = (_a.sent())[0].fileId;
                        node = Math.floor(fileId / this.options.limit);
                        return [4, this._q("SELECT id from " + this._db() + ".partitions WHERE id=? LIMIT 1", [node])];
                    case 2:
                        part = _a.sent();
                        if (!!part.length) return [3, 4];
                        return [4, this._insertNode(node)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4: return [2, {
                            fileId: fileId,
                            node: node,
                        }];
                }
            });
        }); });
    };
    return MySQLfiles;
}());
export { MySQLfiles };
