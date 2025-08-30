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

import {ActionInputs} from '../inputs';
import DarwinInstaller from './darwin';
import Installer from './installer';
import LinuxInstaller from './linux';
import WindowsInstaller from './windows';

export default async function getInstaller(
  actionInputs: ActionInputs
): Promise<Installer> {
  switch (process.platform) {
    case 'win32':
    case 'cygwin':
      return new WindowsInstaller(actionInputs);
    case 'darwin':
      return new DarwinInstaller(actionInputs);
    case 'linux':
      return new LinuxInstaller(actionInputs);
    default:
      throw Error(`Invalid platform: ${process.platform}.`);
  }
}

export {Installer};
