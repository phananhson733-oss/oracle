#!/usr/bin/env python3
"""
Apply generated deep_dive content to wiki-generated.ts
Usage: python3 apply-deeplive.py
"""

import json
import re
from pathlib import Path

# Load generated content
GENERATED_FILE = Path("/Users/wzb/Documents/oracle/backend/src/data/wiki-deep-dive-generated.ts")
WIKI_FILE = Path("/Users/wzb/Documents/oracle/backend/src/data/wiki-generated.ts")

def extract_deep_dive(content: str, term: str) -> list:
    """Extract deep_dive array from generated content"""
    # Look for the term in the generated file
    pattern = rf'"{term}":\s*(\[.*?\])(?=,|\s*\n\s*"[a-z])'
    match = re.search(pattern, content, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(1))
        except:
            return []
    return []

def update_wiki_file():
    """Apply generated deep_dive content to wiki-generated.ts"""
    # Read generated content
    with open(GENERATED_FILE, 'r', encoding='utf-8') as f:
        generated = f.read()
    
    # Read wiki file
    with open(WIKI_FILE, 'r', encoding='utf-8') as f:
        wiki = f.read()
    
    # List of terms to update
    terms = [
        "sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn",
        "uranus", "neptune", "pluto", "chiron", "lilith", "ascendant",
        "midheaven", "north-node", "south-node", "aries", "taurus",
        "gemini", "cancer", "leo", "virgo", "libra", "scorpio",
        "sagittarius", "capricorn", "aquarius", "pisces"
    ]
    
    updated_count = 0
    for term in terms:
        deep_dive = extract_deep_dive(generated, term)
        if deep_dive:
            # Find and replace the deep_dive section in wiki file
            pattern = rf'("{term}":\s*\{{[^}}]*?)("deep_dive":\s*\[)[^\]]*\]'
            replacement = rf'\1\2{json.dumps(deep_dive, ensure_ascii=False, indent=8)}'
            
            if re.search(pattern, wiki):
                wiki = re.sub(pattern, replacement, wiki, flags=re.DOTALL)
                updated_count += 1
                print(f"✓ Updated: {term}")
    
    # Save updated wiki file
    with open(WIKI_FILE, 'w', encoding='utf-8') as f:
        f.write(wiki)
    
    print(f"\nTotal updated: {updated_count} terms")

if __name__ == "__main__":
    update_wiki_file()
