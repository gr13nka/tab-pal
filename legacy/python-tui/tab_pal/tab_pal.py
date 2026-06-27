"""
TabPal, a TUI for generating, browsing and editing colour palettes.

Palettes are stored as plain-text files (one ``#rrggbb`` hex code per line) in a
``my_color_palettes`` directory, so they live alongside your project and are easy
to read, diff and share. The directory location can be overridden with the
``TAB_PAL_DIR`` environment variable.
"""

import os
from re import fullmatch

from textual import on
from textual.app import App
from textual.containers import Vertical, Center, Horizontal
from textual.reactive import reactive
from textual.screen import Screen
from textual.widgets import (
    Button,
    Footer,
    Input,
    Label,
    OptionList,
    Select,
    Static,
)
from textual.validation import Validator
from textual.widgets.option_list import Option

from tab_pal import colors

# Generation strategies. The keys are the identifiers ``colors.generate``
# understands; the values are the labels shown in the generator's type selector.
PALETTE_TYPES = {
    "regular": "Categorical",
    "ordered-sequential": "Sequential",
    "ordered-diverging": "Diverging",
}

# Reverse of PALETTE_TYPES: the display label back to the generation key.
TYPE_LABELS_TO_KEY = {label: key for key, label in PALETTE_TYPES.items()}

HEX_VALIDATION_REGEX = "^(#)?(?:[0-9a-fA-F]{6}){1}$"


# ---------------------------------------------------------------------------
# Palette storage (a directory of "<name>.txt" hex lists)
# ---------------------------------------------------------------------------


def palettes_dir():
    """Return the directory palettes are stored in (created on demand)."""
    return os.environ.get("TAB_PAL_DIR") or os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "my_color_palettes",
    )


def palette_file(name):
    """Return the path of the ``.txt`` file backing a palette."""
    return os.path.join(palettes_dir(), f"{name}.txt")


def load_palettes():
    """Read every saved palette as ``{"name", "colours"}`` (sorted by name)."""
    directory = palettes_dir()
    os.makedirs(directory, exist_ok=True)
    palettes = []
    for filename in sorted(os.listdir(directory)):
        if not filename.endswith(".txt"):
            continue
        with open(os.path.join(directory, filename), "r", encoding="UTF-8") as f:
            colours = [line.strip() for line in f if line.strip()]
        palettes.append({"name": filename[:-4], "colours": colours})
    return palettes


def write_palette(name, colours):
    """Write a whole palette to its ``.txt`` file (one hex code per line)."""
    os.makedirs(palettes_dir(), exist_ok=True)
    with open(palette_file(name), "w", encoding="UTF-8") as f:
        f.write("".join(f"{colour}\n" for colour in colours))


def delete_palette(name):
    """Delete a palette's ``.txt`` file if it exists."""
    path = palette_file(name)
    if os.path.exists(path):
        os.remove(path)


# Validators.
class HexCode(Validator):
    """Validate the hex code is valid."""

    def validate(self, hex_code):
        """Validate hex code entered."""
        if fullmatch(HEX_VALIDATION_REGEX, hex_code):
            return self.success()
        return self.failure()


# Screens.
class AddPalette(Screen):
    """Add a new (empty) colour palette page."""

    def compose(self):
        """Create child widgets for the add palette screen."""
        with Center():
            yield Label("Palette name:", classes="add_palette")
            yield Input(id="palette_name", validate_on=["blur"])
            yield Button("Add palette", classes="add_palette", id="add_palette_button")

    @on(Button.Pressed, "#add_palette_button")
    @on(Input.Submitted, "#palette_name")
    def add_new_palette(self):
        """Create a new, empty palette file and return to the main screen."""
        palette_name = self.query_one("#palette_name").value.strip()
        existing_names = [palette["name"] for palette in self.app.existing_palettes]
        if palette_name and palette_name not in existing_names:
            write_palette(palette_name, [])
            self.dismiss(palette_name)


