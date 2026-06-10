export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface Candidate {
  id: string;
  name: string;
  stage: string;
  overallScore: number;
  confidence: 'High' | 'Medium' | 'Low';
  properties: {
    efficacy: number;
    safety: number;
    admet: number;
    developability: number;
  };
}

export type ConfidenceLevel = 'High' | 'Medium' | 'Low';
export type AgentStatus = 'Completed' | 'In progress' | 'Queued';
export type ProjectStatus = 'Active' | 'Planning' | 'Paused' | 'Completed';
export type DataSourceStatus = 'Active' | 'Not connected';
export type AlertType = 'safety' | 'trial' | 'regulatory' | 'opportunity';
export type FileType = 'SDF' | 'CSV' | 'XLSX' | 'PDF' | 'FASTA';

export interface Candidate {
  id: string;
  name: string;
  stage: string;
  score: number;
  confidence: ConfidenceLevel;
  efficacy: number;
  safety: number;
  admet: number;
  developability: number;
}

export interface AnaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning?: string;
  confidence?: number;
  sources?: string[];
  timestamp: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  progress: number;
  molecules: number;
  status: ProjectStatus;
}

export interface LedgerEvent {
  id: string;
  occurredAt: string;
  actor: string;
  action: string;
  subject?: string;
  detail?: Record<string, unknown>;
  reasoning?: string;
  confidence?: string;
}

export interface DataFile {
  name: string;
  type: FileType;
  addedAt: string;
}
