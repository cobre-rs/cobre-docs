# Render all matplotlib diagrams. Invoke from this directory:
#   make           # render every d*.py
#   make clean     # remove generated d-*.svg / d-*.png from src/images/
#   make d02_value_function.py   # render one script
#
# D2 policy: diagrams are rendered locally and committed as SVG/PNG. CI does
# not re-render — it just builds the book against the committed assets.

PY       ?= uv run python3
SCRIPTS  := $(wildcard d*.py)
IMAGES   := ../../src/images

.PHONY: all clean $(SCRIPTS)

all: $(SCRIPTS)

$(SCRIPTS):
	$(PY) $@

clean:
	rm -f $(IMAGES)/d*-*.svg
