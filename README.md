MY SQL FILES
====
Compact solution to store and serve small files in MySQL tables.

Uses MyISAM table to store 10000 files per one file, making it easy to backup and maintain.

Provides only two asynchronous methods:
- put(name, data)
- get(name)

To create something bigger than that - use store composition:
- metaStore.put(fileName, {width, height})
- miniStore.put(fileName, resizedImage)
- originalStore.put(fileName, originalImage)

See `examples`