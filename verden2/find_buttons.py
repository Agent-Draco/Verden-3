import os
import re

for root, _, files in os.walk('src/routes'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()
                buttons = re.findall(r'<button[^>]*>([\s\S]*?)</button>', content)
                for i, b in enumerate(buttons):
                    # Check if it contains text
                    text = re.sub(r'<[^>]+>', '', b).strip()
                    if not text:
                        # Extract the button tag to check for aria-label
                        tag_match = re.search(r'<button([^>]*)>', content)
                        if tag_match:
                            tag = tag_match.group(1)
                            print(f"File: {path}, Icon-only button: {b.strip()}, aria-label in tag: {'aria-label' in tag}")
