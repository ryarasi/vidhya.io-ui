import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Select } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AuthState } from 'src/app/modules/auth/state/auth.state';
import { CurrentMember } from 'src/app/shared/common/models';
import { uiroutes } from 'src/app/shared/common/ui-routes';

@Component({
  selector: 'app-own-issues',
  templateUrl: './own-issues.component.html',
  styleUrls: [
    './own-issues.component.scss',
    './../../../../../../../../shared/common/shared-styles.css',
  ],
})
export class OwnIssuesComponent implements OnInit {
  @Select(AuthState.getCurrentMember)
  currentMember$: Observable<CurrentMember>;
  currentMember: CurrentMember;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(private router: Router) {
    this.currentMember$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.currentMember = val;
    });
  }

  ngOnInit(): void {}

  openIssue(issue) {
    this.router.navigate([uiroutes.ISSUE_PROFILE_ROUTE.route], {
      queryParams: { id: issue.id },
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
