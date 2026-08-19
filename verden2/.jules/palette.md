## 2024-07-23 - ARIA labels for Search and Navigation controls

**Learning:** Found an accessibility issue pattern across mapping/navigation apps where input fields (like the address search) and icon-only buttons (like clear search or voice toggle) lack descriptive ARIA labels. Screen readers struggle with inputs that only have placeholders and buttons that only contain icons.
**Action:** When adding or updating icon-only buttons or placeholder-only inputs, always verify that `aria-label` attributes are present to explicitly convey the element's purpose to assistive technologies.
