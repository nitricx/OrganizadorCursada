# Rule: No Default / Fake Data Allowed

1. **No Fake or Mock Data**: Do NOT introduce hardcoded dummy, placeholder, or fake study plans/careers (such as dummy Abogacía, Medicina, etc.) into the codebase, catalogs, or tests.
2. **Real Data Only**: Only use actual, authoritative study plan JSON files (e.g. `scripts/seed-data/sistemas.json` and `scripts/seed-data/audiovisual.json`).
3. **No Internal Version Numbers in UI**: Do not display artificial internal version tags or version numbers in user-facing tables or UI components.
4. **Complete Data Loading**: Always load full course manifests with all subjects (e.g., 36 subjects for Sistemas) intact rather than truncated mock snippets.
