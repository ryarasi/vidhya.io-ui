import { Component, OnDestroy, OnInit } from '@angular/core';
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
import {
  Course,
  CurrentMember,
  MatSelectOption,
  Project,
  ProjectContributor,
} from 'src/app/shared/common/models';
import { AuthState } from 'src/app/modules/auth/state/auth.state';
import { ProjectState } from '../../state/project.state';
import { emptyProjectFormRecord } from '../../state/project.model';
import {
  CreateUpdateProjectAction,
  GetProjectAction,
} from '../../state/project.actions';
import { ShowNotificationAction } from 'src/app/shared/state/notifications/notification.actions';
import { CourseState } from '../../../course/state/courses/course.state';
import { FetchCoursesAction } from '../../../course/state/courses/course.actions';
import { defaultSearchParams } from 'src/app/shared/common/constants';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-edit-project',
  templateUrl: './add-edit-project.component.html',
  styleUrls: [
    './add-edit-project.component.scss',
    './../../../../../../shared/common/shared-styles.css',
  ],
})
export class AddEditProjectComponent implements OnInit, OnDestroy {
  formSubmitting: boolean = false;
  params: object = {};
  @Select(ProjectState.getProjectFormRecord)
  projectFormRecord$: Observable<Project>;
  @Select(ProjectState.formSubmitting)
  formSubmitting$: Observable<boolean>;
  @Select(AuthState.getCurrentUserId)
  currentUserId$: Observable<number>;
  currentUserId: number;
  @Select(AuthState.getCurrentMember)
  currentMember$: Observable<CurrentMember>;
  currentMember: CurrentMember;
  projectFormRecord: Project = emptyProjectFormRecord;
  projectForm: FormGroup;
  description: string;
  contributors: ProjectContributor[];
  @Select(CourseState.listCourseOptions)
  courseOptions$: Observable<MatSelectOption[]>;
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private location: Location,
    private store: Store,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.fetchCourses();
    this.currentUserId$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.currentUserId = val;
    });
    this.currentMember$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.currentMember = val;
    });

    this.projectForm = this.setupProjectFormProject();
    this.projectFormRecord$
    .pipe(takeUntil(this.destroy$))
    .subscribe((val) => {
      this.projectFormRecord = val;
      this.projectForm = this.setupProjectFormProject(this.projectFormRecord);
    });
  }

  fetchCourses() {
    this.store.dispatch(
      new FetchCoursesAction({ searchParams: defaultSearchParams })
    );
  }

  setupProjectFormProject = (
    projectFormRecord: Project = emptyProjectFormRecord
  ): FormGroup => {
    const formProject = this.fb.group({
      id: [projectFormRecord?.id],
      title: [projectFormRecord?.title, Validators.required],
      author: [
        projectFormRecord?.author?.id
          ? projectFormRecord?.author?.id
          : this.currentUserId,
        Validators.required,
      ],
      link: [projectFormRecord?.link],
      course: [
        projectFormRecord.course?.id ? projectFormRecord.course?.id : null,
      ],
      description: [projectFormRecord?.description, Validators.required],
      public: [
        projectFormRecord.public != null &&
        projectFormRecord.public != undefined
          ? projectFormRecord.public
          : true,
      ],
    });
    this.description = formProject.get('description').value;
    return formProject;
  };

  ngOnInit(): void {
    this.route.queryParams
    .pipe(takeUntil(this.destroy$))
    .subscribe((params) => {
      this.params = params;
      const id = params['id'];
      if (id) {
        this.store.dispatch(
          new GetProjectAction({ id, fetchFormDetails: true })
        );
      }
    });
  }

  goBack() {
    this.location.back();
  }

  submitForm(form: FormGroup, formDirective: FormGroupDirective) {
    form.get('description').setValue(this.description);
    this.store.dispatch(new CreateUpdateProjectAction({ form, formDirective }));
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
