# @spaghettilab/project-store

`ProjectRepository` (S014) — the only place the `Storage` port (S011,
`@spaghettilab/domain`) meets `ProjectV1` (S014, same package). Orchestration only:
serialization and validation live in `@spaghettilab/domain`
(`exportProjectV1`/`importProjectV1`); this class is just "where a project's JSON
lives", addressed by `ProjectId`.

```ts
import { InMemoryStorage, createEmptyProject, projectId } from "@spaghettilab/domain";
import { ProjectRepository } from "@spaghettilab/project-store";

const repo = new ProjectRepository(new InMemoryStorage()); // or a real Storage later
const id = /* validated ProjectId */;
await repo.save(createEmptyProject(id, "My project"));
const result = await repo.load(id); // Result<ProjectV1, DomainError[]>
```

`save`/`load`/`remove`/`listProjectIds` are the whole surface — no autosave,
version history, or crash recovery yet (that's S122's job, layered on top of this).

## Commands

```sh
npm run -w @spaghettilab/project-store typecheck
npm run -w @spaghettilab/project-store lint
npm run -w @spaghettilab/project-store test
npm run -w @spaghettilab/project-store test:coverage
```
