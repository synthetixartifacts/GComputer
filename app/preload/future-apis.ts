// @ts-nocheck
// Future IPC API design for "everything app" capabilities
// This file documents the planned API structure for future implementation

import type { Route } from '../renderer/src/ts/features/router/types';

// File indexing and search APIs
export interface FileIndexApi {
  // File system scanning
  scanFolder(path: string, options?: { recursive?: boolean; includeHidden?: boolean }): Promise<ScanJobId>;
  getScanProgress(jobId: ScanJobId): Promise<ScanProgress>;
  
  // File operations
  getFileContent(fileId: number): Promise<FileContent>;
  extractText(fileId: number): Promise<TextExtraction>;
  generateEmbeddings(fileId: number, model?: string): Promise<EmbeddingResult>;
  
  // Search operations
  searchFiles(query: SearchQuery): Promise<SearchResult[]>;
  searchSemantic(query: string, options?: SemanticSearchOptions): Promise<SemanticResult[]>;
  
  // Collections
  createCollection(name: string, description?: string): Promise<Collection>;
  addToCollection(collectionId: number, fileIds: number[]): Promise<void>;
  getCollections(): Promise<Collection[]>;
}

// Screen understanding and automation APIs
export interface ScreenApi {
  // Screen capture (with consent)
  captureScreen(options?: CaptureOptions): Promise<ScreenCapture>;
  captureWindow(windowId: string): Promise<WindowCapture>;
  captureRegion(bounds: Rectangle): Promise<RegionCapture>;
  
  // OCR and analysis
  extractText(imageData: ArrayBuffer): Promise<OCRResult>;
  detectElements(imageData: ArrayBuffer): Promise<UIElement[]>;
  
  // Screen monitoring (with permissions)
  watchClipboard(): Promise<ClipboardWatcher>;
  detectActiveWindow(): Promise<ActiveWindow>;
}

// OS automation APIs (with granular permissions)
export interface AutomationApi {
  // Application control
  openApp(appName: string): Promise<AppInstance>;
  getRunningApps(): Promise<AppInstance[]>;
  controlApp(appId: string, action: AppAction): Promise<ActionResult>;
  
  // Input simulation
  typeText(text: string, target?: InputTarget): Promise<void>;
  clickElement(selector: ElementSelector): Promise<void>;
  keyboardShortcut(keys: string[]): Promise<void>;
  
  // File operations
  moveFile(source: string, destination: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  
  // System integration
  runShellCommand(command: string, options?: ShellOptions): Promise<CommandResult>;
  setClipboard(content: string | ArrayBuffer): Promise<void>;
  getClipboard(): Promise<ClipboardContent>;
}

// Permission management APIs
export interface PermissionApi {
  // Permission requests
  requestPermission(tool: string, scope: string, rationale: string): Promise<PermissionResult>;
  checkPermission(tool: string, scope: string): Promise<boolean>;
  revokePermission(tool: string, scope?: string): Promise<void>;
  
  // Permission management
  listPermissions(): Promise<Permission[]>;
  updatePermission(id: number, updates: Partial<Permission>): Promise<Permission>;
  
  // Usage tracking
  getUsageStats(tool: string): Promise<UsageStats>;
}

// Chat and AI integration APIs
export interface AIApi {
  // Chat operations
  sendMessage(content: string, context?: ChatContext): Promise<ChatResponse>;
  createThread(title?: string): Promise<ChatThread>;
  getThreads(): Promise<ChatThread[]>;
  
  // AI actions
  summarizeFile(fileId: number): Promise<Summary>;
  generateTags(fileId: number): Promise<string[]>;
  transcribeAudio(audioData: ArrayBuffer): Promise<Transcription>;
  
  // AI-powered automation
  planAction(goal: string, context?: ActionContext): Promise<ActionPlan>;
  executeAction(plan: ActionPlan, dryRun?: boolean): Promise<ActionResult>;
}

// Voice interaction APIs
export interface VoiceApi {
  // Speech recognition
  startListening(options?: ListenOptions): Promise<VoiceSession>;
  stopListening(sessionId: string): Promise<Transcription>;
  
  // Text-to-speech
  speak(text: string, options?: SpeechOptions): Promise<void>;
  stopSpeaking(): Promise<void>;
  
  // Voice commands
  registerCommand(phrase: string, action: VoiceAction): Promise<void>;
  unregisterCommand(phrase: string): Promise<void>;
  getCommands(): Promise<VoiceCommand[]>;
}

// Workflow and automation builder APIs  
export interface WorkflowApi {
  // Workflow management
  createWorkflow(name: string, steps: WorkflowStep[]): Promise<Workflow>;
  updateWorkflow(id: number, updates: Partial<Workflow>): Promise<Workflow>;
  deleteWorkflow(id: number): Promise<void>;
  getWorkflows(): Promise<Workflow[]>;
  
