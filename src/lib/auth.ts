import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function getOrCreateUser() {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (rows[0]) return rows[0];

    const clerkUser = await currentUser();
    const [created] = await db
      .insert(users)
      .values({
        id: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser?.fullName ?? clerkUser?.firstName ?? "",
      })
      .returning();

    return created;
  } catch (err) {
    console.error("[getOrCreateUser]", err);
    throw err;
  }
}
