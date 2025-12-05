#!/usr/bin/env python3
"""
Game Boy Color Sprite Processor for Polished Crystal ROM

This script processes Pokemon sprites from the ROM data, applying color palettes,
creating transparency, extracting animation frames, and generating both PNG sequences
and animated GIFs.

Usage: python process_sprites.py [pokemon_name] [--all]
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple, Optional
from PIL import Image, ImagePalette
import argparse


def reduce_name(name: str) -> str:
    """
    Normalize a Pokemon name to match the extraction format.
    Mirrors the TypeScript reduce() function in extract-utils.ts
    - Lowercases everything
    - Removes spaces, underscores, dashes, apostrophes, periods
    - Removes angle brackets
    """
    return (name.lower()
            .replace(' ', '')
            .replace('<', '')
            .replace('>', '')
            .replace('_', '')
            .replace('-', '')
            .replace("'", '')
            .replace('.', ''))


def reduce_pokemon_folder_name(name: str) -> str:
    """
    Normalize a Pokemon folder name, preserving form suffixes with underscores.
    - If name ends with '_plain', strip it and return just the reduced base name
    - If name has another form suffix (e.g., '_alolan'), reduce the base name 
      but keep the underscore and form suffix
    - Otherwise, reduce the entire name
    """
    name_lower = name.lower()
    
    # Known form suffixes that should be preserved
    form_suffixes = [
        '_alolan', '_galarian', '_hisuian', '_paldean', 
        '_paldean_fire', '_paldean_water', '_paldean_combat', '_paldean_blaze', '_paldean_aqua',
        '_mega', '_mega_x', '_mega_y', '_gmax', '_primal',
        '_origin', '_sky', '_therian', '_black', '_white',
        '_attack', '_defense', '_speed', '_plant', '_sandy', '_trash',
        '_heat', '_wash', '_frost', '_fan', '_mow',
        '_zen', '_pirouette', '_blade', '_shield',
        '_10', '_50', '_complete', '_school', '_meteor',
        '_dusk', '_midnight', '_dawn', '_dusk_mane', '_dawn_wings', '_ultra',
        '_crowned', '_eternamax', '_ice', '_shadow',
        '_single_strike', '_rapid_strike', '_bloodmoon',
        '_hero', '_wellspring', '_hearthflame', '_cornerstone',
        '_terastal', '_stellar',
        '_red', '_yellow', '_green', '_blue', '_orange', '_purple', '_pink', '_white', '_black',
        '_chuchu', '_pika',
        '_two_segment', '_three_segment',
        '_johto',
    ]
    
    # Check for _plain suffix - strip it entirely
    if name_lower.endswith('_plain'):
        base_name = name_lower[:-6]  # Remove '_plain'
        return reduce_name(base_name)
    
    # Check for other form suffixes - preserve them with underscore
    for suffix in form_suffixes:
        if name_lower.endswith(suffix):
            base_name = name_lower[:-len(suffix)]
            reduced_base = reduce_name(base_name)
            # The suffix is already lowercase, just need to ensure underscore is there
            return f"{reduced_base}{suffix}"
    
    # No form suffix, just reduce the whole name
    return reduce_name(name_lower)


class GBCPaletteParser:
    """Parses Game Boy Color palette files (.pal format)"""

    @staticmethod
    def parse_palette_file(pal_path: str) -> List[Tuple[int, int, int]]:
        """Parse a .pal file and return RGB color values"""
        colors = []
        try:
            with open(pal_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('RGB'):
                        # Extract RGB values from "RGB 28, 19, 03" format
                        rgb_match = re.search(r'RGB\s+(\d+),\s*(\d+),\s*(\d+)', line)
                        if rgb_match:
                            r, g, b = map(int, rgb_match.groups())
                            # Convert from GBC 5-bit (0-31) to 8-bit (0-255)
                            r = (r * 255) // 31
                            g = (g * 255) // 31
                            b = (b * 255) // 31
                            colors.append((r, g, b))
        except FileNotFoundError:
            print(f"Warning: Palette file {pal_path} not found")
            # Return default grayscale palette
            return [(255, 255, 255), (170, 170, 170), (85, 85, 85), (0, 0, 0)]

        # Ensure we have at least 4 colors (GBC uses 4-color palettes)
        while len(colors) < 4:
            colors.append((0, 0, 0))  # Fill with black

        return colors[:4]  # GBC sprites use max 4 colors

class GBCAnimationParser:
    """Parses Game Boy Color animation files (.asm format)"""

    # Game Boy runs at 59.7275 fps (4194304 Hz CPU / 70224 cycles per frame)
    GB_FRAME_DURATION_MS = 1000.0 / 59.7275  # ~16.742ms per frame

    @staticmethod
    def parse_animation_file(anim_path: str) -> List[Dict[str, int]]:
        """Parse animation file to extract frame timings with proper loop handling"""
        frames = []
        try:
            with open(anim_path, 'r') as f:
                lines = [line.strip() for line in f if line.strip()]

            # Parse the animation commands
            parsed_frames = GBCAnimationParser._parse_animation_commands(lines)

            # Convert to milliseconds using accurate Game Boy timing
            for frame_data in parsed_frames:
                duration_ms = frame_data['duration'] * GBCAnimationParser.GB_FRAME_DURATION_MS
                frames.append({
                    'frame': frame_data['frame'],
                    'duration': duration_ms
                })

        except FileNotFoundError:
            print(f"Warning: Animation file {anim_path} not found")
            # Return default single frame with Game Boy accurate timing
            return [{'frame': 0, 'duration': 300}]

        return frames if frames else [{'frame': 0, 'duration': 300}]

    @staticmethod
    def _parse_animation_commands(lines: List[str]) -> List[Dict[str, int]]:
        """Parse animation commands including setrepeat/dorepeat loops"""
        frames = []
        i = 0
        repeat_stack = []  # Stack to handle nested repeats

        while i < len(lines):
            line = lines[i]

            if line.startswith('frame'):
                # Extract frame number and duration from "frame 1, 08"
                frame_match = re.search(r'frame\s+(\d+),\s*(\d+)', line)
                if frame_match:
                    frame_num, duration = map(int, frame_match.groups())
                    frames.append({
                        'frame': frame_num,
                        'duration': duration
                    })

            elif line.startswith('setrepeat'):
                # Extract repeat count from "setrepeat 2"
                repeat_match = re.search(r'setrepeat\s+(\d+)', line)
                if repeat_match:
                    repeat_count = int(repeat_match.group(1))
                    repeat_stack.append({
                        'count': repeat_count,
                        'start_pos': len(frames),
                        'commands': []
                    })

            elif line.startswith('dorepeat'):
                # Execute the repeat block
                if repeat_stack:
                    repeat_info = repeat_stack.pop()
                    repeat_count = repeat_info['count']
                    start_pos = repeat_info['start_pos']

                    # Get the frames that were added since setrepeat
                    repeat_frames = frames[start_pos:]

                    # Add the repeated frames (repeat_count - 1 more times)
                    for _ in range(repeat_count - 1):
                        frames.extend(repeat_frames)

            elif line.startswith('endanim'):
                break

            i += 1

        return frames

class GBCSpriteProcessor:
    """Main sprite processing class"""

    def __init__(self, rom_path: str, output_path: str):
        self.rom_path = Path(rom_path)
        self.output_path = Path(output_path)
        self.pokemon_dir = self.rom_path / "gfx" / "pokemon"
        self.trainer_dir = self.rom_path / "gfx" / "trainers"
        self.items_dir = self.rom_path / "gfx" / "items"
        self.minis_dir = self.rom_path / "gfx" / "minis"
        self.icons_dir = self.rom_path / "gfx" / "icons"

        # Create output directories
        self.sprites_dir = self.output_path / "sprites" / "pokemon"
        self.sprites_dir.mkdir(exist_ok=True)

        self.trainer_sprites_dir = self.output_path / "sprites" / "trainers"
        self.trainer_sprites_dir.mkdir(parents=True, exist_ok=True)

        self.item_sprites_dir = self.output_path / "sprites" / "items"
        self.item_sprites_dir.mkdir(parents=True, exist_ok=True)

        self.minis_sprites_dir = self.output_path / "sprites" / "minis"
        self.minis_sprites_dir.mkdir(parents=True, exist_ok=True)

        self.icons_sprites_dir = self.output_path / "sprites" / "icons"
        self.icons_sprites_dir.mkdir(parents=True, exist_ok=True)

        # Icon palette definitions from icons.pal (GBC 5-bit RGB values)
        # Each palette has 4 colors: light, skin/base, main color, black
        self.icon_palettes = {
            'RED': [(27, 31, 27), (31, 19, 10), (31, 7, 1), (0, 0, 0)],
            'BLUE': [(27, 31, 27), (31, 19, 10), (10, 9, 31), (0, 0, 0)],
            'GREEN': [(27, 31, 27), (31, 19, 10), (7, 23, 3), (0, 0, 0)],
            'BROWN': [(27, 31, 27), (31, 19, 10), (15, 10, 3), (0, 0, 0)],
            'PURPLE': [(27, 31, 27), (31, 19, 10), (18, 4, 18), (0, 0, 0)],
            'GRAY': [(27, 31, 27), (31, 19, 10), (13, 13, 13), (0, 0, 0)],
            'PINK': [(27, 31, 27), (31, 19, 10), (31, 10, 11), (0, 0, 0)],
            'TEAL': [(27, 31, 27), (31, 19, 10), (3, 23, 21), (0, 0, 0)],
            # Additional colors referenced in overworld_icon_pals.asm
            'AZURE': [(27, 31, 27), (31, 19, 10), (10, 20, 31), (0, 0, 0)],
            'ORANGE': [(27, 31, 27), (31, 19, 10), (31, 16, 1), (0, 0, 0)],
            'YELLOW': [(27, 31, 27), (31, 19, 10), (31, 28, 1), (0, 0, 0)],
            'WHITE': [(27, 31, 27), (31, 19, 10), (27, 27, 27), (0, 0, 0)],
            'BLACK': [(27, 31, 27), (31, 19, 10), (5, 5, 5), (0, 0, 0)],
        }

        # Mapping for Pokemon with palette files in different directories
        # Used when a Pokemon's palette is stored in a shared/alternate location
        self.palette_directory_mapping: Dict[str, str] = {}

        # Load icon palette mappings from overworld_icon_pals.asm
        self.icon_color_map = self._load_icon_palette_map()

    def _load_icon_palette_map(self) -> Dict[str, Tuple[str, str]]:
        """Parse overworld_icon_pals.asm to get Pokemon -> (color1, color2) mapping"""
        pal_map = {}
        pal_file = self.rom_path / "data" / "pokemon" / "overworld_icon_pals.asm"

        if not pal_file.exists():
            print(f"Warning: Icon palette map not found at {pal_file}")
            return pal_map

        try:
            with open(pal_file, 'r') as f:
                for line in f:
                    line = line.strip()
                    # Match lines like: iconpal RED, AZURE ; PIKACHU
                    if line.startswith('iconpal'):
                        # Extract colors and Pokemon name from comment
                        match = re.match(r'iconpal\s+(\w+),\s*(\w+)\s*;\s*(\w+)', line)
                        if match:
                            color1, color2, pokemon = match.groups()
                            # Normalize Pokemon name to match icon filename
                            pokemon_key = pokemon.lower()
                            # Handle special characters in names
                            pokemon_key = pokemon_key.replace('_', '_')
                            pal_map[pokemon_key] = (color1, color2)
        except Exception as e:
            print(f"Warning: Could not parse icon palette map: {e}")

        return pal_map

    def get_pokemon_list(self) -> List[str]:
        """Get list of all Pokemon directories, including mapped variants"""
        pokemon_dirs = []
        if self.pokemon_dir.exists():
            for item in self.pokemon_dir.iterdir():
                if item.is_dir() and not item.name.startswith('.') and not item.name.endswith('.asm'):
                    # Include the directory name as-is for processing
                    pokemon_dirs.append(item.name)
        return sorted(pokemon_dirs)

    def should_process_pokemon(self, pokemon_name: str) -> bool:
        """Determine if this Pokemon directory should be processed"""
        # Process all Pokemon directories as individual entities
        return True

    def get_output_name(self, pokemon_name: str) -> str:
        """Get the output directory name for a Pokemon - normalized to match extraction format"""
        # Handle special mappings first
        mapped_name = pokemon_name
        # Map dudunsparce_two_segment to the default dudunsparce folder
        if pokemon_name == 'dudunsparce_two_segment':
            mapped_name = 'dudunsparce'
        # Map dudunsparce_three_segment to the default dudunsparce folder
        elif pokemon_name == 'dudunsparce_three_segment':
            mapped_name = 'dudunsparce'
        elif pokemon_name == 'arbok_johto':
            mapped_name = 'arbok'
        # Map arbok_johto to the default arbok folder
        elif pokemon_name == 'unown':
            mapped_name = 'unown_z'
        # Map pikachu_chuchu to pikachu_yellow (chuchu = yellow)
        elif pokemon_name == 'pikachu_chuchu':
            mapped_name = 'pikachu_yellow'
        # Map pikachu_pika to pikachu_red (pika = red)
        elif pokemon_name == 'pikachu_pika':
            mapped_name = 'pikachu_red'

        # Apply reduce_pokemon_folder_name to normalize the output 
        # (reduces base name but preserves form suffixes with underscores)
        return reduce_pokemon_folder_name(mapped_name)

    def extract_sprite_frames(self, sprite_path: str) -> List[Image.Image]:
        """Extract individual frames using auto-detection logic from crop_top_sprite.ts"""
        try:
            sprite_img = Image.open(sprite_path).convert('RGBA')
            width, height = sprite_img.size

            # Auto-detect sprite dimensions (from your TypeScript logic)
            sprite_height = width  # Default to square
            for h in range(width, height + 1):
                if height % h == 0 and h <= width:
                    sprite_height = h
                    break

            # If we couldn't find a good divisor, use the original approach
            if sprite_height > height:
                sprite_height = min(56, height)

            frames = []
            num_frames = height // sprite_height

            for i in range(num_frames):
                top = i * sprite_height
                bottom = min(top + sprite_height, height)
                frame = sprite_img.crop((0, top, width, bottom))
                frames.append(frame)

            return frames if frames else [sprite_img]

        except Exception as e:
            print(f"Warning: Could not process sprite {sprite_path}: {e}")
            return []

    def apply_palette_to_sprite(self, sprite: Image.Image, palette: List[Tuple[int, int, int]]) -> Image.Image:
        """Apply GBC palette to sprite and create transparency"""
        # Convert to grayscale first to map palette indices
        gray_sprite = sprite.convert('L')

        # Extend palette to 4 colors if needed (GBC standard)
        while len(palette) < 4:
            palette.append((255, 255, 255))  # Add white as default

        # Create RGBA image
        rgba_sprite = Image.new('RGBA', sprite.size, (0, 0, 0, 0))
        pixels = rgba_sprite.load()
        gray_pixels = gray_sprite.load()

        for y in range(sprite.size[1]):
            for x in range(sprite.size[0]):
                gray_value = gray_pixels[x, y]

                # Map grayscale values to palette indices
                # Game Boy Color uses: lightest=background, darkest=foreground
                if gray_value >= 240:    # Near white -> transparent background
                    pixels[x, y] = (0, 0, 0, 0)  # Transparent
                elif gray_value >= 170:  # Light gray -> palette[0] (lightest color)
                    r, g, b = palette[0] if len(palette) > 0 else (200, 200, 200)
                    pixels[x, y] = (r, g, b, 255)
                elif gray_value >= 85:   # Medium gray -> palette[1] (medium color)
                    r, g, b = palette[1] if len(palette) > 1 else (128, 128, 128)
                    pixels[x, y] = (r, g, b, 255)
                else:                    # Dark gray/black -> palette[2] (darkest color)
                    r, g, b = palette[2] if len(palette) > 2 else (64, 64, 64)
                    pixels[x, y] = (r, g, b, 255)

        return rgba_sprite

    def create_animated_gif(self, frames: List[Image.Image], durations: List[int], output_path: str):
        """Create animated GIF from frames with accurate timing conversion and a 300ms delay after each loop"""
        if not frames:
            return

        try:
            # Convert Game Boy timing to GIF timing
            # GIFs typically display at 100fps (10ms minimum), but we want to preserve
            # the relative timing from Game Boy (59.7275 fps)
            gif_durations = []
            for duration_ms in durations:
                # Convert to centiseconds (GIF uses 1/100s units)
                # Round to nearest centisecond but ensure minimum of 2 (20ms for smooth playback)
                centiseconds = max(2, round(duration_ms / 10))
                gif_durations.append(centiseconds)

            # If we have fewer duration values than frames, repeat the last duration
            while len(gif_durations) < len(frames):
                gif_durations.append(gif_durations[-1] if gif_durations else 50)

            # Add a 300ms (30 centiseconds) pause after the last frame
            gif_durations[-1] += 30

            # Save the animated GIF with the calculated durations
            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                duration=[d * 10 for d in gif_durations],  # Convert centiseconds back to milliseconds
                loop=0,
                disposal=2,  # Clear frame before next
                optimize=True
            )
            print(f"Created animated GIF: {output_path}")

        except Exception as e:
            print(f"Warning: Could not create GIF {output_path}: {e}")

    def process_pokemon(self, pokemon_name: str) -> bool:
        """Process a single Pokemon's sprites - only front sprites, 4 files total"""
        # Check if we should process this Pokemon
        if not self.should_process_pokemon(pokemon_name):
            print(f"Skipping {pokemon_name}")
            return True

        pokemon_path = self.pokemon_dir / pokemon_name
        if not pokemon_path.exists():
            print(f"Pokemon directory not found: {pokemon_name}")
            return False

        # Get the output name (base Pokemon name)
        output_name = self.get_output_name(pokemon_name)
        print(f"Processing {pokemon_name} -> {output_name}...")

        # Create output directory for this Pokemon using the base name
        output_dir = self.sprites_dir / output_name
        output_dir.mkdir(exist_ok=True)

        # DEBUG: Log the output name and directory
        print(f"DEBUG: Output name for {pokemon_name} is {output_name}")
        print(f"DEBUG: Output directory for {pokemon_name} is {output_dir}")

        # Only process front sprites for normal and shiny variants
        variants = ['normal', 'shiny']

        for variant in variants:
            # Check if we need to look for palette files in a different directory
            palette_dir = pokemon_path
            if pokemon_name in self.palette_directory_mapping:
                palette_dir = self.pokemon_dir / self.palette_directory_mapping[pokemon_name]

            palette_file = palette_dir / f"{variant}.pal"
            if not palette_file.exists():
                print(f"Palette file not found: {palette_file}")
                continue

            palette = GBCPaletteParser.parse_palette_file(str(palette_file))

            # Only process front sprites
            sprite_file = pokemon_path / "front.png"
            if not sprite_file.exists():
                print(f"Sprite file not found: {sprite_file}")
                continue

            # Extract frames from sprite sheet
            raw_frames = self.extract_sprite_frames(str(sprite_file))
            if not raw_frames:
                print(f"No frames extracted from sprite: {sprite_file}")
                continue

            # Apply palette and transparency
            processed_frames = [
                self.apply_palette_to_sprite(frame, palette) for frame in raw_frames
            ]

            # Use accurate Game Boy timing from animation data
            animation_data = self.get_animation_data(pokemon_name, variant)  # Assume this method exists
            durations = []
            for i in range(len(processed_frames)):
                if i < len(animation_data):
                    # Use the parsed duration directly (already in milliseconds)
                    duration = animation_data[i]['duration']
                    durations.append(duration)
                else:
                    # Fallback to reasonable default if we run out of animation data
                    durations.append(300)

            # Save static PNG (first frame)
            png_output_path = output_dir / f"{variant}_front.png"
            if processed_frames:
                processed_frames[0].save(png_output_path)
                print(f"Saved static PNG: {png_output_path}")

            # Save processed frames as an animated GIF
            gif_output_path = output_dir / f"{variant}_front_animated.gif"
            self.create_animated_gif(processed_frames, durations, str(gif_output_path))

        return True

    def process_all_pokemon(self):
        """Process all Pokemon sprites"""
        pokemon_list = self.get_pokemon_list()
        total = len(pokemon_list)
        processed = 0

        print(f"Found {total} Pokemon to process...")

        for i, pokemon_name in enumerate(pokemon_list, 1):
            print(f"[{i}/{total}] Processing {pokemon_name}")
            if self.process_pokemon(pokemon_name):
                processed += 1

        print(f"\nCompleted! Processed {processed}/{total} Pokemon sprites")
        print(f"Output directory: {self.sprites_dir}")

    def create_sprite_manifest(self):
        """Create a JSON manifest of all processed sprites with dimensions"""
        pokemon_manifest = {}

        for pokemon_dir in self.sprites_dir.iterdir():
            if pokemon_dir.is_dir():
                pokemon_name = pokemon_dir.name
                pokemon_data = {
                    "normal_front": None,
                    "shiny_front": None,
                    "normal_animated": None,
                    "shiny_animated": None
                }

                # Find the 4 expected files and get their dimensions
                for sprite_file in pokemon_dir.iterdir():
                    if sprite_file.suffix in ['.png', '.gif'] and "back" not in sprite_file.name:
                        rel_path = f"sprites/pokemon/{pokemon_name}/{sprite_file.name}"

                        # Get image dimensions
                        try:
                            with Image.open(sprite_file) as img:
                                width, height = img.size
                                sprite_info = {
                                    "url": rel_path,
                                    "width": width,
                                    "height": height
                                }
                        except Exception as e:
                            print(f"Warning: Could not read dimensions for {sprite_file}: {e}")
                            sprite_info = {
                                "url": rel_path,
                                "width": 64,  # fallback dimensions
                                "height": 64
                            }

                        if sprite_file.name == "normal_front.png":
                            pokemon_data["normal_front"] = sprite_info
                        elif sprite_file.name == "shiny_front.png":
                            pokemon_data["shiny_front"] = sprite_info
                        elif sprite_file.name == "normal_front_animated.gif":
                            pokemon_data["normal_animated"] = sprite_info
                        elif sprite_file.name == "shiny_front_animated.gif":
                            pokemon_data["shiny_animated"] = sprite_info

                # Only add Pokemon that have at least normal front sprite
                if pokemon_data["normal_front"]:
                    pokemon_manifest[pokemon_name] = pokemon_data

        return pokemon_manifest

    def get_trainer_list(self) -> List[str]:
        """Get list of all trainer PNG files"""
        trainer_pngs = []
        if self.trainer_dir.exists():
            for item in self.trainer_dir.iterdir():
                if item.is_file() and item.suffix == '.png':
                    trainer_name = item.stem
                    trainer_pngs.append(trainer_name)
        return sorted(trainer_pngs)

    def get_trainer_palettes(self, trainer_name: str) -> List[str]:
        """Get all palette files for a trainer"""
        palettes = []

        # Look for exact match first
        exact_pal = self.trainer_dir / f"{trainer_name}.pal"
        if exact_pal.exists():
            palettes.append(trainer_name)

        # Look for numbered variants (e.g., kimono_girl_1.pal, kimono_girl_2.pal, etc.)
        for item in self.trainer_dir.iterdir():
            if item.is_file() and item.suffix == '.pal':
                if item.stem.startswith(f"{trainer_name}_") and item.stem != trainer_name:
                    # Extract the variant (e.g., "1" from "kimono_girl_1")
                    variant = item.stem.replace(f"{trainer_name}_", "")
                    palettes.append(f"{trainer_name}_{variant}")

        return sorted(palettes)

    def process_trainer(self, trainer_name: str) -> bool:
        """Process a single trainer's sprite with all palette variants"""
        trainer_png = self.trainer_dir / f"{trainer_name}.png"
        if not trainer_png.exists():
            print(f"Trainer PNG not found: {trainer_name}")
            return False

        # Normalize output name
        output_name = reduce_name(trainer_name)
        print(f"Processing trainer {trainer_name} -> {output_name}...")

        # Create output directory for this trainer with normalized name
        output_dir = self.trainer_sprites_dir / output_name
        output_dir.mkdir(exist_ok=True)

        # Get all palette variants for this trainer
        palettes = self.get_trainer_palettes(trainer_name)

        if not palettes:
            print(f"No palette files found for {trainer_name}")
            return False

        # Extract frames from sprite sheet (trainers are typically single frame)
        raw_frames = self.extract_sprite_frames(str(trainer_png))
        if not raw_frames:
            print(f"Could not extract frames from {trainer_name}")
            return False

        # Process each palette variant
        for palette_name in palettes:
            palette_file = self.trainer_dir / f"{palette_name}.pal"
            if not palette_file.exists():
                print(f"Palette file not found: {palette_file}")
                continue

            palette = GBCPaletteParser.parse_palette_file(str(palette_file))

            # Apply palette and transparency to each frame
            processed_frames = []
            for frame in raw_frames:
                processed_frame = self.apply_palette_to_sprite(frame, palette)
                processed_frames.append(processed_frame)

            # Determine output filename with normalized names
            if palette_name == trainer_name:
                # Default palette
                output_filename = f"{output_name}.png"
            else:
                # Variant palette (e.g., kimono_girl_1.png)
                variant = palette_name.replace(f"{trainer_name}_", "")
                output_filename = f"{output_name}_{reduce_name(variant)}.png"

            # Save static PNG (first frame)
            if processed_frames:
                static_path = output_dir / output_filename
                processed_frames[0].save(static_path)
                print(f"Saved trainer sprite: {static_path}")

        return True

    def process_all_trainers(self):
        """Process all trainer sprites"""
        trainer_list = self.get_trainer_list()
        total = len(trainer_list)
        processed = 0

        print(f"Found {total} trainers to process...")

        for i, trainer_name in enumerate(trainer_list, 1):
            print(f"[{i}/{total}] Processing trainer {trainer_name}")
            if self.process_trainer(trainer_name):
                processed += 1

        print(f"\nCompleted! Processed {processed}/{total} trainer sprites")
        print(f"Output directory: {self.trainer_sprites_dir}")

    def create_trainer_manifest(self):
        """Create a JSON manifest of all processed trainer sprites with dimensions"""
        trainer_manifest = {}

        for trainer_dir in self.trainer_sprites_dir.iterdir():
            if trainer_dir.is_dir():
                trainer_name = trainer_dir.name
                trainer_data = {}

                # Find all PNG files for this trainer
                for sprite_file in trainer_dir.iterdir():
                    if sprite_file.suffix == '.png':
                        # Get image dimensions
                        try:
                            with Image.open(sprite_file) as img:
                                width, height = img.size
                                sprite_info = {
                                    "url": f"sprites/trainers/{trainer_name}/{sprite_file.name}",
                                    "width": width,
                                    "height": height
                                }
                        except Exception as e:
                            print(f"Warning: Could not read dimensions for {sprite_file}: {e}")
                            sprite_info = {
                                "url": f"sprites/trainers/{trainer_name}/{sprite_file.name}",
                                "width": 64,  # fallback dimensions
                                "height": 64
                            }

                        # Use filename without extension as key
                        variant_key = sprite_file.stem
                        trainer_data[variant_key] = sprite_info

                # Only add trainers that have at least one sprite
                if trainer_data:
                    trainer_manifest[trainer_name] = trainer_data

        return trainer_manifest

    def get_item_list(self) -> List[str]:
        """Get list of all item PNG files"""
        item_pngs = []
        if self.items_dir.exists():
            for item in self.items_dir.iterdir():
                if item.is_file() and item.suffix == '.png':
                    item_name = item.stem
                    item_pngs.append(item_name)
        return sorted(item_pngs)

    def process_item(self, item_name: str) -> bool:
        """Process a single item's sprite as monochrome"""
        item_png = self.items_dir / f"{item_name}.png"
        if not item_png.exists():
            print(f"Item PNG not found: {item_name}")
            return False

        # Normalize output name
        output_name = reduce_name(item_name)
        print(f"Processing item {item_name} -> {output_name}...")

        # Items save directly to the items directory, no subdirectory needed

        # Use monochrome palette for all items
        palette = [(240, 240, 240), (160, 160, 160), (100, 100, 100), (60, 60, 60)]  # Grayscale
        print(f"Using monochrome palette for {item_name}")

        # Extract frames from sprite sheet (items are typically single frame)
        raw_frames = self.extract_sprite_frames(str(item_png))
        if not raw_frames:
            print(f"Could not extract frames from {item_name}")
            return False

        # Apply palette and transparency to each frame
        processed_frames = []
        for frame in raw_frames:
            processed_frame = self.apply_palette_to_sprite(frame, palette)
            processed_frames.append(processed_frame)

        # Save static PNG (first frame) directly in items directory with normalized name
        if processed_frames:
            static_path = self.item_sprites_dir / f"{output_name}.png"
            processed_frames[0].save(static_path)
            print(f"Saved item sprite: {static_path}")

        return True

    def process_all_items(self):
        """Process all item sprites"""
        item_list = self.get_item_list()
        total = len(item_list)
        processed = 0

        print(f"Found {total} items to process...")

        for i, item_name in enumerate(item_list, 1):
            print(f"[{i}/{total}] Processing item {item_name}")
            if self.process_item(item_name):
                processed += 1

        print(f"\nCompleted! Processed {processed}/{total} item sprites")
        print(f"Output directory: {self.item_sprites_dir}")

    def create_item_manifest(self):
        """Create a JSON manifest of all processed item sprites with dimensions"""
        item_manifest = {}

        # Items are stored directly in the items directory, not in subdirectories
        for sprite_file in self.item_sprites_dir.iterdir():
            if sprite_file.is_file() and sprite_file.suffix == '.png':
                item_name = sprite_file.stem

                # Get image dimensions
                try:
                    with Image.open(sprite_file) as img:
                        width, height = img.size
                        sprite_info = {
                            "url": f"sprites/items/{sprite_file.name}",
                            "width": width,
                            "height": height
                        }
                except Exception as e:
                    print(f"Warning: Could not read dimensions for {sprite_file}: {e}")
                    sprite_info = {
                        "url": f"sprites/items/{sprite_file.name}",
                        "width": 32,  # fallback dimensions for items (typically smaller)
                        "height": 32
                    }

                # Use simple naming scheme for items
                item_manifest[item_name] = {
                    "icon": sprite_info
                }

        return item_manifest

    def get_item_category(self, item_name: str) -> str:
        """Categorize items based on their name for palette selection"""
        item_lower = item_name.lower()

        # Poké Balls
        if 'ball' in item_lower:
            return 'pokeball'

        # Potions and medicines
        if any(word in item_lower for word in ['potion', 'heal', 'antidote', 'awakening', 'burn_heal', 'paralyze_heal', 'ice_heal', 'full_heal', 'revive', 'ether', 'elixir']):
            return 'medicine'

        # Berries
        if 'berry' in item_lower:
            return 'berry'

        # Stones (evolution items)
        if 'stone' in item_lower:
            return 'stone'

        # TMs/HMs
        if item_lower.startswith('tm') or item_lower.startswith('hm'):
            return 'tm'

        # Battle items
        if any(word in item_lower for word in ['x_', 'guard_spec', 'dire_hit']):
            return 'battle'

        # Key items (special quest items)
        if any(word in item_lower for word in ['key', 'card', 'pass', 'ticket', 'map', 'bell', 'wing', 'egg', 'scope', 'rod', 'coin_case']):
            return 'key'

        # Held items (battle equipment)
        if any(word in item_lower for word in ['band', 'belt', 'lens', 'claw', 'orb', 'herb', 'powder', 'coat', 'vest', 'specs', 'scarf']):
            return 'held'

        # Valuables (sellable items)
        if any(word in item_lower for word in ['nugget', 'pearl', 'mushroom', 'star', 'fossil', 'scale']):
            return 'valuable'

        # Default category
        return 'general'

    def get_item_palette(self, item_name: str) -> List[Tuple[int, int, int]]:
        """Get appropriate color palette based on item category"""
        category = self.get_item_category(item_name)

        # Different color schemes for different item types
        palettes = {
            'pokeball': [(255, 255, 255), (255, 60, 60), (200, 30, 30), (120, 20, 20)],  # Red/white
            'medicine': [(240, 255, 240), (100, 200, 100), (60, 150, 60), (30, 100, 30)],  # Green
            'berry': [(255, 240, 255), (200, 100, 200), (150, 60, 150), (100, 30, 100)],  # Purple
            'stone': [(255, 255, 240), (200, 200, 100), (150, 150, 60), (100, 100, 30)],  # Yellow
            'tm': [(240, 240, 255), (100, 100, 200), (60, 60, 150), (30, 30, 100)],  # Blue
            'battle': [(255, 240, 240), (200, 150, 100), (150, 100, 60), (100, 60, 30)],  # Orange
            'key': [(240, 255, 255), (100, 200, 200), (60, 150, 150), (30, 100, 100)],  # Cyan
            'held': [(255, 255, 240), (180, 180, 120), (120, 120, 80), (80, 80, 40)],  # Gold
            'valuable': [(255, 240, 255), (200, 150, 200), (150, 100, 150), (100, 50, 100)],  # Pink
            'general': [(240, 240, 240), (160, 160, 160), (100, 100, 100), (60, 60, 60)]  # Gray
        }

        return palettes.get(category, palettes['general'])

    def apply_mask_to_sprite(self, sprite: Image.Image, mask: Image.Image) -> Image.Image:
        """Apply transparency mask to sprite using mask file"""
        # Ensure both images are the same size
        if sprite.size != mask.size:
            print(f"Warning: Sprite and mask size mismatch - sprite: {sprite.size}, mask: {mask.size}")
            mask = mask.resize(sprite.size, Image.NEAREST)

        # Convert sprite to RGBA if not already
        if sprite.mode != 'RGBA':
            sprite = sprite.convert('RGBA')

        # Convert mask to grayscale
        mask_gray = mask.convert('L')

        # Create new RGBA image with transparency applied
        masked_sprite = Image.new('RGBA', sprite.size, (0, 0, 0, 0))
        sprite_pixels = sprite.load()
        mask_pixels = mask_gray.load()
        result_pixels = masked_sprite.load()

        for y in range(sprite.size[1]):
            for x in range(sprite.size[0]):
                # For Game Boy masks: dark/black areas in mask = opaque, light/white = transparent
                # This is opposite of what I initially implemented
                mask_value = mask_pixels[x, y]
                if mask_value < 128:  # Dark areas in mask = visible sprite pixels
                    result_pixels[x, y] = sprite_pixels[x, y]
                # Light areas in mask = transparent (already initialized to (0,0,0,0))

        return masked_sprite

    def apply_palette_to_mini_sprite(self, sprite: Image.Image, palette: List[Tuple[int, int, int]]) -> Image.Image:
        """Apply GBC palette to mini sprite - different logic than main sprites"""
        # Convert to grayscale first to map palette indices
        gray_sprite = sprite.convert('L')

        # Extend palette to 4 colors if needed (GBC standard)
        while len(palette) < 4:
            palette.append((255, 255, 255))  # Add white as default

        # Create RGBA image - for mini sprites, don't make anything transparent yet
        rgba_sprite = Image.new('RGBA', sprite.size, (0, 0, 0, 0))
        pixels = rgba_sprite.load()
        gray_pixels = gray_sprite.load()

        for y in range(sprite.size[1]):
            for x in range(sprite.size[0]):
                gray_value = gray_pixels[x, y]

                # Map grayscale values to palette indices for mini sprites
                # Use all 4 palette colors, don't make any transparent automatically
                if gray_value >= 192:    # Lightest -> palette[0]
                    r, g, b = palette[0] if len(palette) > 0 else (255, 255, 255)
                    pixels[x, y] = (r, g, b, 255)
                elif gray_value >= 128:  # Light gray -> palette[1]
                    r, g, b = palette[1] if len(palette) > 1 else (200, 200, 200)
                    pixels[x, y] = (r, g, b, 255)
                elif gray_value >= 64:   # Dark gray -> palette[2]
                    r, g, b = palette[2] if len(palette) > 2 else (100, 100, 100)
                    pixels[x, y] = (r, g, b, 255)
                else:                    # Darkest -> palette[3]
                    r, g, b = palette[3] if len(palette) > 3 else (0, 0, 0)
                    pixels[x, y] = (r, g, b, 255)

        return rgba_sprite

    def get_mini_list(self) -> List[str]:
        """Get list of all mini sprite base names (without _mask suffix)"""
        mini_sprites = set()
        if self.minis_dir.exists():
            for item in self.minis_dir.iterdir():
                if item.is_file() and item.suffix == '.png' and not item.name.endswith('_mask.png'):
                    # Extract base name (remove .png extension)
                    base_name = item.stem
                    mini_sprites.add(base_name)
        return sorted(list(mini_sprites))

    def process_mini(self, mini_name: str) -> bool:
        """Process a single mini sprite with its mask for transparency - create both static and animated versions"""
        mini_png = self.minis_dir / f"{mini_name}.png"
        mask_png = self.minis_dir / f"{mini_name}_mask.png"

        if not mini_png.exists():
            print(f"Mini sprite not found: {mini_name}")
            return False

        # Normalize output name
        output_name = reduce_name(mini_name)
        print(f"Processing mini sprite {mini_name} -> {output_name}...")

        try:
            # Load the sprite image
            sprite_img = Image.open(mini_png).convert('RGBA')

            # Get appropriate palette based on Pokemon name
            palette = self.get_mini_palette(mini_name)

            # Extract frames from the sprite sheet (mini sprites may have multiple frames)
            raw_frames = self.extract_sprite_frames_for_mini(sprite_img)

            # Process each frame
            processed_frames = []
            for frame in raw_frames:
                # Apply colorization using mini-specific palette logic
                colored_frame = self.apply_palette_to_mini_sprite(frame, palette)

                # Apply mask if available
                if mask_png.exists():
                    mask_img = Image.open(mask_png)
                    # For multi-frame sprites, we may need to extract corresponding mask frames
                    mask_frames = self.extract_sprite_frames_for_mini(mask_img)
                    if len(mask_frames) == len(raw_frames):
                        # Use corresponding mask frame
                        frame_idx = raw_frames.index(frame)
                        final_frame = self.apply_mask_to_sprite(colored_frame, mask_frames[frame_idx])
                    else:
                        # Use first mask frame for all sprite frames
                        final_frame = self.apply_mask_to_sprite(colored_frame, mask_frames[0])
                else:
                    print(f"Warning: No mask found for {mini_name}, using sprite as-is")
                    final_frame = colored_frame

                processed_frames.append(final_frame)

            # Save static PNG (first frame) with normalized name
            if processed_frames:
                static_path = self.minis_sprites_dir / f"{output_name}.png"
                processed_frames[0].save(static_path)
                print(f"Saved static mini sprite: {static_path}")

                # Create animated GIF if there are multiple frames
                if len(processed_frames) > 1:
                    # Generate realistic frame durations for overworld sprites
                    # Overworld sprites typically animate slower than battle sprites
                    durations = [800] * len(processed_frames)  # 800ms per frame for smooth overworld animation

                    gif_path = self.minis_sprites_dir / f"{output_name}_animated.gif"
                    self.create_animated_gif(processed_frames, durations, str(gif_path))
                else:
                    # For single frame sprites, create a simple "breathing" animation
                    self.create_breathing_animation(processed_frames[0], output_name)

            return True

        except Exception as e:
            print(f"Error processing mini sprite {mini_name}: {e}")
            return False

            return True

        except Exception as e:
            print(f"Error processing mini sprite {mini_name}: {e}")
            return False

    def extract_sprite_frames_for_mini(self, sprite: Image.Image) -> List[Image.Image]:
        """Extract frames from mini sprite - they're typically 16x16 or 16x32"""
        width, height = sprite.size

        # Most mini sprites are 16 pixels wide
        if width == 16:
            # Check if it's a multi-frame sprite (height > width)
            if height > width:
                frame_height = 16  # Standard mini sprite frame height
                frames = []
                num_frames = height // frame_height

                for i in range(num_frames):
                    top = i * frame_height
                    bottom = min(top + frame_height, height)
                    frame = sprite.crop((0, top, width, bottom))
                    frames.append(frame)

                return frames if frames else [sprite]
            else:
                # Single frame sprite
                return [sprite]
        else:
            # Non-standard size, treat as single frame
            return [sprite]

    def create_breathing_animation(self, static_frame: Image.Image, mini_name: str):
        """Create a subtle breathing animation for single-frame mini sprites"""
        try:
            # Create a simple 2-frame breathing effect
            frames = [static_frame, static_frame.copy()]  # Same frame twice for subtle effect

            # Longer duration for breathing effect
            durations = [1500, 1500]  # 1.5 seconds per frame for very slow breathing

            gif_path = self.minis_sprites_dir / f"{mini_name}_animated.gif"
            self.create_animated_gif(frames, durations, str(gif_path))

        except Exception as e:
            print(f"Warning: Could not create breathing animation for {mini_name}: {e}")

    def get_mini_palette(self, mini_name: str) -> List[Tuple[int, int, int]]:
        """Get appropriate color palette for mini sprites based on Pokemon type/characteristics"""
        mini_lower = mini_name.lower()

        # Try to find corresponding Pokemon palette from main sprites
        # Map mini names to Pokemon names for palette lookup
        pokemon_name = mini_name

        # Handle special cases and variants
        if '_alolan' in mini_lower:
            pokemon_name = mini_name.replace('_alolan', '')
        elif '_galarian' in mini_lower:
            pokemon_name = mini_name.replace('_galarian', '')
        elif '_hisuian' in mini_lower:
            pokemon_name = mini_name.replace('_hisuian', '')
        elif '_paldean' in mini_lower:
            pokemon_name = mini_name.replace('_paldean', '')
        elif '_armored' in mini_lower:
            pokemon_name = mini_name.replace('_armored', '')
        elif '_bloodmoon' in mini_lower:
            pokemon_name = mini_name.replace('_bloodmoon', '')
        elif '_two_segment' in mini_lower:
            pokemon_name = mini_name.replace('_two_segment', '')
        elif '_three_segment' in mini_lower:
            pokemon_name = mini_name.replace('_three_segment', '')
        elif '_fire' in mini_lower:
            pokemon_name = mini_name.replace('_fire', '')
        elif '_water' in mini_lower:
            pokemon_name = mini_name.replace('_water', '')
        elif mini_name == 'egg':
            return [(255, 255, 240), (240, 200, 160), (200, 150, 100), (150, 100, 60)]  # Cream/beige

        # Check if we have a palette file for this Pokemon
        palette_dir = self.pokemon_dir / pokemon_name
        if pokemon_name in self.palette_directory_mapping:
            palette_dir = self.pokemon_dir / self.palette_directory_mapping[pokemon_name]

        normal_pal = palette_dir / "normal.pal"
        if normal_pal.exists():
            return GBCPaletteParser.parse_palette_file(str(normal_pal))

        # Fallback to type-based coloring for minis
        return self.get_type_based_palette(mini_name)

    def get_type_based_palette(self, mini_name: str) -> List[Tuple[int, int, int]]:
        """Get a palette based on Pokemon type characteristics for overworld sprites"""
        mini_lower = mini_name.lower()

        # Common Pokemon type color schemes for overworld sprites
        if any(word in mini_lower for word in ['pikachu', 'raichu', 'electabuzz', 'elekid', 'magnezone', 'electrode', 'zapdos']):
            return [(255, 255, 200), (255, 220, 0), (200, 150, 0), (100, 80, 0)]  # Electric - Yellow
        elif any(word in mini_lower for word in ['charizard', 'charmander', 'charmeleon', 'arcanine', 'growlithe', 'moltres']):
            return [(255, 240, 200), (255, 100, 50), (200, 60, 30), (120, 40, 20)]  # Fire - Red/Orange
        elif any(word in mini_lower for word in ['blastoise', 'squirtle', 'wartortle', 'gyarados', 'lapras', 'articuno']):
            return [(240, 240, 255), (100, 150, 255), (60, 100, 200), (30, 60, 150)]  # Water - Blue
        elif any(word in mini_lower for word in ['venusaur', 'bulbasaur', 'ivysaur', 'oddish', 'bellsprout']):
            return [(240, 255, 240), (100, 200, 100), (60, 150, 60), (30, 100, 30)]  # Grass - Green
        elif any(word in mini_lower for word in ['gengar', 'gastly', 'haunter', 'misdreavus', 'murkrow']):
            return [(200, 180, 220), (120, 80, 160), (80, 50, 120), (50, 30, 80)]  # Ghost - Purple
        elif any(word in mini_lower for word in ['machamp', 'machoke', 'machop', 'hitmon']):
            return [(255, 220, 180), (200, 140, 100), (150, 100, 70), (100, 70, 50)]  # Fighting - Brown
        elif any(word in mini_lower for word in ['alakazam', 'abra', 'kadabra', 'mewtwo', 'mew']):
            return [(255, 240, 255), (200, 150, 200), (150, 100, 150), (100, 60, 100)]  # Psychic - Pink
        else:
            # Default neutral palette for unknown types
            return [(240, 240, 240), (180, 180, 180), (120, 120, 120), (80, 80, 80)]  # Normal - Gray

    def process_all_minis(self):
        """Process all mini sprites with masking"""
        mini_list = self.get_mini_list()
        total = len(mini_list)
        processed = 0

        print(f"Found {total} mini sprites to process...")

        for i, mini_name in enumerate(mini_list, 1):
            print(f"[{i}/{total}] Processing mini {mini_name}")
            if self.process_mini(mini_name):
                processed += 1

        print(f"\nCompleted! Processed {processed}/{total} mini sprites")
        print(f"Output directory: {self.minis_sprites_dir}")

    def create_mini_manifest(self):
        """Create a JSON manifest of all processed mini sprites with dimensions - includes both static and animated versions"""
        mini_manifest = {}

        # Get unique mini names (without file extensions)
        mini_names = set()
        for sprite_file in self.minis_sprites_dir.iterdir():
            if sprite_file.is_file() and sprite_file.suffix in ['.png', '.gif']:
                # Remove _animated suffix if present to get base name
                base_name = sprite_file.stem.replace('_animated', '')
                mini_names.add(base_name)

        # Process each mini sprite
        for mini_name in sorted(mini_names):
            mini_data = {}

            # Check for static PNG
            static_file = self.minis_sprites_dir / f"{mini_name}.png"
            if static_file.exists():
                try:
                    with Image.open(static_file) as img:
                        width, height = img.size
                        mini_data["overworld"] = {
                            "url": f"sprites/minis/{static_file.name}",
                            "width": width,
                            "height": height
                        }
                except Exception as e:
                    print(f"Warning: Could not read dimensions for {static_file}: {e}")
                    mini_data["overworld"] = {
                        "url": f"sprites/minis/{static_file.name}",
                        "width": 16,  # fallback dimensions
                        "height": 16
                    }

            # Check for animated GIF
            animated_file = self.minis_sprites_dir / f"{mini_name}_animated.gif"
            if animated_file.exists():
                try:
                    with Image.open(animated_file) as img:
                        width, height = img.size
                        mini_data["overworld_animated"] = {
                            "url": f"sprites/minis/{animated_file.name}",
                            "width": width,
                            "height": height
                        }
                except Exception as e:
                    print(f"Warning: Could not read dimensions for {animated_file}: {e}")
                    mini_data["overworld_animated"] = {
                        "url": f"sprites/minis/{animated_file.name}",
                        "width": 16,  # fallback dimensions
                        "height": 16
                    }

            # Only add to manifest if we have at least one file
            if mini_data:
                mini_manifest[mini_name] = mini_data

        return mini_manifest

    def get_icon_list(self) -> List[str]:
        """Get list of all icon PNG files (excluding palette file)"""
        icon_pngs = []
        if self.icons_dir.exists():
            for item in self.icons_dir.iterdir():
                if item.is_file() and item.suffix == '.png':
                    icon_name = item.stem
                    icon_pngs.append(icon_name)
        return sorted(icon_pngs)

    def _get_icon_colors(self, icon_name: str) -> Tuple[str, str]:
        """Get the two palette colors for an icon based on Pokemon name"""
        # Normalize icon name to match palette map keys
        normalized = icon_name.lower()

        # Direct lookup
        if normalized in self.icon_color_map:
            return self.icon_color_map[normalized]

        # Try without form suffix for regional forms
        for suffix in ['_alolan', '_galarian', '_hisuian', '_paldean', '_paldean_fire', '_paldean_water',
                       '_armored', '_bloodmoon', '_two_segment', '_three_segment', '_spiky']:
            if normalized.endswith(suffix):
                base_name = normalized.replace(suffix, '')
                if base_name in self.icon_color_map:
                    return self.icon_color_map[base_name]

        # Check for Unown forms (unown_a, unown_b, etc.)
        if normalized.startswith('unown'):
            if 'unown' in self.icon_color_map:
                return self.icon_color_map['unown']
            return ('BLACK', 'BLUE')  # Default Unown colors

        # Default fallback
        return ('GRAY', 'GRAY')

    def _convert_gbc_to_rgb(self, gbc_color: Tuple[int, int, int]) -> Tuple[int, int, int]:
        """Convert GBC 5-bit RGB (0-31) to 8-bit RGB (0-255)"""
        r = (gbc_color[0] * 255) // 31
        g = (gbc_color[1] * 255) // 31
        b = (gbc_color[2] * 255) // 31
        return (r, g, b)

    def process_icon(self, icon_name: str) -> bool:
        """Process a single Pokemon icon - extract 2 frames, apply colors, create animated GIF"""
        icon_png = self.icons_dir / f"{icon_name}.png"
        if not icon_png.exists():
            print(f"Icon PNG not found: {icon_name}")
            return False

        # Normalize the output name to match evolution chain data format
        output_name = reduce_name(icon_name)
        print(f"Processing icon {icon_name} -> {output_name}...")

        try:
            # Load the icon image (16x32, grayscale with 2 frames stacked)
            icon_img = Image.open(icon_png)
            width, height = icon_img.size

            # Icons are 16x32 with two 16x16 frames
            if height != 32 or width != 16:
                print(f"Warning: Unexpected icon dimensions for {icon_name}: {width}x{height}")

            frame_height = 16

            # Get the palette colors for this Pokemon
            color1_name, color2_name = self._get_icon_colors(icon_name)
            palette1 = self.icon_palettes.get(color1_name, self.icon_palettes['GRAY'])
            palette2 = self.icon_palettes.get(color2_name, self.icon_palettes['GRAY'])

            # Extract the two frames
            frames = []
            for i in range(2):
                top = i * frame_height
                bottom = top + frame_height
                frame = icon_img.crop((0, top, width, bottom))
                # Apply colorization and transparency
                frame_rgba = self.apply_icon_palette(frame, palette1, palette2)
                frames.append(frame_rgba)

            # Save static PNG (first frame) with normalized name
            if frames:
                static_path = self.icons_sprites_dir / f"{output_name}.png"
                frames[0].save(static_path)
                print(f"Saved static icon: {static_path}")

                # Create animated GIF with the two frames
                # Icons animate at a slow pace - about 500ms per frame
                if len(frames) > 1:
                    durations = [500, 500]  # 500ms per frame for gentle bobbing animation
                    gif_path = self.icons_sprites_dir / f"{output_name}_animated.gif"
                    self.create_animated_gif(frames, durations, str(gif_path))

            return True

        except Exception as e:
            print(f"Error processing icon {icon_name}: {e}")
            import traceback
            traceback.print_exc()
            return False

    def apply_icon_palette(self, icon_frame: Image.Image, palette1: List[Tuple[int, int, int]], palette2: List[Tuple[int, int, int]]) -> Image.Image:
        """Apply two-color palette to icon frame with transparency"""
        # Convert to grayscale if needed
        if icon_frame.mode != 'L':
            gray_frame = icon_frame.convert('L')
        else:
            gray_frame = icon_frame

        # Create RGBA output
        rgba = Image.new('RGBA', icon_frame.size, (0, 0, 0, 0))
        gray_pixels = gray_frame.load()
        rgba_pixels = rgba.load()

        # Convert palette colors from GBC 5-bit to 8-bit RGB
        # Use palette1 for main color mapping
        light_color = self._convert_gbc_to_rgb(palette1[0])      # Lightest - near white
        mid_color = self._convert_gbc_to_rgb(palette1[1])        # Skin/base tone
        main_color = self._convert_gbc_to_rgb(palette1[2])       # Main distinguishing color
        dark_color = self._convert_gbc_to_rgb(palette1[3])       # Black

        for y in range(icon_frame.size[1]):
            for x in range(icon_frame.size[0]):
                gray_value = gray_pixels[x, y]

                # Map grayscale values to the 4 palette colors
                # White/near-white becomes transparent
                if gray_value >= 250:
                    rgba_pixels[x, y] = (0, 0, 0, 0)  # Transparent
                elif gray_value >= 192:
                    # Lightest non-transparent - use light color
                    rgba_pixels[x, y] = (*light_color, 255)
                elif gray_value >= 128:
                    # Medium - use mid/skin color
                    rgba_pixels[x, y] = (*mid_color, 255)
                elif gray_value >= 64:
                    # Darker - use main color
                    rgba_pixels[x, y] = (*main_color, 255)
                else:
                    # Darkest - use black/dark color
                    rgba_pixels[x, y] = (*dark_color, 255)

        return rgba

    def apply_icon_transparency(self, icon_frame: Image.Image) -> Image.Image:
        """Apply transparency to icon frame - white pixels become transparent"""
        # Convert to RGBA
        if icon_frame.mode == 'L':
            # Grayscale - convert to RGBA
            rgba = Image.new('RGBA', icon_frame.size, (0, 0, 0, 0))
            gray_pixels = icon_frame.load()
            rgba_pixels = rgba.load()

            for y in range(icon_frame.size[1]):
                for x in range(icon_frame.size[0]):
                    gray_value = gray_pixels[x, y]
                    # White/near-white becomes transparent, everything else is grayscale
                    if gray_value >= 250:
                        rgba_pixels[x, y] = (0, 0, 0, 0)  # Transparent
                    else:
                        rgba_pixels[x, y] = (gray_value, gray_value, gray_value, 255)

            return rgba
        elif icon_frame.mode == 'RGBA':
            return icon_frame
        else:
            return icon_frame.convert('RGBA')

    def process_all_icons(self):
        """Process all Pokemon icons"""
        icon_list = self.get_icon_list()
        total = len(icon_list)
        processed = 0

        print(f"Found {total} icons to process...")

        for i, icon_name in enumerate(icon_list, 1):
            print(f"[{i}/{total}] Processing icon {icon_name}")
            if self.process_icon(icon_name):
                processed += 1

        print(f"\nCompleted! Processed {processed}/{total} icons")
        print(f"Output directory: {self.icons_sprites_dir}")

    def create_icon_manifest(self):
        """Create a JSON manifest of all processed icon sprites with dimensions"""
        icon_manifest = {}

        # Get unique icon names (without file extensions)
        icon_names = set()
        for sprite_file in self.icons_sprites_dir.iterdir():
            if sprite_file.is_file() and sprite_file.suffix in ['.png', '.gif']:
                # Remove _animated suffix if present to get base name
                base_name = sprite_file.stem.replace('_animated', '')
                icon_names.add(base_name)

        # Process each icon
        for icon_name in sorted(icon_names):
            icon_data = {}

            # Check for static PNG
            static_file = self.icons_sprites_dir / f"{icon_name}.png"
            if static_file.exists():
                try:
                    with Image.open(static_file) as img:
                        width, height = img.size
                        icon_data["static"] = {
                            "url": f"sprites/icons/{static_file.name}",
                            "width": width,
                            "height": height
                        }
                except Exception as e:
                    print(f"Warning: Could not read dimensions for {static_file}: {e}")
                    icon_data["static"] = {
                        "url": f"sprites/icons/{static_file.name}",
                        "width": 16,
                        "height": 16
                    }

            # Check for animated GIF
            animated_file = self.icons_sprites_dir / f"{icon_name}_animated.gif"
            if animated_file.exists():
                try:
                    with Image.open(animated_file) as img:
                        width, height = img.size
                        icon_data["animated"] = {
                            "url": f"sprites/icons/{animated_file.name}",
                            "width": width,
                            "height": height
                        }
                except Exception as e:
                    print(f"Warning: Could not read dimensions for {animated_file}: {e}")
                    icon_data["animated"] = {
                        "url": f"sprites/icons/{animated_file.name}",
                        "width": 16,
                        "height": 16
                    }

            # Only add to manifest if we have at least one file
            if icon_data:
                icon_manifest[icon_name] = icon_data

        return icon_manifest

    def create_unified_manifest(self):
        """Create a unified JSON manifest containing Pokemon, trainer, item, mini, and icon sprites"""
        pokemon_data = self.create_sprite_manifest()
        trainer_data = self.create_trainer_manifest()
        item_data = self.create_item_manifest()
        mini_data = self.create_mini_manifest()
        icon_data = self.create_icon_manifest()

        unified_manifest = {
            "pokemon": pokemon_data,
            "trainers": trainer_data,
            "items": item_data,
            "minis": mini_data,
            "icons": icon_data
        }

        # Save unified manifest
        manifest_path = self.output_path / "sprite_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(unified_manifest, f, indent=2, sort_keys=True)

        print(f"Created unified sprite manifest: {manifest_path}")
        print(f"Pokemon sprites: {len(pokemon_data)}")
        print(f"Trainer sprites: {len(trainer_data)}")
        print(f"Item sprites: {len(item_data)}")
        print(f"Mini sprites: {len(mini_data)}")
        print(f"Icon sprites: {len(icon_data)}")

    def export_sprite(self, sprite: Image.Image, output_path: str) -> None:
        """Export the processed sprite to the specified output path."""
        try:
            # Save the sprite
            sprite.save(output_path)
            print(f"Sprite exported to {output_path}")
        except Exception as e:
            print(f"Error exporting sprite to {output_path}: {e}")

    def get_animation_data(self, pokemon_name: str, variant: str) -> List[Dict[str, int]]:
        """Retrieve animation data for a given Pokémon and variant."""
        # Placeholder implementation: Replace with actual logic to fetch animation data
        # For now, return mock data with equal durations for all frames
        return [{'duration': 300} for _ in range(10)]  # Example: 10 frames, each 100ms

