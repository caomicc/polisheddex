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

        # Create output directories
        self.sprites_dir = self.output_path / "sprites" / "pokemon"
        self.sprites_dir.mkdir(exist_ok=True)

        self.trainer_sprites_dir = self.output_path / "sprites" / "trainers"
        self.trainer_sprites_dir.mkdir(parents=True, exist_ok=True)

        self.item_sprites_dir = self.output_path / "sprites" / "items"
        self.item_sprites_dir.mkdir(parents=True, exist_ok=True)

        # Mapping of variant directory names to base Pokemon names
        # For Pokemon with multiple visual variants, we need to know which directory
        # contains the "base" or most common form to use as the default sprite
        self.variant_to_base_mapping = {
            # Pikachu variants - use pikachu_plain as base (most common form)
            'pikachu_plain': 'pikachu_plain',
            'pikachu_chuchu': 'pikachu_yellow',
            'pikachu_yellow': 'pikachu_yellow',
            'pikachu_fly': 'pikachu_fly',
            'pikachu_pika': 'pikachu_red',
            'pikachu_red': 'pikachu_red',
            'pikachu_spark': 'pikachu_spark',
            'pikachu_surf': 'pikachu_surf',

            'dudunsparce': 'dudunsparce',  # Dunsparce variant
            'dudunsparce_two_segment': 'dudunsparce_two_segment',  # Dunsparce variant
            'dudunsparce_three_segment': 'dudunsparce_three_segment',  # Dunsparce variant

            # Unown variants - use unown_a as base (first letter form)
            'unown_a': 'unown_a',
            'unown_b': 'unown_b', 'unown_c': 'unown_c', 'unown_d': 'unown_d', 'unown_e': 'unown_e',
            'unown_f': 'unown_f', 'unown_g': 'unown_g', 'unown_h': 'unown_h', 'unown_i': 'unown_i',
            'unown_j': 'unown_j', 'unown_k': 'unown_k', 'unown_l': 'unown_l', 'unown_m': 'unown_m',
            'unown_n': 'unown_n', 'unown_o': 'unown_o', 'unown_p': 'unown_p', 'unown_q': 'unown_q',
            'unown_r': 'unown_r', 'unown_s': 'unown_s', 'unown_t': 'unown_t', 'unown_u': 'unown_u',
            'unown_v': 'unown_v', 'unown_w': 'unown_w', 'unown_x': 'unown_x', 'unown_y': 'unown_y',
            'unown_z': 'unown_z', 'unown_question': 'unown_question', 'unown_exclamation': 'unown_exclamation',

            # Magikarp variants - use magikarp_plain as base
            'magikarp_plain': 'magikarp_plain',
            'magikarp_bubbles': 'magikarp_bubbles', 'magikarp_calico1': 'magikarp_calico1', 'magikarp_calico2': 'magikarp_calico2',
            'magikarp_calico3': 'magikarp_calico3', 'magikarp_dapples': 'magikarp_dapples', 'magikarp_diamonds': 'magikarp_diamonds',
            'magikarp_forehead1': 'magikarp_forehead1', 'magikarp_forehead2': 'magikarp_forehead2', 'magikarp_mask1': 'magikarp_mask1',
            'magikarp_mask2': 'magikarp_mask2', 'magikarp_orca': 'magikarp_orca', 'magikarp_patches': 'magikarp_patches',
            'magikarp_raindrop': 'magikarp_raindrop', 'magikarp_saucy': 'magikarp_saucy', 'magikarp_skelly': 'magikarp_skelly',
            'magikarp_stripe': 'magikarp_stripe', 'magikarp_tiger': 'magikarp_tiger', 'magikarp_twotone': 'magikarp_twotone',
            'magikarp_zebra': 'magikarp_zebra',

            # Pichu variants - use pichu_plain as base
            'pichu_plain': 'pichu_plain',
            'pichu_spiky': 'pichu_spiky',
        }

        # Base forms that should be processed (directories that represent the default sprite)
        self.base_form_directories = {
            'pikachu': 'pikachu_plain',
            'unown': 'unown_a',  # Use A form as default
            'magikarp': 'magikarp_plain',
            'pichu': 'pichu_plain',
            'dudunsparce': 'dudunsparce_two_segment',  # Use two-segment as default
        }

        # Palette directory mapping - where to find palette files for variants
        # Form variants use the base Pokemon's palette files
        self.palette_directory_mapping = {
            'pikachu_plain': 'pikachu',
            'pikachu_chuchu': 'pikachu',
            'pikachu_fly': 'pikachu',
            'pikachu_pika': 'pikachu',
            'pikachu_spark': 'pikachu',
            'pikachu_surf': 'pikachu',
            'pikachu_yellow': 'pikachu',
            'pikachu_red': 'pikachu',

            'pichu_plain': 'pichu',
            'pichu_spiky': 'pichu',

            'dudunsparce': 'dudunsparce',
            'dudunsparce_two_segment': 'dudunsparce',
            'dudunsparce_three_segment': 'dudunsparce',

            # Unown variants - all use base unown palette
            'unown_a': 'unown', 'unown_b': 'unown', 'unown_c': 'unown', 'unown_d': 'unown',
            'unown_e': 'unown', 'unown_f': 'unown', 'unown_g': 'unown', 'unown_h': 'unown',
            'unown_i': 'unown', 'unown_j': 'unown', 'unown_k': 'unown', 'unown_l': 'unown',
            'unown_m': 'unown', 'unown_n': 'unown', 'unown_o': 'unown', 'unown_p': 'unown',
            'unown_q': 'unown', 'unown_r': 'unown', 'unown_s': 'unown', 'unown_t': 'unown',
            'unown_u': 'unown', 'unown_v': 'unown', 'unown_w': 'unown', 'unown_x': 'unown',
            'unown_y': 'unown', 'unown_z': 'unown', 'unown_question': 'unown', 'unown_exclamation': 'unown',

            # Magikarp variants - all use base magikarp palette
            'magikarp_plain': 'magikarp',
            'magikarp_bubbles': 'magikarp',
            'magikarp_calico1': 'magikarp',
            'magikarp_calico2': 'magikarp',
            'magikarp_calico3': 'magikarp',
            'magikarp_dapples': 'magikarp',
            'magikarp_diamonds': 'magikarp',
            'magikarp_forehead1': 'magikarp',
            'magikarp_forehead2': 'magikarp',
            'magikarp_mask1': 'magikarp',
            'magikarp_mask2': 'magikarp',
            'magikarp_orca': 'magikarp',
            'magikarp_patches': 'magikarp',
            'magikarp_raindrop': 'magikarp',
            'magikarp_saucy': 'magikarp',
            'magikarp_skelly': 'magikarp',
            'magikarp_stripe': 'magikarp',
            'magikarp_tiger': 'magikarp',
            'magikarp_twotone': 'magikarp',
            'magikarp_zebra': 'magikarp',

            # Arbok variants - all use base arbok palette
            'arbok_agatha': 'arbok',
            'arbok_ariana': 'arbok',
            'arbok_johto': 'arbok',
            'arbok_kanto': 'arbok',
            'arbok_koga': 'arbok',
        }

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
        """Get the output directory name for a Pokemon"""
        # Map dudunsparce_two_segment to the default dudunsparce folder
        if pokemon_name == 'dudunsparce_two_segment':
            return 'dudunsparce'
        # Map dudunsparce_three_segment to the default dudunsparce folder
        if pokemon_name == 'dudunsparce_three_segment':
            return 'dudunsparce'
        if pokemon_name == 'arbok_johto':
            return 'arbok'
        # Map arbok_johto to the default arbok folder
        if pokemon_name == 'unown':
            return 'unown_z'
        # Map pikachu_chuchu to pikachu_yellow (chuchu = yellow)
        if pokemon_name == 'pikachu_chuchu':
            return 'pikachu_yellow'
        # Map pikachu_pika to pikachu_red (pika = red)
        if pokemon_name == 'pikachu_pika':
            return 'pikachu_red'
        return pokemon_name

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

        print(f"Processing trainer {trainer_name}...")

        # Create output directory for this trainer
        output_dir = self.trainer_sprites_dir / trainer_name
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

            # Determine output filename
            if palette_name == trainer_name:
                # Default palette
                output_filename = f"{trainer_name}.png"
            else:
                # Variant palette (e.g., kimono_girl_1.png)
                variant = palette_name.replace(f"{trainer_name}_", "")
                output_filename = f"{trainer_name}_{variant}.png"

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

        print(f"Processing item {item_name}...")

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

        # Save static PNG (first frame) directly in items directory
        if processed_frames:
            static_path = self.item_sprites_dir / f"{item_name}.png"
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

    def create_unified_manifest(self):
        """Create a unified JSON manifest containing Pokemon, trainer, and item sprites"""
        pokemon_data = self.create_sprite_manifest()
        trainer_data = self.create_trainer_manifest()
        item_data = self.create_item_manifest()

        unified_manifest = {
            "pokemon": pokemon_data,
            "trainers": trainer_data,
            "items": item_data
        }

        # Save unified manifest
        manifest_path = self.output_path / "sprite_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(unified_manifest, f, indent=2, sort_keys=True)

        print(f"Created unified sprite manifest: {manifest_path}")
        print(f"Pokemon sprites: {len(pokemon_data)}")
        print(f"Trainer sprites: {len(trainer_data)}")
        print(f"Item sprites: {len(item_data)}")

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
    parser = argparse.ArgumentParser(description="Process Game Boy Color sprites (Pokemon, Trainers, and Items)")
    parser.add_argument('target', nargs='?', help='Specific Pokemon/trainer/item name to process')
    parser.add_argument('--all', action='store_true', help='Process all sprites')
    parser.add_argument('--pokemon', action='store_true', help='Process Pokemon sprites only')
    parser.add_argument('--trainers', action='store_true', help='Process trainer sprites only')
    parser.add_argument('--items', action='store_true', help='Process item sprites only')
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

    elif args.target:
        # Try to process specific target (check if it's Pokemon, trainer, or item)
        if processor.process_pokemon(args.target):
            print(f"Processed Pokemon: {args.target}")
        elif processor.process_trainer(args.target):
            print(f"Processed trainer: {args.target}")
        elif processor.process_item(args.target):
            print(f"Processed item: {args.target}")
        else:
            print(f"Target '{args.target}' not found as Pokemon, trainer, or item")

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

        print("Run with --all to process all sprites, --pokemon for Pokemon only, --trainers for trainers only, or --items for items only")

if __name__ == "__main__":
    main()
