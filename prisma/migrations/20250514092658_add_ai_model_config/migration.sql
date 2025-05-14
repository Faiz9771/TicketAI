-- CreateTable
CREATE TABLE "AIModelConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "modelName" TEXT NOT NULL DEFAULT 'llama-2-7b-chat',
    "temperature" REAL NOT NULL DEFAULT 0.7,
    "maxTokens" INTEGER NOT NULL DEFAULT 2048,
    "lastTrainedAt" DATETIME,
    "trainingStatus" TEXT NOT NULL DEFAULT 'not_trained',
    "trainingProgress" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
