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
import * as tc from '@actions/tool-cache';
import Installer from './installer';
import {shellInstallerUrl} from '../constants';

export default class LinuxInstaller extends Installer {
  async installRustup(): Promise<void> {
    const installerFile = await tc.downloadTool(shellInstallerUrl);
    core.info('Shell installer downloaded');
    await exec.exec(installerFile);
    core.info('Rustup successfully installed');
  }
}
