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
import * as io from '@actions/io';
import getInstaller from './installers';
import {parseInputs} from './inputs';
import {toolname} from './constants';

export default async function main(): Promise<void> {
  const inputs = await parseInputs();
  const installer = await getInstaller();
  let rustupPath: string;

  try {
    rustupPath = await io.which(toolname);
  } catch (error) {
    rustupPath = '';
  }

  core.startGroup('Installing rustup');
  if (rustupPath !== '') {
    core.info('Rustup is already installed.');
  } else {
    await installer.installRustup();
  }
  core.endGroup();

  core.startGroup('Clearing rustup installation');
  await installer.clearInstallation();
  core.endGroup();

  core.startGroup('Setting profile');
  await installer.setProfile(inputs.profile);
  core.endGroup();

  core.startGroup('Installing toolchain');
  await installer.installChannel(inputs.channel);
  core.endGroup();

  core.startGroup('Installing additional components');
  for (const component of inputs.components) {
    await installer.installComponent(component);
  }
  core.endGroup();
}
