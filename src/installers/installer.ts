// Action to install rustup in your github actions workflows
// Copyright (C) 2025 Matteo Dell'Acqua
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
  private channel: string | null = null;

  abstract installRustup(): Promise<void>;

  async installChannel(channel: string): Promise<void> {
    await exec.exec(toolname, ['default', channel]);
    core.info(`Toolchain "${channel}" successfully installed.`);
    this.channel = channel;
  }

  async setProfile(profile: Profile): Promise<void> {
    await exec.exec(toolname, ['set', 'profile', profile]);
    core.info(`Profile "${profile}" is now new rustup profile.`);
  }

  async ensureComponents(components: string[]): Promise<void> {
    components = [...new Set(components)];
    await exec.exec(toolname, ['component', 'add', ...components]);
  }

  async ensureAllComponents(): Promise<void> {
    const output = await exec.getExecOutput(toolname, ['component', 'list']);
    const components: string[] = [];
    for (const c of output.stdout.split('\n')) {
      if (!c.includes('installed')) {
        components.push(c.trim());
      }
    }
    await this.ensureComponents(components);
  }

  async ensureSubcommands(subcommands: string[]): Promise<void> {
    subcommands = [...new Set(subcommands)];
    if (this.channel === null) {
      core.error('No installed toolchain');
      throw new Error('this.channel should not be null');
    }
    await exec.exec(toolname, [
      'run',
      this.channel,
      'cargo',
      'install',
      ...subcommands
    ]);
  }
}
