# Setup Rust

Setup Rust in your Github Actions Workflow

## Basic Usage

Simple usage of this action:

```yml
- name: Setup Rust
  uses: MatteoH2O1999/setup-rust
```

## Inputs

|Input|Description|Default|
|-----|-----------|-------|
|Channel|The rust channel to download rust from|`stable`|
|Profile|The profile to use (either `minimal`, `default` or `complete`)|`minimal`|
|Components|The list of additional components to install (`clippy`, `rustfmt`, etc.)|`None`|
