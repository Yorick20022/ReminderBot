-- CreateTable
CREATE TABLE "Reminder" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "user_id" TEXT NOT NULL,
    "reminder_text" TEXT NOT NULL,
    "unix_timestamp" INTEGER NOT NULL,
    "readable_date" TEXT NOT NULL
);
