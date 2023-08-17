import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { AuthorizationService } from 'src/app/shared/api/authorization/authorization.service';
import {
  defaultSearchParams,
  SORT_BY_OPTIONS,
} from 'src/app/shared/common/constants';
import { clipLongText, parseDateTime } from 'src/app/shared/common/functions';
import {
  Project,
  resources,
  RESOURCE_ACTIONS,
  User,
} from 'src/app/shared/common/models';
import { uiroutes } from 'src/app/shared/common/ui-routes';
import {
  FetchProjectsAction,
  FetchNextProjectsAction,
  ResetProjectFormAction,
} from '../../state/project.actions';
import { ProjectState } from '../../state/project.state';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-project-feed',
  templateUrl: './project-feed.component.html',
  styleUrls: [
    './project-feed.component.scss',
    './../../../../../../shared/common/shared-styles.css',
  ],
})
export class ProjectFeedComponent implements OnInit, OnDestroy {
  @Input() author: User = null;
  @Input() ownProfile: boolean = false;
  resource: string = resources.PROJECT;
  resourceActions = RESOURCE_ACTIONS;
  @Select(ProjectState.listProjects)
  projects$: Observable<Project[]>;

  @Select(ProjectState.isFetching)
  isFetching$: Observable<boolean>;
  isFetching: boolean;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private store: Store,
    private router: Router,
    private auth: AuthorizationService
  ) {
    this.isFetching$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.isFetching = val;
    });
  }
  
  ngOnChanges(changes) {
    if (changes.author) {
      this.author = changes.author.currentValue;
      this.fetchProjects();
    }
  }
  
  fetchProjects() {
    const columnFilters = {
      authorId: this.author?.id,
      sortBy: SORT_BY_OPTIONS.NEW,
    };
    this.store.dispatch(
      new FetchProjectsAction({
        searchParams: { ...defaultSearchParams, columnFilters },
      })
    );
  }
  authorizeResourceMethod(action) {
    return this.auth.authorizeResource(this.resource, action);
  }

  renderProjectSubtitle(project: Project) {
    return `Published here on ${this.parseDate(project.createdAt)}`;
  }

  clip(string) {
    return clipLongText(string, 200);
  }

  ngOnInit(): void {}
  onScroll() {
    if (!this.isFetching) {
      this.store.dispatch(new FetchNextProjectsAction());
    }
  }

  parseDate(date) {
    return parseDateTime(date);
  }

  createProject() {
    this.store.dispatch(new ResetProjectFormAction());
    this.router.navigateByUrl(uiroutes.PROJECT_FORM_ROUTE.route);
  }

  openProject(project) {
    this.router.navigate([uiroutes.PROJECT_PROFILE_ROUTE.route], {
      queryParams: { id: project.id },
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
