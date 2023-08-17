import { Component, OnDestroy } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ICellRendererParams } from 'ag-grid-community';
import { RoleProfileComponent } from 'src/app/modules/dashboard/modules/admin/modules/user-role/components/profiles/role-profile/role-profile.component';
import { AuthorizationService } from '../../../../../../../../../shared/api/authorization/authorization.service';
import {
  resources,
  RESOURCE_ACTIONS,
} from '../../../../../../../../../shared/common/models';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-role-profile',
  templateUrl: './role-profile-renderer.component.html',
  styleUrls: ['./role-profile-renderer.component.scss'],
})
export class RoleProfileRendererComponent implements OnDestroy{
  resource = resources.USER_ROLE;
  resourceActions = RESOURCE_ACTIONS;
  cellValue: string;
  rowData: any;
  params: any;
  destroy$: Subject<boolean> = new Subject<boolean>();

  // gets called once before the renderer is used
  agInit(params: ICellRendererParams): void {
    this.params = params;
    this.rowData = params.data;
    this.cellValue = this.getValueToDisplay(params);
  }

  showProfile() {}

  getValueToDisplay(params: ICellRendererParams) {
    return params.valueFormatted ? params.valueFormatted : params.value;
  }

  constructor(public dialog: MatDialog, private auth: AuthorizationService) {}

  public invokeParentMethod() {
    if (this.authorizeResourceMethod(this.resourceActions.GET)) {
      this.params.context.componentParent.openRoleProfile(this.rowData);
    }
  }

  authorizeResourceMethod(action) {
    return this.auth.authorizeResource(this.resource, action, {});
  }

  openDialog() {
    const dialogRef = this.dialog.open(RoleProfileComponent, {
      data: this.rowData,
    });

    dialogRef.afterClosed()   
    .pipe(takeUntil(this.destroy$)).subscribe((result) => {});
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
