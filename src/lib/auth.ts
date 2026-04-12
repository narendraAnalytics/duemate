import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

export async function getOrCreateUser() {
  try {
    const { userId, has } = await auth();
    if (!userId) throw new Error("Unauthorized");

    // Clerk Billing is the source of truth for the plan
    let clerkPlan: 'free' | 'starter' | 'pro' = 'free';
    if (has({ plan: 'pro' })) clerkPlan = 'pro';
    else if (has({ plan: 'plus' })) clerkPlan = 'starter';

    const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (rows[0]) {
      // Sync plan whenever Clerk Billing reflects a change
      if (rows[0].plan !== clerkPlan) {
        const [updated] = await db
          .update(users)
          .set({ plan: clerkPlan })
          .where(eq(users.id, userId))
          .returning();
        return updated;
      }
      return rows[0];
    }

    const clerkUser = await currentUser();
    const [created] = await db
      .insert(users)
      .values({
        id: userId,
        email: clerkUser?.emailAddresses[0]?.emailAddress ?? "",
        name: clerkUser?.fullName ?? clerkUser?.firstName ?? "",
        plan: clerkPlan,
      })
      .returning();

    return created;
  } catch (err) {
    console.error("[getOrCreateUser]", err);
    throw err;
  }
}
