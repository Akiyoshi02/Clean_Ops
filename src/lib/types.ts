export type Role = "HR" | "SUPERVISOR" | "CLEANER";

export type JobStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "IN_PROGRESS"
  | "COMPLETED_PENDING_REVIEW"
  | "APPROVED"
  | "REWORK_REQUIRED"
  | "CANCELLED";

export type ClockEventType = "CLOCK_IN" | "CLOCK_OUT";
export type ClockEventSource = "ONLINE" | "OFFLINE_SYNCED";
export type BreakEventType = "BREAK_START" | "BREAK_END";
export type AttachmentType = "PHOTO_BEFORE" | "PHOTO_AFTER" | "PHOTO_GENERAL";
export type IssueCategory = "ACCESS" | "SAFETY" | "SUPPLIES" | "CLIENT_REQUEST" | "OTHER";
export type IssueSeverity = "LOW" | "MEDIUM" | "HIGH";
export type IssueStatus = "OPEN" | "ACKNOWLEDGED" | "RESOLVED";
export type TimesheetStatus = "OPEN" | "SUBMITTED" | "APPROVED";
export type NotificationType =
  | "JOB_ASSIGNED"
  | "JOB_STATUS"
  | "ISSUE_UPDATE"
  | "TIMESHEET"
  | "SYSTEM";

export type Profile = {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  employee_id: string | null;
  pay_rate: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Client = {
  id: string;
  name: string;
  billing_email: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Site = {
  id: string;
  client_id: string;
  name: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  lat: number;
  lng: number;
  access_notes: string | null;
  geofence_radius_meters: number;
  default_checklist_template_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistTemplate = {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type ChecklistTemplateItem = {
  id: string;
  template_id: string;
  title: string;
  required_photo: boolean;
  sort_order: number;
};

export type Job = {
  id: string;
  site_id: string;
  checklist_template_id: string | null;
  scheduled_start: string;
  scheduled_end: string;
  expected_duration_mins: number | null;
  assigned_cleaner_id: string | null;
  status: JobStatus;
  job_type: string | null;
  instructions: string | null;
  rework_note: string | null;
  rework_note_by: string | null;
  rework_note_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type JobTask = {
  id: string;
  job_id: string;
  title: string;
  required_photo: boolean;
  sort_order: number;
  completed_at: string | null;
  completed_by: string | null;
  notes: string | null;
};

export type JobClockEvent = {
  id: string;
  job_id: string;
  cleaner_id: string;
  type: ClockEventType;
  at: string;
  lat: number;
  lng: number;
  accuracy_meters: number | null;
  is_within_geofence: boolean | null;
  distance_meters: number | null;
  source: ClockEventSource;
  created_at: string;
};

export type BreakEvent = {
  id: string;
  cleaner_id: string;
  job_id: string | null;
  type: BreakEventType;
  at: string;
  lat: number;
  lng: number;
  accuracy_meters: number | null;
  source: ClockEventSource;
  created_at: string;
};

export type JobAttachment = {
  id: string;
  job_id: string;
  type: AttachmentType;
  storage_path: string;
  uploaded_by: string | null;
  uploaded_at: string;
};

export type Issue = {
  id: string;
  job_id: string;
  created_by: string | null;
  category: IssueCategory;
  severity: IssueSeverity;
  message: string;
  status: IssueStatus;
  created_at: string;
  updated_at: string;
};

export type TimesheetPeriod = {
  id: string;
  start_date: string;
  end_date: string;
  status: TimesheetStatus;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type TimesheetEntry = {
  id: string;
  cleaner_id: string;
  job_id: string;
  period_id: string | null;
  clock_in_at: string | null;
  clock_out_at: string | null;
  break_minutes: number;
  minutes_worked: number | null;
  exceptions_json: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  link_url: string | null;
  created_at: string;
  read_at: string | null;
};

export type JobStatusEvent = {
  id: string;
  job_id: string;
  old_status: JobStatus | null;
  new_status: JobStatus;
  changed_by: string | null;
  note: string | null;
  created_at: string;
};
