import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { AuthorizationService } from 'src/app/shared/api/authorization/authorization.service';
import { defaultSearchParams } from 'src/app/shared/common/constants';
import { autoGenOptions, parseDateTime } from 'src/app/shared/common/functions';
import {
  ExerciseSubmissionStatusOptions,
  MatSelectOption,
  resources,
  RESOURCE_ACTIONS,
} from 'src/app/shared/common/models';
import { uiroutes } from 'src/app/shared/common/ui-routes';
import {
  FetchAssignmentsAction,
  FetchNextAssignmentsAction,
} from '../../state/assignment.actions';
import { Assignment } from '../../state/assignment.model';
import { AssignmentState } from '../../state/assignment.state';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-assignment-dashboard',
  templateUrl: './assignment-dashboard.component.html',
  styleUrls: [
    './assignment-dashboard.component.scss',
    './../../../../../../shared/common/shared-styles.css',
  ],
})
export class AssignmentDashboardComponent implements OnInit, OnDestroy {
  resource: string = resources.ANNOUNCEMENT;
  resourceActions = RESOURCE_ACTIONS;
  exerciseSubmissionColumnFilters = {};
  submissionStatusFilter: string = null;
  groupByFilter: string = resources.CHAPTER;
  params: object = {};
  assignmentColumnFilters: any = {
    groupBy: this.groupByFilter,
    status: this.submissionStatusFilter,
  };
  exerciseSubmissionStatusTypes = ExerciseSubmissionStatusOptions;
  exerciseSubmissionStatusOptions: MatSelectOption[] = autoGenOptions({
    all: null,
    ...ExerciseSubmissionStatusOptions,
  });
  @Select(AssignmentState.listAssignments)
  assignments$: Observable<Assignment[]>;
  assignments: Assignment[] = [];

  @Select(AssignmentState.isFetching)
  isFetching$: Observable<boolean>;
  isFetching: boolean;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private store: Store,
    private router: Router,
    private auth: AuthorizationService,
    private route: ActivatedRoute
  ) {
    this.fetchAssignments();
    this.isFetching$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.isFetching = val;
    });
    this.assignments$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.assignments = val ? val : [];
    });
  }

  parseDate(date) {
    return parseDateTime(date);
  }
  authorizeResourceMethod(action) {
    return this.auth.authorizeResource(this.resource, action);
  }

  ngOnInit(): void {
    this.route.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((params) => {
      this.params = params;
      const statusOptions = Object.values(ExerciseSubmissionStatusOptions);
      const status = params['status'];
      this.submissionStatusFilter = statusOptions.includes(status)
        ? status
        : null;
      if (this.submissionStatusFilter) {
        this.fetchAssignments();
      }
    });
  }
  onScroll() {
    if (!this.isFetching) {
      this.fetchNextAssignments();
    }
  }

  statusIcon(card): { icon: string; iconColor: string; tooltip: string } {
    let icon = null;
    let iconColor = null;
    let tooltip = '';
    switch (card?.status) {
      case ExerciseSubmissionStatusOptions.pending:
        icon = 'new_releases';
        iconColor = 'var(--orange)';
        tooltip = 'This chapter contains new exercises!';
        break;
      case ExerciseSubmissionStatusOptions.submitted:
        icon = 'done';
        iconColor = 'var(--green)';
        tooltip =
          'You have submitted this chapter. Some exercises in this chapter may be awaiting grading.';
        break;
      case ExerciseSubmissionStatusOptions.graded:
        icon = 'done_all';
        iconColor = 'var(--green)';
        tooltip = 'This chapter is fully graded!';
        break;
      case ExerciseSubmissionStatusOptions.returned:
        icon = 'cancel';
        iconColor = 'var(--red)';
        tooltip =
          'Some exercises in this chapter have been returned. Please follow the remarks and resubmit this chapter.';
        break;
      default:
        break;
    }
    return { icon, iconColor, tooltip };
  }

  updateAssignmentFilter() {
    const status = this.submissionStatusFilter;
    this.assignmentColumnFilters = {
      status,
    };
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status },
      queryParamsHandling: 'merge',
      skipLocationChange: false,
    });
  }

  fetchAssignments() {
    this.updateAssignmentFilter();
    this.store.dispatch(
      new FetchAssignmentsAction({
        searchParams: {
          ...defaultSearchParams,
          columnFilters: this.assignmentColumnFilters,
        },
      })
    );
  }

  fetchNextAssignments() {
    if (!this.isFetching) {
      this.store.dispatch(new FetchNextAssignmentsAction());
    }
  }

  openChapter(chapter) {
    this.router.navigate([uiroutes.CHAPTER_PROFILE_ROUTE.route], {
      queryParams: { id: chapter.id },
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
