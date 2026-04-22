# Top-level convenience targets for cobre-docs.
#
#   make            → same as `make build`
#   make build      → build the mdBook site (book/)
#   make serve      → live-reloading local preview on :3000
#   make diagrams   → render every matplotlib script into src/images/
#   make lint       → ruff check + mypy --strict on diagram scripts
#   make fmt        → ruff format + ruff check --fix
#   make sync       → uv sync (runtime + dev deps; add GROUPS=manim for animation)
#   make clean      → remove book/ and generated d-*.{svg,png}
#
# Diagram rendering is manual (D2 policy): CI does NOT re-render. Commit the
# SVG/PNG outputs alongside the script that produced them.

.PHONY: all build serve diagrams lint fmt sync clean

GROUPS ?=

all: build

build:
	mdbook build

serve:
	mdbook serve --open

diagrams:
	$(MAKE) -C diagrams/matplotlib all

lint:
	.venv/bin/ruff check diagrams/matplotlib
	.venv/bin/mypy diagrams/matplotlib

fmt:
	.venv/bin/ruff format diagrams/matplotlib
	.venv/bin/ruff check --fix diagrams/matplotlib

sync:
ifneq ($(GROUPS),)
	uv sync $(addprefix --group ,$(GROUPS))
else
	uv sync
endif

clean:
	rm -rf book
	$(MAKE) -C diagrams/matplotlib clean
