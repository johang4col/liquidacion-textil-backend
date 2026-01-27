-- CreateEnum
CREATE TYPE "EstadoLiquidacion" AS ENUM ('borrador', 'en_proceso', 'finalizada');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "nit" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "liquidaciones" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "clienteId" TEXT NOT NULL,
    "ordenProduccion" TEXT,
    "referencia" TEXT,
    "observaciones" TEXT,
    "estado" "EstadoLiquidacion" NOT NULL DEFAULT 'borrador',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "liquidaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rollos" (
    "id" TEXT NOT NULL,
    "liquidacionId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "colorTela" TEXT NOT NULL,
    "colorHex" TEXT NOT NULL,
    "metrosIniciales" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rollos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "espigas" (
    "id" TEXT NOT NULL,
    "rolloId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "largoTrazo" DOUBLE PRECISION NOT NULL,
    "numeroCapas" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "espigas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" TEXT NOT NULL,
    "nombreEmpresa" TEXT NOT NULL DEFAULT 'RED W & GOLD S.A.S',
    "telefono" TEXT NOT NULL DEFAULT '320 694 81 38',
    "siguienteNumero" INTEGER NOT NULL DEFAULT 1,
    "prefijoLiquidacion" TEXT NOT NULL DEFAULT '',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "liquidaciones_numero_key" ON "liquidaciones"("numero");

-- CreateIndex
CREATE INDEX "liquidaciones_clienteId_idx" ON "liquidaciones"("clienteId");

-- CreateIndex
CREATE INDEX "liquidaciones_numero_idx" ON "liquidaciones"("numero");

-- CreateIndex
CREATE INDEX "rollos_liquidacionId_idx" ON "rollos"("liquidacionId");

-- CreateIndex
CREATE INDEX "espigas_rolloId_idx" ON "espigas"("rolloId");

-- AddForeignKey
ALTER TABLE "liquidaciones" ADD CONSTRAINT "liquidaciones_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rollos" ADD CONSTRAINT "rollos_liquidacionId_fkey" FOREIGN KEY ("liquidacionId") REFERENCES "liquidaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "espigas" ADD CONSTRAINT "espigas_rolloId_fkey" FOREIGN KEY ("rolloId") REFERENCES "rollos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
