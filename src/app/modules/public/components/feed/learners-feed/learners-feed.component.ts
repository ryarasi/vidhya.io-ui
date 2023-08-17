import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { LearnerColumnFilters } from 'src/app/modules/dashboard/modules/admin/modules/member/state/member.model';
import { defaultSearchParams } from 'src/app/shared/common/constants';
import { generateMemberSubtitle } from 'src/app/shared/common/functions';
import { User } from 'src/app/shared/common/models';
import { uiroutes } from 'src/app/shared/common/ui-routes';
import {
  FetchNextPublicMembersAction,
  FetchPublicMembersAction,
  ResetPublicHomePageListsAction,
} from '../../../state/public/public.actions';
import { PublicState } from '../../../state/public/public.state';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-learners-feed',
  templateUrl: './learners-feed.component.html',
  styleUrls: ['./learners-feed.component.scss'],
})
export class PublicLearnersFeedComponent implements OnInit, OnDestroy {
  @Input() currentQuery: string = null;
  @Select(PublicState.listMembers)
  learners$: Observable<User[]>;
  @Select(PublicState.isFetchingMembers)
  isFetchingMembers$: Observable<boolean>;
  isFetchingMembers: boolean = false;
  learners: any[] = [];
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private store: Store,
    private router: Router,
    public dialog: MatDialog
  ) {
    this.learners$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.learners = val;
      // this.learners = tempUsers;
    });
  }

  ngOnInit() {
    this.fetchMembers();
  }

  generateLearnerSubtitle(user) {
    return generateMemberSubtitle(user);
  }

  fetchMembers() {
    this.store.dispatch(
      new FetchPublicMembersAction({
        searchParams: {
          ...defaultSearchParams,
          pageSize: 36,
          columnFilters: LearnerColumnFilters,
        },
      })
    );
  }

  onLearnerScroll() {
    this.store.dispatch(new FetchNextPublicMembersAction());
  }

  onClickLearnerCard(learner) {
    this.router.navigateByUrl(
      `${uiroutes.MEMBER_PROFILE_ROUTE.route}/${learner.username}`
    );
  }

  ngOnDestroy(): void {
    this.store.dispatch(new ResetPublicHomePageListsAction());
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
