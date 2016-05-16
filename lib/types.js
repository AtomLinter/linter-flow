import { Range } from 'atom';

export type LinterTrace = {
  type: 'Trace';
  text?: string;
  html?: string;
  filePath: string;
  range?: Range;
};

export type LinterMessage = {
  type: 'Error' | 'Warning';
  text?: string;
  html?: string;
  filePath?: string;
  range?: Range;
  trace?: Array<LinterTrace>;
};

export type FlowError = {
  level: string;
  descr: string;
  path: string;
  line: number;
  start: number;
  endline: number;
  end: number;
};

export type BufferType = {
  cachedText: string;
  getText(): string;
};

export type TextEditorType = {
  getPath(): string;
  getText(): string;
  buffer: BufferType;
  isModified(): boolean;
};

export type Linter = {
  grammarScopes: Array<string>;
  scope: 'file' | 'project';
  name?: string;
  lintOnFly: boolean;
  lint(TextEditor: TextEditorType): Array<LinterMessage> | Promise<Array<LinterMessage>>;
};
