import re

with open('src/routes/auth.tsx', 'r') as f:
    content = f.read()

# Replace any with unknown
content = content.replace('catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any', 'catch (err: unknown) {')
content = content.replace('catch (err: any) {', 'catch (err: unknown) {')
# also handle type casting error.message
content = content.replace('setError(err?.message ?? "Something went wrong");', 'setError(err instanceof Error ? err.message : "Something went wrong");')

with open('src/routes/auth.tsx', 'w') as f:
    f.write(content)
