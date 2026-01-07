import {
  CalendarDays,
  ClipboardCheck,
  ClipboardList,
  Home,
  LayoutGrid,
  MapPin,
  NotebookPen,
  Shield,
  Users,
  Wallet,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: typeof Home;
};

export const navByRole: Record<"HR" | "SUPERVISOR" | "CLEANER", NavItem[]> = {
  HR: [
    { label: "Users", href: "/app/hr/users", icon: Users },
    { label: "Timesheets", href: "/app/hr/timesheets", icon: Wallet },
    { label: "Reports", href: "/app/hr/reports", icon: LayoutGrid },
  ],
  SUPERVISOR: [
    { label: "Dashboard", href: "/app/supervisor/dashboard", icon: Home },
    { label: "Clients", href: "/app/supervisor/clients", icon: Users },
    { label: "Sites", href: "/app/supervisor/sites", icon: MapPin },
    { label: "Checklists", href: "/app/supervisor/checklists", icon: ClipboardList },
    { label: "Schedule", href: "/app/supervisor/schedule", icon: CalendarDays },
  ],
  CLEANER: [
    { label: "Today", href: "/app/cleaner/today", icon: ClipboardCheck },
    { label: "Active", href: "/app/cleaner/active", icon: Shield },
    { label: "Issues", href: "/app/cleaner/issues", icon: NotebookPen },
    { label: "Timesheets", href: "/app/cleaner/timesheets", icon: Wallet },
  ],
};
