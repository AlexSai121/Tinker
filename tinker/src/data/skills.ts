import { db } from "@/db";
import { skills } from "@/db/schema";
import { eq, desc, and, lt } from "drizzle-orm";
import type { Skill, SkillInsert, SkillUpdate } from "@/types";
import { deleteRow, getTable, insertRow, updateRow } from "@/lib/browserStore";
import { getNextReviewDate } from "@/utils/skillLifecycle";
import { withDataFallback } from "./backend";

const STATUS_ORDER: Skill["status"][] = ["exposed", "attempted", "practiced", "owned"];

export interface SaveSkillEvidenceInput {
  id: string;
  evidence: string | null;
  evidenceMediaPath: string | null;
  status: Skill["status"];
  evidenceWorkbenchId?: string | null;
}

function getStatusIndex(status: Skill["status"]) {
  return STATUS_ORDER.indexOf(status);
}

function assertValidTransition(skill: Skill, input: SaveSkillEvidenceInput, now: Date) {
  const currentIndex = getStatusIndex(skill.status);
  const nextIndex = getStatusIndex(input.status);
  const note = input.evidence?.trim() ?? "";
  const hasNote = note.length >= 10;
  const hasMedia = Boolean(input.evidenceMediaPath ?? skill.evidenceMediaPath);
  const nextWorkbenchId = input.evidenceWorkbenchId ?? skill.evidenceWorkbenchId ?? skill.workbenchId ?? null;

  if (nextIndex === -1) {
    throw new Error("Unknown skill status.");
  }

  if (nextIndex > currentIndex + 1) {
    throw new Error("Skills move one step at a time.");
  }

  if (nextIndex < currentIndex && input.status !== skill.status) {
    throw new Error("Skill status cannot move backward.");
  }

  if (input.status === "attempted" && skill.status === "exposed" && !hasNote) {
    throw new Error("Moving to Attempted needs a note about what you tried.");
  }

  if (input.status === "practiced") {
    if (!hasNote || !hasMedia) {
      throw new Error("Moving to Practiced needs a note and an evidence upload.");
    }

    if (!nextWorkbenchId) {
      throw new Error("Choose the project where the practice evidence happened.");
    }
  }

  if (input.status === "owned") {
    if (skill.status !== "practiced" && skill.status !== "owned") {
      throw new Error("Only practiced skills can become owned.");
    }

    if (!skill.reviewDueAt || new Date(skill.reviewDueAt) > now) {
      throw new Error("This skill is not ready for the 30-day review yet.");
    }

    if (!hasNote || !hasMedia) {
      throw new Error("Marking a skill Owned needs fresh evidence and a note.");
    }

    if (!nextWorkbenchId) {
      throw new Error("Choose the project where you re-proved this skill.");
    }

    if ((skill.evidenceWorkbenchId ?? skill.workbenchId ?? null) === nextWorkbenchId) {
      throw new Error("Owned requires new evidence from a different project.");
    }
  }
}

function buildSkillEvidenceUpdate(skill: Skill, input: SaveSkillEvidenceInput, now: Date): SkillUpdate {
  assertValidTransition(skill, input, now);

  const evidence = input.evidence?.trim() ?? skill.evidence ?? null;
  const evidenceMediaPath = input.evidenceMediaPath ?? skill.evidenceMediaPath ?? null;
  const evidenceWorkbenchId = input.evidenceWorkbenchId ?? skill.evidenceWorkbenchId ?? skill.workbenchId ?? null;

  if (input.status === "practiced") {
    return {
      evidence,
      evidenceMediaPath,
      evidenceWorkbenchId,
      lastEvidenceAt: now,
      reviewDueAt: getNextReviewDate(now),
      status: input.status,
    };
  }

  if (input.status === "owned") {
    return {
      evidence,
      evidenceMediaPath,
      evidenceWorkbenchId,
      lastEvidenceAt: now,
      reviewDueAt: null,
      status: input.status,
    };
  }

  if (input.status === "attempted") {
    return {
      evidence,
      evidenceMediaPath,
      evidenceWorkbenchId,
      lastEvidenceAt: now,
      status: input.status,
    };
  }

  return {
    evidence,
    evidenceMediaPath,
    evidenceWorkbenchId,
    lastEvidenceAt: input.evidence || input.evidenceMediaPath ? now : skill.lastEvidenceAt ?? null,
    reviewDueAt: skill.reviewDueAt ?? null,
    status: input.status,
  };
}

export async function getAllSkills(): Promise<Skill[]> {
  return withDataFallback(
    () => getTable<Skill>("skills").sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () => db.select().from(skills).orderBy(desc(skills.createdAt))
  );
}

export async function getSkillById(id: string): Promise<Skill | undefined> {
  return withDataFallback(
    () => getTable<Skill>("skills").find((skill) => skill.id === id),
    async () => {
      const result = await db.select().from(skills).where(eq(skills.id, id)).limit(1);
      return result[0];
    }
  );
}

export async function createSkill(data: SkillInsert): Promise<Skill> {
  return withDataFallback(
    () => insertRow("skills", data as Skill),
    async () => {
      const result = await db.insert(skills).values(data).returning();
      return result[0];
    }
  );
}

export async function updateSkill(id: string, data: SkillUpdate): Promise<Skill> {
  return withDataFallback(
    () => updateRow<Skill>("skills", id, (skill) => ({
      ...skill,
      ...data,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(skills)
        .set({ ...data, updatedAt: new Date() })
        .where(eq(skills.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function saveSkillEvidence(input: SaveSkillEvidenceInput): Promise<Skill> {
  const skill = await getSkillById(input.id);
  if (!skill) {
    throw new Error("Skill not found.");
  }

  const now = new Date();
  const update = buildSkillEvidenceUpdate(skill, input, now);
  return updateSkill(input.id, update);
}

export async function deleteSkill(id: string): Promise<void> {
  return withDataFallback(
    () => {
      deleteRow("skills", id);
    },
    async () => {
      await db.delete(skills).where(eq(skills.id, id));
    }
  );
}

export async function getSkillsByWorkbench(workbenchId: string): Promise<Skill[]> {
  return withDataFallback(
    () => getTable<Skill>("skills")
      .filter((skill) => skill.workbenchId === workbenchId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    () =>
      db
        .select()
        .from(skills)
        .where(eq(skills.workbenchId, workbenchId))
        .orderBy(desc(skills.createdAt))
  );
}

export async function updateSkillStatus(id: string, status: Skill["status"]): Promise<Skill> {
  return withDataFallback(
    () => updateRow<Skill>("skills", id, (skill) => ({
      ...skill,
      status,
      updatedAt: new Date(),
    })),
    async () => {
      const result = await db
        .update(skills)
        .set({ status, updatedAt: new Date() })
        .where(eq(skills.id, id))
        .returning();
      return result[0];
    }
  );
}

export async function getSkillsDueForReview(): Promise<Skill[]> {
  return withDataFallback(
    () => getTable<Skill>("skills")
      .filter((skill) => skill.status === "practiced" && skill.reviewDueAt && skill.reviewDueAt <= new Date())
      .sort((a, b) => {
        const aTime = a.reviewDueAt ? new Date(a.reviewDueAt).getTime() : 0;
        const bTime = b.reviewDueAt ? new Date(b.reviewDueAt).getTime() : 0;
        return aTime - bTime;
      }),
    () =>
      db
        .select()
        .from(skills)
        .where(
          and(
            eq(skills.status, "practiced"),
            lt(skills.reviewDueAt, new Date())
          )
        )
        .orderBy(skills.reviewDueAt)
  );
}
