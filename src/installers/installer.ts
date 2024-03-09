// Action to install rustup in your github actions workflows
// Copyright (C) 2024 Matteo Dell'Acqua
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published
// by the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <https://www.gnu.org/licenses/>.

import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {Profile} from '../inputs';
import {toolname} from '../constants';

export default abstract class Installer {
  abstract installRustup(): Promise<void>;

  async installChannel(channel: string): Promise<void> {
    await exec.exec(toolname, [
      'toolchain',
      'install',
      channel,
      '--allow-downgrade'
    ]);
    core.info(`Toolchain "${channel}" successfully installed.`);
  }

  async setProfile(profile: Profile): Promise<void> {
    await exec.exec(toolname, ['set', 'profile', profile]);
    core.info(`Profile "${profile}" is now new rustup profile.`);
  }

  async installComponent(component: string): Promise<void> {
    core.info(`Installing component ${component}`);
    await exec.exec(toolname, ['component', 'add', component]);
    core.info(`Component "${component}" successfully installed`);
  }

  async clearInstallation(): Promise<void> {
    core.info('Collecting installed toolchains...');
    const versionsOutput = await exec.getExecOutput(
      toolname,
      ['toolchain', 'list'],
      {silent: true}
    );
    const versions = [];
    for (const version of versionsOutput.stdout.split('\n')) {
      if (version !== '') {
        versions.push(version.split('(')[0].trim());
      }
    }

    for (const toolchain of versions) {
      core.info(`Uninstalling toolchain ${toolchain}`);
      await exec.exec(toolname, ['toolchain', 'remove', toolchain]);
    }
  }
}
