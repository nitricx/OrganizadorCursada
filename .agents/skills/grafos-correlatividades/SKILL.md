---
name: grafos-correlatividades
description: Directed Acyclic Graph (DAG) algorithms, cycle detection, topological sorting, and prerequisite visualization with Cytoscape and Dagre for OrganizadorCursada. Trigger when working with prerequisite flow, academic dependency trees, plan linters, or graph rendering. Triggers: grafo, graph, dag, correlativas, correlatividades, prerequisites, cytoscape, dagre, kahn, cycle, topological sort, dependency tree.
---

# Graphs, Prerequisite Trees & DAG Algorithms Skill

This skill defines the theoretical foundations, graph algorithms, and rendering guidelines for academic prerequisite dependency trees in **OrganizadorCursada**.

---

## 1. Study Plans as Directed Acyclic Graphs (DAGs)

A university degree curriculum is modeled mathematically as a **Directed Acyclic Graph (DAG)**:

$$G = (V, E)$$

- **Vertices ($V$)**: Academic subjects (`Course` entities identified by unique numeric IDs).
- **Directed Edges ($E$)**: Prerequisite constraints between subjects:
  - $A \xrightarrow{\text{course}} B$: To enroll or course subject $B$, subject $A$ must be regularized or approved (`cursarReqId`).
  - $A \xrightarrow{\text{approve}} B$: To sit for the final exam or approve subject $B$, subject $A$ must be fully approved (`aprobarReqId`).

### Fundamental Invariant: Strict Acyclicity

A valid curriculum plan **must never** contain circular dependencies:
$$v_1 \rightarrow v_2 \rightarrow \dots \rightarrow v_k \rightarrow v_1 \quad \text{(INVALID)}$$
Any cycle represents an impossible academic deadlock where no student could ever begin or complete the circular sequence.

---

## 2. Cycle Detection: Kahn's Algorithm (Topological Sort)

Implemented in `PlanLinterService` (`src/app/services/plan-linter.service.ts`), Kahn's algorithm verifies acyclicity and computes valid topological course progressions:

### Algorithmic Procedure

1. **Compute In-Degrees**: Count the number of incoming prerequisite constraints for each subject.
2. **Zero In-Degree Queue**: Enqueue all subjects with zero incoming prerequisite requirements ($\text{in-degree} = 0$).
3. **Iterative Traversal**:
   - Dequeue a subject $u$.
   - For each dependent subject $v$ requiring $u$:
     - Decrement $v$'s in-degree by 1.
     - If $v$'s in-degree drops to 0, enqueue $v$.
4. **Cycle Verification**:
   - If the count of dequeued subjects is **less** than the total number of subjects in the plan, **at least one cycle exists**. The linter rejects the plan manifest.

---

## 3. Downstream Lock Rule in Graph Terms

The Downstream Lock Safety Rule operates as a graph reachability constraint:

> If subject $B$ is in `coursing`, `coursed`, or `approved` status, and subject $A$ is an **ancestor** of $B$ in the prerequisite DAG, subject $A$ is **locked against downward state transitions** (it cannot be demoted from `approved` to `pending`, or from `coursed` to `pending`).

### Validation Logic in `CourseService`:

1. Query the transitive forward closure of $A$ (all direct and indirect downstream dependents).
2. Check if any dependent in that closure holds an active state requiring $A$'s current status.
3. If an active dependent is found, deny the status mutation and surface the locking subject ID.

---

## 4. Visual Rendering via Cytoscape.js & Cytoscape-Dagre

The application renders interactive prerequisite graphs using `cytoscape` with the `cytoscape-dagre` hierarchical layout:

### Dagre Layout Configuration

```typescript
const layoutConfig = {
  name: 'dagre',
  rankDir: 'TB', // Top-to-Bottom (introductory to advanced subjects)
  nodeSep: 50, // Horizontal separation between subjects
  rankSep: 80, // Vertical separation between terms/years
  edgeSep: 20,
};
```

### Rendering & Performance Guidelines

1. **Edge Semantics**:
   - `cursarReq`: Dashed line or blue stroke (`var(--status-available-border)`).
   - `aprobarReq`: Solid line or green stroke (`var(--status-approved-border)`).
2. **Batch Updates**:
   - When a subject changes status, do **not** re-run Dagre layout calculations from scratch.
   - Update node data/classes inside a Cytoscape batch:
     ```typescript
     cy.batch(() => {
       cy.$(`#node-${courseId}`).data('status', newStatus);
     });
     ```
3. **Interactive Hover Flow**:
   - On hovering over a subject node:
     - Required prerequisite ancestors: Highlight with `--status-req-bg`.
     - Unlocked downstream successors: Highlight with `--status-unlocks-bg`.
     - Non-connected nodes: Dim to opacity 0.3.

---

## 5. Graph Verification Checklist

- [ ] Does the plan validate as an acyclic DAG via Kahn's algorithm without cycle errors?
- [ ] Is the Downstream Lock Safety Rule preserved during status modifications?
- [ ] Do edge styles distinguish enrollment prerequisites from final exam prerequisites?
- [ ] Does Cytoscape avoid unnecessary layout re-computations on routine status toggles?
