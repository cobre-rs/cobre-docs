# cobre-docs

Documentation for the [Cobre](https://github.com/cobre-rs/cobre) ecosystem — algorithm references, user guides, crate documentation, and NEWAVE migration guides.

Built with [mdBook](https://rust-lang.github.io/mdBook/).

## Local development

```bash
# Install mdBook
cargo install mdbook

# Serve with live reload
mdbook serve --open

# Build static site
mdbook build
```

The site is built to `./book/` and deployed to GitHub Pages on push to `main`.

## Structure

```
src/
├── introduction.md          # Landing page
├── guide/                   # User-facing guides
├── crates/                  # Per-crate documentation
├── algorithms/              # Algorithm theory and references
├── migration/               # NEWAVE migration guides
├── reference/               # Glossary, bibliography, FAQ
└── contributing.md
```

## License

Licensed under [Apache-2.0](https://github.com/cobre-rs/cobre/blob/main/LICENSE).
