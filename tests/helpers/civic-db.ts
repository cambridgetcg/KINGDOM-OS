import { Database } from 'bun:sqlite';

// 純本地合成測試 adapter，唔係 D1／workerd 證據。
// batch 同步跑完整 SQLite transaction；任何 CHECK/UNIQUE/FK 失敗都 rollback。
export class CivicTestDB {
  sqlite: Database;
  beforeBatch: null | (() => void) = null;
  fail = false;
  sessions: string[] = [];
  constructor(migration: string) {
    this.sqlite = new Database(':memory:');
    this.sqlite.exec(migration);
  }
  withSession(mode: string) { this.sessions.push(mode); return this; }
  prepare(sql: string) { return new Statement(this, sql, []); }
  async batch(statements: Statement[]) {
    if (this.fail) throw new Error('synthetic storage failure');
    if (this.beforeBatch) { const hook = this.beforeBatch; this.beforeBatch = null; hook(); }
    return this.sqlite.transaction(() => statements.map((statement) => statement.execute()))();
  }
  close() { this.sqlite.close(); }
}
class Statement {
  constructor(public db: CivicTestDB, public sql: string, public values: (string | number | null)[]) {}
  bind(...values: (string | number | null)[]) { return new Statement(this.db, this.sql, values); }
  execute() {
    if (this.db.fail) throw new Error('synthetic storage failure');
    const prepared = this.db.sqlite.prepare(this.sql);
    const results = prepared.all(...this.values);
    const changes = /^\s*(INSERT|UPDATE|DELETE|REPLACE)\b/i.test(this.sql)
      ? (this.db.sqlite.query('SELECT changes() AS n').get() as { n: number }).n : 0;
    return { success: true, results, meta: { changes } };
  }
  async all() { return this.execute(); }
  async run() { return this.execute(); }
  async first(column?: string) {
    const row = this.execute().results[0] as Record<string, unknown> | undefined;
    return column ? row?.[column] ?? null : row ?? null;
  }
}