def main():
    parser = argparse.ArgumentParser(description="Process Game Boy Color sprites (Pokemon, Trainers, Items, Minis, and Icons)")
    parser.add_argument('target', nargs='?', help='Specific Pokemon/trainer/item name to process')
    parser.add_argument('--all', action='store_true', help='Process all sprites')
    parser.add_argument('--pokemon', action='store_true', help='Process Pokemon sprites only')
    parser.add_argument('--trainers', action='store_true', help='Process trainer sprites only')
    parser.add_argument('--items', action='store_true', help='Process item sprites only')
    parser.add_argument('--minis', action='store_true', help='Process mini/overworld sprites only')
    parser.add_argument('--icons', action='store_true', help='Process Pokemon icon sprites only')
    parser.add_argument('--rom-path', default='polishedcrystal', help='Path to ROM directory')
    parser.add_argument('--output-path', default='public', help='Output directory')

    args = parser.parse_args()

    # Initialize processor
    processor = GBCSpriteProcessor(args.rom_path, args.output_path)

    if args.all:
        # Process everything
        print("Processing all Pokemon sprites...")
        processor.process_all_pokemon()

        print("\nProcessing all trainer sprites...")
        processor.process_all_trainers()

        print("\nProcessing all item sprites...")
        processor.process_all_items()

        print("\nProcessing all mini sprites...")
        processor.process_all_minis()

        print("\nProcessing all icon sprites...")
        processor.process_all_icons()

        # Create unified manifest
        print("\nCreating unified sprite manifest...")
        processor.create_unified_manifest()

    elif args.pokemon:
        # Process only Pokemon
        processor.process_all_pokemon()
        # Create unified manifest with existing trainer and item data
        processor.create_unified_manifest()

    elif args.trainers:
        # Process only trainers
        processor.process_all_trainers()
        # Create unified manifest with existing Pokemon and item data
        processor.create_unified_manifest()

    elif args.items:
        # Process only items
        processor.process_all_items()
        # Create unified manifest with existing Pokemon and trainer data
        processor.create_unified_manifest()

    elif args.minis:
        # Process only mini sprites
        processor.process_all_minis()
        # Create unified manifest with existing data
        processor.create_unified_manifest()

    elif args.icons:
        # Process only icon sprites
        processor.process_all_icons()
        # Create unified manifest with existing data
        processor.create_unified_manifest()

    elif args.target:
        # Try to process specific target (check if it's Pokemon, trainer, item, mini, or icon)
        if processor.process_pokemon(args.target):
            print(f"Processed Pokemon: {args.target}")
        elif processor.process_trainer(args.target):
            print(f"Processed trainer: {args.target}")
        elif processor.process_item(args.target):
            print(f"Processed item: {args.target}")
        elif processor.process_mini(args.target):
            print(f"Processed mini sprite: {args.target}")
        elif processor.process_icon(args.target):
            print(f"Processed icon: {args.target}")
        else:
            print(f"Target '{args.target}' not found as Pokemon, trainer, item, mini sprite, or icon")

    else:
        # Default: process test cases
        print("No target specified. Processing test cases...")
        print("Testing Pokemon (Abra)...")
        if processor.process_pokemon('abra'):
            print("Pokemon test successful!")
        else:
            print("Pokemon test failed")

        print("Testing trainer (red)...")
        if processor.process_trainer('red'):
            print("Trainer test successful!")
        else:
            print("Trainer test failed")

        print("Testing item (poke_ball)...")
        if processor.process_item('poke_ball'):
            print("Item test successful!")
        else:
            print("Item test failed")

        print("Testing mini sprite (pikachu)...")
        if processor.process_mini('pikachu'):
            print("Mini sprite test successful!")
        else:
            print("Mini sprite test failed")

        print("Testing icon (pikachu)...")
        if processor.process_icon('pikachu'):
            print("Icon test successful!")
        else:
            print("Icon test failed")

        print("Run with --all to process all sprites, --pokemon for Pokemon only, --trainers for trainers only, --items for items only, --minis for mini sprites only, or --icons for icons only")

if __name__ == "__main__":
    main()
