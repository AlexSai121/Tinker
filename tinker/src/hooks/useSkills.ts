import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAllSkills, getSkillsByWorkbench, getSkillById, getSkillsDueForReview, createSkill, updateSkill, deleteSkill, updateSkillStatus, saveSkillEvidence, type SaveSkillEvidenceInput } from "../data/skills";
import { queryKeys } from "./queryKeys";
import type { SkillInsert, SkillUpdate, Skill } from "../types";

export function useAllSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: getAllSkills,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSkills(workbenchId: string) {
  return useQuery({
    queryKey: queryKeys.skills(workbenchId),
    queryFn: () => getSkillsByWorkbench(workbenchId),
    enabled: !!workbenchId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSkill(id: string) {
  return useQuery({
    queryKey: queryKeys.skill(id),
    queryFn: () => getSkillById(id),
    enabled: !!id,
  });
}

export function useSkillsDueForReview() {
  return useQuery({
    queryKey: queryKeys.skillsDue,
    queryFn: getSkillsDueForReview,
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createSkill,
    onSuccess: (_, variables) => {
      if (variables.workbenchId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.skills(variables.workbenchId) });
      }
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SkillUpdate }) => updateSkill(id, data),
    onSuccess: (skill) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skill(skill.id) });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.skillsDue });
      if (skill.workbenchId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.skills(skill.workbenchId) });
      }
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteSkill,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });
}

export function useSaveSkillEvidence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SaveSkillEvidenceInput) => saveSkillEvidence(data),
    onSuccess: (skill) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skill(skill.id) });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.skillsDue });
      if (skill.workbenchId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.skills(skill.workbenchId) });
      }
    },
  });
}

export function useUpdateSkillStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: Skill["status"] }) => updateSkillStatus(id, status),
    onSuccess: (skill) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.skill(skill.id) });
      queryClient.invalidateQueries({ queryKey: ["skills"] });
      queryClient.invalidateQueries({ queryKey: queryKeys.skillsDue });
      if (skill.workbenchId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.skills(skill.workbenchId) });
      }
      if (skill.status === "practiced" || skill.status === "owned") {
        queryClient.invalidateQueries({ queryKey: queryKeys.skillsDue });
      }
    },
  });
}
