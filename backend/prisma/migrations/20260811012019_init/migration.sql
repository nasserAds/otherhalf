-- CreateEnum
CREATE TYPE "Avatar" AS ENUM ('LION', 'TIGER', 'FOX', 'PANDA', 'OWL', 'WOLF');

-- CreateEnum
CREATE TYPE "RoomVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "DebateMode" AS ENUM ('TEXT', 'VOICE', 'TEXT_VOICE');

-- CreateEnum
CREATE TYPE "RoomStatus" AS ENUM ('LOBBY', 'IN_PROGRESS', 'CLOSED');

-- CreateEnum
CREATE TYPE "PlayerRole" AS ENUM ('HOST', 'PLAYER');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('PREPARING', 'ROUND_1', 'ROUND_2', 'FINAL', 'VOTING', 'COMPLETED');

-- CreateEnum
CREATE TYPE "RoundType" AS ENUM ('PREP', 'ROUND_1', 'ROUND_2', 'FINAL');

-- CreateEnum
CREATE TYPE "TopicCategory" AS ENUM ('FUN', 'HYPOTHETICAL', 'EVERYDAY_LIFE', 'POP_CULTURE');

-- CreateEnum
CREATE TYPE "XpTransactionType" AS ENUM ('MATCH_WIN', 'MATCH_LOSS', 'CORRECT_PREDICTION', 'OTHER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "avatar" "Avatar" NOT NULL DEFAULT 'LION',
    "deviceSecretHash" TEXT NOT NULL,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "coins" INTEGER NOT NULL DEFAULT 0,
    "wins" INTEGER NOT NULL DEFAULT 0,
    "losses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "visibility" "RoomVisibility" NOT NULL DEFAULT 'PUBLIC',
    "maxPlayers" INTEGER NOT NULL DEFAULT 8,
    "debateMode" "DebateMode" NOT NULL DEFAULT 'TEXT',
    "status" "RoomStatus" NOT NULL DEFAULT 'LOBBY',
    "hostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomPlayer" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "PlayerRole" NOT NULL DEFAULT 'PLAYER',
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "isOnline" BOOLEAN NOT NULL DEFAULT true,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "RoomPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Topic" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "category" "TopicCategory" NOT NULL DEFAULT 'FUN',
    "stanceALabel" TEXT NOT NULL,
    "stanceBLabel" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Topic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "roomId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "debaterAId" TEXT NOT NULL,
    "debaterBId" TEXT NOT NULL,
    "status" "MatchStatus" NOT NULL DEFAULT 'PREPARING',
    "winnerId" TEXT,
    "isDraw" BOOLEAN NOT NULL DEFAULT false,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Round" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "type" "RoundType" NOT NULL,
    "speakerId" TEXT,
    "content" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "durationSeconds" INTEGER NOT NULL,

    CONSTRAINT "Round_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vote" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "voterId" TEXT NOT NULL,
    "votedForId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Prediction" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "predictorId" TEXT NOT NULL,
    "predictedWinnerId" TEXT NOT NULL,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Prediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT,
    "type" "XpTransactionType" NOT NULL,
    "xpAmount" INTEGER NOT NULL,
    "coinAmount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE INDEX "User_xp_idx" ON "User"("xp");

-- CreateIndex
CREATE UNIQUE INDEX "Room_code_key" ON "Room"("code");

-- CreateIndex
CREATE INDEX "Room_status_idx" ON "Room"("status");

-- CreateIndex
CREATE INDEX "Room_visibility_status_idx" ON "Room"("visibility", "status");

-- CreateIndex
CREATE INDEX "RoomPlayer_roomId_idx" ON "RoomPlayer"("roomId");

-- CreateIndex
CREATE UNIQUE INDEX "RoomPlayer_roomId_userId_key" ON "RoomPlayer"("roomId", "userId");

-- CreateIndex
CREATE INDEX "ChatMessage_roomId_createdAt_idx" ON "ChatMessage"("roomId", "createdAt");

-- CreateIndex
CREATE INDEX "Topic_category_isActive_idx" ON "Topic"("category", "isActive");

-- CreateIndex
CREATE INDEX "Match_roomId_idx" ON "Match"("roomId");

-- CreateIndex
CREATE INDEX "Match_status_idx" ON "Match"("status");

-- CreateIndex
CREATE INDEX "Round_matchId_idx" ON "Round"("matchId");

-- CreateIndex
CREATE INDEX "Vote_matchId_idx" ON "Vote"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Vote_matchId_voterId_key" ON "Vote"("matchId", "voterId");

-- CreateIndex
CREATE INDEX "Prediction_matchId_idx" ON "Prediction"("matchId");

-- CreateIndex
CREATE UNIQUE INDEX "Prediction_matchId_predictorId_key" ON "Prediction"("matchId", "predictorId");

-- CreateIndex
CREATE INDEX "XpTransaction_userId_idx" ON "XpTransaction"("userId");

-- CreateIndex
CREATE INDEX "XpTransaction_matchId_idx" ON "XpTransaction"("matchId");

-- AddForeignKey
ALTER TABLE "Room" ADD CONSTRAINT "Room_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomPlayer" ADD CONSTRAINT "RoomPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "Topic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_debaterAId_fkey" FOREIGN KEY ("debaterAId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_debaterBId_fkey" FOREIGN KEY ("debaterBId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_winnerId_fkey" FOREIGN KEY ("winnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Round" ADD CONSTRAINT "Round_speakerId_fkey" FOREIGN KEY ("speakerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_voterId_fkey" FOREIGN KEY ("voterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_votedForId_fkey" FOREIGN KEY ("votedForId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_predictorId_fkey" FOREIGN KEY ("predictorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prediction" ADD CONSTRAINT "Prediction_predictedWinnerId_fkey" FOREIGN KEY ("predictedWinnerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE SET NULL ON UPDATE CASCADE;
