'use babel';
/* @flow */

import { Range } from 'atom';
import flatten from 'lodash.flatten';

import type { FlowError, LinterTrace, LinterMessage } from './types.js';

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

function flowMessageToLinterMessages({ message: flowMessages }): Array<LinterMessage> {
  const blameMessages = flowMessages.filter(m => m.type === 'Blame');

  return blameMessages.map((flowMessage, i) => ({
    type: flowMessage.level === 'error' ? 'Error' : 'Warning',
    text: flowMessages.map(msg => msg.descr).join(' '),
    filePath: flowMessage.path || null,
    range: extractRange(flowMessage),
    trace: [...blameMessages.slice(0, i), ...blameMessages.slice(i + 1)].map(flowMessageToTrace),
  }));
}

function handleData(json: any): Array<LinterMessage> {
  if (json.passed || !json.errors) {
    return [];
  }
  return flatten(json.errors.map(flowMessageToLinterMessages));
}

export default handleData;
