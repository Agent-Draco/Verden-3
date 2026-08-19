import os
import re

for root, _, files in os.walk('src/routes'):
    for file in files:
        if file.endswith('.tsx'):
            path = os.path.join(root, file)
            with open(path, 'r') as f:
                content = f.read()

                # Simple regex check for icon-only buttons without aria-label
                # Find all buttons
                buttons = re.finditer(r'<button([^>]*)>([\s\S]*?)</button>', content)
                for b in buttons:
                    tag_attrs = b.group(1)
                    inner_html = b.group(2)

                    # Remove anything inside {...} (variables, logic)
                    clean_inner = re.sub(r'\{[^}]+\}', '', inner_html)
                    # Remove self-closing tags (like <X /> or <Icon size={16} />)
                    clean_inner = re.sub(r'<[^>]+\/>', '', clean_inner)
                    # Remove normal tags and keep their contents
                    clean_inner = re.sub(r'<[^>]+>|<\/[^>]+>', '', clean_inner)

                    # if the inner html has tags like <X /> but no text, it's an icon-only button
                    if not clean_inner.strip() and '<' in inner_html and 'aria-label' not in tag_attrs:
                        line = content[:b.start()].count('\n') + 1
                        print(f"File: {path}, Line {line}: Missing aria-label on icon-only button: {inner_html.strip()}")
