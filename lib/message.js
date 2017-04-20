/* @flow */

// eslint-disable-next-line import/extensions
import { Range } from 'atom';

import type { FlowError, FlowMessage, LinterTrace, LinterMessageV1 } from './types';

function extractRange(message: FlowMessage): Range {
  return new Range(
    [message.line - 1, message.start - 1],
    [message.endline - 1, message.end],
  );
}

function flowMessageToTrace(message: FlowMessage): LinterTrace {
  return {
    type: 'Trace',
    text: message.descr,
    filePath: message.path,
    range: extractRange(message),
  };
}

function flowErrorToLinterMessages(flowError: FlowError): Array<LinterMessageV1> {
  const blameMessages = flowError.message.filter((m: FlowMessage) => m.type === 'Blame');

  return blameMessages.map((message: FlowMessage, i) => ({
    type: flowError.level === 'error' ? 'Error' : 'Warning',
    text: flowError.message.map((msg: FlowMessage) => msg.descr).join(' '),
    filePath: message.path || null,
    range: extractRange(message),
    trace: [...blameMessages.slice(0, i), ...blameMessages.slice(i + 1)].map(flowMessageToTrace),
  }));
}

function handleData(json: any): Array<LinterMessageV1> {
  if (json.passed || !json.errors) {
    return [];
  }
  return json.errors.reduce((messages, error) =>
    messages.concat(flowErrorToLinterMessages(error)), []);
}

export default handleData;
