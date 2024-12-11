# Setup Rust

[![CI/CD](https://github.com/MatteoH2O1999/setup-rust/actions/workflows/test.yml/badge.svg)](https://github.com/MatteoH2O1999/setup-rust/actions/workflows/test.yml)
![GitHub License](https://img.shields.io/github/license/MatteoH2O1999/setup-rust)
[![codecov](https://codecov.io/github/MatteoH2O1999/setup-rust/graph/badge.svg?token=gBtQmQor9O)](https://codecov.io/github/MatteoH2O1999/setup-rust)

Setup Rust in your Github Actions Workflow

## Basic Usage

Simple usage of this action:

```yml
- name: Setup Rust
  uses: MatteoH2O1999/setup-rust@v1
```

## Inputs

|Input|Description|Default|
|-----|-----------|-------|
|Channel|The rust channel to download rust from|`stable`|
|Profile|The profile to use (either `minimal`, `default` or `complete`)|`minimal`|
|Components|The list of additional components to install (`clippy`, `rustfmt`, etc.)|`None`|
