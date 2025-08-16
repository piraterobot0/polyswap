#!/usr/bin/env python3

# Read the flattened file
with open('flattened.sol', 'r') as f:
    lines = f.readlines()

# Track if we've seen the main SPDX identifier
seen_main_spdx = False
cleaned_lines = []

for i, line in enumerate(lines):
    if 'SPDX-License-Identifier' in line:
        if not seen_main_spdx:
            # Check if this is the contract's main license (LGPL)
            if 'LGPL' in line:
                cleaned_lines.append(line)
                seen_main_spdx = True
            elif i < 10 and not seen_main_spdx:
                # Use the first SPDX if no LGPL found early
                # But change it to LGPL-3.0-or-later
                cleaned_lines.append('// SPDX-License-Identifier: LGPL-3.0-or-later\n')
                seen_main_spdx = True
        # Skip all other SPDX lines
    else:
        cleaned_lines.append(line)

# Write the cleaned file
with open('flattened-clean.sol', 'w') as f:
    f.writelines(cleaned_lines)

print("✅ Created flattened-clean.sol with single SPDX license identifier")
print("   License: LGPL-3.0-or-later")