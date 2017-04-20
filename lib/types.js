// eslint-disable-next-line import/extensions
import { Range } from 'atom';

export type LinterTrace = {
  type: 'Trace';
  text?: string;
  html?: string;
  filePath: string;
  range?: Range;
};

export type LinterMessageV1 = {
  type: 'Error' | 'Warning';
  text?: string;
  html?: string;
  filePath?: string;
  range?: Range;
  trace?: Array<LinterTrace>;
};

export type FlowPoint = {
  column: number;
  line: number;
  offset: number;
}

export type FlowLocation = {
  end: FlowPoint;
  source: string;
  start: FlowPoint;
}

export type FlowMessage = {
  context: string;
  descr: string;
  end: number;
  endline: number;
  line: number;
  loc?: FlowLocation;
  path: string;
  start: number;
  type: string;
};

export type FlowError = {
  kind: string;
  level: string;
  message: Array<FlowMessage>;
}

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
  lint(TextEditor: TextEditorType): Array<LinterMessageV1> | Promise<Array<LinterMessageV1>>;
};