class Swatch(Static):
    """A single clickable colour swatch in the generator preview.

    Clicking it toggles a lock; locked swatches keep their colour when the
    palette is regenerated (the Coolors padlock behaviour).
    """

    color = reactive("#000000")
    locked = reactive(False)

    def __init__(self, index, color):
        super().__init__()
        self.index = index
        self.color = color

    def render(self):
        """Show the hex code, prefixed with a marker when locked."""
        return f"[ LOCK ]\n{self.color}" if self.locked else self.color

    def watch_color(self, color):
        """Recolour the swatch and pick a readable text colour."""
        self.styles.background = color
        self.styles.color = colors.best_text_color(color)
        self.refresh()

    def watch_locked(self, locked):
        """Toggle the CSS class that draws the lock border, and re-render."""
        self.set_class(locked, "-locked")
        self.refresh()

    def on_mount(self):
        """Belt-and-braces initial paint (watchers also run, but avoid a race)."""
        self.styles.background = self.color
        self.styles.color = colors.best_text_color(self.color)

    def on_click(self):
        """Toggle this swatch's lock when clicked."""
        self.locked = not self.locked


class GeneratePalette(Screen):
    """A Coolors-style screen for generating and saving a new palette."""

    BINDINGS = [("space", "regenerate", "Regenerate")]

    def __init__(self):
        super().__init__()
        # Guard against Select.Changed firing while the screen is still building.
        self._ready = False

    def compose(self):
        """Create the controls, preview row and action buttons."""
        with Horizontal(id="gen_controls"):
            yield Select(
                ((label, label) for label in PALETTE_TYPES.values()),
                allow_blank=False,
                value="Categorical",
                id="gen_type",
            )
            yield Select(
                (("Harmony", "Harmony"), ("Preset library", "Preset library")),
                allow_blank=False,
                value="Harmony",
                id="gen_source",
            )
            yield Select(
                ((mode, mode) for mode in colors.MODES_CATEGORICAL),
                allow_blank=False,
                value="triadic",
                id="gen_mode",
            )
            yield Select(
                ((str(count), count) for count in range(2, 17)),
                allow_blank=False,
                value=5,
                id="gen_count",
            )
            yield Input(placeholder="Palette name", id="gen_name", validate_on=["blur"])

        yield OptionList(id="gen_presets")
        yield Horizontal(id="swatch_row")
        with Horizontal(id="gen_buttons"):
            yield Button("Regenerate", id="gen_regen")
            yield Button("Save", id="gen_save")
        yield Label(id="gen_status")
        yield Footer()

    def on_mount(self):
        """Populate the preset list and draw the first palette."""
        self._populate_presets()
        self._sync_source_visibility()
        self._rebuild_row()
        self.query_one("#gen_regen").focus()  # so Space bubbles up to regenerate
        # The Selects each post an initial Select.Changed during mount; those are
        # delivered *after* on_mount, so enable the change handlers only once that
        # cascade has drained -- otherwise the type handler's set_options() would
        # clobber the default mode and the palette would regenerate repeatedly.
        self.call_after_refresh(self._enable_handlers)

    def _enable_handlers(self):
        self._ready = True

    # -- helpers ------------------------------------------------------------
    def _palette_type(self):
        return TYPE_LABELS_TO_KEY[self.query_one("#gen_type").value]

    def _current_mode(self):
        mode = self.query_one("#gen_mode").value
        if mode is Select.BLANK:
            return colors.modes_for(self._palette_type())[0]
        return mode

    def _highlighted_preset(self):
        presets = self.query_one("#gen_presets")
        if presets.highlighted is None:
            return None
        return presets.get_option_at_index(presets.highlighted).prompt

    def _current_colors(self):
        """Build the colours for the current controls (preset or harmony)."""
        n = self.query_one("#gen_count").value
        ptype = self._palette_type()
        if self.query_one("#gen_source").value == "Preset library":
            name = self._highlighted_preset()
            if name is not None:
                return colors.get_preset(ptype, name, n)
        return colors.generate(ptype, n, self._current_mode())

    def _populate_presets(self):
        presets = self.query_one("#gen_presets")
        presets.clear_options()
        names = colors.preset_names(self._palette_type())
        presets.add_options([Option(name) for name in names])
        if names:
            # Highlight the first preset so the preview uses it immediately
            # instead of falling back to a harmony palette.
            presets.highlighted = 0

    def _sync_source_visibility(self):
        is_preset = self.query_one("#gen_source").value == "Preset library"
        self.query_one("#gen_presets").display = is_preset
        self.query_one("#gen_mode").display = not is_preset

    def _rebuild_row(self):
        """Replace every swatch (used when the count/type/source changes)."""
        row = self.query_one("#swatch_row")
        row.remove_children()
        row.mount(
            *[Swatch(i, colour) for i, colour in enumerate(self._current_colors())]
        )

    # -- actions & events ---------------------------------------------------
    def action_regenerate(self):
        """Reroll every unlocked swatch, keeping locked ones fixed."""
        swatches = list(self.query(Swatch))
        if not swatches:
            self._rebuild_row()
            return
        new_colours = self._current_colors()
        for swatch, colour in zip(swatches, new_colours):
            if not swatch.locked:
                swatch.color = colour

    @on(Button.Pressed, "#gen_regen")
    def _regen_pressed(self):
        self.action_regenerate()

    @on(Select.Changed, "#gen_type")
    def _type_changed(self):
        if not self._ready:
            return
        self.query_one("#gen_mode").set_options(
            (mode, mode) for mode in colors.modes_for(self._palette_type())
        )
        self._populate_presets()
        self._rebuild_row()

    @on(Select.Changed, "#gen_source")
    def _source_changed(self):
        if not self._ready:
            return
        self._sync_source_visibility()
        self._rebuild_row()

    @on(Select.Changed, "#gen_mode")
    @on(Select.Changed, "#gen_count")
    def _option_changed(self):
        if not self._ready:
            return
        self._rebuild_row()

    @on(OptionList.OptionHighlighted, "#gen_presets")
    def _preset_changed(self):
        if not self._ready:
            return
        self._rebuild_row()

    @on(Button.Pressed, "#gen_save")
    def _save(self):
        """Validate the name and persist the generated palette."""
        status = self.query_one("#gen_status")
        name = self.query_one("#gen_name").value.strip()
        if not name:
            status.update("Please enter a palette name.")
            return
        existing = [palette["name"] for palette in self.app.existing_palettes]
        if name in existing:
            status.update("A palette with that name already exists.")
            return
        hex_codes = [swatch.color for swatch in self.query(Swatch)]
        if not hex_codes:
            status.update("Nothing to save.")
            return
        write_palette(name, hex_codes)
        self.dismiss(name)