  // Execution
  executeWorkflow(id: number, inputs?: Record<string, any>): Promise<WorkflowExecution>;
  scheduleWorkflow(id: number, schedule: Schedule): Promise<ScheduledWorkflow>;
  getExecutionHistory(workflowId?: number): Promise<WorkflowExecution[]>;
  
  // Workflow building
  validateWorkflow(steps: WorkflowStep[]): Promise<ValidationResult>;
  testWorkflow(steps: WorkflowStep[], dryRun: boolean): Promise<TestResult>;
}

// Type definitions for future APIs
type ScanJobId = string;
type ScanProgress = { progress: number; totalFiles: number; processedFiles: number; currentFile?: string };
type FileContent = { content: string | ArrayBuffer; mimeType: string };
type TextExtraction = { text: string; confidence: number; language?: string };
type EmbeddingResult = { embedding: number[]; model: string; dimension: number };

type SearchQuery = {
  text?: string;
  filters?: Record<string, any>;
  fileTypes?: string[];
  dateRange?: [Date, Date];
  size?: { min?: number; max?: number };
};

type SearchResult = {
  fileId: number;
  path: string;
  name: string;
  relevance: number;
  snippet?: string;
  highlights?: string[];
};

type SemanticSearchOptions = {
  model?: string;
  limit?: number;
  threshold?: number;
  includeMetadata?: boolean;
};

type SemanticResult = SearchResult & {
  similarity: number;
  semanticSnippet?: string;
};

type Collection = {
  id: number;
  name: string;
  description?: string;
  fileCount: number;
  isSmartCollection: boolean;
  query?: string;
};

type CaptureOptions = {
  includeAudio?: boolean;
  quality?: 'low' | 'medium' | 'high';
  format?: 'png' | 'jpg' | 'webp';
};

type ScreenCapture = {
  imageData: ArrayBuffer;
  timestamp: number;
  dimensions: { width: number; height: number };
  format: string;
};

type Rectangle = { x: number; y: number; width: number; height: number };
type OCRResult = { text: string; confidence: number; blocks: TextBlock[] };
type TextBlock = { text: string; bounds: Rectangle; confidence: number };

type UIElement = {
  type: 'button' | 'input' | 'text' | 'image' | 'link' | 'menu';
  bounds: Rectangle;
  text?: string;
  accessible?: boolean;
  clickable?: boolean;
};

type AppInstance = {
  id: string;
  name: string;
  bundleId: string;
  pid: number;
  windowIds: string[];
  isActive: boolean;
};

type AppAction = {
  type: 'focus' | 'quit' | 'minimize' | 'maximize' | 'show' | 'hide';
  windowId?: string;
  parameters?: Record<string, any>;
};

type ActionResult = {
  success: boolean;
  error?: string;
  data?: any;
};

type Permission = {
  id: number;
  tool: string;
  scope: string;
  granted: boolean;
  grantedAt?: Date;
  expiresAt?: Date;
  usageCount: number;
  rationale?: string;
};

type PermissionResult = {
  granted: boolean;
  permission?: Permission;
  reason?: string;
};

type ChatContext = {
  fileIds?: number[];
  route?: Route;
  selectedText?: string;
  activeWindow?: string;
};

type ChatResponse = {
  content: string;
  citations?: Citation[];
  suggestedActions?: SuggestedAction[];
  toolUsage?: ToolUsage[];
};

type Citation = {
  fileId: number;
  path: string;
  snippet: string;
  relevance: number;
};

type SuggestedAction = {
  label: string;
  description: string;
  action: () => Promise<void>;
};

type ActionPlan = {
  steps: PlannedStep[];
  estimatedDuration: number;
  requiredPermissions: string[];
  risks: string[];
};

type PlannedStep = {
  description: string;
  tool: string;
  parameters: Record<string, any>;
  dependencies?: number[]; // Step indices this depends on
};

type Workflow = {
  id: number;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: Date;
  updatedAt: Date;
  isEnabled: boolean;
};

type WorkflowStep = {
  id: string;
  type: 'action' | 'condition' | 'loop' | 'delay';
  configuration: Record<string, any>;
  nextSteps?: string[];
};

// Future window.gc API expansion
declare global {
  interface Window {
    gc: {
      // Current APIs
      settings: typeof import('./index').settingsApi;
      fs: { listDirectory: (path: string) => Promise<any> };
      db: { test: any };
      
      // Future APIs (to be implemented)
      files?: FileIndexApi;
      screen?: ScreenApi;
      automation?: AutomationApi;
      permissions?: PermissionApi;
      ai?: AIApi;
      voice?: VoiceApi;
      workflows?: WorkflowApi;
    };
  }
}

export {};