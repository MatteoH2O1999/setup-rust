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
import * as installer from '../installers/index';
import * as io from '@actions/io';
import {ActionInputs, Profile} from '../inputs';
import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import {InputNames} from '../constants';
import main from '../main';

let commands: string[] = [];

class MockInstaller extends installer.Installer {
  private readonly inputs: ActionInputs;

  constructor(inputs: ActionInputs) {
    super(inputs);
    this.inputs = inputs;
  }

  override async installRustup(): Promise<void> {
    commands.push('Install rustup');
  }

  override async setProfile(): Promise<void> {
    commands.push(`Set profile to ${this.inputs.profile}`);
  }

  override async installChannel(): Promise<void> {
    commands.push(`Install toolchain from channel ${this.inputs.channel}`);
  }

  override async installSubcommands(): Promise<void> {
    if (this.inputs.subcommands.length > 0) {
      commands.push(
        `Install cargo subcommands ${this.inputs.subcommands.join(', ')}`
      );
    }
  }

  override async installComponents(): Promise<void> {
    if (this.inputs.profile === Profile.COMPLETE) {
      commands.push('Install all components');
    } else {
      commands.push(`Install components ${this.inputs.components.join(', ')}`);
    }
  }
}

type MockedInputs = {
  channel: string;
  profile: string;
  components: string;
  subcommands: string;
  cache: string;
};

const mockedInputs: MockedInputs = {
  cache: 'false',
  channel: 'stable',
  components: 'clippy',
  profile: 'minimal',
  subcommands: ''
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
  } else if (input == InputNames.SUBCOMMANDS) {
    return inpts.subcommands;
  } else if (input == InputNames.CACHE) {
    return inpts.cache;
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

mockedInstaller.default.mockImplementation(async actionInputs => {
  return new MockInstaller(actionInputs);
});

describe('main', () => {
  beforeEach(() => {
    commands = [];

    mockedInputs.channel = 'stable';
    mockedInputs.components = 'clippy';
    mockedInputs.profile = 'minimal';
    mockedInputs.subcommands = '';
    mockedInputs.cache = 'false';
  });

  test('rustup already installed', async () => {
    mockedIo.which.mockResolvedValueOnce('rustup');

    await main();

    expect(commands).toEqual([
      'Set profile to minimal',
      'Install toolchain from channel stable',
      'Install components clippy, rust-std, rustc, cargo'
    ]);
  });

  test('rustup not installed', async () => {
    mockedIo.which.mockRejectedValueOnce(new Error());

    await main();

    expect(commands).toEqual([
      'Install rustup',
      'Set profile to minimal',
      'Install toolchain from channel stable',
      'Install components clippy, rust-std, rustc, cargo'
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

  test('cargo subcommands', async () => {
    mockedIo.which.mockResolvedValueOnce('rustup');
    mockedInputs.subcommands = 'a b c-d';

    await main();

    expect(commands).toEqual([
      'Set profile to minimal',
      'Install toolchain from channel stable',
      'Install components clippy, rust-std, rustc, cargo',
      'Install cargo subcommands a, b, c-d'
    ]);
  });
});
