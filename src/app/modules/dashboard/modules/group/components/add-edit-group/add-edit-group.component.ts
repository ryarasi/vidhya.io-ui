import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import { Select, Store } from '@ngxs/store';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject } from 'rxjs';
import { InstitutionState } from 'src/app/modules/dashboard/modules/admin/modules/institution/state/institutions/institution.state';
import {
  CurrentMember,
  Group,
  groupTypeOptions,
  MatSelectOption,
} from 'src/app/shared/common/models';
import { FetchInstitutionsAction } from 'src/app/modules/dashboard/modules/admin/modules/institution/state/institutions/institution.actions';
import { OptionsState } from 'src/app/shared/state/options/options.state';
import {
  defaultSearchParams,
  USER_ROLES_NAMES,
} from 'src/app/shared/common/constants';
import { ShowNotificationAction } from 'src/app/shared/state/notifications/notification.actions';
import { ToggleLoadingScreen } from 'src/app/shared/state/loading/loading.actions';
import { UploadService } from 'src/app/shared/api/upload.service';
import { FetchMemberOptionsByInstitution } from 'src/app/shared/state/options/options.actions';
import { AuthState } from 'src/app/modules/auth/state/auth.state';
import { GroupState } from '../../state/group.state';
import { emptyGroupFormRecord } from '../../state/group.model';
import {
  CreateUpdateGroupAction,
  GetGroupAction,
} from '../../state/group.actions';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-edit-group',
  templateUrl: './add-edit-group.component.html',
  styleUrls: [
    './add-edit-group.component.scss',
    './../../../../../../shared/common/shared-styles.css',
  ],
})
export class AddEditGroupComponent implements OnInit, OnDestroy {
  selectedMemberColumns = [
    { field: 'label', headerName: 'Group Members' },
    { field: 'role', headerName: 'Role' },
  ];
  memberRows: any[] = [];
  formSubmitting: boolean = false;
  params: object = {};
  @Select(GroupState.getGroupFormRecord)
  groupFormRecord$: Observable<Group>;
  @Select(GroupState.formSubmitting)
  formSubmitting$: Observable<boolean>;
  @Select(AuthState.getCurrentMember)
  currentMember$: Observable<CurrentMember>;
  currentMember: CurrentMember;
  groupFormRecord: Group = emptyGroupFormRecord;
  groupForm: FormGroup;
  logoFile = null;
  previewPath = null;

