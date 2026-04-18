ALTER TABLE "liquidaciones" ALTER COLUMN "estampadoPiezas" TYPE TEXT USING "estampadoPiezas"::TEXT;
ALTER TABLE "liquidaciones" ALTER COLUMN "bordadoPiezas" TYPE TEXT USING "bordadoPiezas"::TEXT;
ALTER TABLE "liquidaciones" ALTER COLUMN "fusionadosPiezas" TYPE TEXT USING "fusionadosPiezas"::TEXT;
