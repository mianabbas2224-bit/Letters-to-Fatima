export interface SpaceConfig {
  initialized: boolean;
  creatorEmail: string;
  creatorName: string;
  partnerEmail: string;
  partnerName: string;
  createdAt: string;
}

export interface Letter {
  id: string;
  senderUid: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  recipientName: string;
  subject: string;
  content: string;
  stationery: string; // stationery style (e.g., 'classic', 'lavender', 'parchment', 'midnight')
  status: "draft" | "sent";
  opened: boolean;
  openedAt: string | null;
  openedBy?: string | null;
  createdAt: string;
  sentAt: string | null;
}

export interface Thought {
  id: string;
  authorUid: string;
  authorName: string;
  content: string;
  color: string; // Tailwind bg color class (e.g., 'bg-amber-100', 'bg-rose-100', 'bg-emerald-100')
  createdAt: string;
}
