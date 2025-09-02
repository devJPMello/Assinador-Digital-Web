-- Adiciona/ajusta coluna VALID com preservação de dados
DO $$
BEGIN
  -- cria coluna valid (se não existir ainda)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'VerifyLog' AND column_name = 'valid'
  ) THEN
    ALTER TABLE "VerifyLog" ADD COLUMN "valid" BOOLEAN;
  END IF;

  -- se a coluna antiga isValid existir, copia os valores pra valid e remove isValid
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'VerifyLog' AND column_name = 'isValid'
  ) THEN
    UPDATE "VerifyLog" SET "valid" = "isValid" WHERE "valid" IS NULL;
    ALTER TABLE "VerifyLog" DROP COLUMN "isValid";
  END IF;

  -- preenche nulos restantes com false (evita violar NOT NULL ao final)
  UPDATE "VerifyLog" SET "valid" = FALSE WHERE "valid" IS NULL;

  -- agora torna NOT NULL
  ALTER TABLE "VerifyLog" ALTER COLUMN "valid" SET NOT NULL;
END $$;

-- Renomeia/copia ip -> requesterIp mantendo dados
DO $$
BEGIN
  -- cria requesterIp se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'VerifyLog' AND column_name = 'requesterIp'
  ) THEN
    ALTER TABLE "VerifyLog" ADD COLUMN "requesterIp" TEXT;
  END IF;

  -- se ip existir, copia para requesterIp quando estiver NULL e remove ip
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'VerifyLog' AND column_name = 'ip'
  ) THEN
    UPDATE "VerifyLog" SET "requesterIp" = COALESCE("requesterIp", "ip");
    ALTER TABLE "VerifyLog" DROP COLUMN "ip";
  END IF;
END $$;

-- Colunas opcionais (cria caso faltem)
ALTER TABLE "VerifyLog" ADD COLUMN IF NOT EXISTS "algorithm" TEXT;
ALTER TABLE "VerifyLog" ADD COLUMN IF NOT EXISTS "userId" TEXT;

-- Índices úteis (cria se ainda não houver)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'VerifyLog_createdAt_idx') THEN
    CREATE INDEX "VerifyLog_createdAt_idx" ON "VerifyLog" ("createdAt");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'VerifyLog_signatureId_idx') THEN
    CREATE INDEX "VerifyLog_signatureId_idx" ON "VerifyLog" ("signatureId");
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'VerifyLog_method_valid_idx') THEN
    CREATE INDEX "VerifyLog_method_valid_idx" ON "VerifyLog" ("method","valid");
  END IF;
END $$;