  @Select(InstitutionState.listInstitutionOptions)
  institutionOptions$: Observable<MatSelectOption[]>;
  @Select(OptionsState.listMembersByInstitution)
  memberOptions$: Observable<MatSelectOption[]>;
  memberOptions: MatSelectOption[];
  @Select(OptionsState.getIsFetchingMembersByInstitution)
  isFetchingMembers$: Observable<boolean>;
  isFetchingMembers: boolean;
  groupTypeOptions: MatSelectOption[] = groupTypeOptions;
  institutionOptions;
  @Select(AuthState.getCurrentMemberInstitutionId)
  memberInstitutionId$: Observable<number>;
  memberInstitutionId: number;
  showInstitutionField: boolean = false;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private location: Location,
    private store: Store,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private uploadService: UploadService
  ) {
    this.currentMember$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.currentMember = val;
    });
    this.memberInstitutionId$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.memberInstitutionId = val;
    });
    this.institutionOptions$
    .pipe(takeUntil(this.destroy$))
    .subscribe((options) => {
      this.institutionOptions = options;
    });
    this.memberOptions$
    .pipe(takeUntil(this.destroy$))
    .subscribe((options) => {
      this.memberOptions = options;
    });

    this.isFetchingMembers$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.isFetchingMembers = val;
    });
    this.fetchMemberOptions();
    this.setupInstitution();
    this.groupForm = this.setupGroupFormGroup();
    this.groupFormRecord$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.groupFormRecord = val;
      this.groupForm = this.setupGroupFormGroup(this.groupFormRecord);
    });
  }

  setupInstitution() {
    this.showInstitutionField =
      this.currentMember.role.name == USER_ROLES_NAMES.SUPER_ADMIN;
    if (this.showInstitutionField) {
      this.store.dispatch(
        new FetchInstitutionsAction({ searchParams: defaultSearchParams })
      );
    }
  }

  fetchMemberOptions() {
    this.store.dispatch(
      new FetchMemberOptionsByInstitution({
        memberInstitutionId: this.memberInstitutionId,
      })
    );
  }

  institutionChanged = (event$) => {
    this.memberInstitutionId = event$.value;
    this.fetchMemberOptions();
  };

  setupGroupFormGroup = (
    groupFormRecord: Group = emptyGroupFormRecord
  ): FormGroup => {
    this.logoFile = null;
    this.previewPath = null;
    const memberIds = groupFormRecord?.members.map((m) => m.id);
    const adminIds = groupFormRecord?.admins.map((m) => m.id);
    const formGroup = this.fb.group({
      id: [groupFormRecord?.id],
      avatar: [groupFormRecord?.avatar],
      name: [groupFormRecord?.name, Validators.required],
      institution: [
        groupFormRecord?.institution?.id
          ? groupFormRecord?.institution?.id
          : this.currentMember.institution.id,
        Validators.required,
      ],
      admins: [adminIds.length ? adminIds : [this.currentMember.id]],
      members: [memberIds],
      groupType: [groupFormRecord?.groupType, Validators.required],
      description: [groupFormRecord?.description, Validators.required],
    });
    this.memberRows = this.memberOptions.filter((o) =>
      memberIds.includes(o.value)
    );
    this.previewPath = formGroup.get('avatar').value;
    return formGroup;
  };

  onLogoChange(event) {
    if (event.target.files.length > 0) {
      this.logoFile = event.target.files[0];
      const fileValid = this.logoFile.type.startsWith('image/');

      if (fileValid) {
        const reader = new FileReader();
        reader.onload = () => {
          this.previewPath = reader.result as string;
        };
        reader.readAsDataURL(this.logoFile);
      } else {
        event.target.value = null;
        this.store.dispatch(
          new ShowNotificationAction({
            message: 'Please upload only images',
            action: 'error',
          })
        );
      }
    } else {
      this.logoFile = null;
      this.previewPath = this.groupForm.get('avatar').value;
    }
  }

  imagePreview(e) {
    const file = (e.target as HTMLInputElement).files[0];
  }

  ngOnInit(): void {
    this.route.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((params) => {
      this.params = params;
      const id = params['id'];
      if (id) {
        this.store.dispatch(new GetGroupAction({ id }));
      }
    });
  }

  goBack() {
    this.location.back();
  }

  updateMemberRows($event) {
    const memberIds = this.groupForm.get('members').value.map((id) => id);
    const adminIds = this.groupForm.get('admins').value.map((id) => id);
    this.memberRows = this.memberOptions.filter((o) => {
      return memberIds.includes(o.value) || adminIds.includes(o.value);
    });
    this.memberRows = this.memberRows.map((row) => {
      if (memberIds.includes(row.value)) {
        row.role = 'Member';
      }
      if (adminIds.includes(row.value)) {
        row.role = 'Admin';
      }
      return row;
    });
  }

  submitForm(form: FormGroup, formDirective: FormGroupDirective) {
    if (this.logoFile) {
      this.store.dispatch(
        new ToggleLoadingScreen({
          showLoadingScreen: true,
          message: 'Uploading file',
        })
      );
      const formData = new FormData();
      formData.append('file', this.logoFile);
      this.uploadService.upload(formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (res) => {
          const url = res.secure_url;
          form.get('avatar').setValue(url);
          this.store.dispatch(
            new CreateUpdateGroupAction({ form, formDirective })
          );
          this.store.dispatch(
            new ToggleLoadingScreen({ showLoadingScreen: false, message: '' })
          );
        },
        (err) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: 'Unable to upload file. Reset and try again',
              action: 'error',
            })
          );
          return;
        }
      );
    } else {
      this.store.dispatch(
        new CreateUpdateGroupAction({
          form,
          formDirective,
        })
      );
    }
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
