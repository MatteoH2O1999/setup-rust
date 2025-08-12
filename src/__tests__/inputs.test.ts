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
import * as inputs from '../inputs';
import {beforeEach, describe, expect, jest, test} from '@jest/globals';
import {InputNames} from '../constants';

type MockedInputs = {
  channel: string;
  profile: string;
  components: string;
  subcommands: string;
};

const mockedInputs: MockedInputs = {
  channel: 'stable',
  components: '',
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
  } else if (input === InputNames.SUBCOMMANDS) {
    return inpts.subcommands;
  } else {
    return '';
  }
}

jest.mock('@actions/core');

const mockedCore = jest.mocked(core);

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

describe('Input parsing', () => {
  beforeEach(() => {
    mockedInputs.channel = 'stable';
    mockedInputs.profile = 'minimal';
    mockedInputs.components = '';
  });

  test('default', async () => {
    const actual = await inputs.parseInputs();

    expect(actual.channel).toBe('stable');
    expect(actual.profile).toBe(inputs.Profile.MINIMAL);
    expect(actual.components.sort()).toStrictEqual(
      ['cargo', 'rustc', 'rust-std'].sort()
    );
    expect(actual.subcommands.sort()).toStrictEqual([]);
  });

  describe(`"${InputNames.CHANNEL}"`, () => {
    test('nightly', async () => {
      mockedInputs.channel = 'nightly';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('nightly');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });

    test('1.84', async () => {
      mockedInputs.channel = '1.84';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('1.84');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });

    test('random', async () => {
      mockedInputs.channel = 'random';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('random');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });
  });

  describe(`"${InputNames.PROFILE}"`, () => {
    test('default', async () => {
      mockedInputs.profile = 'default';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('stable');
      expect(actual.profile).toBe(inputs.Profile.DEFAULT);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std', 'rust-docs', 'clippy', 'rustfmt'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });

    test('complete', async () => {
      mockedInputs.profile = 'complete';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('stable');
      expect(actual.profile).toBe(inputs.Profile.COMPLETE);
      expect(actual.components.sort()).toStrictEqual([]);
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });

    test('other', async () => {
      mockedInputs.profile = 'other';

      await expect(inputs.parseInputs()).rejects.toThrow();
    });
  });

  describe(`"${InputNames.COMPONENTS}"`, () => {
    test('Unique', async () => {
      mockedInputs.components = 'a b';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('stable');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['a', 'b', 'rustc', 'cargo', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });

    test('Duplicate', async () => {
      mockedInputs.components = 'cargo';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('stable');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual([]);
    });
  });

  describe(`"${InputNames.SUBCOMMANDS}"`, () => {
    test('Unique', async () => {
      mockedInputs.subcommands = 'a b';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('stable');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual(['a', 'b'].sort());
    });

    test('Duplicate', async () => {
      mockedInputs.subcommands = 'b a a b';

      const actual = await inputs.parseInputs();

      expect(actual.channel).toBe('stable');
      expect(actual.profile).toBe(inputs.Profile.MINIMAL);
      expect(actual.components.sort()).toStrictEqual(
        ['cargo', 'rustc', 'rust-std'].sort()
      );
      expect(actual.subcommands.sort()).toStrictEqual(['b', 'a'].sort());
    });
  });
});
