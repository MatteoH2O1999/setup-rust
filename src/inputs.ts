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
import {InputNames} from './constants';

export enum Profile {
  MINIMAL = 'minimal',
  DEFAULT = 'default',
  COMPLETE = 'complete'
}

export enum Cache {
  NOTHING,
  BINSTALL,
  ALL
}

export type ActionInputs = {
  channel: string;
  profile: Profile;
  components: string[];
  subcommands: string[];
  cache: Cache;
};

async function parseChannel(): Promise<string> {
  return core.getInput(InputNames.CHANNEL);
}

async function parseProfile(): Promise<Profile> {
  const profileString = core.getInput(InputNames.PROFILE).toLowerCase().trim();
  if (profileString === 'minimal') {
    return Profile.MINIMAL;
  }
  if (profileString === 'default') {
    return Profile.DEFAULT;
  }
  if (profileString === 'complete') {
    return Profile.COMPLETE;
  }
  throw new Error(
    `Invalid profile: ${profileString}. Expected one of "complete", "default" or "minimal".`
  );
}

async function parseComponents(): Promise<string[]> {
  const lines = core.getMultilineInput(InputNames.COMPONENTS);
  const components: string[] = [];
  for (const line of lines) {
    for (const component of line.split(' ')) {
      if (component.length !== 0) {
        components.push(component.trim());
      }
    }
  }
  return components;
}

async function parseSubcommands(): Promise<string[]> {
  const lines = core.getMultilineInput(InputNames.SUBCOMMANDS);
  const subcommands: string[] = [];
  for (const line of lines) {
    for (const subcommand of line.split(' ')) {
      if (subcommand.length != 0) {
        subcommands.push(subcommand.trim());
      }
    }
  }
  return subcommands;
}

async function parseCache(): Promise<Cache> {
  const cacheStrig = core.getInput(InputNames.CACHE).toLowerCase().trim();
  if (cacheStrig === 'false') {
    return Cache.NOTHING;
  }
  if (cacheStrig === 'binstall') {
    return Cache.BINSTALL;
  }
  if (cacheStrig === 'all') {
    return Cache.ALL;
  }
  throw new Error(
    `Invalid cache: ${cacheStrig}. Expected one of "false", "binstall" or "all".`
  );
}

export async function parseInputs(): Promise<ActionInputs> {
  const profile = await parseProfile();
  let components = await parseComponents();
  components.push(...['rust-std', 'rustc', 'cargo']);
  if (profile === Profile.DEFAULT) {
    components.push(...['rust-docs', 'rustfmt', 'clippy']);
  }
  components = [...new Set(components)];
  if (profile === Profile.COMPLETE) {
    components = [];
  }
  return {
    cache: await parseCache(),
    channel: await parseChannel(),
    components,
    profile,
    subcommands: [...new Set(await parseSubcommands())]
  };
}
