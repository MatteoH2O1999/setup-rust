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

import * as cache from '@actions/cache';
import * as core from '@actions/core';
import * as exec from '@actions/exec';
import {ActionInputs, Cache, Profile} from '../inputs';
import crypto from 'crypto';
import os from 'os';
import path from 'path';
import {toolname} from '../constants';

const ROOT_INSTALL_PATH = path.join(os.homedir(), 'setup-rust', '.cargo');
const SUBCOMMANDS_PATH = path.join(ROOT_INSTALL_PATH, 'bin');
const BIN_BASE_CACHE_KEY = 'setup-rust-bin';
const BIN_CACHE_PATHS = [
  SUBCOMMANDS_PATH,
  path.join(ROOT_INSTALL_PATH, '.crates.toml'),
  path.join(ROOT_INSTALL_PATH, '.crates2.json')
];

export default abstract class Installer {
  private readonly actionInputs;
  private restoredKey: string | null = null;
  private readonly requestedPackagesKey;
  private readonly saveBinCache: boolean;
  private baseCache = `${BIN_BASE_CACHE_KEY}-${this.osLabel()}`;

  constructor(actionInputs: ActionInputs) {
    this.actionInputs = actionInputs;

    const requestedPackages = this.actionInputs.subcommands.sort().join(', ');
    this.requestedPackagesKey = crypto
      .createHash('sha256')
      .update(requestedPackages)
      .digest('base64');
    core.debug(`Requested packages key: ${this.requestedPackagesKey}`);
    this.saveBinCache = this.actionInputs.cache !== Cache.NOTHING;
  }

  abstract installRustup(): Promise<void>;
  abstract osLabel(): string;

  async installChannel(): Promise<void> {
    await exec.exec(toolname, ['default', this.actionInputs.channel]);
    core.info(
      `Toolchain "${this.actionInputs.channel}" successfully installed.`
    );
  }

  async setProfile(): Promise<void> {
    await exec.exec(toolname, ['set', 'profile', this.actionInputs.profile]);
    core.info(
      `Profile "${this.actionInputs.profile}" is now new rustup profile.`
    );
  }

  async installComponents(): Promise<void> {
    if (this.actionInputs.profile === Profile.COMPLETE) {
      await this.ensureAllComponents();
    } else {
      await this.ensureComponents(this.actionInputs.components);
    }
  }

  private async ensureComponents(components: string[]): Promise<void> {
    await exec.exec(toolname, ['component', 'add', ...new Set(components)]);
  }

  private async ensureAllComponents(): Promise<void> {
    const output = await exec.getExecOutput(toolname, ['component', 'list']);
    const components: string[] = [];
    for (const c of output.stdout.split('\n')) {
      if (!c.includes('installed')) {
        components.push(c.trim());
      }
    }
    this.actionInputs.components = components;
    await this.ensureComponents(components);
  }

  private async saveSubcommandsCache(): Promise<void> {
    core.info('Checking whether subcommands cache should be saved');

    const packageInformation = (
      await exec.getExecOutput(
        toolname,
        [
          'run',
          this.actionInputs.channel,
          'cargo',
          'install',
          '--list',
          '--root',
          ROOT_INSTALL_PATH
        ],
        {silent: true}
      )
    ).stdout;
    core.info(`Computing key for packages:\n${packageInformation}`);

    const packageInformationKey = crypto
      .createHash('sha256')
      .update(packageInformation)
      .digest('base64');

    const expectedKey = `${this.baseCache}-${this.requestedPackagesKey}-${packageInformationKey}`;
    core.debug(`Expected key: ${expectedKey}`);
    core.debug(`Restored key: ${this.restoredKey ?? 'null'}`);

    if (this.restoredKey !== expectedKey) {
      core.info('Cache key match not found. Saving cache...');
      await cache.saveCache(BIN_CACHE_PATHS, expectedKey);
      core.info('Subcommands cache saved successfully');
    }
  }

  private async restoreSubcommadsCache(): Promise<void> {
    core.info('Trying to restore subcommands cache');

    this.restoredKey =
      (await cache.restoreCache(
        BIN_CACHE_PATHS,
        `${this.baseCache}-${this.requestedPackagesKey}`,
        [this.baseCache]
      )) ?? null;

    if (this.restoredKey === null) {
      core.info('Cache miss');
    } else {
      core.info(`Restored cache with key: ${this.restoredKey}`);
    }
  }

  private async installBinstall(): Promise<void> {
    core.info('Installing cargo-binstall...');

    await exec.exec(toolname, [
      'run',
      this.actionInputs.channel,
      'cargo',
      'install',
      ...(this.actionInputs.cache === Cache.NOTHING
        ? []
        : ['--root', ROOT_INSTALL_PATH]),
      'cargo-binstall'
    ]);
  }

  private async uninstallBinstall(): Promise<void> {
    core.info('Uninstalling cargo-binstall');
    await exec.exec(toolname, [
      'run',
      this.actionInputs.channel,
      'cargo',
      'uninstall',
      ...(this.actionInputs.cache === Cache.NOTHING
        ? []
        : ['--root', ROOT_INSTALL_PATH]),
      'cargo-binstall'
    ]);
  }

  async installSubcommands(): Promise<void> {
    const subcommands = this.actionInputs.subcommands.filter(
      subcommand => subcommand !== 'cargo-binstall'
    );

    if (this.actionInputs.subcommands.length > 0) {
      if (this.saveBinCache) {
        await this.restoreSubcommadsCache();

        core.info(`Adding ${SUBCOMMANDS_PATH} to path`);
        core.addPath(SUBCOMMANDS_PATH);
      }

      core.info('Performing installation of cargo subcommands...');
      await this.installBinstall();

      if (subcommands.length > 0) {
        await exec.exec(toolname, [
          'run',
          this.actionInputs.channel,
          'cargo',
          'binstall',
          '--no-confirm',
          '--disable-telemetry',
          ...(this.actionInputs.cache === Cache.ALL
            ? ['--root', ROOT_INSTALL_PATH]
            : []),
          ...subcommands
        ]);
      }

      if (this.saveBinCache) {
        await this.saveSubcommandsCache();
      }

      if (!this.actionInputs.subcommands.includes('cargo-binstall')) {
        await this.uninstallBinstall();
      }
    }
  }
}
