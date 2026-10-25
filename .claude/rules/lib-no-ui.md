---
paths:
  - "src/lib/**"
---

# Core library stays UI-free

Code in `src/lib/` must not import React or anything from `src/components/`, so the core logic does not depend on the user interface.
