'use babel';
/* @flow */

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

function extractRange(message: FlowError): Range {
  return new Range(
    [message.line - 1, message.start - 1],
    [message.endline - 1, message.end],
  );
}

function flowMessageToTrace(message: FlowError): LinterTrace {
  return {
    type: 'Trace',
    text: message.descr,
    filePath: message.path,
    range: extractRange(message),
  };
}

function flowMessageToLinterMessage({ message: flowMessages }): LinterMessage {
  const flowMessage = flowMessages[0];

  return {
    type: flowMessage.level === 'error' ? 'Error' : 'Warning',
    text: flowMessages.map(msg => msg.descr).join(' '),
    filePath: flowMessage.path || null,
    range: extractRange(flowMessage),
    trace: flowMessages.slice(1).map(flowMessageToTrace),
  };
}

function handleData(json: any): Array<LinterMessage> {
  if (json.passed || !json.errors) {
    return [];
  }
  return json.errors.map(flowMessageToLinterMessage);
}

export default handleData;
