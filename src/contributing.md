# Contributing

Contributions to Cobre are welcome — code, documentation, bug reports, and test cases.

## Getting started

1. Fork the relevant repository on GitHub
2. Clone your fork locally
3. Create a branch for your change (`git checkout -b feat/my-feature`)
4. Make your changes and commit using [Conventional Commits](https://www.conventionalcommits.org/)
5. Push and open a pull request

## Commit conventions

All repositories in the Cobre ecosystem use Conventional Commits:

```
feat(sddp): implement multi-cut strategy
fix(core): correct reservoir volume bounds validation
docs(io): add NEWAVE HIDR.DAT format documentation
refactor(solver): extract basis cache into separate module
test(stochastic): add PAR(p) model validation tests
```

Prefix scopes match crate names without the `cobre-` prefix.

## Code style

- Run `cargo fmt` before committing
- Run `cargo clippy -- -D warnings` and resolve all warnings
- Write tests for new functionality
- Document public items with `///` doc comments

## Documentation contributions

This documentation site uses [mdBook](https://rust-lang.github.io/mdBook/). To build locally:

```bash
# Install mdBook
cargo install mdbook

# Clone the docs repo
git clone https://github.com/cobre-rs/cobre-docs.git
cd cobre-docs

# Serve with live reload
mdbook serve --open
```

## Reporting issues

- Use the appropriate repository's issue tracker
- For algorithm or methodology questions, use [Discussions](https://github.com/cobre-rs/cobre/discussions)
- Include a minimal reproducible example when reporting bugs

## License

By contributing to Cobre, you agree that your contributions will be licensed under the [Apache License 2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE).
