# Prerequisites Flow Graph Feature Module 🕸️

The **Requisites Flow** module (`/requisites`) renders an interactive, directed graph visualization of subject prerequisites across the university curriculum using **Cytoscape.js** and the **Dagre** hierarchical layout plugin.

---

## 🔑 Key Functionalities

1. **Interactive Dependency Graph**:
   - Renders each course as a graph node.
   - Nodes are color-coded based on their live `CourseStatus`:
     - 🟡 **Pending**: Gray / Yellow default background.
     - 🔵 **Coursing**: Blue background.
     - 🟣 **Coursed**: Purple / Cyan background.
     - 🟢 **Approved**: Green background.

2. **Edge Categories**:
   - **Solid Arrows (`cursarReq`)**: Direct requirement needed to enroll/course a subject.
   - **Dashed Arrows (`aprobarReq`)**: Requirement needed to take and pass the final exam.

3. **Node Interaction & Highlighting**:
   - Hovering or selecting a course node highlights upstream prerequisite parents and downstream unlocked subjects.
   - Integrated with `CourseService.getRequiredCourseIds()` and `CourseService.getUnlockedCourseIds()`.

---

## 🧩 Tech & Libraries

- **Graph Engine**: `cytoscape` v3.33
- **Layout Plugin**: `cytoscape-dagre` v2.5 (Hierarchical top-to-bottom layout)
- **Component**: `RequisitesFlowComponent` (`requisites-flow.component.ts`)
- **Service**: `CourseService` (`src/app/services/course.service.ts`)
