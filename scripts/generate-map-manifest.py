#!/usr/bin/env python3
"""
Generate a map manifest that maps location IDs to their actual map image files.
Parses blocks.asm to understand which locations share the same map graphics.
"""

import re
import json
import os

def parse_blocks_asm(blocks_asm_path):
    """Parse blocks.asm to create location -> map file mapping"""
    with open(blocks_asm_path, 'r') as f:
        content = f.read()
    
    location_to_map = {}
    current_locations = []
    
    for line in content.split('\n'):
        line = line.strip()
        
        # Check for location label (ends with _BlockData:)
        if '_BlockData:' in line:
            # Extract the location name before _BlockData
            loc_name = line.split('_BlockData')[0].strip()
            if loc_name:
                current_locations.append(loc_name)
        
        # Check for INCBIN directive
        elif 'INCBIN "maps/' in line:
            match = re.search(r'INCBIN "maps/(.+)\.ablk', line)
            if match and current_locations:
                map_file = match.group(1)
                for loc in current_locations:
                    location_to_map[loc.lower()] = map_file
                current_locations = []
    
    return location_to_map

def get_available_maps(maps_dir):
    """Get list of available map PNG files"""
    available = {}
    for f in os.listdir(maps_dir):
        if f.endswith('.png'):
            name = f[:-4]  # Remove .png
            available[name.lower()] = name
    return available

def main():
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    blocks_asm = os.path.join(base_dir, 'polishedcrystal/data/maps/blocks.asm')
    maps_dir = os.path.join(base_dir, 'public/maps')
    output_file = os.path.join(maps_dir, 'manifest.json')
    
    # Parse blocks.asm for location -> map file mappings
    location_to_map = parse_blocks_asm(blocks_asm)
    print(f"Parsed {len(location_to_map)} location -> map mappings from blocks.asm")
    
    # Get available map images
    available_maps = get_available_maps(maps_dir)
    print(f"Found {len(available_maps)} map images in public/maps/")
    
    # Build the manifest
    # Key: lowercase location ID
    # Value: list of actual PNG filenames (without extension)
    manifest = {}
    
    for loc_id, map_file in location_to_map.items():
        map_file_lower = map_file.lower()
        if map_file_lower in available_maps:
            actual_name = available_maps[map_file_lower]
            if loc_id not in manifest:
                manifest[loc_id] = []
            if actual_name not in manifest[loc_id]:
                manifest[loc_id].append(actual_name)
    
    # Also add direct mappings for maps that match location names exactly
    for map_lower, map_actual in available_maps.items():
        if map_lower not in manifest:
            manifest[map_lower] = [map_actual]
    
    # Write manifest
    with open(output_file, 'w') as f:
        json.dump(manifest, f, indent=2, sort_keys=True)
    
    print(f"Written manifest with {len(manifest)} entries to {output_file}")
    
    # Print some stats
    locations_with_maps = sum(1 for loc in location_to_map if loc in manifest)
    print(f"Locations with available maps: {locations_with_maps}/{len(location_to_map)}")

if __name__ == '__main__':
    main()
