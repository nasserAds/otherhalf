---
name: Cross-platform uploaded dependencies
description: How to recover when an uploaded JavaScript project includes native artifacts built on another operating system.
---

Uploaded JavaScript projects may contain `node_modules` and generated ORM clients built for the author's machine rather than the current Linux runtime. Native modules can fail with an invalid ELF header, and Prisma can fail because its client only contains a Windows query engine.

**Why:** The uploaded project ran successfully after rebuilding its native dependency and regenerating Prisma for the current runtime; reinstalling was blocked because the archive pinned a security-blocked package version.

**How to apply:** Prefer the archive's lockfile and source, but inspect native artifacts before starting. Rebuild native modules locally, add the current runtime to Prisma `binaryTargets` when needed, and run `prisma generate` before diagnosing application code.