class TabPal(App):
    """A TUI app for generating and editing colour palettes."""

    CSS_PATH = "tabpal.tcss"
    SCREENS = {"add_palette": AddPalette, "generate_palette": GeneratePalette}
    BINDINGS = [
        ("a", "add_palette", "Add palette"),
        ("g", "generate_palette", "Generate palette"),
        ("d", "delete", "Delete palette or colour"),
        ("q", "quit", "Quit"),
    ]

    def __init__(self):
        super().__init__()
        self.existing_palettes = load_palettes()
        self.dark = False

    # App functions.
    def compose(self):
        """Construct a user interface with widgets."""
        yield OptionList(
            *[Option(palette["name"]) for palette in self.existing_palettes],
            id="existing_palettes",
        )
        yield Vertical(
            OptionList(id="existing_colours"),
            Input(
                placeholder="Enter new code",
                id="add_code",
                validate_on=["submitted"],
                validators=HexCode(),
            ),
        )
        yield Vertical(id="colour_palettes_viz")
        yield Footer()

    # Palette helpers.
    def get_existing_palettes(self):
        """Reload the palettes from disk."""
        return load_palettes()

    def _highlighted_palette_name(self):
        """Return the name of the highlighted palette, or ``None``."""
        palettes = self.query_one("#existing_palettes")
        if palettes.highlighted is None:
            return None
        return palettes.get_option_at_index(palettes.highlighted).prompt

    def _colours_for(self, name):
        """Return the stored colours for a palette name."""
        return next(
            (p["colours"] for p in self.existing_palettes if p["name"] == name), []
        )

    def add_new_colour(self, palette_name, hex_code):
        """Append a colour to a palette's file."""
        with open(palette_file(palette_name), "a", encoding="UTF-8") as f:
            f.write(f"{hex_code}\n")

    def refresh_palette_colours(self):
        """Refresh the palette's list of colours pane."""
        name = self._highlighted_palette_name()
        if name is None:
            return
        options = [Option(colour) for colour in self._colours_for(name)]
        self.query_one("#existing_colours").clear_options()
        self.query_one("#existing_colours").add_options(options)

    def refresh_palettes(self, _result=None):
        """Reload palettes from disk and rebuild the palettes pane.

        Accepts (and ignores) a result argument so it can be used directly as a
        ``push_screen`` dismiss callback.
        """
        self.existing_palettes = self.get_existing_palettes()
        options_list = self.query_one("#existing_palettes")
        options_list.clear_options()
        options_list.add_options(
            [Option(palette["name"]) for palette in self.existing_palettes]
        )

    def refresh_visualisation(self):
        """Refresh the visualisation pane with the highlighted palette's
        colours."""
        viz = self.query_one("#colour_palettes_viz")
        viz.remove_children()
        name = self._highlighted_palette_name()
        if name is None:
            return
        labels = []
        for colour in self._colours_for(name):
            label = Label(colour, classes="viz_labels")
            label.styles.background = colour
            labels.append(label)
        if labels:
            viz.mount(*labels)

    # Keys.
    def action_delete(self):
        """Delete the highlighted colour, or the palette if none is highlighted."""
        name = self._highlighted_palette_name()
        if name is None:
            return

        colours_list = self.query_one("#existing_colours")
        if colours_list.highlighted is not None:
            # A colour is highlighted: remove just that colour.
            highlighted_colour = colours_list.get_option_at_index(
                colours_list.highlighted
            ).prompt
            remaining = [c for c in self._colours_for(name) if c != highlighted_colour]
            write_palette(name, remaining)
            self.existing_palettes = self.get_existing_palettes()
            colours_list.clear_options()
            self.refresh_palette_colours()
            self.refresh_visualisation()
        else:
            # No colour highlighted: delete the whole palette.
            delete_palette(name)
            self.refresh_palettes()
            self.query_one("#existing_colours").clear_options()
            self.refresh_visualisation()

    def action_add_palette(self):
        """Add a new colour palette."""
        self.push_screen(AddPalette(), self.refresh_palettes)

    def action_generate_palette(self):
        """Open the generator screen to create a new palette."""
        self.push_screen(GeneratePalette(), self.refresh_palettes)

    # Widget interaction.
    @on(OptionList.OptionSelected, "#existing_palettes")
    def option_selected(self):
        """Refresh colours palette list and visualisation pane
        when a new colour palette is selected."""
        self.refresh_palette_colours()
        self.refresh_visualisation()

    @on(OptionList.OptionHighlighted, "#existing_palettes")
    def option_highlighted(self):
        """Refresh colours palette list and visualisation pane when a new
        colour palette is highlighted.

        This is necessary to populate the colours palettes list on launch of
        the app (as an option is highlighted, but not selected, when the widget
        is added to the app on launch.)
        """
        self.refresh_palette_colours()
        self.refresh_visualisation()

    @on(Input.Submitted, "#add_code")
    def process_input(self):
        """Add hex code to highlighted colour palette."""
        name = self._highlighted_palette_name()
        if name is None:
            return

        palette_colours = self._colours_for(name)
        hex_code_input = self.query_one("#add_code")
        hex_code = hex_code_input.value
        if len(hex_code) < 7:
            hex_code = "#" + hex_code
        if (
            fullmatch(HEX_VALIDATION_REGEX, hex_code)
            and hex_code not in palette_colours
        ):
            self.add_new_colour(name, hex_code)
            self.existing_palettes = self.get_existing_palettes()
            hex_code_input.clear()
            self.refresh_palette_colours()
            self.refresh_visualisation()


# Entry point script.
def main():
    app = TabPal()
    app.run()


if __name__ == "__main__":
    main()
