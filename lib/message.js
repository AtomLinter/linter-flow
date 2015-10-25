'use babel';
/* @flow */

type Range = Array<Array<number>>
type LinterTrace = { type: 'Trace', text?: string, html?: string, filePath?: string, range?: Range, class?: string }
type LinterMessage = { type: string, text?: string, html?: string, filePath: string, range: Range, trace?: Array<LinterTrace> }
type FlowMessage = { descr: string, level: string, path: string, start: number, end: number, line: number, endline: number }

function extractRange(message: FlowMessage): Range {
  return [
    [message.line - 1, message.start - 1],
    [message.endline - 1, message.end],
  ];
}

function flowMessageToTrace(message: FlowMessage): LinterTrace {
  return {
    type: 'Trace',
    text: message.descr,
    filePath: message.path,
    range: extractRange(message),
  };
}

function flowMessageToLinterMessage({ message: messages }): LinterMessage {
  const first = messages[0];

  return {
    type: first.level,
    text: messages.map(msg => msg.descr).join('. '),
    filePath: first.path,
    range: extractRange(first),
    trace: messages.slice(1).map(flowMessageToTrace),
  };
}

function handleData(data: any): Array<LinterMessage> {
  if (data.passed || !data.errors) {
    return [];
  }
  return data.errors.map(flowMessageToLinterMessage);
}

export default handleData;
