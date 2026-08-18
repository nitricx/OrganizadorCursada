import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnDestroy,
  inject,
  signal,
  effect,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import cytoscape from 'cytoscape';
import dagre from 'cytoscape-dagre';

import { CourseService } from '../../services/course.service';
import { Course, CourseStatus } from '../../models/course';
import {
  COURSE_STATUS_CONFIG,
  COURSE_STATUS_LIST,
  getCourseStatusConfig,
} from '../../constants/course-status.constants';

cytoscape.use(dagre);

@Component({
  selector: 'app-requisites-flow',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './requisites-flow.component.html',
  styleUrl: './requisites-flow.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RequisitesFlowComponent implements AfterViewInit, OnDestroy {
  @ViewChild('cyContainer') cyContainer!: ElementRef<HTMLDivElement>;

  private courseService = inject(CourseService);

  cy: cytoscape.Core | null = null;

  selectedStatus = signal<string>('all');
  selectedCourse = signal<Course | null>(null);
  statusErrorMessage = signal<string | null>(null);

  readonly statusConfigList = COURSE_STATUS_LIST;
  readonly statusConfigMap = COURSE_STATUS_CONFIG;

  constructor() {
    effect(() => {
      // Trigger update when courses or status filter change
      const courses = this.courseService.courses();
      const status = this.selectedStatus();

      if (this.cy) {
        this.updateCytoscapeGraph(courses);
        this.applyStatusFilterDimming();
      }
    });
  }

  ngAfterViewInit(): void {
    this.initCytoscape();
  }

  ngOnDestroy(): void {
    if (this.cy) {
      this.cy.destroy();
      this.cy = null;
    }
  }

  private isCanvasSupported(): boolean {
    try {
      if (typeof window === 'undefined' || typeof document === 'undefined') return false;
      const canvas = document.createElement('canvas');
      return !!(canvas.getContext && canvas.getContext('2d'));
    } catch {
      return false;
    }
  }

  private initCytoscape(): void {
    if (!this.cyContainer?.nativeElement) return;

    const elements = this.buildElements(this.courseService.courses());

    const hasCanvas = this.isCanvasSupported();

    this.cy = cytoscape({
      container: hasCanvas ? this.cyContainer.nativeElement : undefined,
      headless: !hasCanvas,
      elements,
      style: this.getCytoscapeStyles(),
      layout: this.getLayoutOptions(),
      minZoom: 0.2,
      maxZoom: 3,
    });

    this.setupEvents();
    this.applyStatusFilterDimming();
  }

  private updateCytoscapeGraph(courses: Course[]): void {
    if (!this.cy) return;

    const newElements = this.buildElements(courses);

    this.cy.batch(() => {
      this.cy?.elements().remove();
      this.cy?.add(newElements);
    });

    if (this.isCanvasSupported()) {
      const layout = this.cy.layout(this.getLayoutOptions());
      layout.run();
    }

    this.applyStatusFilterDimming();

    // If currently selected course was updated, refresh its reference
    const currentSelected = this.selectedCourse();
    if (currentSelected) {
      const updatedCourse = this.courseService.getCourseById(currentSelected.id);
      this.selectedCourse.set(updatedCourse ?? null);
    }
  }

  private applyStatusFilterDimming(): void {
    if (!this.cy) return;
    const status = this.selectedStatus();

    this.cy.batch(() => {
      if (status === 'all') {
        this.cy?.elements().removeClass('status-dimmed');
      } else {
        const matchingNodes = this.cy?.nodes().filter((n) => n.data('status') === status);
        const nonMatchingNodes = this.cy?.nodes().filter((n) => n.data('status') !== status);
        const matchingEdges = matchingNodes?.connectedEdges();

        nonMatchingNodes?.addClass('status-dimmed');
        matchingNodes?.removeClass('status-dimmed');

        this.cy?.edges().addClass('status-dimmed');
        matchingEdges?.removeClass('status-dimmed');
      }
    });
  }

  private buildElements(allCourses: Course[]): cytoscape.ElementDefinition[] {
    const filteredCourses = [...allCourses];
    const courseIdSet = new Set(filteredCourses.map((c) => c.id));
    const elements: cytoscape.ElementDefinition[] = [];

    // Group courses by academic year to pre-order in strict columns
    const coursesByYearMap = new Map<number, Course[]>();
    filteredCourses.forEach((c) => {
      if (!coursesByYearMap.has(c.year)) {
        coursesByYearMap.set(c.year, []);
      }
      coursesByYearMap.get(c.year)!.push(c);
    });

    const sortedYears = Array.from(coursesByYearMap.keys()).sort((a, b) => a - b);
    const colWidth = 270;
    const rowHeight = 85;

    // Track vertical rank index of each course: courseId -> yIndex
    const courseYIndexMap = new Map<number, number>();

    // Initial assignment: sort each year by q, then name
    sortedYears.forEach((yearVal) => {
      const yearCourses = coursesByYearMap.get(yearVal)!;
      yearCourses.sort((a, b) => (a.q !== b.q ? a.q - b.q : a.name.localeCompare(b.name)));
      yearCourses.forEach((c, idx) => courseYIndexMap.set(c.id, idx));
    });

    // Run 4 iterative sweeps (Forward and Backward) to globally minimize line crossings
    for (let iter = 0; iter < 4; iter++) {
      // FORWARD SWEEP (Left -> Right): Order year i based on upstream prerequisites in earlier years
      for (let i = 1; i < sortedYears.length; i++) {
        const currentYear = sortedYears[i];
        const yearCourses = coursesByYearMap.get(currentYear)!;

        yearCourses.sort((a, b) => {
          const reqsA = [...a.cursarReqId, ...a.aprobarReqId].filter((id) => courseYIndexMap.has(id));
          const avgY_A =
            reqsA.length > 0
              ? reqsA.reduce((sum, id) => sum + courseYIndexMap.get(id)!, 0) / reqsA.length
              : courseYIndexMap.get(a.id) ?? 999;

          const reqsB = [...b.cursarReqId, ...b.aprobarReqId].filter((id) => courseYIndexMap.has(id));
          const avgY_B =
            reqsB.length > 0
              ? reqsB.reduce((sum, id) => sum + courseYIndexMap.get(id)!, 0) / reqsB.length
              : courseYIndexMap.get(b.id) ?? 999;

          if (avgY_A !== avgY_B) {
            return avgY_A - avgY_B;
          }
          if (a.q !== b.q) {
            return a.q - b.q;
          }
          return a.name.localeCompare(b.name);
        });

        yearCourses.forEach((c, idx) => courseYIndexMap.set(c.id, idx));
      }

      // BACKWARD SWEEP (Right -> Left): Order year i based on downstream target courses in later years
      for (let i = sortedYears.length - 2; i >= 0; i--) {
        const currentYear = sortedYears[i];
        const yearCourses = coursesByYearMap.get(currentYear)!;

        yearCourses.sort((a, b) => {
          const targetsA = filteredCourses
            .filter((c) => c.cursarReqId.includes(a.id) || c.aprobarReqId.includes(a.id))
            .map((c) => c.id)
            .filter((id) => courseYIndexMap.has(id));
          const avgY_A =
            targetsA.length > 0
              ? targetsA.reduce((sum, id) => sum + courseYIndexMap.get(id)!, 0) / targetsA.length
              : courseYIndexMap.get(a.id) ?? 999;

          const targetsB = filteredCourses
            .filter((c) => c.cursarReqId.includes(b.id) || c.aprobarReqId.includes(b.id))
            .map((c) => c.id)
            .filter((id) => courseYIndexMap.has(id));
          const avgY_B =
            targetsB.length > 0
              ? targetsB.reduce((sum, id) => sum + courseYIndexMap.get(id)!, 0) / targetsB.length
              : courseYIndexMap.get(b.id) ?? 999;

          if (avgY_A !== avgY_B) {
            return avgY_A - avgY_B;
          }
          if (a.q !== b.q) {
            return a.q - b.q;
          }
          return a.name.localeCompare(b.name);
        });

        yearCourses.forEach((c, idx) => courseYIndexMap.set(c.id, idx));
      }
    }

    // Create Cytoscape node elements with barycenter-optimized column positions
    sortedYears.forEach((yearVal, colIdx) => {
      const yearCourses = coursesByYearMap.get(yearVal)!;
      yearCourses.forEach((course, rowIdx) => {
        const config = getCourseStatusConfig(course.status);
        const xPos = colIdx * colWidth + 120;
        const yPos = rowIdx * rowHeight + 80;

        elements.push({
          group: 'nodes',
          data: {
            id: course.id.toString(),
            name: course.name,
            year: course.year,
            q: course.q,
            status: course.status,
            statusLabel: config.label,
            bg: config.bg,
            color: config.color,
            borderColor: config.borderColor,
          },
          position: {
            x: xPos,
            y: yPos,
          },
        });
      });
    });

    // 1. Gather all candidate raw edges (source: prerequisite -> target: course)
    const rawEdges: Array<{ source: number; target: number }> = [];
    filteredCourses.forEach((course) => {
      const reqSet = new Set([...course.cursarReqId, ...course.aprobarReqId]);
      reqSet.forEach((reqId) => {
        if (courseIdSet.has(reqId)) {
          rawEdges.push({ source: reqId, target: course.id });
        }
      });
    });

    // 2. Build adjacency list map
    const adj = new Map<number, Set<number>>();
    rawEdges.forEach(({ source, target }) => {
      if (!adj.has(source)) {
        adj.set(source, new Set());
      }
      adj.get(source)!.add(target);
    });

    // Helper to check if target is reachable from source via an alternate path (length >= 2)
    const isReachableIndirectly = (source: number, target: number): boolean => {
      const neighbors = adj.get(source);
      if (!neighbors) return false;

      const queue: number[] = [];
      const visited = new Set<number>();

      neighbors.forEach((next) => {
        if (next !== target) {
          queue.push(next);
          visited.add(next);
        }
      });

      while (queue.length > 0) {
        const current = queue.shift()!;
        if (current === target) return true;

        const currentNeighbors = adj.get(current);
        if (currentNeighbors) {
          currentNeighbors.forEach((next) => {
            if (!visited.has(next)) {
              visited.add(next);
              queue.push(next);
            }
          });
        }
      }

      return false;
    };

    // 3. Filter out transitive redundant edges (e.g. A -> C when A -> B -> C exists)
    const essentialEdges = rawEdges.filter(
      ({ source, target }) => !isReachableIndirectly(source, target),
    );

    // 4. Add essential minimal edges to Cytoscape elements
    essentialEdges.forEach(({ source, target }) => {
      elements.push({
        group: 'edges',
        data: {
          id: `edge-${source}-${target}`,
          source: source.toString(),
          target: target.toString(),
        },
      });
    });

    return elements;
  }

  private getLayoutOptions(): cytoscape.LayoutOptions {
    const hasCanvas = this.isCanvasSupported();
    return {
      name: 'preset',
      fit: true,
      padding: 40,
      animate: hasCanvas,
      animationDuration: hasCanvas ? 350 : 0,
    } as cytoscape.LayoutOptions;
  }

  private getCytoscapeStyles(): cytoscape.StylesheetStyle[] {
    return [
      {
        selector: 'node',
        style: {
          label: (node: cytoscape.NodeSingular) => {
            const name = node.data('name');
            const statusLabel = node.data('statusLabel');
            return `${name}\n[${statusLabel}]`;
          },
          'background-color': 'data(bg)',
          color: 'data(color)',
          'border-color': 'data(borderColor)',
          'border-width': 2,
          'border-style': 'solid',
          shape: 'round-rectangle',
          width: 170,
          height: 54,
          padding: '8px',
          'text-valign': 'center',
          'text-halign': 'center',
          'font-size': '11px',
          'font-weight': 'bold',
          'font-family': 'Inter, system-ui, sans-serif',
          'text-wrap': 'wrap',
          'text-max-width': '150px',
          'transition-property': 'background-color, border-color, opacity, border-width',
          'transition-duration': 0.2,
        },
      },
      {
        selector: 'node:selected',
        style: {
          'border-width': 4,
        },
      },
      {
        selector: 'edge',
        style: {
          width: 2,
          'line-color': '#718096',
          'target-arrow-color': '#718096',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          opacity: 0.75,
        },
      },
      {
        selector: '.highlighted',
        style: {
          'z-index': 999,
          opacity: 1,
          'border-width': 3.5,
        },
      },
      {
        selector: 'edge.highlighted',
        style: {
          width: 4,
          opacity: 1,
          'z-index': 999,
        },
      },
      {
        selector: '.dimmed',
        style: {
          opacity: 0.18,
        },
      },
      {
        selector: '.status-dimmed',
        style: {
          opacity: 0.18,
        },
      },
    ];
  }

  private setupEvents(): void {
    if (!this.cy) return;

    this.cy.on('mouseover', 'node', (evt) => {
      const node = evt.target as cytoscape.NodeSingular;
      // Highlight only direct dependencies (direct incoming and direct outgoing neighbors)
      const highlighted = node.closedNeighborhood();

      this.cy?.elements().difference(highlighted).addClass('dimmed');
      highlighted.addClass('highlighted');
    });

    this.cy.on('mouseout', 'node', () => {
      this.cy?.elements().removeClass('highlighted').removeClass('dimmed');
      this.applyStatusFilterDimming();
    });

    this.cy.on('tap', 'node', (evt) => {
      const node = evt.target as cytoscape.NodeSingular;
      const courseId = parseInt(node.id(), 10);
      const course = this.courseService.getCourseById(courseId) ?? null;
      this.statusErrorMessage.set(null);
      this.selectedCourse.set(course);
    });

    this.cy.on('tap', (evt) => {
      if (evt.target === this.cy) {
        this.selectedCourse.set(null);
        this.statusErrorMessage.set(null);
      }
    });
  }

  zoomIn(): void {
    if (!this.cy) return;
    this.cy.zoom({
      level: this.cy.zoom() * 1.25,
      renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 },
    });
  }

  zoomOut(): void {
    if (!this.cy) return;
    this.cy.zoom({
      level: this.cy.zoom() / 1.25,
      renderedPosition: { x: this.cy.width() / 2, y: this.cy.height() / 2 },
    });
  }

  fitDiagram(): void {
    if (!this.cy) return;
    this.cy.fit(undefined, 35);
  }

  resetLayout(): void {
    if (!this.cy) return;

    const initialElements = this.buildElements(this.courseService.courses());

    this.cy.batch(() => {
      initialElements.forEach((ele) => {
        if (ele.group === 'nodes' && ele.position && ele.data?.id) {
          const node = this.cy?.getElementById(ele.data.id as string);
          if (node) {
            node.position(ele.position);
          }
        }
      });
    });

    if (this.isCanvasSupported()) {
      const layout = this.cy.layout(this.getLayoutOptions());
      layout.run();
    }

    this.applyStatusFilterDimming();
    this.cy.fit(undefined, 35);
  }

  onStatusFilterChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedStatus.set(val);
    this.applyStatusFilterDimming();
  }

  changeStatus(courseId: number, targetStatus: CourseStatus): void {
    this.statusErrorMessage.set(null);
    const success = this.courseService.setCourseStatus(courseId, targetStatus);
    if (!success) {
      this.statusErrorMessage.set(
        'No es posible cambiar a este estado. Verifica las correlatividades previas requeridas o materias posteriores que dependen de esta.',
      );
    } else {
      const updated = this.courseService.getCourseById(courseId);
      this.selectedCourse.set(updated ?? null);
    }
  }

  @HostListener('window:keydown.escape')
  closeDetail(): void {
    this.selectedCourse.set(null);
    this.statusErrorMessage.set(null);
  }

  getCourseNameById(id: number): string {
    return this.courseService.getCourseById(id)?.name ?? `Materia #${id}`;
  }

  getStatusConfig(status: CourseStatus) {
    return getCourseStatusConfig(status);
  }
}
