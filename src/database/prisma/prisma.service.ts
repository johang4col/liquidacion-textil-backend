import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private pool: Pool;

  constructor() {
    // ✅ OPTIMIZACIÓN: Pool con conexiones limitadas
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 2, // Máximo 2 conexiones (suficiente para 1 usuario)
      idleTimeoutMillis: 30000, // Cerrar conexiones inactivas después de 30s
      connectionTimeoutMillis: 20000, // Timeout de conexión 20s
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      // ✅ OPTIMIZACIÓN: Logs solo en desarrollo
      log:
        process.env.NODE_ENV === 'production'
          ? [{ level: 'error', emit: 'stdout' }]
          : [
              { level: 'query', emit: 'stdout' },
              { level: 'info', emit: 'stdout' },
              { level: 'warn', emit: 'stdout' },
              { level: 'error', emit: 'stdout' },
            ],
    });

    this.pool = pool;
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
  }
}
