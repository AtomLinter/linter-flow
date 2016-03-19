'use babel';
/* @flow */

import { spawn } from 'child_process';
import path from 'path';

const startedServers = new Map();
const externalServers = new Set();

export function start(pathToFlow: string, flowConfig: string, enableAll: boolean): Promise<void> {
  const flowConfigPath = path.dirname(flowConfig);

  return new Promise((resolve, reject) => {
    // Start flow server for project if necessary
    if (startedServers.has(flowConfigPath) || externalServers.has(flowConfigPath)) {
      return resolve();
    }

    atom.notifications.addInfo(`[Linter-Flow] Starting Flow server for: ${flowConfigPath}`);

    let args = ['server', flowConfig];
    if (enableAll) {
      args = [...args, '--all'];
    }

    const serverProcess = spawn(pathToFlow, args, {cwd: flowConfigPath});
    function handleMsg(data: any) {
      const message = data.toString();
      if (message.indexOf('another server is already running?') > -1) {
        atom.notifications.addInfo(
          `[Linter-Flow] External Flow server detected for: ${flowConfig}`
        );
        externalServers.add(flowConfigPath);
        return resolve();
      }
      if (message.indexOf('READY') > -1) {
        atom.notifications.addInfo(`[Linter-Flow] Flow server ready for: ${flowConfig}`);
        startedServers.set(flowConfigPath, serverProcess);
        return resolve();
      }
    }
    serverProcess.stdout.on('data', handleMsg);
    serverProcess.stderr.on('data', handleMsg);
    serverProcess.on('exit', (code, signal) => {
      if (code === 2 && signal === null) {
        atom.notifications.addError('[Linter-Flow] Flow server unexpectedly exited.');
        return reject();
      }
    });
  });
}

export function stop(): void {
  startedServers.forEach((server, flowConfigPath) => {
    atom.notifications.addInfo(`[Linter-Flow] Killing Flow server for: ${flowConfigPath}`);
    server.kill('SIGKILL');
  });
  startedServers.clear();
  externalServers.clear();
}
