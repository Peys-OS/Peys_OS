export interface Contact {
  id: string;
  name: string;
  email: string;
  favorite: boolean;
  lastSent?: Date;
  totalSent: number;
}

export const MOCK_CONTACTS: Contact[] = [
  { id: "c1", name: "Alice Johnson", email: "alice@email.com", favorite: true, lastSent: new Date(Date.now() - 86400000), totalSent: 1250 },
  { id: "c2", name: "Bob Smith", email: "bob@email.com", favorite: false, lastSent: new Date(Date.now() - 172800000), totalSent: 890 },
  { id: "c3", name: "Grace Chen", email: "grace@email.com", favorite: true, lastSent: new Date(Date.now() - 3600000), totalSent: 2100 },
  { id: "c4", name: "Moses Adebayo", email: "moses@email.com", favorite: false, lastSent: new Date(Date.now() - 604800000), totalSent: 420 },
  { id: "c5", name: "Sarah Kim", email: "sarah@email.com", favorite: false, totalSent: 310 },
];
