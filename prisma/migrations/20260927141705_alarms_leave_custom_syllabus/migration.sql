-- AlterTable
ALTER TABLE "Exam" ADD COLUMN "ownerId" TEXT;

-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "book" TEXT;

-- CreateTable
CREATE TABLE "StudyAlarm" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "days" TEXT NOT NULL DEFAULT '[0,1,2,3,4,5,6]',
    "label" TEXT NOT NULL DEFAULT '',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastFiredOn" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "StudyAlarm_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_DailyStat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "plannedMinutes" INTEGER NOT NULL DEFAULT 0,
    "actualMinutes" INTEGER NOT NULL DEFAULT 0,
    "tasksPlanned" INTEGER NOT NULL DEFAULT 0,
    "tasksDone" INTEGER NOT NULL DEFAULT 0,
    "questions" INTEGER NOT NULL DEFAULT 0,
    "correct" INTEGER NOT NULL DEFAULT 0,
    "revisionsDue" INTEGER NOT NULL DEFAULT 0,
    "revisionsDone" INTEGER NOT NULL DEFAULT 0,
    "mocksTaken" INTEGER NOT NULL DEFAULT 0,
    "focusAvg" REAL,
    "distractions" INTEGER NOT NULL DEFAULT 0,
    "executionScore" INTEGER,
    "focusScore" INTEGER,
    "revisionScore" INTEGER,
    "testingScore" INTEGER,
    "dailyScore" INTEGER,
    "leave" BOOLEAN NOT NULL DEFAULT false,
    "leaveNote" TEXT,
    "blocker" TEXT,
    "blockerNote" TEXT,
    "reviewedAt" DATETIME,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DailyStat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_DailyStat" ("actualMinutes", "blocker", "blockerNote", "correct", "dailyScore", "date", "distractions", "executionScore", "focusAvg", "focusScore", "id", "mocksTaken", "plannedMinutes", "questions", "reviewedAt", "revisionScore", "revisionsDone", "revisionsDue", "tasksDone", "tasksPlanned", "testingScore", "updatedAt", "userId") SELECT "actualMinutes", "blocker", "blockerNote", "correct", "dailyScore", "date", "distractions", "executionScore", "focusAvg", "focusScore", "id", "mocksTaken", "plannedMinutes", "questions", "reviewedAt", "revisionScore", "revisionsDone", "revisionsDue", "tasksDone", "tasksPlanned", "testingScore", "updatedAt", "userId" FROM "DailyStat";
DROP TABLE "DailyStat";
ALTER TABLE "new_DailyStat" RENAME TO "DailyStat";
CREATE UNIQUE INDEX "DailyStat_userId_date_key" ON "DailyStat"("userId", "date");
CREATE TABLE "new_StudentProfile" (
    "userId" TEXT NOT NULL PRIMARY KEY,
    "examId" TEXT NOT NULL,
    "examDate" TEXT NOT NULL,
    "targetScore" REAL,
    "targetRank" INTEGER,
    "prepLevel" TEXT NOT NULL DEFAULT 'BEGINNER',
    "purpose" TEXT NOT NULL DEFAULT 'EXAM',
    "dailyMinutes" INTEGER NOT NULL DEFAULT 180,
    "preferredSlots" TEXT NOT NULL DEFAULT '["MORNING","EVENING"]',
    "dailyGoalMinutes" INTEGER NOT NULL DEFAULT 180,
    "weeklyGoalMinutes" INTEGER NOT NULL DEFAULT 1260,
    "preferredBlockMin" INTEGER NOT NULL DEFAULT 45,
    "previousMockScores" TEXT NOT NULL DEFAULT '[]',
    "recoveryMode" BOOLEAN NOT NULL DEFAULT false,
    "recoverySince" TEXT,
    "recoveryManual" BOOLEAN NOT NULL DEFAULT false,
    "baseline" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "StudentProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "StudentProfile_examId_fkey" FOREIGN KEY ("examId") REFERENCES "Exam" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_StudentProfile" ("baseline", "createdAt", "dailyGoalMinutes", "dailyMinutes", "examDate", "examId", "preferredBlockMin", "preferredSlots", "prepLevel", "previousMockScores", "recoveryManual", "recoveryMode", "recoverySince", "targetRank", "targetScore", "updatedAt", "userId", "weeklyGoalMinutes") SELECT "baseline", "createdAt", "dailyGoalMinutes", "dailyMinutes", "examDate", "examId", "preferredBlockMin", "preferredSlots", "prepLevel", "previousMockScores", "recoveryManual", "recoveryMode", "recoverySince", "targetRank", "targetScore", "updatedAt", "userId", "weeklyGoalMinutes" FROM "StudentProfile";
DROP TABLE "StudentProfile";
ALTER TABLE "new_StudentProfile" RENAME TO "StudentProfile";
CREATE INDEX "StudentProfile_examId_idx" ON "StudentProfile"("examId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "StudyAlarm_userId_idx" ON "StudyAlarm"("userId");

-- CreateIndex
CREATE INDEX "StudyAlarm_enabled_time_idx" ON "StudyAlarm"("enabled", "time");

-- CreateIndex
CREATE INDEX "Exam_ownerId_idx" ON "Exam"("ownerId");
