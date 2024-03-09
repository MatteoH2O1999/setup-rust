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
import {InputNames} from './constants';

export enum Profile {
  MINIMAL = 'minimal',
  DEFAULT = 'default',
  COMPLETE = 'complete'
}

export type ActionInputs = {
  channel: string;
  profile: Profile;
  components: string[];
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
      components.push(component.trim());
    }
  }
  return components;
}

export async function parseInputs(): Promise<ActionInputs> {
  return {
    channel: await parseChannel(),
    components: await parseComponents(),
    profile: await parseProfile()
  };
}
