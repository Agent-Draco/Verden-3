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
                    # Check if it contains text or just tags
                    clean_b = re.sub(r'<[^>]+>', '', b).strip()
                    if not clean_b:
                        print(f"File: {path}, Button {i+1} has no text: {b.strip()}")
