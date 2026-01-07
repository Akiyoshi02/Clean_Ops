export type JobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "IN_PROGRESS"
  | "COMPLETED_PENDING_REVIEW"
  | "APPROVED"
  | "REWORK_REQUIRED"
  | "CANCELLED";

const allowedTransitions: Record<JobStatus, JobStatus[]> = {
  DRAFT: ["PUBLISHED", "CANCELLED"],
  PUBLISHED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED_PENDING_REVIEW", "REWORK_REQUIRED", "CANCELLED"],
  COMPLETED_PENDING_REVIEW: ["APPROVED", "REWORK_REQUIRED"],
  APPROVED: [],
  REWORK_REQUIRED: ["IN_PROGRESS", "COMPLETED_PENDING_REVIEW", "CANCELLED"],
  CANCELLED: [],
};

export function isValidStatusTransition(from: JobStatus, to: JobStatus) {
  if (from === to) {
    return true;
  }
  return allowedTransitions[from]?.includes(to) ?? false;
}
