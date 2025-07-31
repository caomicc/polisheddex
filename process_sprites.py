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

    @staticmethod
    def parse_animation_file(anim_path: str) -> List[Dict[str, int]]:
        """Parse animation file to extract frame timings"""
        frames = []
        try:
            with open(anim_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('frame'):
                        # Extract frame number and duration from "frame 0, 09"
                        frame_match = re.search(r'frame\s+(\d+),\s*(\d+)', line)
                        if frame_match:
                            frame_num, duration = map(int, frame_match.groups())
                            frames.append({
                                'frame': frame_num,
                                'duration': duration * 16.67  # Convert to milliseconds (60fps = 16.67ms per frame)
                            })
        except FileNotFoundError:
            print(f"Warning: Animation file {anim_path} not found")
            # Return default single frame
            return [{'frame': 0, 'duration': 500}]

        return frames if frames else [{'frame': 0, 'duration': 500}]

class GBCSpriteProcessor:
    """Main sprite processing class"""

    def __init__(self, rom_path: str, output_path: str):
        self.rom_path = Path(rom_path)
        self.output_path = Path(output_path)
        self.pokemon_dir = self.rom_path / "gfx" / "pokemon"

        # Create output directories
        self.sprites_dir = self.output_path / "sprites" / "pokemon"
        self.sprites_dir.mkdir(exist_ok=True)
        
        # Mapping of variant directory names to base Pokemon names
        # For Pokemon with multiple visual variants, we need to know which directory
        # contains the "base" or most common form to use as the default sprite
        self.variant_to_base_mapping = {
            # Pikachu variants - use pikachu_plain as base (most common form)
            'pikachu_plain': 'pikachu',
            'pikachu_chuchu': 'pikachu',
            'pikachu_fly': 'pikachu', 
            'pikachu_pika': 'pikachu',
            'pikachu_spark': 'pikachu',
            'pikachu_surf': 'pikachu',
            
            # Unown variants - use unown_a as base (first letter form)
            'unown_a': 'unown',
            'unown_b': 'unown', 'unown_c': 'unown', 'unown_d': 'unown', 'unown_e': 'unown',
            'unown_f': 'unown', 'unown_g': 'unown', 'unown_h': 'unown', 'unown_i': 'unown',
            'unown_j': 'unown', 'unown_k': 'unown', 'unown_l': 'unown', 'unown_m': 'unown',
            'unown_n': 'unown', 'unown_o': 'unown', 'unown_p': 'unown', 'unown_q': 'unown',
            'unown_r': 'unown', 'unown_s': 'unown', 'unown_t': 'unown', 'unown_u': 'unown',
            'unown_v': 'unown', 'unown_w': 'unown', 'unown_x': 'unown', 'unown_y': 'unown',
            'unown_z': 'unown', 'unown_question': 'unown', 'unown_exclamation': 'unown',
            
            # Magikarp variants - use magikarp_plain as base
            'magikarp_plain': 'magikarp',
            'magikarp_bubbles': 'magikarp', 'magikarp_calico1': 'magikarp', 'magikarp_calico2': 'magikarp',
            'magikarp_calico3': 'magikarp', 'magikarp_dapples': 'magikarp', 'magikarp_diamonds': 'magikarp',
            'magikarp_forehead1': 'magikarp', 'magikarp_forehead2': 'magikarp', 'magikarp_mask1': 'magikarp',
            'magikarp_mask2': 'magikarp', 'magikarp_orca': 'magikarp', 'magikarp_patches': 'magikarp',
            'magikarp_raindrop': 'magikarp', 'magikarp_saucy': 'magikarp', 'magikarp_skelly': 'magikarp',
            'magikarp_stripe': 'magikarp', 'magikarp_tiger': 'magikarp', 'magikarp_twotone': 'magikarp',
            'magikarp_zebra': 'magikarp',
            
            # Pichu variants - use pichu_plain as base
            'pichu_plain': 'pichu',
            'pichu_spiky': 'pichu',
        }
        
        # Base forms that should be processed (directories that represent the default sprite)
        self.base_form_directories = {
            'pikachu': 'pikachu_plain',
            'unown': 'unown_a',  # Use A form as default
            'magikarp': 'magikarp_plain', 
            'pichu': 'pichu_plain',
        }
        
        # Palette directory mapping - where to find palette files for variants
        # Some variants store sprites in one directory but palettes in another
        self.palette_directory_mapping = {
            'pikachu_plain': 'pikachu',
            'pikachu_chuchu': 'pikachu',
            'pikachu_fly': 'pikachu',
            'pikachu_pika': 'pikachu', 
            'pikachu_spark': 'pikachu',
            'pikachu_surf': 'pikachu',
            
            'pichu_plain': 'pichu',
            'pichu_spiky': 'pichu',
            
            # Unown variants - all use base unown palette
            'unown_a': 'unown', 'unown_b': 'unown', 'unown_c': 'unown', 'unown_d': 'unown',
            'unown_e': 'unown', 'unown_f': 'unown', 'unown_g': 'unown', 'unown_h': 'unown',
            'unown_i': 'unown', 'unown_j': 'unown', 'unown_k': 'unown', 'unown_l': 'unown',
            'unown_m': 'unown', 'unown_n': 'unown', 'unown_o': 'unown', 'unown_p': 'unown',
            'unown_q': 'unown', 'unown_r': 'unown', 'unown_s': 'unown', 'unown_t': 'unown',
            'unown_u': 'unown', 'unown_v': 'unown', 'unown_w': 'unown', 'unown_x': 'unown',
            'unown_y': 'unown', 'unown_z': 'unown', 'unown_question': 'unown', 'unown_exclamation': 'unown',
            
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
        # Always process if it's not a variant
        if pokemon_name not in self.variant_to_base_mapping:
            return True
            
        # For variants, only process the designated base form
        base_pokemon = self.variant_to_base_mapping[pokemon_name]
        return self.base_form_directories.get(base_pokemon) == pokemon_name
    
    def get_output_name(self, pokemon_name: str) -> str:
        """Get the output directory name for a Pokemon"""
        # If this is a variant, use the base name for output
        return self.variant_to_base_mapping.get(pokemon_name, pokemon_name)

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
        """Create animated GIF from frames"""
        if not frames:
            return

        try:
            # Ensure all durations are at least 50ms (for smooth animation)
            safe_durations = [max(50, int(d)) for d in durations]

            # If we have fewer duration values than frames, repeat the last duration
            while len(safe_durations) < len(frames):
                safe_durations.append(safe_durations[-1] if safe_durations else 500)

            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                duration=safe_durations,
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
            print(f"Skipping {pokemon_name} (variant will be processed by base form)")
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

        # Only process front sprites for normal and shiny variants
        variants = ['normal', 'shiny']

        for variant in variants:
            # Check if we need to look for palette files in a different directory
            palette_dir = pokemon_path
            if pokemon_name in self.palette_directory_mapping:
                palette_dir = self.pokemon_dir / self.palette_directory_mapping[pokemon_name]
            
            palette_file = palette_dir / f"{variant}.pal"
            if not palette_file.exists():
                print(f"Skipping {variant} variant - no palette file at {palette_file}")
                continue

            palette = GBCPaletteParser.parse_palette_file(str(palette_file))

            # Only process front sprites
            sprite_file = pokemon_path / "front.png"
            if not sprite_file.exists():
                continue

            # Extract frames from sprite sheet
            raw_frames = self.extract_sprite_frames(str(sprite_file))
            if not raw_frames:
                continue

            # Apply palette and transparency
            processed_frames = []
            for frame in raw_frames:
                processed_frame = self.apply_palette_to_sprite(frame, palette)
                processed_frames.append(processed_frame)

            # Save static PNG (first frame)
            if processed_frames:
                static_path = output_dir / f"{variant}_front.png"
                static_path = static_path.as_posix().replace('_plain', '')  # Ensure '_plain' is removed
                processed_frames[0].save(static_path)

            # Create animated GIF if multiple frames
            if len(processed_frames) > 1:
                # Parse animation timing
                anim_file = pokemon_path / "anim.asm"
                animation_data = GBCAnimationParser.parse_animation_file(str(anim_file))

                # Use slower, more pleasant timing - minimum 200ms per frame
                durations = []
                for i in range(len(processed_frames)):
                    if i < len(animation_data):
                        # Make animations slower and smoother
                        duration = max(200, animation_data[i]['duration'] * 2)
                        durations.append(duration)
                    else:
                        durations.append(400)

                gif_path = output_dir / f"{variant}_front_animated.gif"
                gif_path = gif_path.as_posix().replace('_plain', '')  # Ensure '_plain' is removed
                self.create_animated_gif(processed_frames, durations, gif_path)

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
        """Create a JSON manifest of all processed sprites"""
        manifest = {}

        for pokemon_dir in self.sprites_dir.iterdir():
            if pokemon_dir.is_dir():
                pokemon_name = pokemon_dir.name
                pokemon_data = {
                    "normal_front": None,
                    "shiny_front": None,
                    "normal_animated": None,
                    "shiny_animated": None
                }

                # Find the 4 expected files
                for sprite_file in pokemon_dir.iterdir():
                    if sprite_file.suffix in ['.png', '.gif']:
                        rel_path = f"sprites/pokemon/{pokemon_name}/{sprite_file.name}"

                        if sprite_file.name == "normal_front.png":
                            pokemon_data["normal_front"] = rel_path
                        elif sprite_file.name == "shiny_front.png":
                            pokemon_data["shiny_front"] = rel_path
                        elif sprite_file.name == "normal_front_animated.gif":
                            pokemon_data["normal_animated"] = rel_path
                        elif sprite_file.name == "shiny_front_animated.gif":
                            pokemon_data["shiny_animated"] = rel_path

                # Only add Pokemon that have at least normal front sprite
                if pokemon_data["normal_front"]:
                    manifest[pokemon_name] = pokemon_data

        # Save manifest
        manifest_path = self.output_path / "sprite_manifest.json"
        with open(manifest_path, 'w') as f:
            json.dump(manifest, f, indent=2, sort_keys=True)

        print(f"Created sprite manifest: {manifest_path}")

    def export_sprite(self, sprite: Image.Image, output_path: str) -> None:
        """Export the processed sprite to the specified output path."""
        try:
            # Remove '_plain' from the output path if it exists
            output_path = output_path.replace('_plain', '')

            # Save the sprite
            sprite.save(output_path)
            print(f"Sprite exported to {output_path}")
        except Exception as e:
            print(f"Error exporting sprite to {output_path}: {e}")

def main():
    parser = argparse.ArgumentParser(description="Process Game Boy Color Pokemon sprites")
    parser.add_argument('pokemon', nargs='?', help='Specific Pokemon name to process')
    parser.add_argument('--all', action='store_true', help='Process all Pokemon')
    parser.add_argument('--rom-path', default='polishedcrystal', help='Path to ROM directory')
    parser.add_argument('--output-path', default='public', help='Output directory')

    args = parser.parse_args()

    # Initialize processor
    processor = GBCSpriteProcessor(args.rom_path, args.output_path)

    if args.all:
        processor.process_all_pokemon()
        processor.create_sprite_manifest()
    elif args.pokemon:
        processor.process_pokemon(args.pokemon)
    else:
        # Default: process Abra as a test
        print("No Pokemon specified. Processing Abra as test...")
        if processor.process_pokemon('abra'):
            print("Test successful! Run with --all to process all Pokemon")
        else:
            print("Test failed. Check ROM path and file structure")

if __name__ == "__main__":
    main()
