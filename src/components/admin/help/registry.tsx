import type { ReactNode } from "react";
import { AttendanceHelpContent } from "./attendance-content";
import { ClassesHelpContent } from "./classes-content";
import { GalleryHelpContent } from "./gallery-content";
import { InstructorsHelpContent } from "./instructors-content";
import { MembersHelpContent } from "./members-content";
import { NewsHelpContent } from "./news-content";
import { OrdersHelpContent } from "./orders-content";
import { OverviewHelpContent } from "./overview-content";
import { ReactivationsHelpContent } from "./reactivations-content";
import { RegistrationsHelpContent } from "./registrations-content";
import { RsvpsHelpContent } from "./rsvps-content";
import { SessionsHelpContent } from "./sessions-content";
import { StoreHelpContent } from "./store-content";
import { SettingsKioskHelpContent } from "./settings-kiosk-content";
import { SettingsRsvpsHelpContent } from "./settings-rsvps-content";
import { TestimonialsHelpContent } from "./testimonials-content";
import { UsersHelpContent } from "./users-content";
import { WtcdHelpContent } from "./wtcd-content";

// Registry of help topics. Each entry pairs a topic id (used in the
// helpTopic prop on PageHeader and the URL of the standalone page)
// with the content component that renders the body, plus a title and
// description used on the help index and inside the drawer header.

export type HelpTopic =
  | "overview"
  | "members"
  | "registrations"
  | "sessions"
  | "classes"
  | "attendance"
  | "rsvps"
  | "testimonials"
  | "instructors"
  | "wtcd"
  | "orders"
  | "reactivations"
  | "news"
  | "store"
  | "gallery"
  | "users"
  | "settings-rsvps"
  | "settings-kiosk";

export type HelpEntry = {
  title: string;
  description: string;
  body: ReactNode;
  /** Path to the standalone help page so the drawer can offer "Open
   * full page" — useful for printing / bookmarking. */
  fullPageHref: string;
  /** When true, only show the topic in the index for admin-role users.
   * Mirrors the page itself being admin-only. */
  adminOnly?: boolean;
};

export const HELP_REGISTRY: Record<HelpTopic, HelpEntry> = {
  overview: {
    title: "Overview",
    description: "What the dashboard tiles mean and how to use them.",
    body: <OverviewHelpContent />,
    fullPageHref: "/admin/help/overview",
  },
  members: {
    title: "Members",
    description: "Find members, edit their info, send QR badges.",
    body: <MembersHelpContent />,
    fullPageHref: "/admin/help/members",
  },
  registrations: {
    title: "Registrations",
    description: "Mark payments, approve, deny, refund class signups.",
    body: <RegistrationsHelpContent />,
    fullPageHref: "/admin/help/registrations",
  },
  sessions: {
    title: "Sessions",
    description: "Manage specific class dates and one-off events.",
    body: <SessionsHelpContent />,
    fullPageHref: "/admin/help/sessions",
  },
  classes: {
    title: "Classes",
    description: "Add and edit the recurring class schedule.",
    body: <ClassesHelpContent />,
    fullPageHref: "/admin/help/classes",
  },
  attendance: {
    title: "Attendance",
    description: "Open the QR scanner for a class session.",
    body: <AttendanceHelpContent />,
    fullPageHref: "/admin/help/attendance",
  },
  rsvps: {
    title: "RSVPs",
    description: "Approve or reject one-time session attendance requests.",
    body: <RsvpsHelpContent />,
    fullPageHref: "/admin/help/rsvps",
  },
  testimonials: {
    title: "Testimonials",
    description: "Review, approve, and order public-facing quotes.",
    body: <TestimonialsHelpContent />,
    fullPageHref: "/admin/help/testimonials",
  },
  instructors: {
    title: "Instructors",
    description: "Manage instructor profiles shown on the public site.",
    body: <InstructorsHelpContent />,
    fullPageHref: "/admin/help/instructors",
  },
  wtcd: {
    title: "World Tai Chi Day",
    description: "Manage annual celebration events and posters.",
    body: <WtcdHelpContent />,
    fullPageHref: "/admin/help/wtcd",
  },
  orders: {
    title: "Orders",
    description: "Track shirt and merchandise orders.",
    body: <OrdersHelpContent />,
    fullPageHref: "/admin/help/orders",
  },
  reactivations: {
    title: "Reactivations",
    description: "Approve former members rejoining the school.",
    body: <ReactivationsHelpContent />,
    fullPageHref: "/admin/help/reactivations",
  },
  news: {
    title: "News",
    description: "Write, edit, hide, and delete stories for the school website.",
    body: <NewsHelpContent />,
    fullPageHref: "/admin/help/news",
  },
  store: {
    title: "Store",
    description: "Manage products, photos, sizes, and prices.",
    body: <StoreHelpContent />,
    fullPageHref: "/admin/help/store",
  },
  gallery: {
    title: "Gallery",
    description: "Upload, reorder, and manage photos on /gallery.",
    body: <GalleryHelpContent />,
    fullPageHref: "/admin/help/gallery",
  },
  users: {
    title: "Users",
    description: "Invite staff and manage admin access.",
    body: <UsersHelpContent />,
    fullPageHref: "/admin/help/users",
    adminOnly: true,
  },
  "settings-rsvps": {
    title: "RSVP rules",
    description: "Configure RSVP cutoff and level visibility.",
    body: <SettingsRsvpsHelpContent />,
    fullPageHref: "/admin/help/settings-rsvps",
    adminOnly: true,
  },
  "settings-kiosk": {
    title: "Kiosk PIN",
    description: "Set or remove the PIN that protects the attendance scanner.",
    body: <SettingsKioskHelpContent />,
    fullPageHref: "/admin/help/settings-kiosk",
    adminOnly: true,
  },
};
