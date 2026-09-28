-- CreateTable
CREATE TABLE "PaperLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL,
    "activeSeconds" INTEGER NOT NULL,
    "pauseCount" INTEGER NOT NULL DEFAULT 0,
    "laps" TEXT NOT NULL DEFAULT '[]',
    "totalQuestions" INTEGER,
    "attempted" INTEGER,
    "marksObtained" REAL,
    "totalMarks" REAL,
    "note" TEXT NOT NULL DEFAULT '',
    "startedAt" DATETIME NOT NULL,
    "endedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PaperLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Shayari" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "text" TEXT NOT NULL,
    "poet" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT '',
    "meaning" TEXT NOT NULL DEFAULT '',
    "lang" TEXT NOT NULL DEFAULT 'hi',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "PaperLog_userId_endedAt_idx" ON "PaperLog"("userId", "endedAt");

-- CreateIndex
CREATE INDEX "Shayari_active_idx" ON "Shayari"("active");
