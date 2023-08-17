import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Select } from '@ngxs/store';
import { ICellRendererParams } from 'ag-grid-community';
import { Observable, Subject } from 'rxjs';
import { AuthState } from 'src/app/modules/auth/state/auth.state';
import { InstitutionModalComponent } from 'src/app/modules/dashboard/modules/admin/modules/institution/components/institution-modal/institution-modal.component';
import { AuthorizationService } from '../../../../../../../../shared/api/authorization/authorization.service';
import {
  CurrentMember,
  resources,
  RESOURCE_ACTIONS,
} from '../../../../../../../../shared/common/models';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-institution-profile-renderer',
  templateUrl: './institution-profile-renderer.component.html',
  styleUrls: ['./institution-profile-renderer.component.scss'],
})
export class InstitutionProfileRendererComponent implements OnDestroy {
  cellValue: string;
  rowData: any;
  params: any;
  resource = resources.INSTITUTION;
  resourceActions = RESOURCE_ACTIONS;
  @Select(AuthState.getCurrentMember)
  currentMember$: Observable<CurrentMember>;
  currentMember: CurrentMember;
  destroy$: Subject<boolean> = new Subject<boolean>();

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.rowData = params.data;
    this.cellValue = this.getValueToDisplay(params);
    this.currentMember$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.currentMember = val;
    });
  }

  showProfile() {}

  getValueToDisplay(params: ICellRendererParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  constructor(public dialog: MatDialog, private auth: AuthorizationService) {}

  authorizeResourceMethod(action) {
    return this.auth.authorizeResource(this.resource, action, {
      institutionId: this.rowData.id,
    });
  }

  public invokeParentMethod() {
    if (this.authorizeResourceMethod(this.resourceActions.GET)) {
      this.params.context.componentParent.openInstitutionProfile(this.rowData);
    }
  }
  openDialog() {
    const dialogRef = this.dialog.open(InstitutionModalComponent, {
      data: this.rowData,
    });

    dialogRef.afterClosed()   .pipe(takeUntil(this.destroy$)).subscribe((result) => {});
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
