'use babel';

function extractRange(message) {
  return [
    [message.line - 1, message.start - 1],
    [message.endline - 1, message.end],
  ];
}

function flowMessageToTrace(message) {
  return {
    type: 'Trace',
    text: message.descr,
    filePath: message.path,
    range: extractRange(message),
  };
}

function toLinterMsg(arr) {
  // h/t Nuclide-flow
  // It's unclear why the 1-based to 0-based indexing works the way that it
  // does, but this has the desired effect in the UI, in practice.
  const message = Array.isArray(arr) ? arr[0] : arr;

  const obj = {
    type: message.level,
    text: Array.isArray(arr)
      ? arr.map(item => item.descr).join(' ')
      : message.descry,
    filePath: message.path,
    range: extractRange(message),
  };

  if (Array.isArray(arr) && arr.length > 1) {
    obj.trace = arr.slice(1).map(flowMessageToTrace);
  }

  return obj;
}

export default toLinterMsg;
