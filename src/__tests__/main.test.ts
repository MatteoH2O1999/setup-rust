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
import * as installer from '../installers/index';
import * as io from '@actions/io';
import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import {InputNames} from '../constants';
import {Profile} from '../inputs';
import main from '../main';

let commands: string[] = [];

class MockInstaller extends installer.Installer {
  override async installRustup(): Promise<void> {
    commands.push('Install rustup');
  }

  override async setProfile(profile: Profile): Promise<void> {
    commands.push(`Set profile to ${profile}`);
  }

  override async installChannel(channel: string): Promise<void> {
    commands.push(`Install toolchain from channel ${channel}`);
  }

  override async ensureAllComponents(): Promise<void> {
    commands.push('Install all components');
  }

  override async ensureComponents(components: string[]): Promise<void> {
    commands.push(`Install components ${components.join(' ')}`);
  }
}

type MockedInputs = {
  channel: string;
  profile: string;
  components: string;
};

const mockedInputs: MockedInputs = {
  channel: 'stable',
  components: 'clippy',
  profile: 'minimal'
};

function mockInput(
  inpts: MockedInputs,
  input: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: core.InputOptions | undefined
): string {
  if (input === InputNames.CHANNEL) {
    return inpts.channel;
  } else if (input === InputNames.COMPONENTS) {
    return inpts.components;
  } else if (input === InputNames.PROFILE) {
    return inpts.profile;
  } else {
    return '';
  }
}

jest.mock('@actions/core');
jest.mock('@actions/io');
jest.mock('../installers/index');

const mockedCore = jest.mocked(core);
const mockedIo = jest.mocked(io);
const mockedInstaller = jest.mocked(installer);

mockedCore.getBooleanInput.mockImplementation(
  (name: string, options: core.InputOptions | undefined) => {
    const trueValue = ['true', 'True', 'TRUE'];
    const falseValue = ['false', 'False', 'FALSE'];
    const val = core.getInput(name, options);
    if (trueValue.includes(val)) return true;
    if (falseValue.includes(val)) return false;
    throw new TypeError(
      `Input does not meet YAML 1.2 "Core Schema" specification: ${name}\n` +
        `Support boolean input list: \`true | True | TRUE | false | False | FALSE\``
    );
  }
);
mockedCore.getInput.mockImplementation(
  (name: string, options: core.InputOptions | undefined) => {
    return mockInput(mockedInputs, name, options);
  }
);
mockedCore.getMultilineInput.mockImplementation(
  (name: string, options: core.InputOptions | undefined) => {
    const inp: string[] = core
      .getInput(name, options)
      .split('\n')
      .filter(x => x !== '');

    if (options && options.trimWhitespace === false) {
      return inp;
    }

    return inp.map(input => input.trim());
  }
);

mockedInstaller.default.mockImplementation(async () => {
  return new MockInstaller();
});

describe('main', () => {
  beforeEach(() => {
    commands = [];
  });

  test('rustup already installed', async () => {
    mockedIo.which.mockResolvedValueOnce('rustup');

    await main();

    expect(commands).toEqual([
      'Set profile to minimal',
      'Install toolchain from channel stable',
      'Install components clippy rust-std rustc cargo'
    ]);
  });

  test('rustup not installed', async () => {
    mockedIo.which.mockRejectedValueOnce(new Error());

    await main();

    expect(commands).toEqual([
      'Install rustup',
      'Set profile to minimal',
      'Install toolchain from channel stable',
      'Install components clippy rust-std rustc cargo'
    ]);
  });

  test('complete profile', async () => {
    mockedIo.which.mockResolvedValueOnce('rustup');
    mockedInputs.profile = 'complete';

    await main();

    expect(commands).toEqual([
      'Set profile to complete',
      'Install toolchain from channel stable',
      'Install all components'
    ]);
  });
});
