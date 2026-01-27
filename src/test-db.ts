import { PrismaClient } from './generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🔍 Probando conexión a Railway...\n');

  // Intentar crear un cliente de prueba
  const cliente = await prisma.cliente.create({
    data: {
      id: 'test-' + Date.now(),
      nombre: 'Cliente de Prueba',
      nit: '123456789',
      telefono: '3001234567',
      email: 'test@example.com',
    },
  });

  console.log('✅ Cliente creado:', cliente.nombre);

  // Leer todos los clientes
  const clientes = await prisma.cliente.findMany();
  console.log('✅ Total clientes en BD:', clientes.length);

  // Mostrar todos
  console.log('\n📋 Clientes en la base de datos:');
  clientes.forEach((c) => {
    console.log(`  - ${c.nombre} (${c.email})`);
  });

  console.log('\n🎉 ¡Conexión exitosa a Railway!');
}

main()
  .catch((error) => {
    console.error('❌ Error:', error.message);
  })
  .finally(async () => {
    await pool.end();
    await prisma.$disconnect();
  });
