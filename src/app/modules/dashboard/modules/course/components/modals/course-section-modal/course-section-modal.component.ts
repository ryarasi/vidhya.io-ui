import { Component, Inject, Input, OnDestroy } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormGroupDirective,
  Validators,
} from '@angular/forms';
import {
  MatDialog,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { Select, Store } from '@ngxs/store';
import { Observable, Subject } from 'rxjs';
import { AuthorizationService } from 'src/app/shared/api/authorization/authorization.service';
import {
  Course,
  CourseSection,
  resources,
  RESOURCE_ACTIONS,
} from 'src/app/shared/common/models';
import {
  MasterConfirmationDialog,
  MasterConfirmationDialogObject,
} from 'src/app/shared/components/confirmation-dialog/confirmation-dialog.component';
import {
  CreateUpdateCourseSectionAction,
  DeleteCourseSectionAction,
} from '../../../state/courseSections/courseSection.actions';
import { emptyCourseSectionFormRecord } from '../../../state/courseSections/courseSection.model';
import { CourseSectionState } from '../../../state/courseSections/courseSection.state';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'course-section-modal',
  templateUrl: './course-section-modal.component.html',
  styleUrls: [
    './course-section-modal.component.scss',
    './../../../../../../../shared/common/shared-styles.css',
  ],
})
export class CourseSectionModalComponent implements OnDestroy {
  resource = resources.COURSE;
  resourceActions = RESOURCE_ACTIONS;
  @Input()
  course: Course;
  @Input()
  courseSection: CourseSection = emptyCourseSectionFormRecord;
  @Select(CourseSectionState.formSubmitting)
  formSubmitting$: Observable<boolean>;
  sectionForm: FormGroup;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    public dialog: MatDialog,
    public dialogRef: MatDialogRef<CourseSectionModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private route: ActivatedRoute,
    private router: Router,
    private store: Store,
    private auth: AuthorizationService,
    private fb: FormBuilder
  ) {
    this.course = this.data.course;
    this.courseSection = this.data.courseSection;
    this.sectionForm = this.setupCourseSectionForm(this.courseSection);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  setupCourseSectionForm = (
    courseSectionForm: CourseSection = emptyCourseSectionFormRecord
  ): FormGroup => {
    return this.fb.group({
      id: [courseSectionForm?.id],
      title: [courseSectionForm?.title, Validators.required],
      index: [courseSectionForm?.index],
      course: [this.course.id],
    });
  };

  authorizeResourceMethod(action) {
    return this.auth.authorizeResource(this.resource, action, {
      adminIds: [this.course?.instructor?.id],
    });
  }

  // editMember() {
  //   this.closeDialog();
  //   const id = this.profileData.id;
  //   this.router.navigate([uiroutes.MEMBER_FORM_ROUTE.route], {
  //     relativeTo: this.route,
  //     queryParams: { id },
  //     queryParamsHandling: 'merge',
  //     skipLocationChange: false,
  //   });
  // }

  submitForm(form: FormGroup, formDirective: FormGroupDirective) {
    this.sectionForm.get('course').setValue(this.course.id);
    this.store.dispatch(
      new CreateUpdateCourseSectionAction({
        form,
        formDirective,
      })
    );
  }

  deleteConfirmation() {
    const masterDialogConfirmationObject: MasterConfirmationDialogObject = {
      title: 'Confirm delete?',
      message: `Are you sure you want to delete the course titled "${this.course.title}"`,
      confirmButtonText: 'Delete',
      denyButtonText: 'Cancel',
    };
    const dialogRef = this.dialog.open(MasterConfirmationDialog, {
      data: masterDialogConfirmationObject,
    });

    dialogRef.afterClosed()   .pipe(takeUntil(this.destroy$)).subscribe((result) => {
      if (result == true) {
        this.deleteCourseSection();
      }
    });
  }
  deleteCourseSection() {
    this.store.dispatch(
      new DeleteCourseSectionAction({ id: this.courseSection.id })
    );
    this.closeDialog();
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
