-- Renombrar colorTela a material
ALTER TABLE "rollos" RENAME COLUMN "colorTela" TO "material";

-- Eliminar columna colorHex
ALTER TABLE "rollos" DROP COLUMN "colorHex";
