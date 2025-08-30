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

export enum InputNames {
  CHANNEL = 'channel',
  PROFILE = 'profile',
  COMPONENTS = 'components',
  SUBCOMMANDS = 'subcommands',
  CACHE = 'cache'
}

const toolname = 'rustup';
const shellInstallerUrl = 'https://sh.rustup.rs';
const windowsInstallerUrl =
  'https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe';

export {toolname, shellInstallerUrl, windowsInstallerUrl};
