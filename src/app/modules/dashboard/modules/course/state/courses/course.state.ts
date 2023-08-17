import { Action, Selector, State, StateContext, Store } from '@ngxs/store';
import {
  defaultCourseState,
  emptyCourseFormRecord,
  CourseStateModel,
} from './course.model';

import { Injectable, OnDestroy } from '@angular/core';
import {
  CourseSubscriptionAction,
  CreateUpdateCourseAction,
  DeleteCourseAction,
  FetchCoursesAction,
  FetchNextCoursesAction,
  ForceRefetchCoursesAction,
  GetCourseAction,
  PublishCourseAction,
  ResetCourseFormAction,
} from './course.actions';
import { Apollo } from 'apollo-angular';
import { Router } from '@angular/router';
import {
  Course,
  FetchParams,
  MatSelectOption,
  startingFetchParams,
  SUBSCRIPTION_METHODS,
} from 'src/app/shared/common/models';
import { SearchParams } from 'src/app/shared/modules/master-grid/table.model';
import {
  convertPaginatedListToNormalList,
  getErrorMessageFromGraphQLResponse,
  paginatedSubscriptionUpdater,
  updateFetchParams,
} from 'src/app/shared/common/functions';
import { ToggleLoadingScreen } from 'src/app/shared/state/loading/loading.actions';
import { COURSE_QUERIES } from 'src/app/shared/api/graphql/queries.graphql';
import { ShowNotificationAction } from 'src/app/shared/state/notifications/notification.actions';
import { SUBSCRIPTIONS } from 'src/app/shared/api/graphql/subscriptions.graphql';
import { uiroutes } from 'src/app/shared/common/ui-routes';
import { COURSE_MUTATIONS } from 'src/app/shared/api/graphql/mutations.graphql';
import { COURSES } from 'src/app/modules/dashboard/dashboard.component';
import { takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

@State<CourseStateModel>({
  name: 'courseState',
  defaults: defaultCourseState,
})
@Injectable()
export class CourseState implements OnDestroy{
  destroy$: Subject<boolean> = new Subject<boolean>();

  constructor(
    private apollo: Apollo,
    private store: Store,
    private router: Router
  ) {}

  @Selector()
  static listCourses(state: CourseStateModel): Course[] {
    return state.courses;
  }

  @Selector()
  static isFetching(state: CourseStateModel): boolean {
    return state.isFetching;
  }

  @Selector()
  static fetchParams(state: CourseStateModel): FetchParams {
    return state.fetchParamObjects[state.fetchParamObjects.length - 1];
  }
  @Selector()
  static listCourseOptions(state: CourseStateModel): MatSelectOption[] {
    const options: MatSelectOption[] = state.courses.map((i) => {
      const option: MatSelectOption = {
        value: i.id,
        label: i.title,
      };
      return option;
    });

    return options;
  }

  @Selector()
  static errorFetching(state: CourseStateModel): boolean {
    return state.errorFetching;
  }

  @Selector()
  static formSubmitting(state: CourseStateModel): boolean {
    return state.formSubmitting;
  }

  @Selector()
  static errorSubmitting(state: CourseStateModel): boolean {
    return state.errorSubmitting;
  }

  @Selector()
  static getCourseFormRecord(state: CourseStateModel): Course {
    return state.courseFormRecord;
  }

  @Action(ForceRefetchCoursesAction)
  forceRefetchCourses({
    getState,
    patchState,
  }: StateContext<CourseStateModel>) {
    const state = getState();
    let previousFetchParams =
      state.fetchParamObjects[state.fetchParamObjects.length - 1];
    previousFetchParams = previousFetchParams
      ? previousFetchParams
      : startingFetchParams;
    const pageNumber = previousFetchParams?.currentPage;
    const previousSearchParams: SearchParams = {
      pageNumber,
      pageSize: previousFetchParams?.pageSize,
      searchQuery: previousFetchParams?.searchQuery,
      columnFilters: previousFetchParams?.columnFilters,
    };
    patchState({ fetchPolicy: 'network-only' });
    this.store.dispatch(
      new FetchCoursesAction({ searchParams: previousSearchParams })
    );
  }

  @Action(FetchNextCoursesAction)
  fetchNextCourses({ getState }: StateContext<CourseStateModel>) {
    const state = getState();
    const lastPageNumber = state.lastPage;
    let previousFetchParams =
      state.fetchParamObjects[state.fetchParamObjects.length - 1];
    previousFetchParams = previousFetchParams
      ? previousFetchParams
      : startingFetchParams;
    const pageNumber = previousFetchParams.currentPage + 1;
    const newSearchParams: SearchParams = {
      pageNumber,
      pageSize: previousFetchParams.pageSize,
      searchQuery: previousFetchParams.searchQuery,
      columnFilters: previousFetchParams.columnFilters,
    };
    if (
      !lastPageNumber ||
      (lastPageNumber != null && pageNumber <= lastPageNumber)
    ) {
      this.store.dispatch(
        new FetchCoursesAction({ searchParams: newSearchParams })
      );
    }
  }
  @Action(FetchCoursesAction)
  fetchCourses(
    { getState, patchState }: StateContext<CourseStateModel>,
    { payload }: FetchCoursesAction
  ) {
    let { searchParams } = payload;
    const state = getState();
    const { fetchPolicy, fetchParamObjects } = state;
    const { searchQuery, pageSize, pageNumber, columnFilters } = searchParams;
    let newFetchParams = updateFetchParams({
      fetchParamObjects,
      newPageNumber: pageNumber,
      newPageSize: pageSize,
      newSearchQuery: searchQuery,
      newColumnFilters: columnFilters,
    });
    const variables = {
      searchField: searchQuery,
      limit: newFetchParams.pageSize,
      offset: newFetchParams.offset,
    };
    patchState({ isFetching: true });
    this.store.dispatch(
      new ToggleLoadingScreen({
        message: 'Fetching courses...',
        showLoadingScreen: true,
      })
    );
    this.apollo
      .query({
        query: COURSE_QUERIES.GET_COURSES,
        variables,
        // fetchPolicy,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          this.store.dispatch(
            new ToggleLoadingScreen({
              showLoadingScreen: false,
            })
          );
          const response = data.courses;

          newFetchParams = { ...newFetchParams };
          let paginatedCourses = state.paginatedCourses;
          paginatedCourses = {
            ...paginatedCourses,
            [pageNumber]: response,
          };
          let courses = convertPaginatedListToNormalList(paginatedCourses);
          let lastPage = null;
          if (response.length < newFetchParams.pageSize) {
            lastPage = newFetchParams.currentPage;
          }
          patchState({
            courses,
            paginatedCourses,
            lastPage,
            fetchParamObjects: state.fetchParamObjects.concat([newFetchParams]),
            isFetching: false,
          });
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
          patchState({ isFetching: false });
        }
      );
  }

  @Action(CourseSubscriptionAction)
  subscribeToCourses({ getState, patchState }: StateContext<CourseStateModel>) {
    const state = getState();
    if (!state.coursesSubscribed) {
      this.apollo
        .subscribe({
          query: SUBSCRIPTIONS.course,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe((result: any) => {
          const state = getState();
          const method = result?.data?.notifyCourse?.method;
          const course = result?.data?.notifyCourse?.course;
          const { newPaginatedItems, newItemsList } =
            paginatedSubscriptionUpdater({
              paginatedItems: state.paginatedCourses,
              method,
              modifiedItem: course,
            });
          patchState({
            courses: newItemsList,
            paginatedCourses: newPaginatedItems,
            coursesSubscribed: true,
          });
        });
    }
  }

  @Action(GetCourseAction)
  getCourse(
    { getState, patchState }: StateContext<CourseStateModel>,
    { payload }: GetCourseAction
  ) {
    const { id, fetchFormDetails } = payload;
    patchState({ isFetching: true });
    const query = fetchFormDetails
      ? COURSE_QUERIES.GET_COURSE_FORM_DETAILS
      : COURSE_QUERIES.GET_COURSE_PROFILE;
    this.apollo
      .query({
        query,
        variables: { id },
        fetchPolicy: 'network-only',
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          const response = data.course;
          patchState({ courseFormRecord: response, isFetching: false });
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
          this.router.navigate([uiroutes.DASHBOARD_ROUTE.route], {
            queryParams: {
              tab: COURSES,
            },
          });
          patchState({ isFetching: false });
        }
      );
  }

  @Action(CreateUpdateCourseAction)
  createUpdateCourse(
    { getState, patchState }: StateContext<CourseStateModel>,
    { payload }: CreateUpdateCourseAction
  ) {
    const state = getState();
    const { form, formDirective } = payload;
    let { formSubmitting } = state;
    if (form.valid) {
      formSubmitting = true;
      patchState({ formSubmitting });
      const values = form.value;

      const updateForm = values.id == null ? false : true;
      const { id, ...sanitizedValues } = values;
      const variables = updateForm
        ? {
            input: sanitizedValues,
            id: values.id, // adding id to the mutation variables if it is an update mutation
          }
        : { input: sanitizedValues };

      this.apollo
        .mutate({
          mutation: updateForm
            ? COURSE_MUTATIONS.UPDATE_COURSE
            : COURSE_MUTATIONS.CREATE_COURSE,
          variables,
        })
        .pipe(takeUntil(this.destroy$))
        .subscribe(
          ({ data }: any) => {
            const response = updateForm ? data.updateCourse : data.createCourse;
            patchState({ formSubmitting: false });

            if (response.ok) {
              const method = updateForm
                ? SUBSCRIPTION_METHODS.UPDATE_METHOD
                : SUBSCRIPTION_METHODS.CREATE_METHOD;
              const course = response.course;
              const { newPaginatedItems, newItemsList } =
                paginatedSubscriptionUpdater({
                  paginatedItems: state.paginatedCourses,
                  method,
                  modifiedItem: course,
                });

              form.reset();
              formDirective.resetForm();
              this.router.navigate([uiroutes.DASHBOARD_ROUTE.route], {
                queryParams: {
                  tab: COURSES,
                },
              });
              patchState({
                paginatedCourses: newPaginatedItems,
                courses: newItemsList,
                courseFormRecord: emptyCourseFormRecord,
                fetchPolicy: 'network-only',
              });
              this.store.dispatch(
                new ShowNotificationAction({
                  message: `Course ${
                    updateForm ? 'updated' : 'created'
                  } successfully!`,
                  action: 'success',
                })
              );
            } else {
              this.store.dispatch(
                new ShowNotificationAction({
                  message: getErrorMessageFromGraphQLResponse(response?.errors),
                  action: 'error',
                })
              );
            }
          },
          (error) => {
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(error),
                action: 'error',
              })
            );
            patchState({ formSubmitting: false });
          }
        );
    } else {
      this.store.dispatch(
        new ShowNotificationAction({
          message:
            'Please make sure there are no errors in the form before attempting to submit!',
          action: 'error',
        })
      );
    }
  }

  @Action(DeleteCourseAction)
  deleteCourse(
    { getState, patchState }: StateContext<CourseStateModel>,
    { payload }: DeleteCourseAction
  ) {
    let { id } = payload;
    this.apollo
      .mutate({
        mutation: COURSE_MUTATIONS.DELETE_COURSE,
        variables: { id },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          const response = data.deleteCourse;

          if (response.ok) {
            this.router.navigate([uiroutes.DASHBOARD_ROUTE.route], {
              queryParams: {
                tab: COURSES,
              },
            });
            const method = SUBSCRIPTION_METHODS.DELETE_METHOD;
            const course = response.course;
            const state = getState();
            const { newPaginatedItems, newItemsList } =
              paginatedSubscriptionUpdater({
                paginatedItems: state.paginatedCourses,
                method,
                modifiedItem: course,
              });
            patchState({
              paginatedCourses: newPaginatedItems,
              courses: newItemsList,
              courseFormRecord: emptyCourseFormRecord,
            });
            this.store.dispatch(
              new ShowNotificationAction({
                message: 'Course deleted successfully!',
                action: 'success',
              })
            );
            this.store.dispatch(new ForceRefetchCoursesAction());
          } else {
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(response?.errors),
                action: 'error',
              })
            );
          }
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
        }
      );
  }

  @Action(PublishCourseAction)
  PublishCourseAction(
    {}: StateContext<CourseStateModel>,
    { payload }: PublishCourseAction
  ) {
    let { id, publishChapters } = payload;
    this.apollo
      .mutate({
        mutation: COURSE_MUTATIONS.PUBLISH_COURSE,
        variables: { id, publishChapters },
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        ({ data }: any) => {
          const response = data.publishCourse;

          if (response.ok) {
            this.store.dispatch(
              new ShowNotificationAction({
                message: `Course ${
                  publishChapters ? 'and its chapters' : ''
                } published successfully!`,
                action: 'success',
              })
            );
          } else {
            this.store.dispatch(
              new ShowNotificationAction({
                message: getErrorMessageFromGraphQLResponse(response?.errors),
                action: 'error',
              })
            );
          }
        },
        (error) => {
          this.store.dispatch(
            new ShowNotificationAction({
              message: getErrorMessageFromGraphQLResponse(error),
              action: 'error',
            })
          );
        }
      );
  }

  @Action(ResetCourseFormAction)
  resetCourseForm({ patchState }: StateContext<CourseStateModel>) {
    patchState({
      courseFormRecord: emptyCourseFormRecord,
      formSubmitting: false,
    });
  }

  ngOnDestroy() {
    this.destroy$.next(true);
    this.destroy$.unsubscribe();
  }
}
