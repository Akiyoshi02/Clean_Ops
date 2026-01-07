/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");
const dotenv = require("dotenv");
const { initializeApp, cert, getApps } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");

dotenv.config({ path: path.join(process.cwd(), ".env.local") });

const serviceAccountJson =
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
  (process.env.FIREBASE_SERVICE_ACCOUNT_BASE64
    ? Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT_BASE64, "base64").toString(
        "utf-8",
      )
    : "");

if (!serviceAccountJson) {
  console.error("Missing FIREBASE_SERVICE_ACCOUNT_JSON in .env.local");
  process.exit(1);
}

const serviceAccount = JSON.parse(serviceAccountJson);

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

const auth = getAuth();
const db = getFirestore();

const nowIso = () => new Date().toISOString();

function weekStartMonday(date = new Date()) {
  const start = new Date(date);
  const day = start.getDay();
  const diff = (day + 6) % 7;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

async function upsertUser(user) {
  try {
    await auth.getUser(user.uid);
    await auth.updateUser(user.uid, {
      email: user.email,
      displayName: user.name,
      disabled: !user.is_active,
    });
    console.log(`Updated auth user ${user.email}`);
  } catch {
    await auth.createUser({
      uid: user.uid,
      email: user.email,
      password: user.password,
      displayName: user.name,
      disabled: !user.is_active,
    });
    console.log(`Created auth user ${user.email}`);
  }
}

async function seed() {
  const users = [
    {
      uid: "11111111-1111-1111-1111-111111111111",
      email: "hr@cleanops.local",
      name: "Harper Rivers",
      role: "HR",
      phone: "+1-555-100-1000",
      employee_id: "HR-001",
      pay_rate: 32.5,
      is_active: true,
      password: "CleanOPS123!",
    },
    {
      uid: "22222222-2222-2222-2222-222222222222",
      email: "supervisor@cleanops.local",
      name: "Sam Ortega",
      role: "SUPERVISOR",
      phone: "+1-555-200-2000",
      employee_id: "SUP-010",
      pay_rate: 28.75,
      is_active: true,
      password: "CleanOPS123!",
    },
    {
      uid: "33333333-3333-3333-3333-333333333333",
      email: "cleaner1@cleanops.local",
      name: "Alex Kim",
      role: "CLEANER",
      phone: "+1-555-300-3000",
      employee_id: "CLN-101",
      pay_rate: 19.5,
      is_active: true,
      password: "CleanOPS123!",
    },
    {
      uid: "44444444-4444-4444-4444-444444444444",
      email: "cleaner2@cleanops.local",
      name: "Riley Patel",
      role: "CLEANER",
      phone: "+1-555-400-4000",
      employee_id: "CLN-102",
      pay_rate: 20.25,
      is_active: true,
      password: "CleanOPS123!",
    },
  ];

  for (const user of users) {
    await upsertUser(user);
    const profile = {
      id: user.uid,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      employee_id: user.employee_id,
      pay_rate: user.pay_rate,
      is_active: user.is_active,
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await db.collection("profiles").doc(user.uid).set(profile, { merge: true });
  }

  await db.collection("settings").doc("overtime_threshold_minutes").set(
    {
      value: 2280,
    },
    { merge: true },
  );
  await db.collection("settings").doc("clock_grace_minutes").set(
    {
      value: 30,
    },
    { merge: true },
  );

  const clients = [
    {
      id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa1",
      name: "Arcadia Offices",
      billing_email: "billing@arcadia.example",
      notes: "Multi-floor corporate office, after-hours access via security desk.",
      created_by: "22222222-2222-2222-2222-222222222222",
    },
    {
      id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbb2",
      name: "Mariner Retail",
      billing_email: "finance@mariner.example",
      notes: "Retail client with weekly schedule and strict before-open completion.",
      created_by: "22222222-2222-2222-2222-222222222222",
    },
  ];

  for (const client of clients) {
    await db.collection("clients").doc(client.id).set(
      {
        ...client,
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      { merge: true },
    );
  }

  const templateId = "f1111111-1111-4111-8111-111111111111";
  await db.collection("checklist_templates").doc(templateId).set(
    {
      id: templateId,
      name: "Standard Office Clean",
      created_by: "22222222-2222-2222-2222-222222222222",
      created_at: nowIso(),
      updated_at: nowIso(),
    },
    { merge: true },
  );

  const templateItems = [
    { title: "Entry and lobby surfaces", required_photo: true, sort_order: 1 },
    { title: "Restroom sanitization", required_photo: true, sort_order: 2 },
    { title: "Trash and recycling removal", required_photo: false, sort_order: 3 },
    { title: "Vacuum and spot clean floors", required_photo: false, sort_order: 4 },
    { title: "Disinfect high-touch points", required_photo: true, sort_order: 5 },
  ];

  for (const item of templateItems) {
    const id = db.collection("checklist_template_items").doc().id;
    await db.collection("checklist_template_items").doc(id).set(
      {
        id,
        template_id: templateId,
        title: item.title,
        required_photo: item.required_photo,
        sort_order: item.sort_order,
      },
      { merge: true },
    );
  }

  const sites = [
    {
      id: "cccccccc-cccc-4ccc-cccc-ccccccccccc1",
      client_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa1",
      name: "Arcadia HQ",
      address_line1: "415 Market Street",
      city: "San Francisco",
      state: "CA",
      postal_code: "94105",
      lat: 37.7893,
      lng: -122.3949,
      access_notes: "Check in with lobby security. Supplies closet on level 2.",
      geofence_radius_meters: 175,
      default_checklist_template_id: templateId,
      created_by: "22222222-2222-2222-2222-222222222222",
    },
    {
      id: "dddddddd-dddd-4ddd-dddd-ddddddddddd2",
      client_id: "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaa1",
      name: "Arcadia Annex",
      address_line1: "210 Fremont Street",
      city: "San Francisco",
      state: "CA",
      postal_code: "94105",
      lat: 37.7907,
      lng: -122.3921,
      access_notes: "Access via side door. Alarm code required after 7pm.",
      geofence_radius_meters: 150,
      default_checklist_template_id: templateId,
      created_by: "22222222-2222-2222-2222-222222222222",
    },
    {
      id: "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeee3",
      client_id: "bbbbbbbb-bbbb-4bbb-bbbb-bbbbbbbbbbb2",
      name: "Mariner Mall",
      address_line1: "80 Embarcadero Center",
      city: "San Francisco",
      state: "CA",
      postal_code: "94111",
      lat: 37.7952,
      lng: -122.3977,
      access_notes: "Complete before store opens. Dock access on east side.",
      geofence_radius_meters: 200,
      default_checklist_template_id: templateId,
      created_by: "22222222-2222-2222-2222-222222222222",
    },
  ];

  for (const site of sites) {
    await db.collection("sites").doc(site.id).set(
      {
        ...site,
        address_line2: null,
        country: "US",
        created_at: nowIso(),
        updated_at: nowIso(),
      },
      { merge: true },
    );
  }

  const weekStart = weekStartMonday();
  const jobs = [
    {
      id: "11111111-aaaa-4aaa-aaaa-111111111111",
      site_id: "cccccccc-cccc-4ccc-cccc-ccccccccccc1",
      assigned_cleaner_id: "33333333-3333-3333-3333-333333333333",
      duration: 120,
      dayOffset: 1,
      hourOffset: 9,
      job_type: "Office",
      instructions: "Focus on lobby glass and conference rooms.",
    },
    {
      id: "22222222-bbbb-4bbb-bbbb-222222222222",
      site_id: "dddddddd-dddd-4ddd-dddd-ddddddddddd2",
      assigned_cleaner_id: "44444444-4444-4444-4444-444444444444",
      duration: 120,
      dayOffset: 2,
      hourOffset: 14,
      job_type: "Office",
      instructions: "Extra attention to break room appliances.",
    },
    {
      id: "33333333-cccc-4ccc-cccc-333333333333",
      site_id: "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeee3",
      assigned_cleaner_id: "33333333-3333-3333-3333-333333333333",
      duration: 180,
      dayOffset: 3,
      hourOffset: 7,
      job_type: "Retail",
      instructions: "Complete before store opening at 10am.",
    },
    {
      id: "44444444-dddd-4ddd-dddd-444444444444",
      site_id: "cccccccc-cccc-4ccc-cccc-ccccccccccc1",
      assigned_cleaner_id: "44444444-4444-4444-4444-444444444444",
      duration: 120,
      dayOffset: 4,
      hourOffset: 13,
      job_type: "Office",
      instructions: "Restock supplies closet if needed.",
    },
    {
      id: "55555555-eeee-4eee-eeee-555555555555",
      site_id: "dddddddd-dddd-4ddd-dddd-ddddddddddd2",
      assigned_cleaner_id: "33333333-3333-3333-3333-333333333333",
      duration: 120,
      dayOffset: 5,
      hourOffset: 9,
      job_type: "Office",
      instructions: "Target glass doors and entry mats.",
    },
    {
      id: "66666666-ffff-4fff-ffff-666666666666",
      site_id: "eeeeeeee-eeee-4eee-eeee-eeeeeeeeeee3",
      assigned_cleaner_id: "44444444-4444-4444-4444-444444444444",
      duration: 180,
      dayOffset: 6,
      hourOffset: 8,
      job_type: "Retail",
      instructions: "Weekend deep clean with floor polish.",
    },
  ];

  for (const job of jobs) {
    const start = new Date(weekStart);
    start.setDate(weekStart.getDate() + job.dayOffset);
    start.setHours(job.hourOffset, 0, 0, 0);
    const end = new Date(start.getTime() + job.duration * 60 * 1000);
    const record = {
      id: job.id,
      site_id: job.site_id,
      checklist_template_id: templateId,
      scheduled_start: start.toISOString(),
      scheduled_end: end.toISOString(),
      expected_duration_mins: job.duration,
      assigned_cleaner_id: job.assigned_cleaner_id,
      status: "PUBLISHED",
      job_type: job.job_type,
      instructions: job.instructions,
      rework_note: null,
      rework_note_by: null,
      rework_note_at: null,
      created_by: "22222222-2222-2222-2222-222222222222",
      created_at: nowIso(),
      updated_at: nowIso(),
    };
    await db.collection("jobs").doc(job.id).set(record, { merge: true });
  }

  const templateItemsSnap = await db
    .collection("checklist_template_items")
    .where("template_id", "==", templateId)
    .get();
  const templateDocs = templateItemsSnap.docs.map((doc) => doc.data());

  for (const job of jobs) {
    for (const item of templateDocs) {
      const taskRef = db.collection("job_tasks").doc();
      await taskRef.set({
        id: taskRef.id,
        job_id: job.id,
        title: item.title,
        required_photo: item.required_photo,
        sort_order: item.sort_order ?? 0,
        completed_at: null,
        completed_by: null,
        notes: null,
      });
    }
  }

  const startDate = weekStart.toISOString().slice(0, 10);
  const endDate = new Date(weekStart);
  endDate.setDate(endDate.getDate() + 6);
  const period = {
    id: "99999999-9999-4999-9999-999999999999",
    start_date: startDate,
    end_date: endDate.toISOString().slice(0, 10),
    status: "OPEN",
    created_by: "11111111-1111-1111-1111-111111111111",
    created_at: nowIso(),
    updated_at: nowIso(),
  };
  await db.collection("timesheet_periods").doc(period.id).set(period, {
    merge: true,
  });

  const notifications = [
    {
      user_id: "33333333-3333-3333-3333-333333333333",
      title: "New jobs assigned",
      body: "You have 3 jobs scheduled this week. Check your Today list.",
    },
    {
      user_id: "44444444-4444-4444-4444-444444444444",
      title: "New jobs assigned",
      body: "You have 3 jobs scheduled this week. Tap to review.",
    },
  ];

  for (const notification of notifications) {
    const noteRef = db.collection("notifications").doc();
    await noteRef.set({
      id: noteRef.id,
      user_id: notification.user_id,
      type: "JOB_ASSIGNED",
      title: notification.title,
      body: notification.body,
      link_url: "/app/cleaner/today",
      created_at: nowIso(),
      read_at: null,
    });
  }

  console.log("Seed complete.");
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
